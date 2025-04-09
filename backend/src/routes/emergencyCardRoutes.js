const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { validateUpdateEmergencyCard } = require('../middleware/validationMiddleware');
const {
  getEmergencyCard,
  updateEmergencyCard,
  regenerateEmergencyCard,
  accessEmergencyInfo,
  getAccessLogs
} = require('../controllers/emergencyCardController');

/**
 * @swagger
 * tags:
 *   name: Emergency Card
 *   description: Emergency medical information access
 */

/**
 * @swagger
 * /api/v1/emergency-card:
 *   get:
 *     summary: Get or generate patient emergency card
 *     tags: [Emergency Card]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Emergency card information with QR code
 *       404:
 *         description: Patient not found
 *       500:
 *         description: Server error
 */
router.get('/', protect, getEmergencyCard);

/**
 * @swagger
 * /api/v1/emergency-card:
 *   put:
 *     summary: Update emergency card settings
 *     tags: [Emergency Card]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               accessLevel:
 *                 type: string
 *                 enum: [basic, full]
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Updated emergency card
 *       404:
 *         description: Emergency card not found
 *       500:
 *         description: Server error
 */
router.put('/', protect, validateUpdateEmergencyCard, updateEmergencyCard);

/**
 * @swagger
 * /api/v1/emergency-card/regenerate:
 *   post:
 *     summary: Regenerate emergency card with new access code
 *     tags: [Emergency Card]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: New emergency card generated
 *       500:
 *         description: Server error
 */
router.post('/regenerate', protect, regenerateEmergencyCard);

/**
 * @swagger
 * /api/v1/emergency-card/logs:
 *   get:
 *     summary: Get emergency card access logs
 *     tags: [Emergency Card]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of access logs
 *       404:
 *         description: No emergency cards found
 *       500:
 *         description: Server error
 */
router.get('/logs', protect, getAccessLogs);

// Public route for emergency access
/**
 * @swagger
 * /api/v1/emergency-access/{accessCode}:
 *   get:
 *     summary: Access emergency information with access code
 *     tags: [Emergency Card]
 *     parameters:
 *       - in: path
 *         name: accessCode
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               accessedBy:
 *                 type: string
 *                 description: Identity of the person accessing
 *               notes:
 *                 type: string
 *                 description: Reason for accessing
 *     responses:
 *       200:
 *         description: Emergency information
 *       404:
 *         description: Invalid or expired access code
 *       500:
 *         description: Server error
 */
router.get('/emergency-access/:accessCode', accessEmergencyInfo);

module.exports = router;
