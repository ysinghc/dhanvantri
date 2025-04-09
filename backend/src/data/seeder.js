const mongoose = require('mongoose');
const dotenv = require('dotenv');
const colors = require('colors');
const bcrypt = require('bcryptjs');

// Load env vars
dotenv.config();

// Load models
const User = require('../models/userModel');
const Patient = require('../models/patientModel');
const Doctor = require('../models/doctorModel');
const Hospital = require('../models/hospitalModel');
const Appointment = require('../models/appointmentModel');
const MedicalRecord = require('../models/medicalRecordModel');
const Prescription = require('../models/prescriptionModel');
const LabReport = require('../models/labReportModel');

// Connect to DB
const connectDB = require('../config/db');
connectDB();

// Sample data
const patients = [
  {
    name: 'John Doe',
    dateOfBirth: '1990-01-15',
    gender: 'male',
    contactNumber: '9876543210',
    emergencyContact: {
      name: 'Jane Doe',
      relationship: 'Spouse',
      phone: '9876543211',
    },
    address: {
      street: '123 Main St',
      city: 'Bangalore',
      state: 'Karnataka',
      postalCode: '560001',
      country: 'India',
    },
    bloodGroup: 'O+',
    allergies: ['Penicillin', 'Peanuts'],
    chronicConditions: ['Hypertension'],
    insuranceDetails: {
      provider: 'Health India',
      policyNumber: 'HI12345678',
      coverageDetails: 'Comprehensive',
      validUntil: '2025-12-31',
    },
  },
  {
    name: 'Jane Smith',
    dateOfBirth: '1985-05-22',
    gender: 'female',
    contactNumber: '9876543212',
    emergencyContact: {
      name: 'John Smith',
      relationship: 'Husband',
      phone: '9876543213',
    },
    address: {
      street: '456 Park Ave',
      city: 'Delhi',
      state: 'Delhi',
      postalCode: '110001',
      country: 'India',
    },
    bloodGroup: 'A+',
    allergies: ['Sulfa'],
    chronicConditions: ['Diabetes'],
    insuranceDetails: {
      provider: 'MediShield',
      policyNumber: 'MS87654321',
      coverageDetails: 'Basic',
      validUntil: '2024-10-15',
    },
  },
  {
    name: 'Rahul Kumar',
    dateOfBirth: '1995-09-10',
    gender: 'male',
    contactNumber: '9876543214',
    address: {
      street: '789 Ring Road',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400001',
      country: 'India',
    },
    bloodGroup: 'B+',
    allergies: [],
    chronicConditions: [],
  },
];

const doctors = [
  {
    name: 'Dr. Robert Smith',
    specialization: 'Cardiology',
    qualifications: ['MBBS', 'MD', 'DM Cardiology'],
    experience: 15,
    licenseNumber: 'MCI12345',
    contactNumber: '9876543215',
    consultationFee: 1000,
    availability: {
      monday: [
        { start: '09:00', end: '13:00' },
        { start: '16:00', end: '19:00' },
      ],
      tuesday: [{ start: '09:00', end: '13:00' }],
      wednesday: [
        { start: '09:00', end: '13:00' },
        { start: '16:00', end: '19:00' },
      ],
      thursday: [{ start: '09:00', end: '13:00' }],
      friday: [
        { start: '09:00', end: '13:00' },
        { start: '16:00', end: '19:00' },
      ],
    },
  },
  {
    name: 'Dr. Sarah Johnson',
    specialization: 'Dermatology',
    qualifications: ['MBBS', 'MD', 'DNB Dermatology'],
    experience: 10,
    licenseNumber: 'MCI67890',
    contactNumber: '9876543216',
    consultationFee: 1200,
    availability: {
      monday: [{ start: '10:00', end: '16:00' }],
      wednesday: [{ start: '10:00', end: '16:00' }],
      friday: [{ start: '10:00', end: '16:00' }],
    },
  },
  {
    name: 'Dr. Priya Sharma',
    specialization: 'Gynecology',
    qualifications: ['MBBS', 'MS', 'DGO'],
    experience: 12,
    licenseNumber: 'MCI54321',
    contactNumber: '9876543217',
    consultationFee: 1500,
    availability: {
      tuesday: [{ start: '10:00', end: '17:00' }],
      thursday: [{ start: '10:00', end: '17:00' }],
      saturday: [{ start: '10:00', end: '14:00' }],
    },
  },
];

const hospitals = [
  {
    name: 'City Hospital',
    type: 'multi-specialty',
    address: {
      street: '10 Hospital Road',
      city: 'Bangalore',
      state: 'Karnataka',
      postalCode: '560046',
      country: 'India',
    },
    contactNumber: '08012345678',
    email: 'info@cityhospital.com',
    facilities: [
      'Emergency',
      'ICU',
      'Laboratory',
      'Radiology',
      'Pharmacy',
      'Blood Bank',
    ],
    departments: [
      'Cardiology',
      'Dermatology',
      'Neurology',
      'Orthopedics',
      'Gynecology',
      'Pediatrics',
    ],
  },
  {
    name: 'Lifeline Medical Center',
    type: 'private',
    address: {
      street: '25 Health Avenue',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400050',
      country: 'India',
    },
    contactNumber: '02223456789',
    email: 'contact@lifelinemedical.com',
    facilities: ['Emergency', 'ICU', 'Laboratory', 'Radiology', 'Pharmacy'],
    departments: ['Cardiology', 'Orthopedics', 'Gynecology', 'Pediatrics'],
  },
];

// Import data
const importData = async () => {
  try {
    // Clear database
    await User.deleteMany();
    await Patient.deleteMany();
    await Doctor.deleteMany();
    await Hospital.deleteMany();
    await Appointment.deleteMany();
    await MedicalRecord.deleteMany();
    await Prescription.deleteMany();
    await LabReport.deleteMany();

    console.log('Database cleared'.red.inverse);

    // Create users and their profiles
    const patientUsers = [];
    const doctorUsers = [];
    const hospitalUsers = [];
    const patientProfiles = [];
    const doctorProfiles = [];
    const hospitalProfiles = [];

    // Create patients
    for (let i = 0; i < patients.length; i++) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('password123', salt);

      const user = await User.create({
        healthId: `PAT${i + 1}${Date.now().toString().slice(-5)}`,
        email: `patient${i + 1}@example.com`,
        password: hashedPassword,
        userType: 'patient',
      });

      patientUsers.push(user);

      const patient = await Patient.create({
        userId: user._id,
        ...patients[i],
      });

      patientProfiles.push(patient);

      user.profile = patient._id;
      await user.save();
    }

    // Create doctors
    for (let i = 0; i < doctors.length; i++) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('password123', salt);

      const user = await User.create({
        healthId: `DOC${i + 1}${Date.now().toString().slice(-5)}`,
        email: `doctor${i + 1}@example.com`,
        password: hashedPassword,
        userType: 'doctor',
      });

      doctorUsers.push(user);

      const doctor = await Doctor.create({
        userId: user._id,
        ...doctors[i],
      });

      doctorProfiles.push(doctor);

      user.profile = doctor._id;
      await user.save();
    }

    // Create hospitals
    for (let i = 0; i < hospitals.length; i++) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('password123', salt);

      const user = await User.create({
        healthId: `HOS${i + 1}${Date.now().toString().slice(-5)}`,
        email: `hospital${i + 1}@example.com`,
        password: hashedPassword,
        userType: 'hospital',
      });

      hospitalUsers.push(user);

      const hospital = await Hospital.create({
        userId: user._id,
        ...hospitals[i],
      });

      hospitalProfiles.push(hospital);

      user.profile = hospital._id;
      await user.save();
    }

    // Associate doctors with hospitals
    doctorProfiles[0].hospitalAffiliations.push({
      hospitalId: hospitalProfiles[0]._id,
      name: hospitalProfiles[0].name,
      from: new Date('2020-01-01'),
      current: true,
    });
    await doctorProfiles[0].save();

    doctorProfiles[1].hospitalAffiliations.push({
      hospitalId: hospitalProfiles[1]._id,
      name: hospitalProfiles[1].name,
      from: new Date('2021-05-01'),
      current: true,
    });
    await doctorProfiles[1].save();

    doctorProfiles[2].hospitalAffiliations.push({
      hospitalId: hospitalProfiles[0]._id,
      name: hospitalProfiles[0].name,
      from: new Date('2019-03-01'),
      current: true,
    });
    await doctorProfiles[2].save();

    // Add doctors to hospitals
    hospitalProfiles[0].doctors.push(doctorProfiles[0]._id, doctorProfiles[2]._id);
    await hospitalProfiles[0].save();

    hospitalProfiles[1].doctors.push(doctorProfiles[1]._id);
    await hospitalProfiles[1].save();

    // Create appointments
    const appointments = [
      {
        patientId: patientProfiles[0]._id,
        doctorId: doctorProfiles[0]._id,
        hospitalId: hospitalProfiles[0]._id,
        date: new Date(),
        time: '10:00',
        status: 'scheduled',
        type: 'in-person',
        reason: 'Heart checkup',
      },
      {
        patientId: patientProfiles[1]._id,
        doctorId: doctorProfiles[1]._id,
        hospitalId: hospitalProfiles[1]._id,
        date: new Date(),
        time: '11:30',
        status: 'scheduled',
        type: 'in-person',
        reason: 'Skin condition',
      },
      {
        patientId: patientProfiles[0]._id,
        doctorId: doctorProfiles[2]._id,
        hospitalId: hospitalProfiles[0]._id,
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        time: '15:00',
        status: 'scheduled',
        type: 'telemedicine',
        reason: 'Follow-up consultation',
      },
    ];

    await Appointment.insertMany(appointments);

    // Create medical records
    const medicalRecords = [
      {
        patientId: patientProfiles[0]._id,
        doctorId: doctorProfiles[0]._id,
        hospitalId: hospitalProfiles[0]._id,
        recordType: 'consultation',
        date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        diagnosis: 'Hypertension',
        symptoms: ['Headache', 'Dizziness', 'High blood pressure'],
        treatment: 'Prescribed medication and lifestyle changes',
        notes: 'Patient should monitor blood pressure daily',
      },
      {
        patientId: patientProfiles[1]._id,
        doctorId: doctorProfiles[1]._id,
        hospitalId: hospitalProfiles[1]._id,
        recordType: 'diagnosis',
        date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        diagnosis: 'Eczema',
        symptoms: ['Skin rash', 'Itching', 'Dry skin'],
        treatment: 'Topical corticosteroids',
        notes: 'Avoid allergens and keep skin moisturized',
      },
    ];

    await MedicalRecord.insertMany(medicalRecords);

    // Create prescriptions
    const prescriptions = [
      {
        patientId: patientProfiles[0]._id,
        doctorId: doctorProfiles[0]._id,
        date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        medications: [
          {
            name: 'Amlodipine',
            dosage: '5mg',
            frequency: 'Once daily',
            duration: '30 days',
            instructions: 'Take in the morning',
          },
          {
            name: 'Hydrochlorothiazide',
            dosage: '12.5mg',
            frequency: 'Once daily',
            duration: '30 days',
            instructions: 'Take in the morning with Amlodipine',
          },
        ],
        instructions: 'Maintain low sodium diet, avoid alcohol',
        duration: 30,
        isActive: true,
      },
      {
        patientId: patientProfiles[1]._id,
        doctorId: doctorProfiles[1]._id,
        date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        medications: [
          {
            name: 'Hydrocortisone Cream',
            dosage: '1%',
            frequency: 'Twice daily',
            duration: '14 days',
            instructions: 'Apply thin layer to affected areas',
          },
        ],
        instructions: 'Keep skin moisturized, avoid hot showers',
        duration: 14,
        isActive: true,
      },
    ];

    await Prescription.insertMany(prescriptions);

    // Create lab reports
    const labReports = [
      {
        patientId: patientProfiles[0]._id,
        doctorId: doctorProfiles[0]._id,
        hospitalId: hospitalProfiles[0]._id,
        date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
        testType: 'Blood Pressure',
        results: {
          systolic: 145,
          diastolic: 95,
        },
        normalRanges: {
          systolic: '90-120',
          diastolic: '60-80',
        },
        notes: 'Blood pressure is elevated, monitoring required',
      },
      {
        patientId: patientProfiles[0]._id,
        doctorId: doctorProfiles[0]._id,
        hospitalId: hospitalProfiles[0]._id,
        date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        testType: 'Blood Sugar',
        results: {
          fasting: 102,
          postPrandial: 145,
        },
        normalRanges: {
          fasting: '70-100',
          postPrandial: '100-140',
        },
        notes: 'Blood sugar slightly elevated, diet control recommended',
      },
    ];

    await LabReport.insertMany(labReports);

    console.log('Data imported!'.green.inverse);
    process.exit();
  } catch (error) {
    console.error(`${error}`.red.inverse);
    process.exit(1);
  }
};

// Delete data
const destroyData = async () => {
  try {
    await User.deleteMany();
    await Patient.deleteMany();
    await Doctor.deleteMany();
    await Hospital.deleteMany();
    await Appointment.deleteMany();
    await MedicalRecord.deleteMany();
    await Prescription.deleteMany();
    await LabReport.deleteMany();

    console.log('Data destroyed!'.red.inverse);
    process.exit();
  } catch (error) {
    console.error(`${error}`.red.inverse);
    process.exit(1);
  }
};

// Run import or destroy based on args
if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}
