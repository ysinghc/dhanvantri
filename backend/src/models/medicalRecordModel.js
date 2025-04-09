const mongoose = require('mongoose');

const medicalRecordSchema = mongoose.Schema(
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
    recordType: {
      type: String,
      required: true,
      enum: ['consultation', 'diagnosis', 'treatment', 'surgery', 'vaccination', 'other'],
    },
    date: {
      type: Date,
      required: true,
    },
    diagnosis: String,
    symptoms: [String],
    treatment: String,
    notes: String,
    attachments: [
      {
        fileName: String,
        fileType: String,
        fileUrl: String,
        uploadDate: Date,
      },
    ],
  },
  {
    timestamps: true,
  }
);

const MedicalRecord = mongoose.model('MedicalRecord', medicalRecordSchema);

module.exports = MedicalRecord;
