const { check, validationResult } = require('express-validator');
const User = require('../models/userModel');
const Patient = require('../models/patientModel');
const Doctor = require('../models/doctorModel');
const Hospital = require('../models/hospitalModel');
const generateToken = require('../utils/generateToken');
const crypto = require('crypto');

// Generate Health ID
const generateHealthId = () => {
  return 'DH' + crypto.randomBytes(4).toString('hex').toUpperCase();
};

// @desc    Register a new user
// @route   POST /api/v1/auth/register
// @access  Public
const registerUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, password, userType, name } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Generate a unique health ID
    const healthId = generateHealthId();

    // Create user first
    const user = await User.create({
      healthId,
      email,
      password,
      userType,
    });

    // Based on user type, create respective profile
    let profileData = {};

    if (userType === 'patient') {
      const patient = await Patient.create({
        userId: user._id,
        name,
        dateOfBirth: req.body.dateOfBirth || new Date(),
        gender: req.body.gender || 'other',
        contactNumber: req.body.contactNumber || '',
        address: req.body.address || {},
      });
      user.profile = patient._id;
      profileData = patient;
    } else if (userType === 'doctor') {
      const doctor = await Doctor.create({
        userId: user._id,
        name,
        specialization: req.body.specialization || 'General',
        qualifications: req.body.qualifications || [],
        experience: req.body.experience || 0,
        licenseNumber: req.body.licenseNumber || `LIC${Date.now()}`,
        contactNumber: req.body.contactNumber || '',
        consultationFee: req.body.consultationFee || 0,
      });
      user.profile = doctor._id;
      profileData = doctor;
    } else if (userType === 'hospital') {
      const hospital = await Hospital.create({
        userId: user._id,
        name,
        type: req.body.type || 'private',
        address: req.body.address || {},
        contactNumber: req.body.contactNumber || '',
        email: req.body.email || email,
        facilities: req.body.facilities || [],
        departments: req.body.departments || [],
      });
      user.profile = hospital._id;
      profileData = hospital;
    }

    await user.save();

    res.status(201).json({
      _id: user._id,
      healthId: user.healthId,
      email: user.email,
      userType: user.userType,
      profile: profileData,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/v1/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      let profileData = {};

      if (user.userType === 'patient') {
        profileData = await Patient.findById(user.profile);
      } else if (user.userType === 'doctor') {
        profileData = await Doctor.findById(user.profile);
      } else if (user.userType === 'hospital') {
        profileData = await Hospital.findById(user.profile);
      }

      res.json({
        _id: user._id,
        healthId: user.healthId,
        email: user.email,
        userType: user.userType,
        profile: profileData,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/v1/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      let profileData = {};

      if (user.userType === 'patient') {
        profileData = await Patient.findById(user.profile);
      } else if (user.userType === 'doctor') {
        profileData = await Doctor.findById(user.profile);
      } else if (user.userType === 'hospital') {
        profileData = await Hospital.findById(user.profile);
      }

      res.json({
        _id: user._id,
        healthId: user.healthId,
        email: user.email,
        userType: user.userType,
        profile: profileData,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/v1/auth/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.email = req.body.email || user.email;

      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();

      let profileData = {};
      let profileModel;

      if (user.userType === 'patient') {
        profileModel = Patient;
      } else if (user.userType === 'doctor') {
        profileModel = Doctor;
      } else if (user.userType === 'hospital') {
        profileModel = Hospital;
      }

      if (profileModel) {
        const profile = await profileModel.findById(user.profile);
        
        if (profile) {
          // Update profile fields
          Object.keys(req.body.profile || {}).forEach(key => {
            profile[key] = req.body.profile[key];
          });
          
          const updatedProfile = await profile.save();
          profileData = updatedProfile;
        }
      }

      res.json({
        _id: updatedUser._id,
        healthId: updatedUser.healthId,
        email: updatedUser.email,
        userType: updatedUser.userType,
        profile: profileData,
        token: generateToken(updatedUser._id),
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
};
