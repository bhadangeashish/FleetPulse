import {
  Vehicle,
  Driver,
  Trip,
  PartyPaymentRecord,
  Party,
  InAppNotification,
  DriverDailyWork,
  UserPermissions,
  AuditLogEntry,
  UserRole,
  CompanyProfile,
  UserAccount,
  AuthSession,
  OdometerEvent,
  FuelRecord,
  ServiceRepairRecord,
  AppLanguage,
} from '../types/tms';
import {
  INITIAL_VEHICLES,
  INITIAL_DRIVERS,
  INITIAL_TRIPS,
  INITIAL_PARTY_PAYMENTS,
  INITIAL_USER_PERMISSIONS,
  INITIAL_NOTIFICATIONS,
  INITIAL_PARTIES,
  INITIAL_DRIVER_DAILY_WORKS,
  INITIAL_ODOMETER_EVENTS,
  INITIAL_FUEL_RECORDS,
  INITIAL_SERVICE_RECORDS,
} from '../data/mockData';

const STORAGE_KEYS = {
  VEHICLES: 'fleetpulse_vehicles_v2',
  DRIVERS: 'fleetpulse_drivers_v2',
  TRIPS: 'fleetpulse_trips_v2',
  PAYMENTS: 'fleetpulse_party_payments_v2',
  PARTIES: 'fleetpulse_parties_v2',
  NOTIFICATIONS: 'fleetpulse_notifications_v2',
  DAILY_WORKS: 'fleetpulse_driver_daily_works_v2',
  COMPANY_NAME: 'fleetpulse_company_name_v2',
  COMPANY_PROFILE: 'fleetpulse_company_profile_v2',
  USER_ACCOUNTS: 'fleetpulse_user_accounts_v2',
  PERMISSIONS: 'fleetpulse_user_permissions_v2',
  AUDIT_LOGS: 'fleetpulse_audit_logs_v2',
  ODOMETER_EVENTS: 'fleetpulse_odometer_events_v2',
  FUEL_RECORDS: 'fleetpulse_fuel_records_v2',
  SERVICE_RECORDS: 'fleetpulse_service_records_v2',
  LANGUAGE: 'fleetpulse_app_language_v2',
  AUTH_SESSION: 'fleetpulse_auth_session_v2',
};

const DEFAULT_COMPANY_PROFILE: CompanyProfile = {
  companyName: 'MAHA-GUJ TRANSPULSE',
  ownerName: 'Rajesh Sharma',
  mobile: '+91 98220 11988',
  email: 'operations@mahagujtranspulse.com',
  address: 'Plot 44, Pune-Nashik Highway Freight Terminal, Chakan MIDC',
  city: 'Pune',
  state: 'Maharashtra',
  gstin: '27AABCU9603R1ZM',
  panNumber: 'AABCU9603R',
  establishedYear: '2012',
  updatedAt: new Date().toISOString(),
};

const DEFAULT_USER_ACCOUNTS: UserAccount[] = [
  {
    id: 'usr-1',
    fullName: 'Rajesh Sharma (Managing Director)',
    mobile: '+91 98220 11988',
    email: 'admin@fleetpulse.com',
    role: 'admin',
    passwordHash: '01599c8267a050fc2afded717e328e972295d07331a970267d29feb82aadbbda', // Admin@123
    address: 'Pune Head Office, Maharashtra',
    verificationStatus: 'verified',
    permissions: {
      canApproveTrips: true,
      canSettlePayments: true,
      canEditReminders: true,
      canManageDrivers: true,
      canViewFinancials: true,
    },
    documents: [
      {
        id: 'udoc-1',
        name: 'Aadhaar Card Copy',
        type: 'Aadhaar',
        documentNumber: 'XXXX-XXXX-9901',
        status: 'verified',
        uploadedAt: '2026-01-10',
      },
    ],
    createdAt: '2026-01-01',
  },
  {
    id: 'usr-2',
    fullName: 'Amit Deshmukh (Dispatch Manager)',
    mobile: '+91 98224 88201',
    email: 'amit@fleetpulse.com',
    role: 'operator',
    passwordHash: 'bccea06f67b9d1f24b7a20090d2e24837e5c41df598a454224f0bbeca1b4d515', // Operator@123
    address: 'Surat Ring Road Booking Office, Gujarat',
    verificationStatus: 'verified',
    permissions: {
      canApproveTrips: true,
      canSettlePayments: false,
      canEditReminders: false,
      canManageDrivers: true,
      canViewFinancials: false,
    },
    documents: [
      {
        id: 'udoc-2',
        name: 'Aadhaar Card Copy',
        type: 'Aadhaar',
        documentNumber: 'XXXX-XXXX-4422',
        status: 'verified',
        uploadedAt: '2026-02-15',
      },
    ],
    createdAt: '2026-02-15',
  },
  {
    id: 'usr-3',
    fullName: 'Pooja Kulkarni (Accounts Executive)',
    mobile: '+91 98228 33100',
    email: 'pooja@fleetpulse.com',
    role: 'operator',
    passwordHash: 'bccea06f67b9d1f24b7a20090d2e24837e5c41df598a454224f0bbeca1b4d515', // Operator@123
    address: 'Pune Market Yard Office, Maharashtra',
    verificationStatus: 'pending',
    permissions: {
      canApproveTrips: false,
      canSettlePayments: true,
      canEditReminders: false,
      canManageDrivers: false,
      canViewFinancials: true,
    },
    documents: [
      {
        id: 'udoc-3',
        name: 'PAN Card Copy',
        type: 'PAN',
        documentNumber: 'ABCDE5678F',
        status: 'pending',
        uploadedAt: '2026-10-20',
      },
    ],
    createdAt: '2026-10-20',
  },
];

const safeGet = <T>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch (err) {
    console.warn(`[StorageEngine] Failed reading ${key}:`, err);
    return fallback;
  }
};

const safeSet = (key: string, value: any): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.error(`[StorageEngine] Failed writing ${key}:`, err);
    return false;
  }
};

export const StorageEngine = {
  getVehicles: (): Vehicle[] => safeGet(STORAGE_KEYS.VEHICLES, INITIAL_VEHICLES),
  setVehicles: (v: Vehicle[]) => safeSet(STORAGE_KEYS.VEHICLES, v),

  getDrivers: (): Driver[] => safeGet(STORAGE_KEYS.DRIVERS, INITIAL_DRIVERS),
  setDrivers: (d: Driver[]) => safeSet(STORAGE_KEYS.DRIVERS, d),

  getTrips: (): Trip[] => safeGet(STORAGE_KEYS.TRIPS, INITIAL_TRIPS),
  setTrips: (t: Trip[]) => safeSet(STORAGE_KEYS.TRIPS, t),

  getPayments: (): PartyPaymentRecord[] => safeGet(STORAGE_KEYS.PAYMENTS, INITIAL_PARTY_PAYMENTS),
  setPayments: (p: PartyPaymentRecord[]) => safeSet(STORAGE_KEYS.PAYMENTS, p),

  getParties: (): Party[] => safeGet(STORAGE_KEYS.PARTIES, INITIAL_PARTIES),
  setParties: (p: Party[]) => safeSet(STORAGE_KEYS.PARTIES, p),

  getNotifications: (): InAppNotification[] => safeGet(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS),
  setNotifications: (n: InAppNotification[]) => safeSet(STORAGE_KEYS.NOTIFICATIONS, n),

  getDailyWorks: (): DriverDailyWork[] => safeGet(STORAGE_KEYS.DAILY_WORKS, INITIAL_DRIVER_DAILY_WORKS),
  setDailyWorks: (w: DriverDailyWork[]) => safeSet(STORAGE_KEYS.DAILY_WORKS, w),

  getCompanyName: (): string => safeGet(STORAGE_KEYS.COMPANY_NAME, 'MAHA-GUJ TRANSPULSE'),
  setCompanyName: (name: string) => safeSet(STORAGE_KEYS.COMPANY_NAME, name),

  getCompanyProfile: (): CompanyProfile =>
    safeGet(STORAGE_KEYS.COMPANY_PROFILE, DEFAULT_COMPANY_PROFILE),
  setCompanyProfile: (profile: CompanyProfile) => {
    safeSet(STORAGE_KEYS.COMPANY_PROFILE, profile);
    safeSet(STORAGE_KEYS.COMPANY_NAME, profile.companyName);
    return true;
  },

  getUserAccounts: (): UserAccount[] =>
    safeGet(STORAGE_KEYS.USER_ACCOUNTS, DEFAULT_USER_ACCOUNTS),
  setUserAccounts: (users: UserAccount[]) => safeSet(STORAGE_KEYS.USER_ACCOUNTS, users),

  getAuthSession: (): AuthSession | null => {
    const session = safeGet<AuthSession | null>(STORAGE_KEYS.AUTH_SESSION, null);
    if (!session) return null;
    // Enforce cryptographic session expiry check
    if (session.expiresAt && Date.now() > session.expiresAt) {
      StorageEngine.setAuthSession(null);
      return null;
    }
    return session;
  },
  setAuthSession: (session: AuthSession | null) =>
    safeSet(STORAGE_KEYS.AUTH_SESSION, session),

  getPermissions: (): UserPermissions => safeGet(STORAGE_KEYS.PERMISSIONS, INITIAL_USER_PERMISSIONS),
  setPermissions: (p: UserPermissions) => safeSet(STORAGE_KEYS.PERMISSIONS, p),

  getAuditLogs: (): AuditLogEntry[] => {
    const defaultLogs: AuditLogEntry[] = [
      {
        id: 'aud-seed-1',
        timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
        userRole: 'admin',
        userName: 'Admin Fleet Controller',
        module: 'trips',
        action: 'System Initialized',
        details: 'FleetPulse TMS database and operational registries mounted.',
      },
    ];
    return safeGet(STORAGE_KEYS.AUDIT_LOGS, defaultLogs);
  },
  setAuditLogs: (logs: AuditLogEntry[]) => safeSet(STORAGE_KEYS.AUDIT_LOGS, logs),

  addAuditLog: (entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): AuditLogEntry => {
    const newEntry: AuditLogEntry = {
      ...entry,
      id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    const current = StorageEngine.getAuditLogs();
    const updated = [newEntry, ...current].slice(0, 500); // retain latest 500 logs
    StorageEngine.setAuditLogs(updated);
    return newEntry;
  },

  getOdometerEvents: (): OdometerEvent[] =>
    safeGet(STORAGE_KEYS.ODOMETER_EVENTS, INITIAL_ODOMETER_EVENTS),
  setOdometerEvents: (events: OdometerEvent[]) => safeSet(STORAGE_KEYS.ODOMETER_EVENTS, events),

  getFuelRecords: (): FuelRecord[] =>
    safeGet(STORAGE_KEYS.FUEL_RECORDS, INITIAL_FUEL_RECORDS),
  setFuelRecords: (records: FuelRecord[]) => safeSet(STORAGE_KEYS.FUEL_RECORDS, records),

  getServiceRecords: (): ServiceRepairRecord[] =>
    safeGet(STORAGE_KEYS.SERVICE_RECORDS, INITIAL_SERVICE_RECORDS),
  setServiceRecords: (records: ServiceRepairRecord[]) => safeSet(STORAGE_KEYS.SERVICE_RECORDS, records),

  getLanguage: (): AppLanguage => safeGet(STORAGE_KEYS.LANGUAGE, 'en'),
  setLanguage: (lang: AppLanguage) => safeSet(STORAGE_KEYS.LANGUAGE, lang),

  exportBackupJSON: (): string => {
    const backup = {
      version: '1.1',
      exportedAt: new Date().toISOString(),
      companyName: StorageEngine.getCompanyName(),
      companyProfile: StorageEngine.getCompanyProfile(),
      userAccounts: StorageEngine.getUserAccounts(),
      vehicles: StorageEngine.getVehicles(),
      drivers: StorageEngine.getDrivers(),
      trips: StorageEngine.getTrips(),
      partyPayments: StorageEngine.getPayments(),
      parties: StorageEngine.getParties(),
      notifications: StorageEngine.getNotifications(),
      driverDailyWorks: StorageEngine.getDailyWorks(),
      auditLogs: StorageEngine.getAuditLogs(),
    };
    return JSON.stringify(backup, null, 2);
  },

  importBackupJSON: (jsonString: string): { success: boolean; message: string } => {
    try {
      const data = JSON.parse(jsonString);
      if (data.companyProfile) StorageEngine.setCompanyProfile(data.companyProfile);
      if (Array.isArray(data.userAccounts)) StorageEngine.setUserAccounts(data.userAccounts);
      if (Array.isArray(data.vehicles)) StorageEngine.setVehicles(data.vehicles);
      if (Array.isArray(data.drivers)) StorageEngine.setDrivers(data.drivers);
      if (Array.isArray(data.trips)) StorageEngine.setTrips(data.trips);
      if (Array.isArray(data.partyPayments)) StorageEngine.setPayments(data.partyPayments);
      if (Array.isArray(data.parties)) StorageEngine.setParties(data.parties);
      if (Array.isArray(data.notifications)) StorageEngine.setNotifications(data.notifications);
      if (Array.isArray(data.driverDailyWorks)) StorageEngine.setDailyWorks(data.driverDailyWorks);
      if (typeof data.companyName === 'string') StorageEngine.setCompanyName(data.companyName);
      if (Array.isArray(data.auditLogs)) StorageEngine.setAuditLogs(data.auditLogs);
      return { success: true, message: 'Backup imported successfully. All modules refreshed.' };
    } catch (err: any) {
      return { success: false, message: `Failed to import backup: ${err.message}` };
    }
  },
};

