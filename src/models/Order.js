const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  order_number: {
    type: String,
    unique: true,
    required: true
  },

  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },

  product_snapshot: {
    type: Object,
    required: true
  },

  recipient_number: {
    type: String,
    required: true
  },

  payment_number: {
    type: String,
    required: true
  },

  payment_network: {
    type: String,
    required: true
  },

  amount: {
    type: Number,
    required: true
  },

  status: {
    type: String,
    enum: [
      'pending',
      'processing',
      'completed',
      'failed',
      'cancelled'
    ],
    default: 'pending'
  },

  payment_reference: String,
  payment_status: {
    type: String,
    default: 'pending'
  },

  delivery_status: {
    type: String,
    default: 'pending'
  },

  delivery_reference: String,

  delivery_response: Object,

  customer_email: String,

  ip_address: String,

  notes: String

}, {
  timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);