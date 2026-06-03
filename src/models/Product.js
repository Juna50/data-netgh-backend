const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  product_type: {
    type: String,
    enum: ['data_bundle', 'result_checker'],
    required: true
  },
  network: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  size: String,
  price: {
    type: Number,
    required: true
  },
  duration: String,
  is_active: {
    type: Boolean,
    default: true
  },
  moolre_enabled: {
    type: Boolean,
    default: true
  },
  sort_order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Product', productSchema);