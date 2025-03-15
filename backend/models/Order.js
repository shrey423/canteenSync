const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
    quantity: { type: Number, default: 1 }
  }],
  status: { type: String, enum: ['Pending', 'Approved','Disapproved', 'Preparing', 'Ready', 'Completed', 'Cancelled'], default: 'Pending' },
  paymentStatus: { type: String, enum: ['Pending','Paid', 'Failed'], default: 'Pending' },
  createdAt: { type: Date, default: Date.now },
  canCancel: { type: Boolean, default: true },
  feedback: { rating: Number, comment: String },
  otp: { type: String } // Generated when status becomes "Ready"
});
orderSchema.index({ managerId: 1, status: 1 });
orderSchema.index({ studentId: 1 });
module.exports = mongoose.model('Order', orderSchema);