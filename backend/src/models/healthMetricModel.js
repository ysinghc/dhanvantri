const mongoose = require('mongoose');

const healthMetricSchema = mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Patient',
    },
    type: {
      type: String,
      required: true,
      enum: ['blood-pressure', 'weight', 'blood-sugar', 'heart-rate', 'temperature', 'oxygen-level', 'other'],
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    unit: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
    },
    source: {
      type: String,
      enum: ['manual', 'device', 'lab'],
      default: 'manual',
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Create compound index for efficient queries
healthMetricSchema.index({ patientId: 1, type: 1, date: -1 });

const HealthMetric = mongoose.model('HealthMetric', healthMetricSchema);

module.exports = HealthMetric; 