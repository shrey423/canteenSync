const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

router.get('/', auth, async (req, res) => {
  try {
    // Validate user role
    if (req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Access denied. Manager privileges required.' });
    }
    
    // Validate user ID
    if (!mongoose.Types.ObjectId.isValid(req.user.id)) {
      return res.status(400).json({ message: 'Invalid user ID format.' });
    }
    
    // Fetch orders with error handling for database queries
    let orders;
    try {
      orders = await Order.find({ managerId: req.user.id }).populate('items.menuItemId');
    } catch (dbError) {
      console.error('Database query error:', dbError);
      return res.status(500).json({ 
        message: 'Error retrieving orders from database.',
        error: process.env.NODE_ENV === 'development' ? dbError.message : 'Database error'
      });
    }
    
    // Handle case where no orders found
    if (!orders || orders.length === 0) {
      return res.status(200).json({
        revenue: "0.00",
        orderCount: 0,
        averageOrderValue: "0.00",
        customerCount: 0,
        dailyOrders: {},
        topItems: [],
        feedbackByOrder: [],
        feedbackByItem: []
      });
    }
    
    // Revenue calculation with validation
    const revenue = orders.reduce((total, order) => {
      if (!order || !Array.isArray(order.items)) return total;
      
      const orderTotal = order.items.reduce((sum, item) => {
        if (!item || !item.menuItemId || typeof item.menuItemId !== 'object') return sum;
        if (typeof item.menuItemId.price !== 'number') return sum;
        if (typeof item.quantity !== 'number') return sum;
        
        const discount = typeof item.menuItemId.discount === 'number' ? item.menuItemId.discount : 0;
        const price = Math.max(0, item.menuItemId.price - discount); // Ensure price is not negative
        return sum + price * item.quantity;
      }, 0);
      
      return total + orderTotal;
    }, 0);
    
    // Order Count
    const orderCount = orders.length;
    
    // Average Order Value with validation
    const averageOrderValue = orderCount > 0 ? revenue / orderCount : 0;
    
    // Customer Count with validation
    const customerCount = orders.reduce((uniqueIds, order) => {
      if (order && order.studentId) {
        uniqueIds.add(order.studentId.toString());
      }
      return uniqueIds;
    }, new Set()).size;
    
    // Daily Orders with date validation
    const dailyOrders = orders.reduce((acc, order) => {
      if (!order || !order.createdAt || !(order.createdAt instanceof Date)) {
        // Skip if createdAt is missing or invalid
        return acc;
      }
      
      try {
        const date = new Date(order.createdAt).toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
      } catch (dateError) {
        console.warn('Invalid date format in order:', order._id);
      }
      
      return acc;
    }, {});
    
    // Top 5 Menu Items with comprehensive validation
    const itemCounts = orders.reduce((acc, order) => {
      if (!order || !Array.isArray(order.items)) return acc;
      
      order.items.forEach(item => {
        if (!item || !item.menuItemId || typeof item.menuItemId !== 'object') return;
        if (!item.menuItemId._id) return;
        
        const itemId = item.menuItemId._id.toString();
        const itemName = item.menuItemId.name || 'Unknown Item';
        const itemQuantity = typeof item.quantity === 'number' ? item.quantity : 0;
        
        if (!acc[itemId]) {
          acc[itemId] = { name: itemName, count: 0 };
        }
        
        acc[itemId].count += itemQuantity;
      });
      
      return acc;
    }, {});
    
    const topItems = Object.values(itemCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Feedback validation helper function
    const hasFeedback = (feedback) => {
      if (!feedback) return false;
      
      const hasRating = typeof feedback.rating === 'number' || 
                        (typeof feedback.rating === 'string' && feedback.rating.trim() !== '');
      const hasComment = typeof feedback.comment === 'string' && feedback.comment.trim() !== '';
      
      return hasRating || hasComment;
    };
    
    // Feedback by Order with validation
    const feedbackByOrder = orders
      .filter(order => order && hasFeedback(order.feedback))
      .map(order => {
        // Safe mapping of items
        const itemNames = Array.isArray(order.items) 
          ? order.items
              .map(item => {
                if (!item || !item.menuItemId || typeof item.menuItemId !== 'object') {
                  return 'Unknown Item';
                }
                return item.menuItemId.name || 'Unknown Item';
              })
              .join(', ')
          : 'No items';
        
        return {
          orderId: order._id,
          items: itemNames,
          rating: order.feedback && order.feedback.rating !== undefined ? order.feedback.rating : 'N/A',
          comment: order.feedback && typeof order.feedback.comment === 'string' ? order.feedback.comment : 'No comment'
        };
      });
    
    // Feedback by Menu Item with validation
    const feedbackByItem = orders.reduce((acc, order) => {
      if (!order || !hasFeedback(order.feedback) || !Array.isArray(order.items)) {
        return acc;
      }
      
      order.items.forEach(item => {
        if (!item || !item.menuItemId || typeof item.menuItemId !== 'object' || !item.menuItemId._id) {
          return;
        }
        
        const itemId = item.menuItemId._id.toString();
        const itemName = item.menuItemId.name || 'Unknown Item';
        
        if (!acc[itemId]) {
          acc[itemId] = { name: itemName, feedback: [] };
        }
        
        acc[itemId].feedback.push({
          orderId: order._id,
          rating: order.feedback.rating !== undefined ? order.feedback.rating : 'N/A',
          comment: typeof order.feedback.comment === 'string' ? order.feedback.comment : 'No comment'
        });
      });
      
      return acc;
    }, {});
    
    // Ensure numbers are properly formatted and validated before sending response
    res.status(200).json({
      revenue: isNaN(revenue) ? "0.00" : revenue.toFixed(2),
      orderCount: orderCount || 0,
      averageOrderValue: isNaN(averageOrderValue) ? "0.00" : averageOrderValue.toFixed(2),
      customerCount: customerCount || 0,
      dailyOrders: dailyOrders || {},
      topItems: topItems || [],
      feedbackByOrder: feedbackByOrder || [],
      feedbackByItem: Object.values(feedbackByItem) || []
    });
    
  } catch (error) {
    console.error('Unexpected error in analytics route:', error);
    res.status(500).json({ 
      message: 'An unexpected error occurred while processing your request.',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;