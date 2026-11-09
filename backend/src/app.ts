import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import apiRouter from './routes/index';
import { getHealth } from './controllers/healthController';
import { errorHandler } from './middleware/errorHandler';

export const app = express();

// Security Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS Configuration
app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser agents, local dev, or whitelisted domains
    if (!origin || env.CORS_ORIGINS.includes(origin) || env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} is not allowed by CORS.`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Device-Id', 'X-User-Role', 'X-User-Id'],
}));

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Root health check for Render uptime monitoring
app.get('/health', getHealth);

// API Router
app.use('/api', apiRouter);

// 404 handler for undefined API routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.method} ${req.originalUrl}' does not exist on FleetPulse server.`,
    timestamp: new Date().toISOString(),
  });
});

// Centralized error handling
app.use(errorHandler);

