const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { validateCreateAppointment, validateUpdateAppointment } = require('../middleware/validationMiddleware');
const {
  createAppointment,
  getAppointmentById,
  updateAppointment,
  cancelAppointment,
} = require('../controllers/appointmentController');

// All routes are protected
router.use(protect);

router.route('/')
  .post(validateCreateAppointment, createAppointment);

router.route('/:id')
  .get(getAppointmentById)
  .put(validateUpdateAppointment, updateAppointment)
  .delete(cancelAppointment);

module.exports = router;
