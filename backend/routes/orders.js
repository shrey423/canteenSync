module.exports = (io) => {
  const express = require('express');
  const router = express.Router();
  const Order = require('../models/Order');
  const MenuItem = require('../models/MenuItem');
  const auth = require('../middleware/auth');

  // Helper function to convert Mongoose document to plain object
  const toPlainObject = (doc) => doc.toObject ? doc.toObject() : doc;

  // Place a new order (Student only)
  router.post('/', auth, async (req, res) => {
    if (req.user.role !== 'student') return res.status(403).send('Forbidden');
    
    try {
      const { items, managerId } = req.body;
      const menuItemIds = items.map(i => i.menuItemId);
      
      const validItems = await MenuItem.countDocuments({ _id: { $in: menuItemIds } });
      if (validItems !== items.length) {
        return res.status(400).send('Invalid menu items in order');
      }

      const order = new Order({
        studentId: req.user.id,
        managerId: managerId || req.user.managerId,
        items,
        status: 'Pending',
        canCancel: true
      });

      const savedOrder = await order.save();
      const populatedOrder = await Order.findById(savedOrder._id)
        .populate('items.menuItemId')
        .lean();

      const managerRoom = savedOrder.managerId.toString();
      const studentRoom = savedOrder.studentId.toString();
      
      io.to(managerRoom).emit('newOrder', populatedOrder);
      io.to(studentRoom).emit('orderUpdate', populatedOrder);
      
      res.status(201).json(populatedOrder);
    } catch (err) {
      res.status(400).send('Error placing order: ' + err.message);
    }
  });

  // Cancel an order (Student only)
  router.post('/cancel/:id', auth, async (req, res) => {
    try {
      const order = await Order.findById(req.params.id);
      if (!order) return res.status(404).send('Order not found');
  
      if (order.studentId.toString() !== req.user.id)
        return res.status(403).send('Forbidden');
  
      if (order.paymentStatus === 'Paid')
        return res.status(400).send('Cannot cancel paid order');
  
      if (!order.canCancel)
        return res.status(400).send('Order cannot be canceled');
  
      order.status = 'Cancelled';
      order.canCancel = false;
      await order.save();
  
      const populatedOrder = await order.populate('items.menuItemId');
      const orderData = toPlainObject(populatedOrder);
  
      io.to(order.managerId.toString()).emit('orderUpdate', orderData);
      io.to(order.studentId.toString()).emit('orderUpdate', orderData);
  
      res.json(orderData);
    } catch (err) {
      console.error('Error cancelling order:', err);
      res.status(500).send('Server error');
    }
  });
  
  // Cancel order by manager
  router.put('/cancel/:id', auth, async (req, res) => {
    if (req.user.role !== 'manager') return res.status(403).send('Forbidden');
    
    try {
      const { reason, cancelledBy } = req.body;
      if (!reason) return res.status(400).send('Cancellation reason required');
      
      const order = await Order.findOne({
        _id: req.params.id,
        managerId: req.user.id,
        status: { $in: ['Approved', 'Preparing'] }
      });
      
      if (!order) return res.status(404).send('Order not found');
      
      order.status = 'Cancelled';
      order.canCancel = false;
      order.cancellationReason = reason;
      order.cancelledBy = cancelledBy || 'manager';
      
      await order.save();
      const populatedOrder = await Order.populate(order, { path: 'items.menuItemId' });
      const orderData = toPlainObject(populatedOrder);

      io.to(order.studentId.toString()).emit('orderUpdate', orderData);
      io.to(order.managerId.toString()).emit('orderUpdate', orderData);
      
      res.json(orderData);
    } catch (err) {
      res.status(400).send('Error cancelling order: ' + err.message);
    }
  });

  // Disapprove order by manager
  router.put('/disapprove/:id', auth, async (req, res) => {
    if (req.user.role !== 'manager') return res.status(403).send('Forbidden');
    
    try {
      const { reason } = req.body;
      if (!reason) return res.status(400).send('Disapproval reason required');
      
      const order = await Order.findOne({
        _id: req.params.id,
        managerId: req.user.id,
        status: 'Pending'
      });
      
      if (!order) return res.status(404).send('Order not found');
      
      order.status = 'Disapproved';
      order.canCancel = false;
      order.cancellationReason = reason;
      order.cancelledBy = 'manager';
      
      await order.save();
      const populatedOrder = await Order.populate(order, { path: 'items.menuItemId' });
      const orderData = toPlainObject(populatedOrder);

      io.to(order.studentId.toString()).emit('orderUpdate', orderData);
      io.to(order.managerId.toString()).emit('orderUpdate', orderData);
      
      res.json(orderData);
    } catch (err) {
      res.status(400).send('Error disapproving order: ' + err.message);
    }
  });

  // Confirm payment
  router.put('/confirm-payment/:id', auth, async (req, res) => {
    if (req.user.role !== 'manager') return res.status(403).send('Forbidden');
    
    try {
      const order = await Order.findOne({ 
        _id: req.params.id, 
        managerId: req.user.id 
      });
      if (!order) return res.status(404).send('Order not found');
      
      order.paymentStatus = 'Paid';
      order.status = 'Approved';
      await order.save();
      
      const populatedOrder = await Order.populate(order, { path: 'items.menuItemId' });
      const orderData = toPlainObject(populatedOrder);

      io.to(order.studentId.toString()).emit('orderUpdate', orderData);
      io.to(order.managerId.toString()).emit('orderUpdate', orderData);
      
      res.json(orderData);
    } catch (err) {
      res.status(400).send('Error confirming payment: ' + err.message);
    }
  });

  // Update order status
  router.put('/update/:id', auth, async (req, res) => {
    if (req.user.role !== 'manager') return res.status(403).send('Forbidden');
    
    try {
      const { status } = req.body;
      const validStatuses = ['Pending', 'Approved', 'Preparing', 'Ready', 'Completed', 'Cancelled', 'Disapproved'];
      if (!validStatuses.includes(status)) return res.status(400).send('Invalid status');
      
      const order = await Order.findOne({ 
        _id: req.params.id, 
        managerId: req.user.id 
      });
      if (!order) return res.status(404).send('Order not found');
      
      order.status = status;
      if (status === 'Ready' && !order.otp) {
        order.otp = Math.floor(1000 + Math.random() * 9000).toString();
      }
      
      await order.save();
      const populatedOrder = await Order.populate(order, { path: 'items.menuItemId' });
      const orderData = toPlainObject(populatedOrder);

      io.to(order.studentId.toString()).emit('orderUpdate', orderData);
      io.to(order.managerId.toString()).emit('orderUpdate', orderData);
      
      res.json(orderData);
    } catch (err) {
      res.status(400).send('Error updating order: ' + err.message);
    }
  });

  // Verify OTP
  router.post('/verify-otp/:id', auth, async (req, res) => {
    if (req.user.role !== 'manager') return res.status(403).send('Forbidden');
    
    try {
      const { otp } = req.body;
      const order = await Order.findOne({
        _id: req.params.id,
        managerId: req.user.id
      });
      
      if (!order) return res.status(404).send('Order not found');
      if (order.status !== 'Ready') return res.status(400).send('Order not ready');
      if (order.otp !== otp) return res.status(400).send('Invalid OTP');
      
      order.status = 'Completed';
      order.otp = null;
      await order.save();
      
      const populatedOrder = await Order.populate(order, { path: 'items.menuItemId' });
      const orderData = toPlainObject(populatedOrder);

      io.to(order.studentId.toString()).emit('orderUpdate', orderData);
      io.to(order.managerId.toString()).emit('orderUpdate', orderData);
      
      res.json(orderData);
    } catch (err) {
      res.status(400).send('Error verifying OTP: ' + err.message);
    }
  });

  // Get active orders
  router.get('/active', auth, async (req, res) => {
    if (req.user.role !== 'manager') return res.status(403).send('Forbidden');
    
    try {
      const orders = await Order.find({
        managerId: req.user.id,
        status: { $in: ['Pending', 'Approved', 'Preparing', 'Ready'] }
      }).populate('items.menuItemId').lean();
      
      res.json(orders);
    } catch (err) {
      res.status(500).send('Error fetching orders: ' + err.message);
    }
  });

  // Get all orders
  router.get('/', auth, async (req, res) => {
    try {
      const filter = req.user.role === 'student' 
        ? { studentId: req.user.id } 
        : { managerId: req.user.id };
      
      const orders = await Order.find(filter)
        .populate('items.menuItemId')
        .lean();
      
      res.json(orders);
    } catch (err) {
      res.status(500).send('Error fetching orders: ' + err.message);
    }
  });

  return router;
};