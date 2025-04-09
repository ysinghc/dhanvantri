const mongoose = require('mongoose');
const crypto = require('crypto');

const emergencyCardSchema = mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Patient',
      index: true,
    },
    accessCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: function() {
        // Default expiration 1 year from now
        const date = new Date();
        date.setFullYear(date.getFullYear() + 1);
        return date;
      },
    },
    accessLevel: {
      type: String,
      enum: ['basic', 'full'],
      default: 'basic',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    accessLog: [
      {
        accessedAt: {
          type: Date,
          default: Date.now,
        },
        accessedBy: {
          type: String,
        },
        accessIp: {
          type: String,
        },
        notes: {
          type: String,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to generate access code if not provided
emergencyCardSchema.pre('save', function (next) {
  // Only generate if new document or accessCode has not been set
  if (this.isNew && !this.accessCode) {
    // Generate a random 12-character alphanumeric code
    const accessCode = crypto.randomBytes(6).toString('hex').toUpperCase();
    this.accessCode = accessCode;
  }
  next();
});

const EmergencyCard = mongoose.model('EmergencyCard', emergencyCardSchema);

module.exports = EmergencyCard; 