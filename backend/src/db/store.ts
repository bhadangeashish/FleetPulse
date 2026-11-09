import {
  Vehicle,
  Driver,
  Trip,
  PartyPaymentRecord,
  Party,
  CompanyProfile,
  UserAccount,
  OdometerEvent,
  FuelRecord,
  ServiceRepairRecord,
  AuditLogEntry,
  OfflineQueueItem,
} from '../types/tms';
import {
  INITIAL_VEHICLES,
  INITIAL_DRIVERS,
  INITIAL_TRIPS,
  INITIAL_PARTY_PAYMENTS,
  INITIAL_PARTIES,
  INITIAL_ODOMETER_EVENTS,
  INITIAL_FUEL_RECORDS,
  INITIAL_SERVICE_RECORDS,
} from './initialData';
import { query, isDatabaseConnected } from '../config/database';

export const DEFAULT_COMPANY_PROFILE: CompanyProfile = {
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

export const DEFAULT_USERS: UserAccount[] = [
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
    documents: [],
    createdAt: '2026-01-01',
  },
  {
    id: 'usr-2',
    fullName: 'Amit Deshmukh (Dispatch Manager)',
    mobile: '+91 98224 88201',
    email: 'dispatcher@fleetpulse.com',
    role: 'operator',
    passwordHash: '01599c8267a050fc2afded717e328e972295d07331a970267d29feb82aadbbda', // Admin@123
    address: 'Pune Market Yard Office, Maharashtra',
    verificationStatus: 'verified',
    permissions: {
      canApproveTrips: true,
      canSettlePayments: false,
      canEditReminders: true,
      canManageDrivers: true,
      canViewFinancials: false,
    },
    documents: [],
    createdAt: '2026-01-05',
  },
];

// Persistent In-Memory State Cache
class DatabaseStore {
  companyProfile: CompanyProfile = { ...DEFAULT_COMPANY_PROFILE };
  users: UserAccount[] = [...DEFAULT_USERS];
  vehicles: Vehicle[] = [...INITIAL_VEHICLES];
  drivers: Driver[] = [...INITIAL_DRIVERS];
  trips: Trip[] = [...INITIAL_TRIPS];
  parties: Party[] = [...INITIAL_PARTIES];
  partyPayments: PartyPaymentRecord[] = [...INITIAL_PARTY_PAYMENTS];
  fuelRecords: FuelRecord[] = [...INITIAL_FUEL_RECORDS];
  serviceRecords: ServiceRepairRecord[] = [...INITIAL_SERVICE_RECORDS];
  odometerEvents: OdometerEvent[] = [...INITIAL_ODOMETER_EVENTS];
  auditLogs: AuditLogEntry[] = [];
  processedIdempotencyKeys: Set<string> = new Set();

  constructor() {
    console.log(`[FleetPulse Store] Initialized with ${this.vehicles.length} vehicles, ${this.trips.length} trips, ${this.drivers.length} drivers, and ${this.parties.length} mandi parties.`);
  }

  // Idempotency check for offline sync
  hasProcessedIdempotencyKey(key: string): boolean {
    return this.processedIdempotencyKeys.has(key);
  }

  recordIdempotencyKey(key: string): void {
    this.processedIdempotencyKeys.add(key);
  }
}

export const dbStore = new DatabaseStore();

