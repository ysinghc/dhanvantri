const express = require('express');
const router = express.Router();
const { protect, doctor } = require('../middleware/authMiddleware');
const { validateCreateLabReport, validateUpdateLabReport } = require('../middleware/validationMiddleware');
const {
  createLabReport,
  getLabReportById,
  updateLabReport,
  deleteLabReport,
} = require('../controllers/labReportController');

// All routes are protected
router.use(protect);

router.route('/')
  .post(doctor, validateCreateLabReport, createLabReport);

router.route('/:id')
  .get(getLabReportById)
  .put(doctor, validateUpdateLabReport, updateLabReport)
  .delete(doctor, deleteLabReport);

module.exports = router;
