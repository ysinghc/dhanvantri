const express = require('express');
const router = express.Router();
const { protect, doctor } = require('../middleware/authMiddleware');
const { validateUpdatePrescription } = require('../middleware/validationMiddleware');
const {
  getPrescriptionById,
  updatePrescription,
  deletePrescription,
} = require('../controllers/prescriptionController');

// All routes are protected
router.use(protect);

router.route('/:id')
  .get(getPrescriptionById)
  .put(doctor, validateUpdatePrescription, updatePrescription)
  .delete(doctor, deletePrescription);

module.exports = router;
