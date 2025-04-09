const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.userType === 'admin') {
    next();
  } else {
    res.status(401);
    throw new Error('Not authorized as an admin');
  }
};

const doctor = (req, res, next) => {
  if (req.user && req.user.userType === 'doctor') {
    next();
  } else {
    res.status(401);
    throw new Error('Not authorized as a doctor');
  }
};

const hospital = (req, res, next) => {
  if (req.user && req.user.userType === 'hospital') {
    next();
  } else {
    res.status(401);
    throw new Error('Not authorized as a hospital');
  }
};

const patient = (req, res, next) => {
  if (req.user && req.user.userType === 'patient') {
    next();
  } else {
    res.status(401);
    throw new Error('Not authorized as a patient');
  }
};

module.exports = { protect, admin, doctor, hospital, patient };
