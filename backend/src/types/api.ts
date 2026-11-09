import {
  UserAccount,
  UserRole,
  AuthSession,
  Vehicle,
  Driver,
  Trip,
  ReturnLoad,
  PartyPaymentRecord,
  Party,
  FuelRecord,
  ServiceRepairRecord,
  OdometerEvent,
  CompanyProfile,
  OfflineQueueItem,
} from './tms';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  timestamp?: string;
}

// Authentication
export interface LoginRequest {
  emailOrUsername: string;
  password?: string;
  role?: UserRole;
  rememberMe?: boolean;
}

export interface LoginResponse {
  user: UserAccount;
  role: UserRole;
  token: string;
  expiresAt: number;
}

export interface RegisterRequest {
  fullName: string;
  mobile: string;
  email: string;
  password?: string;
  role: UserRole;
  address?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface ResetPasswordRequest {
  email: string;
  otp: string;
  newPassword: string;
}

// Batch Sync
export interface BatchSyncRequest {
  deviceId: string;
  items: OfflineQueueItem[];
}

export interface BatchSyncItemResult {
  clientItemId: string;
  idempotencyKey: string;
  status: 'synced' | 'conflict_detected' | 'failed' | 'ignored_duplicate';
  message?: string;
  serverEntityId?: string;
}

export interface BatchSyncResponse {
  processed: number;
  succeeded: number;
  failed: number;
  conflicts: number;
  results: BatchSyncItemResult[];
}

// Health Check
export interface HealthResponse {
  status: 'ok' | 'degraded' | 'error';
  service: string;
  timestamp: string;
  uptime: number;
  database: 'connected' | 'disconnected' | 'in_memory_fallback';
  version: string;
}
