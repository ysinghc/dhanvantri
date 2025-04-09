const { check, validationResult } = require('express-validator');
const LabReport = require('../models/labReportModel');

// @desc    Create lab report
// @route   POST /api/v1/lab-reports
// @access  Private/Doctor
const createLabReport = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { patientId, hospitalId, testType, results, normalRanges, notes, attachmentUrl } = req.body;
    const doctorId = req.user.profile;

    const labReport = await LabReport.create({
      patientId,
      doctorId,
      hospitalId,
      date: new Date(),
      testType,
      results,
      normalRanges,
      notes,
      attachmentUrl,
    });

    res.status(201).json(labReport);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get lab report by ID
// @route   GET /api/v1/lab-reports/:id
// @access  Private
const getLabReportById = async (req, res) => {
  try {
    const labReport = await LabReport.findById(req.params.id)
      .populate('patientId', 'name gender dateOfBirth')
      .populate('doctorId', 'name specialization')
      .populate('hospitalId', 'name address');

    if (labReport) {
      res.json(labReport);
    } else {
      res.status(404).json({ message: 'Lab report not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update lab report
// @route   PUT /api/v1/lab-reports/:id
// @access  Private/Doctor
const updateLabReport = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { results, normalRanges, notes, attachmentUrl } = req.body;
    const labReport = await LabReport.findById(req.params.id);

    if (labReport) {
      labReport.results = results || labReport.results;
      labReport.normalRanges = normalRanges || labReport.normalRanges;
      labReport.notes = notes || labReport.notes;
      labReport.attachmentUrl = attachmentUrl || labReport.attachmentUrl;

      const updatedLabReport = await labReport.save();
      res.json(updatedLabReport);
    } else {
      res.status(404).json({ message: 'Lab report not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Delete lab report
// @route   DELETE /api/v1/lab-reports/:id
// @access  Private/Doctor
const deleteLabReport = async (req, res) => {
  try {
    const labReport = await LabReport.findById(req.params.id);

    if (labReport) {
      await labReport.remove();
      res.json({ message: 'Lab report removed' });
    } else {
      res.status(404).json({ message: 'Lab report not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = {
  createLabReport,
  getLabReportById,
  updateLabReport,
  deleteLabReport,
};
