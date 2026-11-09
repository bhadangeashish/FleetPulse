import dotenv from 'dotenv';
dotenv.config();

export interface EnvConfig {
  PORT: number;
  NODE_ENV: string;
  DATABASE_URL?: string;
  JWT_SECRET: string;
  CORS_ORIGINS: string[];
}

const getEnvOrThrow = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;
  if (!value) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`[Configuration Error] Required environment variable ${key} is missing in production.`);
    }
    return '';
  }
  return value;
};

export const env: EnvConfig = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET || 'fleetpulse_default_jwt_secret_change_in_production_2026',
  CORS_ORIGINS: (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:5173,https://fleetpulse-tms.vercel.app')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
};

