import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

dotenv.config();

import uploadRoutes from './routes/upload.js';
import resumeRoutes from './routes/resume.js';
import enhanceRoutes from './routes/enhance.js';
import authRoutes from './routes/auth.js';
import jobsRoutes from './routes/jobsRoute.js';
import jobTrackerRoutes from './routes/jobTracker.js';
import jobAlertRoutes from './routes/jobAlerts.js';
import communityRoutes from './routes/community.js';
import adminRoutes from './routes/admin.js';
import fellowshipRoutes from './routes/fellowships.js';
import interviewRoutes from './routes/interview.js';
import paymentRoutes from './routes/payments.js';

import { errorHandler } from './middleware/errorHandler.js';

import { initializeSocket } from './config/socket.js';

import { initializeDefaultChannels } from './controllers/communityFirebaseController.js';

import mongoose from 'mongoose';
import { initJobFetcher } from './services/jobFetcher.js';
import JobAlert from './models/JobAlert.model.js';

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;

app.use(helmet());

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 500, // increased for development
  message: {
    error: 'Too many requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/enhance', enhanceRoutes);
app.use('/api/fetchjobs', jobsRoutes);
app.use('/api/job-tracker', jobTrackerRoutes);
app.use('/api/job-alerts', jobAlertRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/fellowship', fellowshipRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/payments', paymentRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});
app.use(errorHandler);
const startServer = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/velocity';

    console.log('📦 Connecting to MongoDB...');
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10
    });
    console.log('📦 Connected to MongoDB');

    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
    });

    try {
      await initializeDefaultChannels();
      console.log('💬 Community channels initialized');
    } catch (channelError) {
      console.warn('⚠️ Could not initialize default channels:', channelError.message);
    }

    if (process.env.NODE_ENV === 'development') {
      try {
        const testEmail = process.env.DEV_USER_EMAIL || process.env.EMAIL_USER;
        if (testEmail) {
          const result = await JobAlert.updateMany(
            { userEmail: 'dev@example.com' },
            { $set: { userEmail: testEmail } }
          );
          if (result.modifiedCount > 0) {
            console.log(`📧 Updated ${result.modifiedCount} alerts to use email: ${testEmail}`);
          }
        }
      } catch (err) {
        console.warn('⚠️ Could not update dev alert emails:', err.message);
      }
    }

    initializeSocket(httpServer);

    try {
      await initJobFetcher();
    } catch (fetcherError) {
      console.warn('⚠️ Job fetcher initialization skipped:', fetcherError.message);
    }

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

export default app;
