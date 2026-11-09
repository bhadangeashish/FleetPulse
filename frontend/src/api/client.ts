// FleetPulse TMS - Centralized Production API Client
// Handles JWT authentication headers, request timeouts, and offline error propagation

const getApiBaseUrl = (): string => {
  // 1. Environment variable (e.g. Render backend URL: https://fleetpulse-api.onrender.com)
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0) {
    return envUrl.replace(/\/+$/, '');
  }
  // 2. Localhost development fallback
  return 'http://localhost:5000';
};

export const API_BASE_URL = getApiBaseUrl();

export interface ApiRequestOptions extends RequestInit {
  timeoutMs?: number;
}

export class ApiError extends Error {
  statusCode: number;
  data: any;

  constructor(message: string, statusCode: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.data = data;
  }
}

/**
 * Universal fetch wrapper with timeout, token injection, and error formatting
 */
export const apiClient = async <T = any>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> => {
  const { timeoutMs = 8000, headers = {}, ...customConfig } = options;

  // Retrieve auth token from localStorage
  let token: string | null = null;
  try {
    const rawSession = localStorage.getItem('fleetpulse_auth_session_v2');
    if (rawSession) {
      const parsed = JSON.parse(rawSession);
      token = parsed.token || null;
    }
  } catch {
    // Ignore storage parse error
  }

  // Retrieve device ID
  const deviceId = localStorage.getItem('fleetpulse_device_id') || 'browser-client';

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Device-Id': deviceId,
  };

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith('/api') ? endpoint : `/api${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...customConfig,
      headers: {
        ...defaultHeaders,
        ...(headers as Record<string, string>),
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const errorMessage = data && typeof data === 'object' && data.message ? data.message : `API Error: HTTP ${response.status}`;
      throw new ApiError(errorMessage, response.status, data);
    }

    return data as T;
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      throw new ApiError(`Request timeout after ${timeoutMs}ms. Backend server might be unreachable or sleeping.`, 408);
    }

    if (error instanceof ApiError) {
      throw error;
    }

    // Network error (offline or server sleeping on Render free tier)
    throw new ApiError(error.message || 'Network connection failed. Operating in offline-safe mode.', 0);
  }
};
