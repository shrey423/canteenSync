// routes/menu.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const { body, param } = require('express-validator');
const MenuItem = require('../models/MenuItem');
const Category = require('../models/Category');
const Order = require('../models/Order');
const { validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');

// Using memoryStorage to store images in MongoDB
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  next();
};

// Get menu items with advanced filtering
router.get('/', auth, async (req, res) => {
  const filter = req.user.role === 'student' ? { managerId: req.user.managerId } : { managerId: req.user.id };
  const menuItems = await MenuItem.find(filter);
  res.json(menuItems);
});

// Create new menu item
router.post(
  '/',
  auth,
  upload.single('image'),
  [
    body('name').trim().notEmpty().withMessage('Name required'),
    body('price').isFloat({ min: 0.01 }).withMessage('Invalid price'),
    body('category')
      .isMongoId()
      .withMessage('Invalid category')
      .custom(async (value, { req }) => {
        if (req.user.role !== 'manager') {
          throw new Error('Only managers can create menu items');
        }
        const valid = await Category.exists({
          _id: value,
          managerId: req.user.id,
          isDeleted: false
        });
        if (!valid) throw new Error('Invalid category');
        return true;
      })
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { name, price, description, category } = req.body;
      
      const categoryDoc = await Category.findById(category);
      if (!categoryDoc) {
        return res.status(400).json({ error: 'Category not found' });
      }
      
      const item = new MenuItem({
        name,
        price: parseFloat(price),
        description,
        category,
        managerId: req.user.id,
        image: req.file ? {
          data: req.file.buffer,
          contentType: req.file.mimetype
        } : null
      });

      await item.save();
      const newItem = await MenuItem.populate(item, { path: 'category', select: 'name' });
      res.status(201).json(newItem);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to create item' });
    }
  }
);

// Delete menu item
router.delete(
  '/:id',
  auth,
  [
    param('id').isMongoId().withMessage('Invalid item ID')
  ],
  validateRequest,
  async (req, res) => {
    try {
      // Check if user is a manager first
      if (req.user.role !== 'manager') {
        return res.status(403).json({ error: 'Only managers can delete items' });
      }

      const item = await MenuItem.findById(req.params.id);
      if (!item) return res.status(404).json({ error: 'Item not found' });

      // Properly fetch the category to check ownership
      const category = await Category.findById(item.category);
      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }

      // Check if user is authorized (only managers can delete their own items)
      if (category.managerId.toString() !== req.user.id.toString()) {
        return res.status(403).json({ error: 'Access denied: You do not own this item' });
      }

      // Check if the item is used in any active orders
      const activeOrders = await Order.countDocuments({
        'items.menuItemId': req.params.id,
        status: { $in: ['pending', 'preparing', 'ready'] }
      });

      if (activeOrders > 0) {
        return res.status(400).json({ 
          error: 'Cannot delete item that is in active orders' 
        });
      }
      
      // Use soft delete for consistency with the rest of the application
      await MenuItem.deleteOne({ _id: req.params.id });
      
      res.json({ message: 'Item deleted successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// Get item feedback with security checks
router.get(
  '/feedback/:itemId',
  auth,
  [
    param('itemId').isMongoId().withMessage('Invalid item ID')
  ],
  validateRequest,
  async (req, res) => {
    try {
      // Verify item exists and user has access
      const item = await MenuItem.findById(req.params.itemId)
        .populate('category', 'managerId');

      if (!item) return res.status(404).json({ error: 'Item not found' });

      if (req.user.role === 'student' && 
          item.category.managerId.toString() !== req.user.managerId.toString()) {
        return res.status(403).json({ error: 'Access denied' });
      }

      if (req.user.role === 'manager' && 
          item.category.managerId.toString() !== req.user.id.toString()) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Get feedback with population
      const orders = await Order.find({
        'items.menuItemId': req.params.itemId,
        'feedback.comment': { $exists: true, $ne: '' }
      })
      .populate('studentId', 'name')
      .select('items feedback createdAt')
      .lean();

      const feedback = orders.flatMap(order => {
        // Safely handle potential undefined values
        const studentName = order.studentId && order.studentId.name ? 
          order.studentId.name : 'Anonymous';
        
        return order.items
          .filter(item => item.menuItemId && 
                        item.menuItemId.toString() === req.params.itemId)
          .map(item => ({
            orderId: order._id,
            rating: item.rating || null,
            comment: order.feedback && order.feedback.comment ? 
              order.feedback.comment : '',
            studentName,
            date: order.createdAt
          }));
      });

      res.json(feedback);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// Archive menu item
router.patch(
  '/:id/archive',
  auth,
  [
    param('id').isMongoId().withMessage('Invalid item ID')
  ],
  validateRequest,
  async (req, res) => {
    try {
      // Check if user is a manager
      if (req.user.role !== 'manager') {
        return res.status(403).json({ error: 'Only managers can archive items' });
      }

      const item = await MenuItem.findById(req.params.id)
        .populate('category', 'managerId');

      if (!item) return res.status(404).json({ error: 'Item not found' });

      if (item.category.managerId.toString() !== req.user.id.toString()) {
        return res.status(403).json({ error: 'Access denied' });
      }

      item.isArchived = true;
      await item.save();

      res.json({ message: 'Item archived successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

module.exports = router;