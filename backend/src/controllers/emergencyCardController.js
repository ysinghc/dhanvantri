const EmergencyCard = require('../models/emergencyCardModel');
const Patient = require('../models/patientModel');
const User = require('../models/userModel');
const QRCode = require('qrcode');
const { check, validationResult } = require('express-validator');

// @desc    Generate or retrieve emergency card for a patient
// @route   GET /api/v1/emergency-card
// @access  Private (Patient - own data only)
const getEmergencyCard = async (req, res) => {
  try {
    const patientId = req.user.profile;

    // Check if an active card already exists
    let emergencyCard = await EmergencyCard.findOne({
      patientId,
      isActive: true,
      expiresAt: { $gt: new Date() },
    });

    // If no valid card exists, create a new one
    if (!emergencyCard) {
      emergencyCard = await EmergencyCard.create({
        patientId,
        accessLevel: 'basic',
      });
    }

    // Get patient information for QR code
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const user = await User.findOne({ profile: patientId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate QR code
    const accessUrl = `${process.env.API_URL}/emergency-access/${emergencyCard.accessCode}`;
    const qrCode = await QRCode.toDataURL(accessUrl);

    // Prepare emergency information for response
    const emergencyInfo = {
      patientName: patient.name,
      bloodGroup: patient.bloodGroup || 'Unknown',
      healthId: user.healthId,
      emergencyContact: patient.emergencyContact || null,
      allergies: patient.allergies || [],
      chronicConditions: patient.chronicConditions || [],
      accessCode: emergencyCard.accessCode,
      expiresAt: emergencyCard.expiresAt,
      qrCode,
      accessUrl,
    };

    res.json({
      emergencyCard,
      emergencyInfo,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update emergency card settings
// @route   PUT /api/v1/emergency-card
// @access  Private (Patient - own data only)
const updateEmergencyCard = [
  check('accessLevel').optional().isIn(['basic', 'full']).withMessage('Invalid access level'),
  check('isActive').optional().isBoolean().withMessage('Invalid active status'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const patientId = req.user.profile;
      const { accessLevel, isActive } = req.body;

      // Retrieve the active emergency card
      const emergencyCard = await EmergencyCard.findOne({
        patientId,
        isActive: true,
        expiresAt: { $gt: new Date() },
      });

      if (!emergencyCard) {
        return res.status(404).json({ message: 'Emergency card not found' });
      }

      // Update fields
      if (accessLevel) {
        emergencyCard.accessLevel = accessLevel;
      }
      
      if (isActive !== undefined) {
        emergencyCard.isActive = isActive;
      }

      await emergencyCard.save();

      res.json(emergencyCard);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server Error', error: error.message });
    }
  }
];

// @desc    Regenerate emergency card (new code)
// @route   POST /api/v1/emergency-card/regenerate
// @access  Private (Patient - own data only)
const regenerateEmergencyCard = async (req, res) => {
  try {
    const patientId = req.user.profile;

    // Deactivate existing cards
    await EmergencyCard.updateMany(
      { patientId, isActive: true },
      { isActive: false }
    );

    // Create new card
    const emergencyCard = await EmergencyCard.create({
      patientId,
      accessLevel: 'basic',
    });

    // Generate QR code
    const accessUrl = `${process.env.API_URL}/emergency-access/${emergencyCard.accessCode}`;
    const qrCode = await QRCode.toDataURL(accessUrl);

    res.status(201).json({
      emergencyCard,
      qrCode,
      accessUrl,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Access emergency information using access code
// @route   GET /api/v1/emergency-access/:accessCode
// @access  Public
const accessEmergencyInfo = async (req, res) => {
  try {
    const { accessCode } = req.params;

    // Find the emergency card
    const emergencyCard = await EmergencyCard.findOne({
      accessCode,
      isActive: true,
      expiresAt: { $gt: new Date() },
    });

    if (!emergencyCard) {
      return res.status(404).json({ message: 'Invalid or expired emergency access code' });
    }

    // Get patient information
    const patient = await Patient.findById(emergencyCard.patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const user = await User.findOne({ profile: emergencyCard.patientId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Log the access
    emergencyCard.accessLog.push({
      accessedAt: new Date(),
      accessedBy: req.body.accessedBy || 'Anonymous',
      accessIp: req.ip,
      notes: req.body.notes || 'Emergency access',
    });
    await emergencyCard.save();

    // Prepare emergency information for response
    const emergencyInfo = {
      patientName: patient.name,
      healthId: user.healthId,
      bloodGroup: patient.bloodGroup || 'Unknown',
      dateOfBirth: patient.dateOfBirth,
      gender: patient.gender,
      emergencyContact: patient.emergencyContact || null,
      allergies: patient.allergies || [],
      chronicConditions: patient.chronicConditions || [],
    };

    // If access level is full, include more information
    if (emergencyCard.accessLevel === 'full') {
      emergencyInfo.medications = patient.medications || [];
      emergencyInfo.contactNumber = patient.contactNumber;
      emergencyInfo.address = patient.address;
    }

    res.json({
      emergencyInfo,
      accessLevel: emergencyCard.accessLevel,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get emergency card access logs
// @route   GET /api/v1/emergency-card/logs
// @access  Private (Patient - own data only)
const getAccessLogs = async (req, res) => {
  try {
    const patientId = req.user.profile;

    // Find all cards for the patient
    const emergencyCards = await EmergencyCard.find({ patientId }).sort({ createdAt: -1 });

    if (!emergencyCards || emergencyCards.length === 0) {
      return res.status(404).json({ message: 'No emergency cards found' });
    }

    // Combine all access logs with card information
    const allLogs = [];
    emergencyCards.forEach(card => {
      card.accessLog.forEach(log => {
        allLogs.push({
          accessedAt: log.accessedAt,
          accessedBy: log.accessedBy,
          accessIp: log.accessIp,
          notes: log.notes,
          cardCode: card.accessCode,
          cardStatus: card.isActive ? 'Active' : 'Inactive',
          accessLevel: card.accessLevel,
        });
      });
    });

    // Sort logs by access date (newest first)
    allLogs.sort((a, b) => new Date(b.accessedAt) - new Date(a.accessedAt));

    res.json(allLogs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = {
  getEmergencyCard,
  updateEmergencyCard,
  regenerateEmergencyCard,
  accessEmergencyInfo,
  getAccessLogs,
};
