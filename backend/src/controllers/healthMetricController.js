const { check, validationResult } = require('express-validator');
const HealthMetric = require('../models/healthMetricModel');
const Patient = require('../models/patientModel');

// @desc    Create health metric
// @route   POST /api/v1/health-metrics
// @access  Private (Patient, Doctor)
const createHealthMetric = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { patientId, type, value, unit, date, notes, source, metadata } = req.body;
    
    // If request is from a patient, ensure they're adding their own data
    if (req.user.userType === 'patient' && req.user.profile.toString() !== patientId) {
      return res.status(403).json({ message: 'Not authorized to add metrics for other patients' });
    }
    
    // Validate patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    // Create the health metric record
    const healthMetric = await HealthMetric.create({
      patientId,
      type,
      value,
      unit,
      date: date || new Date(),
      notes,
      source: source || 'manual',
      recordedBy: req.user._id,
      metadata,
    });
    
    res.status(201).json(healthMetric);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get patient health metrics
// @route   GET /api/v1/health-metrics
// @access  Private (Patient - own data only, Doctor - their patients' data)
const getHealthMetrics = async (req, res) => {
  try {
    const { patientId, type, from, to, limit = 50, page = 1 } = req.query;
    
    if (!patientId) {
      return res.status(400).json({ message: 'Patient ID is required' });
    }
    
    // If request is from a patient, ensure they're accessing their own data
    if (req.user.userType === 'patient' && req.user.profile.toString() !== patientId) {
      return res.status(403).json({ message: 'Not authorized to access other patients data' });
    }
    
    // Build query
    const query = { patientId };
    
    if (type) {
      query.type = type;
    }
    
    if (from || to) {
      query.date = {};
      if (from) {
        query.date.$gte = new Date(from);
      }
      if (to) {
        query.date.$lte = new Date(to);
      }
    }
    
    // Count total matching records
    const count = await HealthMetric.countDocuments(query);
    
    // Get records with pagination
    const metrics = await HealthMetric.find(query)
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    res.json({
      metrics,
      page: parseInt(page),
      pages: Math.ceil(count / parseInt(limit)),
      total: count
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get patient health metrics summary
// @route   GET /api/v1/health-metrics/summary
// @access  Private (Patient - own data only, Doctor - their patients' data)
const getHealthMetricsSummary = async (req, res) => {
  try {
    const { patientId, timespan = '6m' } = req.query;
    
    if (!patientId) {
      return res.status(400).json({ message: 'Patient ID is required' });
    }
    
    // If request is from a patient, ensure they're accessing their own data
    if (req.user.userType === 'patient' && req.user.profile.toString() !== patientId) {
      return res.status(403).json({ message: 'Not authorized to access other patients data' });
    }
    
    // Calculate date range based on timespan parameter
    const now = new Date();
    let fromDate = new Date();
    
    switch (timespan) {
      case '1w':
        fromDate.setDate(now.getDate() - 7);
        break;
      case '1m':
        fromDate.setMonth(now.getMonth() - 1);
        break;
      case '3m':
        fromDate.setMonth(now.getMonth() - 3);
        break;
      case '6m':
      default:
        fromDate.setMonth(now.getMonth() - 6);
        break;
      case '1y':
        fromDate.setFullYear(now.getFullYear() - 1);
        break;
    }
    
    // Get blood pressure metrics
    const bloodPressureData = await HealthMetric.find({
      patientId,
      type: 'blood-pressure',
      date: { $gte: fromDate }
    }).sort({ date: 1 });
    
    // Get weight metrics
    const weightData = await HealthMetric.find({
      patientId,
      type: 'weight',
      date: { $gte: fromDate }
    }).sort({ date: 1 });
    
    // Get blood sugar metrics
    const bloodSugarData = await HealthMetric.find({
      patientId,
      type: 'blood-sugar',
      date: { $gte: fromDate }
    }).sort({ date: 1 });
    
    // Format data for charts
    const formatChartData = (data) => {
      return {
        labels: data.map(item => item.date.toISOString().split('T')[0]),
        values: data.map(item => item.value),
        latest: data.length > 0 ? data[data.length - 1].value : null,
        unit: data.length > 0 ? data[0].unit : null
      };
    };
    
    res.json({
      bloodPressure: formatChartData(bloodPressureData),
      weight: formatChartData(weightData),
      bloodSugar: formatChartData(bloodSugarData)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Delete health metric
// @route   DELETE /api/v1/health-metrics/:id
// @access  Private (Patient - own data only, Doctor - their patients' data)
const deleteHealthMetric = async (req, res) => {
  try {
    const healthMetric = await HealthMetric.findById(req.params.id);
    
    if (!healthMetric) {
      return res.status(404).json({ message: 'Health metric not found' });
    }
    
    // Check authorization
    if (req.user.userType === 'patient') {
      // Patients can only delete their own data
      if (healthMetric.patientId.toString() !== req.user.profile.toString()) {
        return res.status(403).json({ message: 'Not authorized to delete this record' });
      }
    } else if (req.user.userType === 'doctor') {
      // Doctors can only delete data they recorded
      if (healthMetric.recordedBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to delete this record' });
      }
    }
    
    await healthMetric.remove();
    
    res.json({ message: 'Health metric removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = {
  createHealthMetric,
  getHealthMetrics,
  getHealthMetricsSummary,
  deleteHealthMetric
};
