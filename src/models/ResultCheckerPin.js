const mongoose = require('mongoose');

const resultCheckerPinSchema = new mongoose.Schema({

  order_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },

  pin: {
    type: String,
    required: true
  },

  serial: String,

  exam_type: {
    type: String,
    enum: ['WASSCE', 'BECE'],
    required: true
  },

  is_used: {
    type: Boolean,
    default: false
  }

}, {
  timestamps: true
});

module.exports = mongoose.model(
  'ResultCheckerPin',
  resultCheckerPinSchema
);