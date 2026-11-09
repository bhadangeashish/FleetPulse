import { Request, Response } from 'express';
import { isDatabaseConnected } from '../config/database';
import { HealthResponse } from '../types/api';

const startTime = Date.now();

export const getHealth = (req: Request, res: Response): void => {
  const healthData: HealthResponse = {
    status: 'ok',
    service: 'fleetpulse-api',
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000),
    database: isDatabaseConnected ? 'connected' : 'in_memory_fallback',
    version: '1.0.0',
  };

  res.status(200).json(healthData);
};

