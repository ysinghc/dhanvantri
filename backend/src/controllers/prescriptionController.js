const { check, validationResult } = require('express-validator');
const Prescription = require('../models/prescriptionModel');

// @desc    Get prescription by ID
// @route   GET /api/v1/prescriptions/:id
// @access  Private
const getPrescriptionById = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('patientId', 'name gender dateOfBirth')
      .populate('doctorId', 'name specialization');

    if (prescription) {
      res.json(prescription);
    } else {
      res.status(404).json({ message: 'Prescription not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update prescription
// @route   PUT /api/v1/prescriptions/:id
// @access  Private/Doctor
const updatePrescription = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { medications, instructions, duration, isActive } = req.body;
    const prescription = await Prescription.findById(req.params.id);

    if (prescription) {
      prescription.medications = medications || prescription.medications;
      prescription.instructions = instructions || prescription.instructions;
      prescription.duration = duration || prescription.duration;
      
      if (isActive !== undefined) {
        prescription.isActive = isActive;
      }

      const updatedPrescription = await prescription.save();
      res.json(updatedPrescription);
    } else {
      res.status(404).json({ message: 'Prescription not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Delete prescription
// @route   DELETE /api/v1/prescriptions/:id
// @access  Private/Doctor
const deletePrescription = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);

    if (prescription) {
      await prescription.remove();
      res.json({ message: 'Prescription removed' });
    } else {
      res.status(404).json({ message: 'Prescription not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = {
  getPrescriptionById,
  updatePrescription,
  deletePrescription,
};
