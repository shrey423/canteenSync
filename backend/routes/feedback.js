const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const auth = require('../middleware/auth');

router.post('/', auth, async (req, res) => {
  if (req.user.role !== 'student') return res.status(403).send('Forbidden');
  const { orderId, rating, comment } = req.body;
  const order = await Order.findOneAndUpdate(
    { _id: orderId, studentId: req.user.id },
    { feedback: { rating, comment } },
    { new: true }
  );
  res.json(order);
});

module.exports = router;