export type UserRole = 'admin' | 'operator' | 'driver';

export type VerificationStatus =
  | 'pending'
  | 'verified'
  | 'rejected'
  | 'additional_docs_required'
  | 'inactive';

export interface CompanyProfile {
  companyName: string;
  logoUrl?: string; // base64 Data URL or web link
  ownerName: string;
  mobile: string;
  email: string;
  address: string;
  city: string;
  state: string;
  gstin?: string;
  panNumber?: string;
  establishedYear?: string;
  updatedAt?: string;
}

export interface UserDocument {
  id: string;
  name: string;
  type: 'Aadhaar' | 'PAN' | 'Voter ID' | 'Passport' | 'Employee ID' | 'Other Document';
  documentNumber?: string;
  fileUrl?: string; // Data URL or filename
  fileName?: string;
  uploadedAt: string;
  status: VerificationStatus;
  rejectionReason?: string;
}

export interface UserAccount {
  id: string;
  fullName: string;
  mobile: string;
  email: string;
  password?: string;
  passwordHash?: string;
  address?: string;
  role: UserRole;
  profilePhotoUrl?: string;
  documents: UserDocument[];
  verificationStatus: VerificationStatus;
  rejectionReason?: string;
  permissions: UserPermissions;
  createdAt: string;
  lastLogin?: string;
}

export interface AuthSession {
  user: UserAccount;
  role: UserRole;
  token: string;
  rememberMe: boolean;
  loginTimestamp: number;
  expiresAt: number;
}

export interface PasswordResetChallenge {
  email: string;
  otp: string;
  expiresAt: number;
  verified: boolean;
}

export interface UserPermissions {
  canApproveTrips: boolean;
  canSettlePayments: boolean;
  canEditReminders: boolean;
  canManageDrivers: boolean;
  canViewFinancials: boolean;
}

export interface OdometerLog {
  id: string;
  reading: number;
  recordedAt: string;
  recordedBy: string;
  notes?: string;
}

export interface DriverAssignmentLog {
  id: string;
  driverId: string;
  driverName: string;
  assignedAt: string;
  unassignedAt?: string;
}

export interface VehicleDocument {
  id: string;
  type: 'Permit' | 'State Permit' | 'RC' | 'PUC' | 'Fitness / Passing' | 'Insurance';
  number: string;
  expiryDate: string; // YYYY-MM-DD
  status: 'valid' | 'expiring_soon' | 'expired';
  softCopyName?: string;
  softCopyUrl?: string; // base64 or object url
  rcStatus?: 'Active' | 'Under Renewal';
  lastUpdated: string;
}

export interface MultipurposeReminder {
  id: string;
  title: string; // e.g. "Servicing for 10,000 KM", "Major Servicing for 90,000 KM", "Timing Belt for 90,000 KM"
  dueKm: number; // Set by Admin (Interval in KM)
  lastDoneKm: number;
  status: 'nominal' | 'due_soon' | 'overdue';
}

export interface Vehicle {
  id: string;
  number: string; // e.g. MH-12-RN-4892 (Maharashtra), GJ-03-XX-5512 (Gujarat)
  stateCode: 'MH' | 'GJ';
  type: string; // 10-Ton Truck, 16-Ton Cargo Carrier, 24-Ton Heavy Carrier
  model: string;
  capacityKg: number;
  capacityMt: number;
  capacityUnit?: 'KG' | 'Ton';
  currentOdometer: number;
  fuelType?: 'diesel' | 'cng' | 'dual';
  assignedDriverId?: string;
  assignedDriverName?: string;
  assignedDriverIds?: string[]; // Multiple driver assignments
  dieselAverage?: number; // Calculated KM / Litre
  cngAverage?: number; // Calculated KM / KG
  lastServiceOdo?: number;
  status: 'active' | 'in_transit' | 'loading' | 'unloaded_idle' | 'inactive';
  currentLocation: string; // Maharashtra or Gujarat city
  documents: VehicleDocument[];
  maintenanceReminders: MultipurposeReminder[];
  odometerHistory?: OdometerLog[];
  driverAssignmentHistory?: DriverAssignmentLog[];
}

export interface Driver {
  id: string;
  fullName: string;
  mobile: string;
  address: string;
  licenseNumber: string;
  licenseExpiry: string;
  licenseSoftCopy?: string;
  licenseSoftCopyUrl?: string;
  aadhaarNumber: string;
  aadhaarSoftCopy?: string;
  aadhaarSoftCopyUrl?: string;
  panNumber: string;
  panSoftCopy?: string;
  panSoftCopyUrl?: string;
  profilePhotoUrl?: string;
  verificationStatus?: VerificationStatus;
  rejectionReason?: string;
  dlVerificationStatus?: VerificationStatus;
  dlRejectionReason?: string;
  aadhaarVerificationStatus?: VerificationStatus;
  aadhaarRejectionReason?: string;
  panVerificationStatus?: VerificationStatus;
  panRejectionReason?: string;
  status: 'active' | 'on_trip' | 'inactive';
  assignedVehicleId?: string;
  assignedVehicleNumber?: string;
  assignedVehicleIds?: string[]; // Multiple assigned vehicles (Part 3)
  tripsCompleted: number;
  joinedDate: string;
}

export interface DeliveryItem {
  id: string;
  itemName: string; // e.g. "Alphonso Mango Box", "Solapur Pomegranates", "Nashik Grapes", "Nagpur Oranges", "Jalgaon Bananas"
  quantity: number; // e.g. 30
  costPerItem: number; // e.g. 30
  totalAmount: number; // Auto calculated: quantity * costPerItem = 900
}

export interface TripDestination {
  id: string;
  stopSequence: number;
  placeName: string; // e.g. "Vapi APMC Fruit Yard", "Surat Ring Road Market", "Vadodara Sayajiganj Mandi", "Ahmedabad APMC"
  city: string; // Vapi, Surat, Bharuch, Vadodara, Ahmedabad, Rajkot
  state: string; // Gujarat
  contactPerson: string;
  mobile: string;
  items: DeliveryItem[];
  destinationTotalAmount: number;
  paymentTerm: 'immediate' | '1_month' | '2_months' | '3_months';
  quickReminderDate?: string;
  deliveryStatus: 'pending' | 'delivered';
}

export interface ReturnLoadDeliveryLocation {
  id: string;
  dropOrder: number; // 1, 2, 3...
  placeName: string; // e.g. "Bhiwandi Central Godown", "Pune Hadapsar Wholesale Depot"
  city: string; // e.g. Bhiwandi, Mumbai, Pune, Nashik, Solapur, Kolhapur
  state?: string; // Maharashtra / other destination state
  consigneeName?: string; // Consignee / unloading person
  mobile?: string;
  quantity?: number; // Number of items/bales/packages unloaded at this location
  weightKg?: number; // Weight unloaded at this location
  deliveryStatus?: 'pending' | 'delivered';
  notes?: string;
}

export interface ReturnLoad {
  id: string;
  tripId?: string;
  loadingPartyId?: string;
  loadingPartyName: string; // Party in Gujarat from where goods are taken
  loadingCity: string; // e.g. Surat, Vapi, Ahmedabad, Bharuch
  deliveryCity: string; // Consolidated/primary destination (e.g. "Bhiwandi & Pune (2 Drops)")
  deliveryLocationsCount?: number; // "How many locations to delivered" (e.g. 1, 2, 3)
  deliveryLocations?: ReturnLoadDeliveryLocation[]; // "Which Location" breakdown with order, city, consignee & qty
  goodsDescription: string; // e.g. Textile Bales, Industrial Ceramic Tiles, Chemical Drums, Machine Parts
  quantity: number;
  weightKg: number;
  weightUnit?: 'KG' | 'Ton';
  loadRentCharge: number; // For how much we charge them for load (e.g. 10500)
  settledAmount?: number; // Settle amount (e.g. 10500 or negotiated 9800)
  isSettled: boolean; // Tagged as (Settled)
  settledDate?: string;
  lrNumber: string;
  hasStampedLR: boolean; // Driver gets LR with Stamp from delivered location
  stampedLrPhotoUrl?: string;
  lrSubmittedToParty: boolean; // Option: LR submitted or not to Party who gave the goods
  lrSubmittedDate?: string;
  paymentStatus: 'pending' | 'partially_paid' | 'settled' | 'overdue';
  dueDate: string;
  dueTime?: string;
  loadingDate?: string;
  deliveryDate?: string;
  reminderDate?: string; // Reminder when payment not cleared in few days
  vehicleNumber: string;
  driverName: string;
  notes?: string;
  editHistory?: Array<{ editedBy: string; timestamp: string; summary: string }>;
}

export interface TripApprovalEvent {
  action: 'draft' | 'submitted' | 'approved' | 'rejected' | 'resubmitted';
  performedBy: string;
  timestamp: string;
  reason?: string;
}

export interface Trip {
  id: string; // e.g. TRP-MH-GJ-2026-01
  createdAt: string;
  outDate: string; // Date when it Out to Deliver Fruits
  vehicleId: string;
  vehicleNumber: string;
  vehicleStateCode: 'MH' | 'GJ';
  driverId: string;
  driverName: string;
  startingLocation: string; // e.g. Pune APMC, Nashik Farm Depot, Solapur Fruit Market
  destinations: TripDestination[]; // 3 to 4 Places
  totalFruitValue: number;
  totalWeightKg?: number;
  isOverloaded?: boolean;
  adminOverride?: boolean;
  status: 'draft' | 'pending_approval' | 'approved' | 'in_transit' | 'delivered' | 'rejected';
  approvalInfo?: {
    approvedBy: string;
    approvedAt: string;
    rejectionReason?: string;
  };
  approvalHistory?: TripApprovalEvent[];
  startOdometer: number;
  endOdometer?: number;
  returnLoad?: ReturnLoad;
}

export interface PaymentEntry {
  id: string;
  amount: number;
  paymentDate: string; // YYYY-MM-DD
  paymentTime?: string; // HH:mm
  paymentMode: 'Cash' | 'NEFT' | 'RTGS' | 'UPI' | 'Cheque' | 'Bank Transfer';
  referenceNumber?: string;
  proofUrl?: string; // base64 Data URL or filename
  proofName?: string;
  notes?: string;
  recordedBy: string;
  recordedAt: string;
}

export interface PartyPaymentRecord {
  id: string;
  partyId?: string;
  partyName: string;
  type: 'fruit_customer' | 'return_load_party';
  route: string; // e.g. "Pune → Surat", "Ahmedabad → Mumbai"
  tripReferenceId: string;
  vehicleNumber: string; // Vehicle Number displayed prominently
  driverName?: string;
  lrNumber: string;
  chargeAmount: number; // Original Charge (e.g. ₹10,500)
  totalAmount?: number; // Total billed
  settledAmount?: number; // Settled amount
  isSettled: boolean; // Tag: (Settled)
  amountPaid: number;
  amountDue: number; // Pending Amount = Total - Amount Paid
  lrSubmittedToParty: boolean; // LR submitted or not
  tripDate?: string; // Date of Trip / Loading
  loadingDate?: string;
  deliveryDate?: string;
  dueDate: string;
  dueTime?: string;
  paymentTerm?: 'immediate' | 'fixed_days' | 'fixed_date' | 'date_time';
  paymentTermDays?: number;
  lrSubmittedDate?: string;
  reminderDate?: string;
  isReminderAlert: boolean;
  status: 'pending' | 'partially_paid' | 'settled' | 'overdue';
  paymentHistory?: PaymentEntry[];
  goodsDescription?: string;
  weightKg?: number;
  loadingCity?: string;
  deliveryCity?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userRole: UserRole;
  userName: string;
  module: 'trips' | 'vehicles' | 'drivers' | 'payments' | 'parties' | 'documents' | 'permissions';
  action: string;
  details: string;
  entityId?: string;
  previousValue?: string;
  newValue?: string;
}

export interface AdvancedReportFilter {
  reportType:
    | 'pending'
    | 'paid'
    | 'partially_paid'
    | 'overdue'
    | 'city_wise'
    | 'party_wise'
    | 'load_wise'
    | 'date_wise'
    | 'lr_pending';
  selectedCities: string[]; // empty means all cities
  partyName: string; // 'all' or specific
  vehicleNumber: string; // 'all' or specific
  driverName: string; // 'all' or specific
  lrNumber: string;
  loadingDateFrom?: string;
  loadingDateTo?: string;
  deliveryDateFrom?: string;
  deliveryDateTo?: string;
  paymentStatus: 'all' | 'pending' | 'partially_paid' | 'settled' | 'overdue';
  lrSubmittedStatus: 'all' | 'submitted' | 'pending';
  dueDateFrom?: string;
  dueDateTo?: string;
}

export interface InAppNotification {
  id: string;
  type: 'doc_expiry' | 'odo_reminder' | 'payment_reminder' | 'trip_approval';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

export interface PartyDocument {
  id: string;
  partyId: string;
  partyName: string;
  type:
    | 'Aadhaar Card'
    | 'PAN Card'
    | 'GST Certificate'
    | 'Mandi Trade License'
    | 'Bank Passbook / Cheque'
    | 'Transport Agreement'
    | 'Other Document';
  documentNumber: string;
  documentName: string;
  issueDate?: string;
  expiryDate?: string;
  isNonExpiring?: boolean;
  status: 'verified' | 'pending_verification' | 'expired';
  softCopyName?: string;
  softCopyUrl?: string;
  uploadedAt: string;
  notes?: string;
}

export interface Party {
  id: string;
  name: string;
  businessName?: string;
  contactPerson: string;
  mobile: string;
  email?: string;
  address: string;
  city: string;
  state: string; // Gujarat, Maharashtra, etc.
  partyType: 'return_load_consignor' | 'fruit_buyer' | 'mandi_trader' | 'both';
  gstin?: string;
  panNumber?: string;
  aadhaarNumber?: string;
  totalTripsCount: number;
  totalBusinessAmount: number;
  outstandingBalance: number;
  documents: PartyDocument[];
  createdAt: string;
}

export interface DriverDailyWork {
  id: string; // e.g. WRK-2026-10-26-001
  date: string; // YYYY-MM-DD
  driverId: string;
  driverName: string;
  vehicleNumber: string; // Prominent Vehicle Number to Track the work fast!
  vehicleId?: string;
  deliveriesCount: number; // "How many Delivery they Delivered"
  deliveryLocations?: Array<{
    id?: string;
    placeName: string;
    city: string;
    quantityBoxes?: number;
    notes?: string;
  }>;
  workCategories: string[]; // e.g. ['Tyre Replacement / Change', 'Fruit Delivery', 'Maintenance']
  workDescription: string; // "what work they did"
  hadTyreChangeOrMaintenance: boolean;
  maintenanceDetails?: {
    component: string; // e.g. "Rear Right Outer Tyre", "Engine Oil & Filter"
    actionTaken: string; // e.g. "Replaced with New MRF Radial Tyre", "Puncture Repaired"
    workshopName?: string; // Workshop / Tyre Shop name & location
    expenseAmount?: number; // ₹ Cost of tyre / parts / labor
    paidBy?: 'driver_cash' | 'company_account' | 'fastag_fuel_card';
    billInvoiceNumber?: string;
    billPhotoUrl?: string; // Photo of bill / tyre work
  };
  startOdometer?: number;
  endOdometer?: number;
  totalKmRun?: number;
  notes?: string;
  status: 'saved_locally' | 'synced_to_cloud';
  createdAt: string;
}

// ==========================================
// PART 4: ACTIVITY-BASED ODOMETER ENGINE
// ==========================================
export type OdometerActivityType =
  | 'trip_start'
  | 'trip_completion'
  | 'diesel_refuel'
  | 'cng_refuel'
  | 'general_servicing'
  | 'repair'
  | 'tyre_replacement'
  | 'maintenance_other';

export interface OdometerEvent {
  id: string; // e.g. "odo-uuid"
  vehicleId: string;
  vehicleNumber: string;
  driverId: string;
  driverName: string;
  odometerReading: number; // KM
  activityType: OdometerActivityType;
  activityReferenceId?: string; // Links to Trip ID, Fuel ID, or Service ID
  recordedAt: string; // ISO timestamp
  evidencePhotoUrl?: string; // Cluster photo
  submissionStatus: 'saved_offline' | 'waiting_to_sync' | 'synced' | 'flagged_suspicious';
  verificationStatus: 'verified' | 'pending_admin_review' | 'rejected' | 'corrected';
  flagReason?: string;
  notes?: string;
  adminCorrection?: {
    originalReading: number;
    correctedReading: number;
    correctedBy: string;
    correctedAt: string;
    reason: string;
  };
}

// ==========================================
// PART 5 & 6: DIESEL AND CNG FUEL MANAGEMENT & FUEL AVERAGE
// ==========================================
export type FuelType = 'diesel' | 'cng';
export type FuelUnit = 'Litres' | 'KG';
export type FuelFillType = 'full_tank' | 'partial_fill';
export type FuelPaymentMethod =
  | 'driver_cash'
  | 'company_account'
  | 'fuel_card'
  | 'fastag'
  | 'upi'
  | 'credit_mandi';

export interface FuelRecord {
  id: string;
  vehicleId: string;
  vehicleNumber: string;
  driverId: string;
  driverName: string;
  fuelType: FuelType;
  odometerReading: number;
  fuelQuantity: number; // Litres for Diesel, KG for CNG
  unit: FuelUnit;
  pricePerUnit: number; // Rate in ₹
  totalAmount: number; // Auto: quantity * pricePerUnit
  fillType: FuelFillType;
  fuelStation: string;
  paymentMethod: FuelPaymentMethod;
  receiptPhotoUrl?: string;
  receiptPhotoName?: string;
  notes?: string;
  recordedAt: string;
  syncStatus: 'saved_offline' | 'waiting_to_sync' | 'synced';
}

export interface FuelAverageStats {
  vehicleId: string;
  vehicleNumber: string;
  fuelType: FuelType;
  latestAverage: number; // KM/L or KM/KG
  monthlyAverage: number;
  totalDistanceRun: number; // KM
  totalFuelQuantity: number; // L or KG
  totalExpenditure: number; // ₹
  costPerKm: number; // ₹ / KM
  hasVerifiedCycle: boolean;
  cycleStatusMessage: string;
}

// ==========================================
// PART 7: SERVICE AND REPAIR (12 ACTIVITY TYPES)
// ==========================================
export type ServiceActivityType =
  | 'General Servicing'
  | 'Engine Oil'
  | 'Oil Filter'
  | 'Air Filter'
  | 'Tyre Replacement'
  | 'Tyre Repair'
  | 'Brake Repair'
  | 'Clutch Repair'
  | 'Battery'
  | 'Electrical'
  | 'Washing and Greasing'
  | 'Other Repairs';

export interface ServiceRepairRecord {
  id: string;
  vehicleId: string;
  vehicleNumber: string;
  driverId: string;
  driverName: string;
  currentOdometer: number;
  activityType: ServiceActivityType;
  date: string; // YYYY-MM-DD
  workshopName: string;
  workDescription: string;
  expenseAmount: number;
  paidBy: 'driver_cash' | 'company_account' | 'fastag_fuel_card' | 'upi';
  invoiceNumber: string;
  receiptPhotoUrl?: string;
  receiptPhotoName?: string;
  partsReplaced?: string[];
  recordedAt: string;
  syncStatus: 'saved_offline' | 'waiting_to_sync' | 'synced';
}

// ==========================================
// PART 11: OFFLINE-FIRST SYNCHRONIZATION QUEUE & PROTOCOL
// ==========================================
export type OfflineSyncStatus =
  | 'saved_offline'
  | 'waiting_to_sync'
  | 'syncing'
  | 'synced_successfully'
  | 'sync_failed'
  | 'needs_review'
  | 'conflict_detected';

export interface OfflineQueueItem {
  id: string; // Client UUID
  idempotencyKey: string; // Unique idempotency hash
  userId: string;
  userName: string;
  role: UserRole;
  vehicleId?: string;
  vehicleNumber?: string;
  activityType:
    | 'SAVE_TRIP'
    | 'START_TRIP'
    | 'COMPLETE_TRIP'
    | 'LOG_REFUEL'
    | 'LOG_SERVICE'
    | 'LOG_REPAIR'
    | 'UPDATE_ODOMETER'
    | 'SETTLE_PAYMENT'
    | 'RECORD_PARTIAL_PAY'
    | 'SAVE_DRIVER_DAILY_WORK'
    | 'ADMIN_CORRECTION';
  summary: string;
  payload: any;
  createdAt: string; // ISO
  deviceId: string;
  status: OfflineSyncStatus;
  retryCount: number;
  lastAttemptAt?: string;
  errorMessage?: string;
  conflictDetails?: {
    conflictType: 'odo_regression' | 'duplicate_entry' | 'concurrent_modification' | 'unauthorized_assignment';
    serverValue?: any;
    localValue?: any;
    resolution?: 'pending' | 'resolved_server' | 'resolved_local' | 'admin_override';
  };
}

// ==========================================
// MULTILINGUAL LANGUAGE SUPPORT (Part 2 & 3)
// ==========================================
export type AppLanguage = 'en' | 'mr' | 'hi';

// ==========================================
// PART 8, 9, 10: VEHICLE HEALTH, PERFORMANCE & ANALYTICS
// ==========================================
export interface VehicleAnalyticsData {
  vehicleId: string;
  vehicleNumber: string;
  totalKm: number;
  dieselAverage: number;
  cngAverage: number;
  totalFuelLitres: number;
  totalFuelKg: number;
  totalFuelExpense: number;
  fuelCostPerKm: number;
  maintenanceExpense: number;
  repairExpense: number;
  serviceFrequency: number;
  vehicleDowntimeDays: number;
  tripsCount: number;
}


