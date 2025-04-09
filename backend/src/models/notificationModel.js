const mongoose = require('mongoose');

const notificationSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['appointment', 'prescription', 'lab-report', 'medical-record', 'system'],
      default: 'system',
    },
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'dynamic', // Will be populated dynamically based on type
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    icon: {
      type: String,
      default: 'notification',
    },
  },
  {
    timestamps: true,
  }
);

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification; 