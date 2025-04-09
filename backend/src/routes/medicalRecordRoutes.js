const express = require('express');
const router = express.Router();
const { protect, doctor } = require('../middleware/authMiddleware');
const { validateUpdateMedicalRecord, validateAddAttachment } = require('../middleware/validationMiddleware');
const {
  getMedicalRecordById,
  updateMedicalRecord,
  addAttachment,
  deleteMedicalRecord,
} = require('../controllers/medicalRecordController');

// All routes are protected
router.use(protect);

router.route('/:id')
  .get(getMedicalRecordById)
  .put(doctor, validateUpdateMedicalRecord, updateMedicalRecord)
  .delete(doctor, deleteMedicalRecord);

router.route('/:id/attachments')
  .put(doctor, validateAddAttachment, addAttachment);

module.exports = router;
