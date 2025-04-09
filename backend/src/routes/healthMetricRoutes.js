const express = require('express');
const router = express.Router();
const { protect, patient, doctor } = require('../middleware/authMiddleware');
const { validateCreateHealthMetric } = require('../middleware/validationMiddleware');
const {
  createHealthMetric,
  getHealthMetrics,
  getHealthMetricsSummary,
  deleteHealthMetric
} = require('../controllers/healthMetricController');

// All routes are protected
router.use(protect);

/**
 * @swagger
 * /api/v1/health-metrics:
 *   post:
 *     summary: Create a new health metric
 *     tags: [Health Metrics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - patientId
 *               - type
 *               - value
 *               - unit
 *             properties:
 *               patientId:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [blood-pressure, weight, blood-sugar, heart-rate, temperature, oxygen-level, other]
 *               value:
 *                 type: object
 *               unit:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *               source:
 *                 type: string
 *                 enum: [manual, device, lab]
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Health metric created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not authorized to add metrics for other patients
 *       404:
 *         description: Patient not found
 *       500:
 *         description: Server error
 */
router.post('/', validateCreateHealthMetric, createHealthMetric);

/**
 * @swagger
 * /api/v1/health-metrics:
 *   get:
 *     summary: Get patient health metrics
 *     tags: [Health Metrics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *         description: Patient ID
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [blood-pressure, weight, blood-sugar, heart-rate, temperature, oxygen-level, other]
 *         description: Type of health metric
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of records to return
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *     responses:
 *       200:
 *         description: List of health metrics
 *       400:
 *         description: Patient ID is required
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not authorized to access other patients data
 *       500:
 *         description: Server error
 */
router.get('/', getHealthMetrics);

/**
 * @swagger
 * /api/v1/health-metrics/summary:
 *   get:
 *     summary: Get patient health metrics summary for charts
 *     tags: [Health Metrics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *         description: Patient ID
 *       - in: query
 *         name: timespan
 *         schema:
 *           type: string
 *           enum: [1w, 1m, 3m, 6m, 1y]
 *           default: 6m
 *         description: Time span for the summary (1w=1 week, 1m=1 month, etc.)
 *     responses:
 *       200:
 *         description: Health metrics summary for charts
 *       400:
 *         description: Patient ID is required
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not authorized to access other patients data
 *       500:
 *         description: Server error
 */
router.get('/summary', getHealthMetricsSummary);

/**
 * @swagger
 * /api/v1/health-metrics/{id}:
 *   delete:
 *     summary: Delete a health metric
 *     tags: [Health Metrics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Health metric ID
 *     responses:
 *       200:
 *         description: Health metric removed
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not authorized to delete this record
 *       404:
 *         description: Health metric not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', deleteHealthMetric);

module.exports = router;
