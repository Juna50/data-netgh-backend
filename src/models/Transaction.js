const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({

  order_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },

  type: {
    type: String,
    enum: ['payment', 'refund'],
    required: true
  },

  amount: {
    type: Number,
    required: true
  },

  gateway: {
    type: String,
    default: 'moolre'
  },

  gateway_reference: String,

  status: {
    type: String,
    default: 'pending'
  },

  gateway_response: Object

}, {
  timestamps: true
});

module.exports = mongoose.model(
  'Transaction',
  transactionSchema
);