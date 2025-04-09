const { check, validationResult } = require('express-validator');
const Doctor = require('../models/doctorModel');
const Appointment = require('../models/appointmentModel');
const MedicalRecord = require('../models/medicalRecordModel');
const Prescription = require('../models/prescriptionModel');
const LabReport = require('../models/labReportModel');
const Patient = require('../models/patientModel');

// @desc    Get doctor dashboard data
// @route   GET /api/v1/doctors/dashboard
// @access  Private/Doctor
const getDoctorDashboard = async (req, res) => {
  try {
    const doctorId = req.user.profile;

    // Get today's appointments
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const appointments = await Appointment.find({
      doctorId,
      status: 'scheduled',
      date: { $gte: today, $lt: tomorrow },
    })
      .sort({ time: 1 })
      .populate('patientId', 'name gender dateOfBirth contactNumber');

    // Get pending appointments count
    const pendingAppointmentsCount = await Appointment.countDocuments({
      doctorId,
      status: 'scheduled',
      date: { $gt: tomorrow },
    });

    // Get recent patients
    const recentPatients = await Appointment.find({
      doctorId,
      status: { $in: ['completed', 'scheduled'] },
    })
      .sort({ date: -1 })
      .limit(5)
      .populate('patientId', 'name gender dateOfBirth contactNumber');

    // Get patient count
    const uniquePatientIds = await Appointment.distinct('patientId', {
      doctorId,
    });

    res.json({
      todayAppointments: appointments,
      pendingAppointmentsCount,
      recentPatients,
      patientsCount: uniquePatientIds.length,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get doctor appointments
// @route   GET /api/v1/doctors/appointments
// @access  Private/Doctor
const getDoctorAppointments = async (req, res) => {
  try {
    const doctorId = req.user.profile;
    const { status, date, patientName } = req.query;

    const query = { doctorId };

    if (status) {
      query.status = status;
    }

    if (date) {
      const selectedDate = new Date(date);
      selectedDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(selectedDate);
      nextDay.setDate(nextDay.getDate() + 1);
      query.date = { $gte: selectedDate, $lt: nextDay };
    }

    let appointments = await Appointment.find(query)
      .sort({ date: 1, time: 1 })
      .populate('patientId', 'name gender dateOfBirth contactNumber')
      .populate('hospitalId', 'name');

    // Filter by patient name if provided
    if (patientName) {
      appointments = appointments.filter(appointment => 
        appointment.patientId.name.toLowerCase().includes(patientName.toLowerCase())
      );
    }

    res.json(appointments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Create medical record
// @route   POST /api/v1/doctors/medical-records
// @access  Private/Doctor
const createMedicalRecord = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const doctorId = req.user.profile;
    const { patientId, hospitalId, recordType, date, diagnosis, symptoms, treatment, notes } = req.body;

    const medicalRecord = await MedicalRecord.create({
      patientId,
      doctorId,
      hospitalId,
      recordType,
      date: date || new Date(),
      diagnosis,
      symptoms,
      treatment,
      notes,
    });

    res.status(201).json(medicalRecord);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Create prescription
// @route   POST /api/v1/doctors/prescriptions
// @access  Private/Doctor
const createPrescription = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const doctorId = req.user.profile;
    const { patientId, medications, instructions, duration } = req.body;

    const prescription = await Prescription.create({
      patientId,
      doctorId,
      date: new Date(),
      medications,
      instructions,
      duration,
      isActive: true,
    });

    res.status(201).json(prescription);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get doctor's patients
// @route   GET /api/v1/doctors/patients
// @access  Private/Doctor
const getDoctorPatients = async (req, res) => {
  try {
    const doctorId = req.user.profile;

    // Get all unique patient IDs from appointments
    const patientIds = await Appointment.distinct('patientId', { doctorId });

    // Get patient details
    const patients = await Patient.find({ _id: { $in: patientIds } })
      .select('name gender dateOfBirth contactNumber bloodGroup allergies chronicConditions');

    res.json(patients);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update doctor availability
// @route   PUT /api/v1/doctors/availability
// @access  Private/Doctor
const updateAvailability = async (req, res) => {
  try {
    const doctorId = req.user.profile;
    const doctor = await Doctor.findById(doctorId);

    if (doctor) {
      doctor.availability = req.body.availability || doctor.availability;
      const updatedDoctor = await doctor.save();
      res.json(updatedDoctor.availability);
    } else {
      res.status(404).json({ message: 'Doctor not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = {
  getDoctorDashboard,
  getDoctorAppointments,
  createMedicalRecord,
  createPrescription,
  getDoctorPatients,
  updateAvailability,
};
