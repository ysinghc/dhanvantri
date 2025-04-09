const { check, validationResult } = require('express-validator');
const MedicalRecord = require('../models/medicalRecordModel');

// @desc    Get medical record by ID
// @route   GET /api/v1/medical-records/:id
// @access  Private
const getMedicalRecordById = async (req, res) => {
  try {
    const medicalRecord = await MedicalRecord.findById(req.params.id)
      .populate('patientId', 'name gender dateOfBirth')
      .populate('doctorId', 'name specialization')
      .populate('hospitalId', 'name address');

    if (medicalRecord) {
      res.json(medicalRecord);
    } else {
      res.status(404).json({ message: 'Medical record not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update medical record
// @route   PUT /api/v1/medical-records/:id
// @access  Private/Doctor
const updateMedicalRecord = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { diagnosis, symptoms, treatment, notes } = req.body;
    const medicalRecord = await MedicalRecord.findById(req.params.id);

    if (medicalRecord) {
      medicalRecord.diagnosis = diagnosis || medicalRecord.diagnosis;
      medicalRecord.symptoms = symptoms || medicalRecord.symptoms;
      medicalRecord.treatment = treatment || medicalRecord.treatment;
      medicalRecord.notes = notes || medicalRecord.notes;

      const updatedMedicalRecord = await medicalRecord.save();
      res.json(updatedMedicalRecord);
    } else {
      res.status(404).json({ message: 'Medical record not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Add attachment to medical record
// @route   PUT /api/v1/medical-records/:id/attachments
// @access  Private/Doctor
const addAttachment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { fileName, fileType, fileUrl } = req.body;
    const medicalRecord = await MedicalRecord.findById(req.params.id);

    if (medicalRecord) {
      medicalRecord.attachments.push({
        fileName,
        fileType,
        fileUrl,
        uploadDate: new Date(),
      });

      const updatedMedicalRecord = await medicalRecord.save();
      res.json(updatedMedicalRecord.attachments);
    } else {
      res.status(404).json({ message: 'Medical record not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Delete medical record
// @route   DELETE /api/v1/medical-records/:id
// @access  Private/Doctor
const deleteMedicalRecord = async (req, res) => {
  try {
    const medicalRecord = await MedicalRecord.findById(req.params.id);

    if (medicalRecord) {
      await medicalRecord.remove();
      res.json({ message: 'Medical record removed' });
    } else {
      res.status(404).json({ message: 'Medical record not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = {
  getMedicalRecordById,
  updateMedicalRecord,
  addAttachment,
  deleteMedicalRecord,
};
