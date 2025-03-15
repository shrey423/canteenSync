const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

router.post('/register', async (req, res) => {
  const { name, email, password, role, managerId, upiId } = req.body;
  if (role === 'manager' && !upiId) {
    return res.status(400).send('UPI ID is required for managers');
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword, role, managerId, upiId });
    await user.save();
    res.status(201).send('User registered');
  } catch (err) {
    res.status(400).send('Registration failed');
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).send('Invalid credentials');
  }
  const token = jwt.sign({ id: user._id, role: user.role, managerId: user.managerId  ,email: user.email}, 'secret');
  res.json({ token });
});

router.get('/managers', async (req, res) => {
  const managers = await User.find({ role: 'manager' }, 'name _id');
  res.json(managers);
});

router.get('/me', auth, async (req, res) => {
  const token = req.headers.authorization.split(' ')[1];
  const decoded = jwt.verify(token, 'secret');
  const user = await User.findById(decoded.id)
    .select('-password')
    .populate('managerId', 'name upiId'); // Populate the manager details (name and upiId)
  res.json(user);
});

module.exports = router;
