const { check, validationResult } = require('express-validator');
const Hospital = require('../models/hospitalModel');
const Doctor = require('../models/doctorModel');
const Appointment = require('../models/appointmentModel');
const MedicalRecord = require('../models/medicalRecordModel');

// @desc    Get hospital dashboard data
// @route   GET /api/v1/hospitals/dashboard
// @access  Private/Hospital
const getHospitalDashboard = async (req, res) => {
  try {
    const hospitalId = req.user.profile;

    // Get today's appointments
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const appointments = await Appointment.find({
      hospitalId,
      date: { $gte: today, $lt: tomorrow },
    })
      .sort({ time: 1 })
      .populate('patientId', 'name')
      .populate('doctorId', 'name specialization');

    // Get doctors count
    const doctorsCount = await Doctor.countDocuments({
      'hospitalAffiliations.hospitalId': hospitalId,
      'hospitalAffiliations.current': true,
    });

    // Get appointment statistics
    const totalAppointments = await Appointment.countDocuments({ hospitalId });
    const pendingAppointments = await Appointment.countDocuments({
      hospitalId,
      status: 'scheduled',
    });
    const completedAppointments = await Appointment.countDocuments({
      hospitalId,
      status: 'completed',
    });
    const cancelledAppointments = await Appointment.countDocuments({
      hospitalId,
      status: 'cancelled',
    });

    res.json({
      todayAppointments: appointments,
      doctorsCount,
      appointmentStats: {
        total: totalAppointments,
        pending: pendingAppointments,
        completed: completedAppointments,
        cancelled: cancelledAppointments,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get hospital doctors
// @route   GET /api/v1/hospitals/doctors
// @access  Private/Hospital
const getHospitalDoctors = async (req, res) => {
  try {
    const hospitalId = req.user.profile;
    const { specialization } = req.query;

    const query = {
      'hospitalAffiliations.hospitalId': hospitalId,
      'hospitalAffiliations.current': true,
    };

    if (specialization) {
      query.specialization = specialization;
    }

    const doctors = await Doctor.find(query).select(
      'name specialization qualifications experience consultationFee availability'
    );

    res.json(doctors);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get hospital appointments
// @route   GET /api/v1/hospitals/appointments
// @access  Private/Hospital
const getHospitalAppointments = async (req, res) => {
  try {
    const hospitalId = req.user.profile;
    const { status, date, doctorId } = req.query;

    const query = { hospitalId };

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

    if (doctorId) {
      query.doctorId = doctorId;
    }

    const appointments = await Appointment.find(query)
      .sort({ date: 1, time: 1 })
      .populate('patientId', 'name gender dateOfBirth contactNumber')
      .populate('doctorId', 'name specialization');

    res.json(appointments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Add doctor to hospital
// @route   POST /api/v1/hospitals/doctors
// @access  Private/Hospital
const addDoctorToHospital = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const hospitalId = req.user.profile;
    const { doctorId, from, to, current } = req.body;

    const doctor = await Doctor.findById(doctorId);
    const hospital = await Hospital.findById(hospitalId);

    if (!doctor || !hospital) {
      return res.status(404).json({ message: 'Doctor or Hospital not found' });
    }

    // Check if the doctor is already affiliated with this hospital
    const existingAffiliation = doctor.hospitalAffiliations.find(
      affiliation => affiliation.hospitalId.toString() === hospitalId.toString()
    );

    if (existingAffiliation) {
      return res.status(400).json({
        message: 'Doctor is already affiliated with this hospital',
      });
    }

    // Add hospital to doctor's affiliations
    doctor.hospitalAffiliations.push({
      hospitalId,
      name: hospital.name,
      from: from || new Date(),
      to,
      current: current !== undefined ? current : true,
    });

    await doctor.save();

    // Add doctor to hospital's doctors
    if (!hospital.doctors.includes(doctorId)) {
      hospital.doctors.push(doctorId);
      await hospital.save();
    }

    res.status(201).json({
      message: 'Doctor added to hospital successfully',
      doctor: {
        _id: doctor._id,
        name: doctor.name,
        specialization: doctor.specialization,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = {
  getHospitalDashboard,
  getHospitalDoctors,
  getHospitalAppointments,
  addDoctorToHospital,
};
