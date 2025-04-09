const mongoose = require('mongoose');

const doctorSchema = mongoose.Schema(
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
    specialization: {
      type: String,
      required: true,
    },
    qualifications: [String],
    experience: {
      type: Number,
      required: true,
    },
    licenseNumber: {
      type: String,
      required: true,
      unique: true,
    },
    contactNumber: {
      type: String,
      required: true,
    },
    hospitalAffiliations: [
      {
        hospitalId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Hospital',
        },
        name: String,
        from: Date,
        to: Date,
        current: Boolean,
      },
    ],
    availability: {
      monday: [{ start: String, end: String }],
      tuesday: [{ start: String, end: String }],
      wednesday: [{ start: String, end: String }],
      thursday: [{ start: String, end: String }],
      friday: [{ start: String, end: String }],
      saturday: [{ start: String, end: String }],
      sunday: [{ start: String, end: String }],
    },
    consultationFee: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Doctor = mongoose.model('Doctor', doctorSchema);

module.exports = Doctor;
