const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');
const { swaggerUi, specs } = require('./swagger');

// Import routes
const authRoutes = require('./routes/authRoutes');
const patientRoutes = require('./routes/patientRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const hospitalRoutes = require('./routes/hospitalRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const medicalRecordRoutes = require('./routes/medicalRecordRoutes');
const prescriptionRoutes = require('./routes/prescriptionRoutes');
const labReportRoutes = require('./routes/labReportRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const healthMetricRoutes = require('./routes/healthMetricRoutes');
const emergencyCardRoutes = require('./routes/emergencyCardRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, { explorer: true }));

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/patients', patientRoutes);
app.use('/api/v1/doctors', doctorRoutes);
app.use('/api/v1/hospitals', hospitalRoutes);
app.use('/api/v1/appointments', appointmentRoutes);
app.use('/api/v1/medical-records', medicalRecordRoutes);
app.use('/api/v1/prescriptions', prescriptionRoutes);
app.use('/api/v1/lab-reports', labReportRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/health-metrics', healthMetricRoutes);
app.use('/api/v1/emergency-card', emergencyCardRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Dhanvantri Healthcare API',
    version: '1.0.0',
    status: 'active',
    documentation: `${process.env.API_URL}/api-docs`
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', message: 'Server is healthy' });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;
