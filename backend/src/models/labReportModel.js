const mongoose = require('mongoose');

const labReportSchema = mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Patient',
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Doctor',
    },
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
    },
    date: {
      type: Date,
      required: true,
    },
    testType: {
      type: String,
      required: true,
    },
    results: {
      type: Object,
      required: true,
    },
    normalRanges: {
      type: Object,
      required: true,
    },
    notes: String,
    attachmentUrl: String,
  },
  {
    timestamps: true,
  }
);

const LabReport = mongoose.model('LabReport', labReportSchema);

module.exports = LabReport;
