const mongoose = require('mongoose');

const patientSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    name: {
      type: String,
      required: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    gender: {
      type: String,
      required: true,
      enum: ['male', 'female', 'other'],
    },
    contactNumber: {
      type: String,
      required: true,
    },
    emergencyContact: {
      name: String,
      relationship: String,
      phone: String,
    },
    address: {
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    },
    allergies: [String],
    chronicConditions: [String],
    medications: [
      {
        name: String,
        dosage: String,
        frequency: String,
        startDate: Date,
        endDate: Date,
      },
    ],
    insuranceDetails: {
      provider: String,
      policyNumber: String,
      coverageDetails: String,
      validUntil: Date,
    },
  },
  {
    timestamps: true,
  }
);

const Patient = mongoose.model('Patient', patientSchema);

module.exports = Patient;
