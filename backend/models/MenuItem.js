// models/MenuItem.js
const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: String,
  customizations: [{ name: String, price: Number }],
  isSpecial: { type: Boolean, default: false },
  discount: { type: Number, default: 0 },
  managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Category',
    required: true 
  },
  image: { data: Buffer, // Binary image data
    contentType: String  } // New field to store the image path
});

module.exports = mongoose.model('MenuItem', menuItemSchema);