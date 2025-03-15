const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { body, param } = require('express-validator');
const { validationResult } = require('express-validator');
const Category = require('../models/Category');
const MenuItem = require('../models/MenuItem');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');

const createCategoryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many category creation attempts'
});

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  next();
};

// Get categories with search - FIXED VERSION
router.get('/', auth, async (req, res) => {
  try {
    const { search } = req.query;
    
    // Determine which managerId to use
    let managerId;
    
    // If user is a manager, use their ID
    if (req.user.role === 'manager') {
      managerId = req.user.id;
    } 
    // If user has a managerId property (customer linked to a manager)
    else if (req.user.managerId) {
      managerId = typeof req.user.managerId === 'object' 
        ? req.user.managerId._id 
        : req.user.managerId;
    } 
    // If no managerId is available, return empty array
    else {
      console.log('No managerId found for user', req.user.id);
      return res.json([]);
    }
    
    const query = { 
      managerId: managerId,
      isDeleted: false
    };

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    console.log('Fetching categories with query:', query);
    const categories = await Category.find(query).sort({ name: 1 });
    console.log('Found categories:', categories);
    
    res.json(categories);
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create category
router.post(
  '/',
  auth,
  createCategoryLimiter,
  [
    body('name')
      .trim()
      .notEmpty().withMessage('Category name required')
      .isLength({ max: 50 }).withMessage('Max 50 characters')
      .matches(/^[a-zA-Z0-9 ]+$/).withMessage('Invalid characters')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { name } = req.body;
      const existing = await Category.findOne({
        managerId: req.user.id,
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        isDeleted: false
      });

      if (existing) return res.status(409).json({ error: 'Category exists' });

      const category = new Category({
        name,
        managerId: req.user.id
      });

      await category.save();
      res.status(201).json(category);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to create category' });
    }
  }
);

// Update category
router.put(
  '/:id',
  auth,
  [
    param('id').isMongoId(),
    body('name')
      .trim()
      .notEmpty().withMessage('Name required')
      .isLength({ max: 50 })
  ],
  validateRequest,
  async (req, res) => {
    try {
      const category = await Category.findOneAndUpdate(
        {
          _id: req.params.id,
          managerId: req.user.id,
          isDeleted: false
        },
        { name: req.body.name },
        { new: true }
      );

      if (!category) return res.status(404).json({ error: 'Category not found' });
      res.json(category);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Update failed' });
    }
  }
);

// Delete category
router.delete(
  '/:id',
  auth,
  [param('id').isMongoId()],
  validateRequest,
  async (req, res) => {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      
      const category = await Category.findOneAndUpdate(
        { _id: req.params.id, managerId: req.user.id },
        { isDeleted: true },
        { session, new: true }
      );

      if (!category) {
        await session.abortTransaction();
        return res.status(404).json({ error: 'Category not found' });
      }

      let defaultCat = await Category.findOne({
        managerId: req.user.id,
        name: 'Uncategorized'
      }).session(session);

      if (!defaultCat) {
        defaultCat = new Category({
          name: 'Uncategorized',
          managerId: req.user.id,
          isDefault: true
        });
        await defaultCat.save({ session });
      }

      await MenuItem.updateMany(
        { category: category._id },
        { $set: { category: defaultCat._id } },
        { session }
      );

      await session.commitTransaction();
      res.json({ message: 'Category deleted' });
    } catch (err) {
      await session.abortTransaction();
      console.error(err);
      res.status(500).json({ error: 'Deletion failed' });
    } finally {
      session.endSession();
    }
  }
);

module.exports = router;