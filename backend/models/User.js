const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'manager'], required: true },
  preferences: {
    notifications: { type: Boolean, default: true },
    darkMode: { type: Boolean, default: false }
  },
  managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // For students
  upiId: { type: String, required: function() { return this.role === 'manager'; } } // Required for managers
});

module.exports = mongoose.model('User', userSchema);