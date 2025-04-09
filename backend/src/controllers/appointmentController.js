const { body, validationResult } = require('express-validator');
const Appointment = require('../models/appointmentModel');
const Patient = require('../models/patientModel');
const Doctor = require('../models/doctorModel');

// @desc    Create a new appointment
// @route   POST /api/v1/appointments
// @access  Private/Patient
const createAppointment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { doctorId, hospitalId, date, time, type, reason } = req.body;
    const patientId = req.user.profile;

    const appointment = await Appointment.create({
      patientId,
      doctorId,
      hospitalId,
      date,
      time,
      type,
      reason,
      status: 'scheduled',
    });

    res.status(201).json(appointment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get appointment by ID
// @route   GET /api/v1/appointments/:id
// @access  Private
const getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patientId', 'name contactNumber')
      .populate('doctorId', 'name specialization')
      .populate('hospitalId', 'name address');

    if (appointment) {
      res.json(appointment);
    } else {
      res.status(404).json({ message: 'Appointment not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update appointment
// @route   PUT /api/v1/appointments/:id
// @access  Private
const updateAppointment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const appointment = await Appointment.findById(req.params.id);

    if (appointment) {
      appointment.date = req.body.date || appointment.date;
      appointment.time = req.body.time || appointment.time;
      appointment.status = req.body.status || appointment.status;
      appointment.type = req.body.type || appointment.type;
      appointment.reason = req.body.reason || appointment.reason;
      appointment.notes = req.body.notes || appointment.notes;

      const updatedAppointment = await appointment.save();
      res.json(updatedAppointment);
    } else {
      res.status(404).json({ message: 'Appointment not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Cancel appointment
// @route   DELETE /api/v1/appointments/:id
// @access  Private
const cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (appointment) {
      appointment.status = 'cancelled';
      await appointment.save();
      res.json({ message: 'Appointment cancelled' });
    } else {
      res.status(404).json({ message: 'Appointment not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = {
  createAppointment,
  getAppointmentById,
  updateAppointment,
  cancelAppointment,
};
