import { apiClient } from './client';
import {
  Vehicle,
  Driver,
  Trip,
  ReturnLoad,
  PartyPaymentRecord,
  Party,
  PartyDocument,
  CompanyProfile,
  UserAccount,
  FuelRecord,
  ServiceRepairRecord,
  OfflineQueueItem,
} from '../types/tms';
import {
  ApiResponse,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  BatchSyncRequest,
  BatchSyncResponse,
  HealthResponse,
} from '../../shared/types/api';

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient<ApiResponse<LoginResponse>>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  register: (data: RegisterRequest) =>
    apiClient<ApiResponse<LoginResponse>>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  me: () => apiClient<ApiResponse<{ user: UserAccount; role: string }>>('/auth/me'),

  forgotPassword: (email: string) =>
    apiClient<ApiResponse<void>>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  verifyOtp: (email: string, otp: string) =>
    apiClient<ApiResponse<void>>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    }),

  resetPassword: (email: string, otp: string, newPassword: string) =>
    apiClient<ApiResponse<void>>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, otp, newPassword }),
    }),

  getAllUsers: () => apiClient<ApiResponse<UserAccount[]>>('/auth/users'),
};

export const companyApi = {
  getProfile: () => apiClient<ApiResponse<CompanyProfile>>('/company/profile'),

  updateProfile: (profile: Partial<CompanyProfile>) =>
    apiClient<ApiResponse<CompanyProfile>>('/company/profile', {
      method: 'PUT',
      body: JSON.stringify(profile),
    }),

  renameCompany: (newName: string) =>
    apiClient<ApiResponse<CompanyProfile>>('/company/rename', {
      method: 'PATCH',
      body: JSON.stringify({ newName }),
    }),
};

export const vehiclesApi = {
  getAll: () => apiClient<ApiResponse<Vehicle[]>>('/vehicles'),

  getById: (id: string) => apiClient<ApiResponse<Vehicle>>(`/vehicles/${id}`),

  add: (vehicle: Partial<Vehicle>) =>
    apiClient<ApiResponse<Vehicle>>('/vehicles', {
      method: 'POST',
      body: JSON.stringify(vehicle),
    }),

  update: (id: string, updates: Partial<Vehicle>) =>
    apiClient<ApiResponse<Vehicle>>(`/vehicles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  updateOdometer: (id: string, reading: number, notes?: string) =>
    apiClient<ApiResponse<Vehicle>>(`/vehicles/${id}/odometer`, {
      method: 'PATCH',
      body: JSON.stringify({ reading, notes }),
    }),
};

export const driversApi = {
  getAll: () => apiClient<ApiResponse<Driver[]>>('/drivers'),

  getById: (id: string) => apiClient<ApiResponse<Driver>>(`/drivers/${id}`),

  add: (driver: Partial<Driver>) =>
    apiClient<ApiResponse<Driver>>('/drivers', {
      method: 'POST',
      body: JSON.stringify(driver),
    }),

  update: (id: string, updates: Partial<Driver>) =>
    apiClient<ApiResponse<Driver>>(`/drivers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
};

export const tripsApi = {
  getAll: () => apiClient<ApiResponse<Trip[]>>('/trips'),

  getById: (id: string) => apiClient<ApiResponse<Trip>>(`/trips/${id}`),

  add: (trip: Partial<Trip> & { overrideCapacityWarning?: boolean }) =>
    apiClient<ApiResponse<Trip>>('/trips', {
      method: 'POST',
      body: JSON.stringify(trip),
    }),

  updateDestinations: (id: string, destinations: any[]) =>
    apiClient<ApiResponse<Trip>>(`/trips/${id}/destinations`, {
      method: 'PUT',
      body: JSON.stringify({ destinations }),
    }),

  addReturnLoad: (id: string, returnLoad: Partial<ReturnLoad>) =>
    apiClient<ApiResponse<Trip>>(`/trips/${id}/return-load`, {
      method: 'POST',
      body: JSON.stringify(returnLoad),
    }),
};

export const fuelApi = {
  getAll: () => apiClient<ApiResponse<FuelRecord[]>>('/fuel'),

  add: (fuel: Partial<FuelRecord>) =>
    apiClient<ApiResponse<FuelRecord>>('/fuel', {
      method: 'POST',
      body: JSON.stringify(fuel),
    }),
};

export const servicesApi = {
  getAll: () => apiClient<ApiResponse<ServiceRepairRecord[]>>('/services'),

  add: (service: Partial<ServiceRepairRecord>) =>
    apiClient<ApiResponse<ServiceRepairRecord>>('/services', {
      method: 'POST',
      body: JSON.stringify(service),
    }),
};

export const partiesApi = {
  getAll: () => apiClient<ApiResponse<Party[]>>('/parties'),

  add: (party: Partial<Party>) =>
    apiClient<ApiResponse<Party>>('/parties', {
      method: 'POST',
      body: JSON.stringify(party),
    }),

  addDocument: (partyId: string, doc: Partial<PartyDocument>) =>
    apiClient<ApiResponse<PartyDocument>>(`/parties/${partyId}/documents`, {
      method: 'POST',
      body: JSON.stringify(doc),
    }),
};

export const paymentsApi = {
  getAll: () => apiClient<ApiResponse<PartyPaymentRecord[]>>('/payments'),

  recordPartialPayment: (id: string, amount: number, paymentMode?: string, referenceNumber?: string, notes?: string) =>
    apiClient<ApiResponse<PartyPaymentRecord>>(`/payments/${id}/partial-payment`, {
      method: 'POST',
      body: JSON.stringify({ amount, paymentMode, referenceNumber, notes }),
    }),

  settle: (id: string, settledAmount?: number, lrSubmitted?: boolean) =>
    apiClient<ApiResponse<PartyPaymentRecord>>(`/payments/${id}/settle`, {
      method: 'POST',
      body: JSON.stringify({ settledAmount, lrSubmitted }),
    }),
};

export const syncApi = {
  batchSync: (data: BatchSyncRequest) =>
    apiClient<ApiResponse<BatchSyncResponse>>('/sync/batch', {
      method: 'POST',
      body: JSON.stringify(data),
      timeoutMs: 15000,
    }),
};

export const healthApi = {
  check: () => apiClient<HealthResponse>('/health', { timeoutMs: 5000 }),
};
