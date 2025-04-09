const Patient = require('../models/patientModel');
const Appointment = require('../models/appointmentModel');
const MedicalRecord = require('../models/medicalRecordModel');
const Prescription = require('../models/prescriptionModel');
const LabReport = require('../models/labReportModel');
const Doctor = require('../models/doctorModel');

// @desc    Get patient dashboard data
// @route   GET /api/v1/patients/dashboard
// @access  Private/Patient
const getPatientDashboard = async (req, res) => {
  try {
    const patientId = req.user.profile;

    // Get upcoming appointments
    const appointments = await Appointment.find({
      patientId,
      status: 'scheduled',
      date: { $gte: new Date() },
    })
      .sort({ date: 1, time: 1 })
      .limit(5)
      .populate('doctorId', 'name specialization')
      .populate('hospitalId', 'name address');

    // Get active prescriptions
    const prescriptions = await Prescription.find({
      patientId,
      isActive: true,
    })
      .sort({ date: -1 })
      .limit(5)
      .populate('doctorId', 'name specialization');

    // Get recent medical records
    const medicalRecords = await MedicalRecord.find({
      patientId,
    })
      .sort({ date: -1 })
      .limit(5)
      .populate('doctorId', 'name specialization')
      .populate('hospitalId', 'name');

    // Get recent lab reports
    const labReports = await LabReport.find({
      patientId,
    })
      .sort({ date: -1 })
      .limit(5)
      .populate('doctorId', 'name specialization');

    res.json({
      appointments,
      prescriptions,
      medicalRecords,
      labReports,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get patient appointments
// @route   GET /api/v1/patients/appointments
// @access  Private/Patient
const getPatientAppointments = async (req, res) => {
  try {
    const patientId = req.user.profile;
    const { status, from, to } = req.query;

    const query = { patientId };

    if (status) {
      query.status = status;
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

    const appointments = await Appointment.find(query)
      .sort({ date: -1, time: -1 })
      .populate('doctorId', 'name specialization')
      .populate('hospitalId', 'name address');

    res.json(appointments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get patient medical records
// @route   GET /api/v1/patients/medical-records
// @access  Private/Patient
const getPatientMedicalRecords = async (req, res) => {
  try {
    const patientId = req.user.profile;
    const { recordType, from, to } = req.query;

    const query = { patientId };

    if (recordType) {
      query.recordType = recordType;
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

    const medicalRecords = await MedicalRecord.find(query)
      .sort({ date: -1 })
      .populate('doctorId', 'name specialization')
      .populate('hospitalId', 'name');

    res.json(medicalRecords);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get patient prescriptions
// @route   GET /api/v1/patients/prescriptions
// @access  Private/Patient
const getPatientPrescriptions = async (req, res) => {
  try {
    const patientId = req.user.profile;
    const { active, from, to } = req.query;

    const query = { patientId };

    if (active === 'true') {
      query.isActive = true;
    } else if (active === 'false') {
      query.isActive = false;
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

    const prescriptions = await Prescription.find(query)
      .sort({ date: -1 })
      .populate('doctorId', 'name specialization');

    res.json(prescriptions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get patient lab reports
// @route   GET /api/v1/patients/lab-reports
// @access  Private/Patient
const getPatientLabReports = async (req, res) => {
  try {
    const patientId = req.user.profile;
    const { testType, from, to } = req.query;

    const query = { patientId };

    if (testType) {
      query.testType = testType;
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

    const labReports = await LabReport.find(query)
      .sort({ date: -1 })
      .populate('doctorId', 'name specialization')
      .populate('hospitalId', 'name');

    res.json(labReports);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get available doctors
// @route   GET /api/v1/patients/doctors
// @access  Private/Patient
const getAvailableDoctors = async (req, res) => {
  try {
    const { specialization } = req.query;

    const query = {};

    if (specialization) {
      query.specialization = specialization;
    }

    const doctors = await Doctor.find(query)
      .select('name specialization qualifications experience consultationFee hospitalAffiliations')
      .populate('hospitalAffiliations.hospitalId', 'name address');

    res.json(doctors);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = {
  getPatientDashboard,
  getPatientAppointments,
  getPatientMedicalRecords,
  getPatientPrescriptions,
  getPatientLabReports,
  getAvailableDoctors,
};
