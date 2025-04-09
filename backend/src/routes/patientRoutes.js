const express = require('express');
const router = express.Router();
const { protect, patient } = require('../middleware/authMiddleware');
const {
  getPatientDashboard,
  getPatientAppointments,
  getPatientMedicalRecords,
  getPatientPrescriptions,
  getPatientLabReports,
  getAvailableDoctors,
} = require('../controllers/patientController');

// All routes are protected and require patient role
router.use(protect);
router.use(patient);

router.get('/dashboard', getPatientDashboard);
router.get('/appointments', getPatientAppointments);
router.get('/medical-records', getPatientMedicalRecords);
router.get('/prescriptions', getPatientPrescriptions);
router.get('/lab-reports', getPatientLabReports);
router.get('/doctors', getAvailableDoctors);

module.exports = router;
