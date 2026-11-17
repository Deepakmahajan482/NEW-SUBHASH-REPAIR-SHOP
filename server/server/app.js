import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Route Imports
import authRoutes from './routes/authRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import settingRoutes from './routes/settingRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';

dotenv.config();

const app = express();

// Dynamic CORS configuration (Allows all in development, restricted in production)
const corsOrigin = process.env.CORS_ORIGIN;
if (corsOrigin && corsOrigin !== '*') {
  const allowedOrigins = corsOrigin.split(',').map((o) => o.trim());
  app.use(cors({ origin: allowedOrigins, credentials: true }));
} else {
  app.use(cors());
}

// Configurable payload limit for high-resolution images
const payloadLimit = process.env.MAX_PAYLOAD_LIMIT || '25mb';
app.use(express.json({ limit: payloadLimit }));
app.use(express.urlencoded({ limit: payloadLimit, extended: true }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Base health check route
app.get('/', (req, res) => {
  res.status(200).json({ message: 'New Subash Repair Shop - API is running...' });
});

// Real-time Database Health Check
app.get('/api/health', (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  res.status(200).json({
    status: 'OK',
    database: isDbConnected ? 'connected' : 'disconnected',
    databaseName: mongoose.connection.name || 'subhash_repair_shop',
    host: mongoose.connection.host || '127.0.0.1',
    port: mongoose.connection.port || 27017,
    uptime: Math.floor(process.uptime()),
  });
});

// Route Mounts
app.use('/api/auth', authRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/inventory', inventoryRoutes);

// 404 Route Not Found Middleware
app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
});

// Global Error Handling Middleware
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

export default app;
