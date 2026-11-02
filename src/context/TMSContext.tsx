import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Vehicle,
  Driver,
  Trip,
  ReturnLoad,
  PartyPaymentRecord,
  UserPermissions,
  InAppNotification,
  UserRole,
  MultipurposeReminder,
  TripDestination,
  Party,
  PartyDocument,
  DriverDailyWork,
  PaymentEntry,
  AuditLogEntry,
  OdometerLog,
  CompanyProfile,
  UserAccount,
  VerificationStatus,
} from '../types/tms';
import { StorageEngine } from '../utils/storageEngine';

interface TMSContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;

  // Permissions & Controls
  userPermissions: UserPermissions;
  setUserPermissions: React.Dispatch<React.SetStateAction<UserPermissions>>;
  driverCanViewDocs: boolean;
  setDriverCanViewDocs: (allowed: boolean) => void;

  // State
  vehicles: Vehicle[];
  drivers: Driver[];
  trips: Trip[];
  partyPayments: PartyPaymentRecord[];
  notifications: InAppNotification[];
  parties: Party[];
  auditLogs: AuditLogEntry[];

  addParty: (partyData: Partial<Party>) => { success: boolean; party: Party };
  addPartyDocument: (
    partyId: string,
    docData: {
      type: PartyDocument['type'];
      documentNumber: string;
      documentName: string;
      issueDate?: string;
      expiryDate?: string;
      isNonExpiring?: boolean;
      status?: PartyDocument['status'];
      softCopyName?: string;
      softCopyUrl?: string;
      notes?: string;
    }
  ) => { success: boolean; message: string; doc?: PartyDocument };
  deletePartyDocument: (partyId: string, docId: string) => void;
  updatePartyDocumentStatus: (
    partyId: string,
    docId: string,
    newStatus: PartyDocument['status']
  ) => void;

  addTrip: (tripData: Partial<Trip> & { overrideCapacityWarning?: boolean }) => {
    success: boolean;
    message: string;
    trip?: Trip;
    overloaded?: boolean;
  };
  updateTripDestinations: (
    tripId: string,
    destinations: TripDestination[]
  ) => { success: boolean; message: string };
  approveTrip: (tripId: string) => void;
  rejectTrip: (tripId: string, reason?: string) => void;
  resubmitTrip: (tripId: string, updatedDestinations?: TripDestination[]) => { success: boolean; message: string };
  addReturnLoad: (tripId: string, returnData: Partial<ReturnLoad>) => { success: boolean; message: string };
  editReturnLoad: (tripId: string, returnData: Partial<ReturnLoad>) => { success: boolean; message: string };
  toggleLRSubmitted: (returnLoadIdOrLr: string) => void;
  settleReturnLoadPayment: (
    loadId: string,
    settledAmount: number,
    notes?: string
  ) => { success: boolean; message: string };
  recordPartialPayment: (
    paymentId: string,
    paymentDetails: {
      amount: number;
      paymentDate: string;
      paymentTime?: string;
      paymentMode: 'Cash' | 'NEFT' | 'RTGS' | 'UPI' | 'Cheque' | 'Bank Transfer';
      referenceNumber?: string;
      proofUrl?: string;
      proofName?: string;
      notes?: string;
    }
  ) => { success: boolean; message: string };
  updateOdometer: (vehicleId: string, newOdo: number) => { success: boolean; message: string };
  addMultipurposeReminder: (
    vehicleId: string,
    title: string,
    dueKm: number
  ) => void;
  addVehicle: (vehicleData: Partial<Vehicle>) => void;
  addDriver: (driverData: Partial<Driver>) => { success: boolean; driver: Driver };
  updateDriver: (driverId: string, updates: Partial<Driver>) => { success: boolean; message: string };
  toggleDriverStatus: (driverId: string) => void;
  sendWhatsAppLink: (driver: Driver) => void;
  companyName: string;
  updateCompanyName: (newName: string) => { success: boolean; message: string };
  companyProfile: CompanyProfile;
  updateCompanyProfile: (profile: Partial<CompanyProfile>) => { success: boolean; message: string };
  userAccounts: UserAccount[];
  currentUser: UserAccount;
  setCurrentUser: (u: UserAccount) => void;
  addUserAccount: (userData: Partial<UserAccount>) => { success: boolean; message: string; user: UserAccount };
  updateUserVerification: (userId: string, status: VerificationStatus, reason?: string) => { success: boolean; message: string };
  updateDriverVerification: (
    driverId: string,
    status: VerificationStatus,
    reason?: string,
    docType?: 'dl' | 'aadhaar' | 'pan' | 'overall'
  ) => { success: boolean; message: string };
  goToPreviousTab: () => void;
  dismissNotification: (id: string) => void;
  uploadStampedLRPhoto: (tripId: string, photoDataUrlOrName: string, fileName?: string) => void;

  // Driver Daily Work & Vehicle Tracking
  driverDailyWorks: DriverDailyWork[];
  addDriverDailyWork: (
    workData: Partial<DriverDailyWork> & { vehicleNumber: string }
  ) => { success: boolean; message: string; work: DriverDailyWork };
  deleteDriverDailyWork: (id: string) => void;

  // Backup & Restore
  exportDataJSON: () => string;
  importDataJSON: (jsonStr: string) => { success: boolean; message: string };
}

const TMSContext = createContext<TMSContextType | undefined>(undefined);

export const TMSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole>('admin');
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  const [userPermissions, setUserPermissions] = useState<UserPermissions>(() => StorageEngine.getPermissions());
  const [driverCanViewDocs, setDriverCanViewDocs] = useState<boolean>(true);

  const [vehicles, setVehicles] = useState<Vehicle[]>(() => StorageEngine.getVehicles());
  const [drivers, setDrivers] = useState<Driver[]>(() => StorageEngine.getDrivers());
  const [trips, setTrips] = useState<Trip[]>(() => StorageEngine.getTrips());
  const [partyPayments, setPartyPayments] = useState<PartyPaymentRecord[]>(() => StorageEngine.getPayments());
  const [notifications, setNotifications] = useState<InAppNotification[]>(() => StorageEngine.getNotifications());
  const [parties, setParties] = useState<Party[]>(() => StorageEngine.getParties());
  const [driverDailyWorks, setDriverDailyWorks] = useState<DriverDailyWork[]>(() => StorageEngine.getDailyWorks());
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => StorageEngine.getAuditLogs());
  const [companyName, setCompanyName] = useState<string>(() => StorageEngine.getCompanyName());
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(() => StorageEngine.getCompanyProfile());
  const [userAccounts, setUserAccounts] = useState<UserAccount[]>(() => StorageEngine.getUserAccounts());
  const [currentUser, setCurrentUser] = useState<UserAccount>(() => StorageEngine.getUserAccounts()[0]);

  // Automatically sync state mutations to StorageEngine
  useEffect(() => { StorageEngine.setVehicles(vehicles); }, [vehicles]);
  useEffect(() => { StorageEngine.setDrivers(drivers); }, [drivers]);
  useEffect(() => { StorageEngine.setTrips(trips); }, [trips]);
  useEffect(() => { StorageEngine.setPayments(partyPayments); }, [partyPayments]);
  useEffect(() => { StorageEngine.setParties(parties); }, [parties]);
  useEffect(() => { StorageEngine.setNotifications(notifications); }, [notifications]);
  useEffect(() => { StorageEngine.setDailyWorks(driverDailyWorks); }, [driverDailyWorks]);
  useEffect(() => { StorageEngine.setPermissions(userPermissions); }, [userPermissions]);
  useEffect(() => { StorageEngine.setCompanyName(companyName); }, [companyName]);
  useEffect(() => { StorageEngine.setCompanyProfile(companyProfile); }, [companyProfile]);
  useEffect(() => { StorageEngine.setUserAccounts(userAccounts); }, [userAccounts]);
  useEffect(() => { StorageEngine.setAuditLogs(auditLogs); }, [auditLogs]);

  // Log audit helper
  const recordAudit = (module: AuditLogEntry['module'], action: string, details: string, entityId?: string) => {
    const entry = StorageEngine.addAuditLog({
      userRole: role,
      userName: role === 'admin' ? 'Admin Fleet Controller' : role === 'operator' ? 'Authorized User' : 'Driver User',
      module,
      action,
      details,
      entityId,
    });
    setAuditLogs((prev) => [entry, ...prev].slice(0, 500));
  };

  const updateCompanyName = (newName: string) => {
    if (role !== 'admin') {
      return { success: false, message: 'Access Denied: Only Admin can change the Company Name.' };
    }
    const trimmed = newName.trim();
    if (!trimmed) {
      return { success: false, message: 'Company name cannot be empty.' };
    }
    setCompanyName(trimmed);
    setCompanyProfile((prev) => ({ ...prev, companyName: trimmed, updatedAt: new Date().toISOString() }));
    recordAudit('permissions', 'Company Name Changed', `Company renamed to "${trimmed}".`);
    return { success: true, message: `Company name updated to "${trimmed}"` };
  };

  const updateCompanyProfile = (updates: Partial<CompanyProfile>) => {
    if (role !== 'admin') {
      return { success: false, message: 'Access Denied: Only Admin can update Company Registration & Logo.' };
    }
    const updated: CompanyProfile = {
      ...companyProfile,
      ...updates,
      companyName: updates.companyName?.trim() || companyProfile.companyName,
      updatedAt: new Date().toISOString(),
    };
    setCompanyProfile(updated);
    if (updated.companyName !== companyName) {
      setCompanyName(updated.companyName);
    }
    recordAudit('permissions', 'Company Profile Updated', `Company profile and branding updated for "${updated.companyName}".`);
    return { success: true, message: 'Company profile and branding updated successfully.' };
  };

  const addUserAccount = (userData: Partial<UserAccount>) => {
    if (role !== 'admin') {
      return { success: false, message: 'Access Denied: Only Admin can register new users.' } as any;
    }
    const newUser: UserAccount = {
      id: `usr-${Date.now()}`,
      fullName: userData.fullName || 'New User',
      mobile: userData.mobile || '',
      email: userData.email || '',
      password: userData.password || 'password123',
      address: userData.address || '',
      role: userData.role || 'operator',
      profilePhotoUrl: userData.profilePhotoUrl,
      documents: userData.documents || [],
      verificationStatus: 'pending',
      permissions: userData.permissions || {
        canApproveTrips: false,
        canSettlePayments: false,
        canEditReminders: false,
        canManageDrivers: false,
        canViewFinancials: false,
      },
      createdAt: new Date().toISOString().split('T')[0],
    };
    setUserAccounts((prev) => [newUser, ...prev]);
    recordAudit('permissions', 'User Registered', `New user "${newUser.fullName}" registered with pending verification.`, newUser.id);
    return { success: true, message: `User "${newUser.fullName}" registered successfully.`, user: newUser };
  };

  const updateUserVerification = (userId: string, status: VerificationStatus, reason?: string) => {
    if (role !== 'admin') {
      return { success: false, message: 'Access Denied: Only Admin can verify user documents.' };
    }
    setUserAccounts((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          return {
            ...u,
            verificationStatus: status,
            rejectionReason: status === 'rejected' ? reason : undefined,
            documents: u.documents.map((d) => ({
              ...d,
              status,
              rejectionReason: status === 'rejected' ? reason : undefined,
            })),
          };
        }
        return u;
      })
    );
    recordAudit('permissions', 'User Verification Updated', `User ${userId} status set to ${status}${reason ? ` (${reason})` : ''}.`, userId);
    return { success: true, message: `User verification status updated to ${status}.` };
  };

  const updateDriverVerification = (
    driverId: string,
    status: VerificationStatus,
    reason?: string,
    docType?: 'dl' | 'aadhaar' | 'pan' | 'overall'
  ) => {
    if (role !== 'admin') {
      return { success: false, message: 'Access Denied: Only Admin can verify driver documents.' };
    }
    setDrivers((prev) =>
      prev.map((d) => {
        if (d.id === driverId) {
          const updated: Driver = { ...d };
          if (!docType || docType === 'overall') {
            updated.verificationStatus = status;
            updated.rejectionReason = status === 'rejected' ? reason : undefined;
            if (status === 'verified') {
              updated.dlVerificationStatus = 'verified';
              updated.aadhaarVerificationStatus = 'verified';
              updated.panVerificationStatus = 'verified';
            }
          } else if (docType === 'dl') {
            updated.dlVerificationStatus = status;
            updated.dlRejectionReason = status === 'rejected' ? reason : undefined;
          } else if (docType === 'aadhaar') {
            updated.aadhaarVerificationStatus = status;
            updated.aadhaarRejectionReason = status === 'rejected' ? reason : undefined;
          } else if (docType === 'pan') {
            updated.panVerificationStatus = status;
            updated.panRejectionReason = status === 'rejected' ? reason : undefined;
          }
          return updated;
        }
        return d;
      })
    );
    recordAudit('drivers', 'Driver Verification Updated', `Driver ${driverId} ${docType || 'KYC'} status updated to ${status}${reason ? ` (${reason})` : ''}.`, driverId);
    return { success: true, message: `Driver document verification updated to ${status}.` };
  };

  const goToPreviousTab = () => {
    const tabs = [
      'dashboard',
      'trips',
      'vehicles',
      'drivers',
      'payments',
      'reports',
      'analytics',
      'permissions',
      'audit',
      'driver_portal',
    ];
    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1]);
    } else {
      setActiveTab(tabs[tabs.length - 1]);
    }
  };

  const sendWhatsAppLink = (driver: Driver) => {
    const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://transport-mh-gj.app';
    const cleanMobile = driver.mobile.replace(/[^0-9]/g, '');
    const message = `Namaste ${driver.fullName},\n\nHere is your Fleet Driver Portal access link for the Maharashtra ⇄ Gujarat transport route:\n${appUrl}?role=driver&driverId=${driver.id}\n\nYou can use this to:\n1. Save Daily Work & Trips\n2. View Vehicle Documents (RC, Permit, Insurance, PUC)\n3. Check assigned rig capacity\n4. Upload Stamped LR after delivery.`;

    const whatsappUrl = `https://wa.me/${cleanMobile}?text=${encodeURIComponent(message)}`;
    if (typeof window !== 'undefined') {
      window.open(whatsappUrl, '_blank');
    }
    recordAudit('drivers', 'WhatsApp Link Dispatched', `Portal link sent to ${driver.fullName} (${driver.mobile})`, driver.id);
  };

  const addDriver = (driverData: Partial<Driver>) => {
    const newDriver: Driver = {
      id: `drv-${Date.now()}`,
      fullName: driverData.fullName || 'New Driver',
      mobile: driverData.mobile || '+91 98000 00000',
      address: driverData.address || 'Maharashtra / Gujarat Transport Colony',
      licenseNumber: driverData.licenseNumber || 'MH-12-XXXXXXXX',
      licenseExpiry: driverData.licenseExpiry || '2029-01-01',
      licenseSoftCopy: driverData.licenseSoftCopy || 'Driving_Licence_Scanned.pdf',
      aadhaarNumber: driverData.aadhaarNumber || 'XXXX-XXXX-XXXX',
      aadhaarSoftCopy: driverData.aadhaarSoftCopy || 'Aadhaar_Card_Copy.pdf',
      panNumber: driverData.panNumber || 'ABCDE1234F',
      panSoftCopy: driverData.panSoftCopy || 'PAN_Card_Copy.pdf',
      status: 'active',
      assignedVehicleId: driverData.assignedVehicleId,
      assignedVehicleNumber: driverData.assignedVehicleNumber,
      tripsCompleted: 0,
      joinedDate: new Date().toISOString().split('T')[0],
    };

    setDrivers((prev) => [newDriver, ...prev]);

    // If assigned to a vehicle, update that vehicle
    if (driverData.assignedVehicleId) {
      setVehicles((prev) =>
        prev.map((v) =>
          v.id === driverData.assignedVehicleId
            ? { ...v, assignedDriverId: newDriver.id, assignedDriverName: newDriver.fullName }
            : v
        )
      );
    }

    recordAudit('drivers', 'Driver Created', `Driver ${newDriver.fullName} added with license ${newDriver.licenseNumber}.`, newDriver.id);
    return { success: true, driver: newDriver };
  };

  const updateDriver = (driverId: string, updates: Partial<Driver>) => {
    setDrivers((prev) =>
      prev.map((d) => (d.id === driverId ? { ...d, ...updates } : d))
    );
    recordAudit('drivers', 'Driver Updated', `Driver ${driverId} updated details.`, driverId);
    return { success: true, message: 'Driver details updated.' };
  };

  const toggleDriverStatus = (driverId: string) => {
    setDrivers((prev) =>
      prev.map((d) => {
        if (d.id === driverId) {
          const nextStatus = d.status === 'active' ? 'inactive' : 'active';
          recordAudit('drivers', 'Driver Status Toggled', `Driver ${d.fullName} set to ${nextStatus}.`, driverId);
          return { ...d, status: nextStatus };
        }
        return d;
      })
    );
  };

  // Capacity Calculation & Trip Addition
  const addTrip = (tripData: Partial<Trip> & { overrideCapacityWarning?: boolean }) => {
    const vehicle = vehicles.find((v) => v.id === tripData.vehicleId) || vehicles[0];
    const driver = drivers.find((d) => d.id === tripData.driverId) || drivers[0];

    const calculatedFruitValue = (tripData.destinations || []).reduce(
      (acc, d) => acc + d.destinationTotalAmount,
      0
    );

    // Calculate approximate weight from items: if items mention kg (e.g. 24kg box), extract it, or default to 20kg per box/unit
    let totalEstimatedWeightKg = 0;
    (tripData.destinations || []).forEach((d) => {
      d.items.forEach((item) => {
        const match = item.itemName.match(/(\d+)\s*kg/i);
        const itemWeight = match ? Number(match[1]) : 20;
        totalEstimatedWeightKg += (item.quantity || 1) * itemWeight;
      });
    });

    const isOverloaded = totalEstimatedWeightKg > vehicle.capacityKg;
    const isDriverCreating = role === 'driver';

    // Business rule: Driver CANNOT override capacity; Admin can override with explicit flag
    if (isOverloaded && isDriverCreating) {
      return {
        success: false,
        message: `Overload Blocked: Total trip load (${totalEstimatedWeightKg.toLocaleString('en-IN')} KG) exceeds vehicle ${vehicle.number} max capacity (${vehicle.capacityKg.toLocaleString('en-IN')} KG). Please reduce quantity.`,
        overloaded: true,
      };
    }

    if (isOverloaded && !tripData.overrideCapacityWarning && role === 'admin') {
      return {
        success: false,
        message: `Capacity Warning: Total weight (${totalEstimatedWeightKg.toLocaleString('en-IN')} KG) exceeds vehicle limit (${vehicle.capacityKg.toLocaleString('en-IN')} KG). Confirm override to proceed.`,
        overloaded: true,
      };
    }

    const newTripId = `TRP-MH-GJ-${new Date().getFullYear()}-${String(trips.length + 1).padStart(2, '0')}`;

    const newTrip: Trip = {
      id: newTripId,
      createdAt: 'Just now',
      outDate: tripData.outDate || new Date().toISOString().split('T')[0],
      vehicleId: vehicle.id,
      vehicleNumber: vehicle.number,
      vehicleStateCode: vehicle.stateCode,
      driverId: driver.id,
      driverName: driver.fullName,
      startingLocation: tripData.startingLocation || 'Pune APMC Market (Maharashtra)',
      destinations: tripData.destinations || [],
      totalFruitValue: calculatedFruitValue,
      totalWeightKg: totalEstimatedWeightKg,
      isOverloaded,
      adminOverride: isOverloaded && role === 'admin',
      status: isDriverCreating ? 'pending_approval' : 'approved',
      approvalInfo: isDriverCreating
        ? undefined
        : { approvedBy: role === 'admin' ? 'Admin Fleet Controller' : 'User (Operations)', approvedAt: 'Just now' },
      approvalHistory: [
        {
          action: isDriverCreating ? 'submitted' : 'approved',
          performedBy: isDriverCreating ? driver.fullName : role === 'admin' ? 'Admin Fleet Controller' : 'User (Operations)',
          timestamp: new Date().toISOString(),
        },
      ],
      startOdometer: vehicle.currentOdometer,
    };

    setTrips((prev) => [newTrip, ...prev]);

    setVehicles((prev) =>
      prev.map((v) => (v.id === vehicle.id ? { ...v, status: 'in_transit' } : v))
    );

    if (isDriverCreating) {
      setNotifications((prev) => [
        {
          id: `notif-${Date.now()}`,
          type: 'trip_approval',
          title: `New Trip Saved by ${driver.fullName} (${newTripId})`,
          message: `Trip to ${newTrip.destinations.map((d) => d.city).join(', ')} (${totalEstimatedWeightKg.toLocaleString('en-IN')} KG) awaiting approval.`,
          timestamp: 'Just now',
          isRead: false,
        },
        ...prev,
      ]);
    }

    recordAudit('trips', 'Trip Created', `Trip ${newTripId} created for truck ${vehicle.number} by ${role}. Load: ${totalEstimatedWeightKg} KG.`, newTripId);

    return {
      success: true,
      message: `Trip ${newTripId} saved successfully!`,
      trip: newTrip,
      overloaded: isOverloaded,
    };
  };

  const updateTripDestinations = (tripId: string, updatedDestinations: TripDestination[]) => {
    const recalculatedTotal = updatedDestinations.reduce(
      (acc, d) => acc + d.destinationTotalAmount,
      0
    );

    let recalculatedWeight = 0;
    updatedDestinations.forEach((d) => {
      d.items.forEach((item) => {
        const match = item.itemName.match(/(\d+)\s*kg/i);
        const itemWeight = match ? Number(match[1]) : 20;
        recalculatedWeight += (item.quantity || 1) * itemWeight;
      });
    });

    setTrips((prev) =>
      prev.map((t) => {
        if (t.id === tripId) {
          const veh = vehicles.find((v) => v.id === t.vehicleId);
          const isOverloaded = veh ? recalculatedWeight > veh.capacityKg : false;
          return {
            ...t,
            destinations: updatedDestinations,
            totalFruitValue: recalculatedTotal,
            totalWeightKg: recalculatedWeight,
            isOverloaded,
          };
        }
        return t;
      })
    );

    recordAudit('trips', 'Destinations Updated', `Trip ${tripId} destinations updated. Value: ₹${recalculatedTotal.toLocaleString('en-IN')}`, tripId);

    return {
      success: true,
      message: `Delivery places for ${tripId} updated successfully!`,
    };
  };

  const approveTrip = (tripId: string) => {
    const approver = role === 'admin' ? 'Admin Fleet Controller' : 'User (Operations)';
    const nowTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    setTrips((prev) =>
      prev.map((t) => {
        if (t.id === tripId) {
          const history = t.approvalHistory || [];
          return {
            ...t,
            status: 'approved',
            approvalInfo: {
              approvedBy: approver,
              approvedAt: nowTime,
            },
            approvalHistory: [
              ...history,
              { action: 'approved', performedBy: approver, timestamp: new Date().toISOString() },
            ],
          };
        }
        return t;
      })
    );
    recordAudit('trips', 'Trip Approved', `Trip ${tripId} approved by ${approver}.`, tripId);
  };

  const rejectTrip = (tripId: string, reason?: string) => {
    const rejecter = role === 'admin' ? 'Admin Fleet Controller' : 'User (Operations)';
    const cleanReason = reason || 'Correction required by Operations.';

    setTrips((prev) =>
      prev.map((t) => {
        if (t.id === tripId) {
          const history = t.approvalHistory || [];
          return {
            ...t,
            status: 'rejected',
            approvalInfo: {
              approvedBy: rejecter,
              approvedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
              rejectionReason: cleanReason,
            },
            approvalHistory: [
              ...history,
              { action: 'rejected', performedBy: rejecter, timestamp: new Date().toISOString(), reason: cleanReason },
            ],
          };
        }
        return t;
      })
    );
    recordAudit('trips', 'Trip Rejected', `Trip ${tripId} rejected. Reason: ${cleanReason}`, tripId);
  };

  const resubmitTrip = (tripId: string, updatedDestinations?: TripDestination[]) => {
    const submitter = role === 'admin' ? 'Admin Fleet Controller' : role === 'driver' ? 'Driver' : 'User';

    setTrips((prev) =>
      prev.map((t) => {
        if (t.id === tripId) {
          const destinations = updatedDestinations || t.destinations;
          const recalculatedTotal = destinations.reduce((acc, d) => acc + d.destinationTotalAmount, 0);
          const history = t.approvalHistory || [];
          return {
            ...t,
            destinations,
            totalFruitValue: recalculatedTotal,
            status: 'pending_approval',
            approvalHistory: [
              ...history,
              { action: 'resubmitted', performedBy: submitter, timestamp: new Date().toISOString() },
            ],
          };
        }
        return t;
      })
    );

    recordAudit('trips', 'Trip Resubmitted', `Trip ${tripId} resubmitted for approval.`, tripId);
    return { success: true, message: `Trip ${tripId} resubmitted for approval.` };
  };

  const addReturnLoad = (tripId: string, returnData: Partial<ReturnLoad>) => {
    const returnLoadId = `RET-${Date.now().toString().slice(-4)}`;
    const locations = returnData.deliveryLocations && returnData.deliveryLocations.length > 0
      ? returnData.deliveryLocations
      : undefined;
    const locCount = returnData.deliveryLocationsCount || (locations ? locations.length : 1);
    const computedCity = locations && locations.length > 1
      ? `${locations.map((l) => l.city).join(', ')} (${locations.length} Locations)`
      : returnData.deliveryCity || (locations && locations[0]?.city) || 'Pune (Maharashtra)';

    const targetTrip = trips.find((t) => t.id === tripId);
    const vehicleNum = returnData.vehicleNumber || targetTrip?.vehicleNumber || 'MH-12-RN-4892';
    const driver = returnData.driverName || targetTrip?.driverName || 'Assigned Driver';

    const newReturnLoad: ReturnLoad = {
      id: returnLoadId,
      tripId,
      loadingPartyId: returnData.loadingPartyId,
      loadingPartyName: returnData.loadingPartyName || 'Gujarat Loading Party',
      loadingCity: returnData.loadingCity || 'Surat',
      deliveryCity: returnData.deliveryCity || computedCity,
      deliveryLocationsCount: locCount,
      deliveryLocations: locations,
      goodsDescription: returnData.goodsDescription || 'General Commercial Freight Goods',
      quantity: returnData.quantity || 100,
      weightKg: returnData.weightKg || 12000,
      loadRentCharge: returnData.loadRentCharge || 10500,
      isSettled: false,
      lrNumber: returnData.lrNumber || `LR-RT-${Date.now().toString().slice(-4)}`,
      hasStampedLR: false,
      lrSubmittedToParty: false,
      paymentStatus: 'pending',
      dueDate: returnData.dueDate || new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      dueTime: returnData.dueTime || '18:00',
      loadingDate: targetTrip?.outDate || new Date().toISOString().split('T')[0],
      deliveryDate: returnData.deliveryDate,
      reminderDate: returnData.reminderDate,
      vehicleNumber: vehicleNum,
      driverName: driver,
      notes: returnData.notes,
    };

    setTrips((prev) =>
      prev.map((t) => (t.id === tripId ? { ...t, returnLoad: newReturnLoad } : t))
    );

    const newPayment: PartyPaymentRecord = {
      id: `pay-${Date.now()}`,
      partyId: newReturnLoad.loadingPartyId,
      partyName: newReturnLoad.loadingPartyName,
      type: 'return_load_party',
      route: `${newReturnLoad.loadingCity} (GJ) → ${newReturnLoad.deliveryCity}`,
      tripReferenceId: tripId,
      vehicleNumber: vehicleNum,
      driverName: driver,
      lrNumber: newReturnLoad.lrNumber,
      chargeAmount: newReturnLoad.loadRentCharge,
      totalAmount: newReturnLoad.loadRentCharge,
      isSettled: false,
      amountPaid: 0,
      amountDue: newReturnLoad.loadRentCharge,
      lrSubmittedToParty: false,
      tripDate: targetTrip?.outDate || new Date().toISOString().split('T')[0],
      loadingDate: targetTrip?.outDate || new Date().toISOString().split('T')[0],
      deliveryDate: newReturnLoad.deliveryDate,
      dueDate: newReturnLoad.dueDate,
      dueTime: newReturnLoad.dueTime,
      reminderDate: newReturnLoad.reminderDate,
      isReminderAlert: false,
      status: 'pending',
      paymentHistory: [],
      goodsDescription: newReturnLoad.goodsDescription,
      weightKg: newReturnLoad.weightKg,
      loadingCity: newReturnLoad.loadingCity,
      deliveryCity: newReturnLoad.deliveryCity,
    };

    setPartyPayments((prev) => [newPayment, ...prev]);
    recordAudit('payments', 'Return Load Booked', `Return load LR ${newReturnLoad.lrNumber} added from ${newReturnLoad.loadingPartyName}. Freight: ₹${newReturnLoad.loadRentCharge}.`, returnLoadId);

    return { success: true, message: `Return load LR ${newReturnLoad.lrNumber} booked successfully.` };
  };

  const editReturnLoad = (tripId: string, returnData: Partial<ReturnLoad>) => {
    const targetTrip = trips.find((t) => t.id === tripId);
    if (!targetTrip || !targetTrip.returnLoad) {
      return { success: false, message: 'No return load found on this trip to edit.' };
    }

    if (role !== 'admin' && !userPermissions.canSettlePayments) {
      return { success: false, message: 'Access Denied: You do not have permission to edit return loads.' };
    }

    const existingLoad = targetTrip.returnLoad;
    const isAlreadySettled = existingLoad.isSettled;
    const newRentCharge = returnData.loadRentCharge !== undefined ? returnData.loadRentCharge : existingLoad.loadRentCharge;

    const updatedLocations =
      returnData.deliveryLocations && returnData.deliveryLocations.length > 0
        ? returnData.deliveryLocations
        : existingLoad.deliveryLocations || [];

    const updatedDeliveryCity =
      returnData.deliveryCity ||
      (updatedLocations.length > 0
        ? `${updatedLocations.map((l) => l.city).filter(Boolean).join(' & ')} (${updatedLocations.length} Locations)`
        : existingLoad.deliveryCity);

    const editEvent = {
      editedBy: role === 'admin' ? 'Admin Fleet Controller' : 'Authorized User',
      timestamp: new Date().toISOString(),
      summary: `Updated: Freight ₹${newRentCharge}, LR #${returnData.lrNumber || existingLoad.lrNumber}, ${updatedLocations.length} locations.`,
    };

    const updatedReturnLoad: ReturnLoad = {
      ...existingLoad,
      ...returnData,
      loadingPartyName: returnData.loadingPartyName || existingLoad.loadingPartyName,
      loadingCity: returnData.loadingCity || existingLoad.loadingCity,
      goodsDescription: returnData.goodsDescription || existingLoad.goodsDescription,
      loadRentCharge: newRentCharge,
      lrNumber: returnData.lrNumber || existingLoad.lrNumber,
      dueDate: returnData.dueDate || existingLoad.dueDate,
      reminderDate: returnData.reminderDate || existingLoad.reminderDate,
      deliveryLocations: updatedLocations,
      deliveryLocationsCount: updatedLocations.length,
      deliveryCity: updatedDeliveryCity,
      editHistory: [editEvent, ...(existingLoad.editHistory || [])],
    };

    setTrips((prev) =>
      prev.map((t) => (t.id === tripId ? { ...t, returnLoad: updatedReturnLoad } : t))
    );

    setPartyPayments((prev) =>
      prev.map((p) => {
        if (p.tripReferenceId === tripId && p.type === 'return_load_party') {
          const paid = p.amountPaid || 0;
          const newTotal = isAlreadySettled && p.settledAmount ? p.settledAmount : newRentCharge;
          return {
            ...p,
            partyName: updatedReturnLoad.loadingPartyName,
            chargeAmount: newRentCharge,
            totalAmount: newTotal,
            amountDue: Math.max(0, newTotal - paid),
            route: `${updatedReturnLoad.loadingCity} (GJ) → ${updatedReturnLoad.deliveryCity}`,
            lrNumber: updatedReturnLoad.lrNumber,
            dueDate: updatedReturnLoad.dueDate,
            reminderDate: updatedReturnLoad.reminderDate,
            goodsDescription: updatedReturnLoad.goodsDescription,
            loadingCity: updatedReturnLoad.loadingCity,
            deliveryCity: updatedReturnLoad.deliveryCity,
          };
        }
        return p;
      })
    );

    recordAudit(
      'trips',
      'Return Load Edited',
      `Return load on Trip ${tripId} (LR #${updatedReturnLoad.lrNumber}) updated with ${updatedLocations.length} delivery locations.`,
      tripId
    );

    return { success: true, message: `Return load LR #${updatedReturnLoad.lrNumber} updated successfully.` };
  };

  const toggleLRSubmitted = (returnLoadIdOrLr: string) => {
    let nextSubmitted = false;

    setTrips((prev) =>
      prev.map((t) => {
        if (
          t.returnLoad &&
          (t.returnLoad.id === returnLoadIdOrLr || t.returnLoad.lrNumber === returnLoadIdOrLr)
        ) {
          nextSubmitted = !t.returnLoad.lrSubmittedToParty;
          return {
            ...t,
            returnLoad: {
              ...t.returnLoad,
              lrSubmittedToParty: nextSubmitted,
              lrSubmittedDate: nextSubmitted ? new Date().toISOString().split('T')[0] : undefined,
            },
          };
        }
        return t;
      })
    );

    setPartyPayments((prev) =>
      prev.map((p) => {
        if (p.lrNumber === returnLoadIdOrLr || p.tripReferenceId === returnLoadIdOrLr) {
          return {
            ...p,
            lrSubmittedToParty: !p.lrSubmittedToParty,
            lrSubmittedDate: !p.lrSubmittedToParty ? new Date().toISOString().split('T')[0] : undefined,
          };
        }
        return p;
      })
    );

    recordAudit('payments', 'LR Submitted Toggled', `LR ${returnLoadIdOrLr} submission status updated.`, returnLoadIdOrLr);
  };

  const settleReturnLoadPayment = (
    loadId: string,
    settledAmount: number,
    notes?: string
  ) => {
    const today = new Date().toISOString().split('T')[0];

    setTrips((prev) =>
      prev.map((t) => {
        if (t.returnLoad && t.returnLoad.id === loadId) {
          return {
            ...t,
            returnLoad: {
              ...t.returnLoad,
              settledAmount,
              isSettled: true,
              paymentStatus: 'settled',
              settledDate: today,
              notes: notes || t.returnLoad.notes,
            },
          };
        }
        return t;
      })
    );

    setPartyPayments((prev) =>
      prev.map((p) => {
        if (p.tripReferenceId.includes(loadId) || p.id === loadId || p.tripReferenceId === loadId) {
          const settlementEntry: PaymentEntry = {
            id: `entry-${Date.now()}`,
            amount: settledAmount,
            paymentDate: today,
            paymentTime: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            paymentMode: 'Bank Transfer',
            referenceNumber: 'SETTLED-DIRECT',
            notes: notes || 'Full settlement agreed by Admin.',
            recordedBy: role === 'admin' ? 'Admin Fleet Controller' : 'User',
            recordedAt: new Date().toISOString(),
          };

          return {
            ...p,
            settledAmount,
            isSettled: true,
            amountPaid: settledAmount,
            amountDue: 0,
            status: 'settled',
            paymentHistory: [...(p.paymentHistory || []), settlementEntry],
          };
        }
        return p;
      })
    );

    recordAudit('payments', 'Payment Settled', `Payment ${loadId} settled for ₹${settledAmount.toLocaleString('en-IN')}. Tagged (Settled).`, loadId);

    return {
      success: true,
      message: `Payment successfully settled for ₹${settledAmount.toLocaleString('en-IN')}! Tagged as (Settled).`,
    };
  };

  // Multiple Partial Payments Engine
  const recordPartialPayment = (
    paymentId: string,
    details: {
      amount: number;
      paymentDate: string;
      paymentTime?: string;
      paymentMode: 'Cash' | 'NEFT' | 'RTGS' | 'UPI' | 'Cheque' | 'Bank Transfer';
      referenceNumber?: string;
      proofUrl?: string;
      proofName?: string;
      notes?: string;
    }
  ) => {
    const targetPayment = partyPayments.find((p) => p.id === paymentId);
    if (!targetPayment) {
      return { success: false, message: 'Payment record not found.' };
    }

    if (details.amount <= 0) {
      return { success: false, message: 'Payment amount must be greater than zero.' };
    }

    const newEntry: PaymentEntry = {
      id: `pay-entry-${Date.now()}`,
      amount: details.amount,
      paymentDate: details.paymentDate || new Date().toISOString().split('T')[0],
      paymentTime: details.paymentTime || new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      paymentMode: details.paymentMode,
      referenceNumber: details.referenceNumber,
      proofUrl: details.proofUrl,
      proofName: details.proofName,
      notes: details.notes,
      recordedBy: role === 'admin' ? 'Admin Fleet Controller' : 'Authorized User',
      recordedAt: new Date().toISOString(),
    };

    const newAmountPaid = (targetPayment.amountPaid || 0) + details.amount;
    const totalBilled = targetPayment.settledAmount ?? targetPayment.chargeAmount;
    const newAmountDue = Math.max(0, totalBilled - newAmountPaid);
    const newStatus: PartyPaymentRecord['status'] =
      newAmountDue === 0 ? 'settled' : newAmountPaid > 0 ? 'partially_paid' : 'pending';

    setPartyPayments((prev) =>
      prev.map((p) => {
        if (p.id !== paymentId) return p;
        return {
          ...p,
          amountPaid: newAmountPaid,
          amountDue: newAmountDue,
          status: newStatus,
          isSettled: newAmountDue === 0,
          paymentHistory: [...(p.paymentHistory || []), newEntry],
        };
      })
    );

    // Sync to Trip Return Load if matching
    if (targetPayment.tripReferenceId) {
      setTrips((prev) =>
        prev.map((t) => {
          if (t.id === targetPayment.tripReferenceId && t.returnLoad) {
            return {
              ...t,
              returnLoad: {
                ...t.returnLoad,
                paymentStatus: newStatus,
                isSettled: newAmountDue === 0,
                settledAmount: newAmountDue === 0 ? newAmountPaid : t.returnLoad.settledAmount,
              },
            };
          }
          return t;
        })
      );
    }

    recordAudit('payments', 'Partial Payment Logged', `Recorded ₹${details.amount.toLocaleString('en-IN')} via ${details.paymentMode} for ${targetPayment.partyName}. Remaining: ₹${newAmountDue.toLocaleString('en-IN')}`, paymentId);

    return {
      success: true,
      message: `Payment of ₹${details.amount.toLocaleString('en-IN')} recorded successfully. Remaining balance: ₹${newAmountDue.toLocaleString('en-IN')}.`,
    };
  };

  const uploadStampedLRPhoto = (tripId: string, photoDataUrlOrName: string, fileName?: string) => {
    setTrips((prev) =>
      prev.map((t) => {
        if (t.id === tripId && t.returnLoad) {
          return {
            ...t,
            returnLoad: {
              ...t.returnLoad,
              hasStampedLR: true,
              stampedLrPhotoUrl: photoDataUrlOrName,
              notes: fileName ? `${t.returnLoad.notes ? t.returnLoad.notes + '; ' : ''}Uploaded file: ${fileName}` : t.returnLoad.notes,
            },
          };
        }
        return t;
      })
    );
    recordAudit('trips', 'Stamped LR Uploaded', `Stamped LR attached to trip ${tripId}.`, tripId);
  };

  // Odometer reading with rollback prevention
  const updateOdometer = (vehicleId: string, newOdo: number) => {
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    if (!vehicle) return { success: false, message: 'Vehicle not found.' };

    if (newOdo < vehicle.currentOdometer) {
      return {
        success: false,
        message: `Accidental ODO decrease prevented: New reading (${newOdo.toLocaleString('en-IN')} KM) cannot be less than current odometer (${vehicle.currentOdometer.toLocaleString('en-IN')} KM).`,
      };
    }

    const odoLogEntry: OdometerLog = {
      id: `odo-${Date.now()}`,
      reading: newOdo,
      recordedAt: new Date().toISOString(),
      recordedBy: role === 'admin' ? 'Admin Fleet Controller' : role === 'driver' ? 'Driver' : 'User',
      notes: `Updated from ${vehicle.currentOdometer.toLocaleString('en-IN')} KM to ${newOdo.toLocaleString('en-IN')} KM`,
    };

    setVehicles((prev) =>
      prev.map((v) => {
        if (v.id === vehicleId) {
          const updatedReminders = v.maintenanceReminders.map((mr) => {
            const nextTarget = mr.lastDoneKm + mr.dueKm;
            const remaining = nextTarget - newOdo;
            return {
              ...mr,
              status: remaining <= 0 ? ('overdue' as const) : remaining <= 1000 ? ('due_soon' as const) : ('nominal' as const),
            };
          });

          return {
            ...v,
            currentOdometer: newOdo,
            maintenanceReminders: updatedReminders,
            odometerHistory: [odoLogEntry, ...(v.odometerHistory || [])],
          };
        }
        return v;
      })
    );

    recordAudit('vehicles', 'Odometer Updated', `${vehicle.number} updated to ${newOdo.toLocaleString('en-IN')} KM.`, vehicleId);

    return {
      success: true,
      message: `Odometer updated to ${newOdo.toLocaleString('en-IN')} KM for ${vehicle.number}. Reminders recalculated.`,
    };
  };

  const addMultipurposeReminder = (vehicleId: string, title: string, dueKm: number) => {
    const newReminder: MultipurposeReminder = {
      id: `mr-${Date.now()}`,
      title,
      dueKm,
      lastDoneKm: 0,
      status: 'nominal',
    };

    setVehicles((prev) =>
      prev.map((v) =>
        v.id === vehicleId
          ? {
              ...v,
              maintenanceReminders: [...v.maintenanceReminders, newReminder],
            }
          : v
      )
    );
    recordAudit('vehicles', 'Maintenance Reminder Added', `Added reminder "${title}" every ${dueKm} KM for vehicle ${vehicleId}.`, vehicleId);
  };

  const addVehicle = (vehicleData: Partial<Vehicle>) => {
    const unit = vehicleData.capacityUnit || 'Ton';
    const capacityMt = unit === 'Ton' ? (vehicleData.capacityMt || 16) : Math.round((vehicleData.capacityKg || 16000) / 1000);
    const capacityKg = unit === 'KG' ? (vehicleData.capacityKg || 16000) : capacityMt * 1000;
    const initialOdo = vehicleData.currentOdometer || 0;

    const newVeh: Vehicle = {
      id: `veh-${Date.now()}`,
      number: (vehicleData.number || 'MH-12-XX-0000').toUpperCase(),
      stateCode: (vehicleData.number?.toUpperCase().startsWith('GJ') ? 'GJ' : 'MH'),
      type: vehicleData.type || '16-Ton Cargo Carrier',
      model: vehicleData.model || 'Tata Commercial HD',
      capacityKg,
      capacityMt,
      capacityUnit: unit,
      currentOdometer: initialOdo,
      status: 'active',
      currentLocation: vehicleData.currentLocation || 'Pune APMC Terminal, Maharashtra',
      documents: [
        {
          id: `doc-${Date.now()}-1`,
          type: 'Permit',
          number: 'PER-MH-GJ-9901',
          expiryDate: '2027-10-15',
          status: 'valid',
          softCopyName: 'Permit_Doc.pdf',
          lastUpdated: new Date().toISOString().split('T')[0],
        },
        {
          id: `doc-${Date.now()}-2`,
          type: 'RC',
          number: 'RC-VALID-2035',
          expiryDate: '2035-10-15',
          status: 'valid',
          rcStatus: 'Active',
          softCopyName: 'RC_Doc.pdf',
          lastUpdated: new Date().toISOString().split('T')[0],
        },
        {
          id: `doc-${Date.now()}-3`,
          type: 'PUC',
          number: 'PUC-MH-2027',
          expiryDate: '2027-04-15',
          status: 'valid',
          softCopyName: 'PUC_Doc.pdf',
          lastUpdated: new Date().toISOString().split('T')[0],
        },
        {
          id: `doc-${Date.now()}-4`,
          type: 'Fitness / Passing',
          number: 'FIT-PASS-2027',
          expiryDate: '2027-08-15',
          status: 'valid',
          softCopyName: 'Fitness_Doc.pdf',
          lastUpdated: new Date().toISOString().split('T')[0],
        },
        {
          id: `doc-${Date.now()}-5`,
          type: 'Insurance',
          number: 'INS-POLICY-2027',
          expiryDate: '2027-10-15',
          status: 'valid',
          softCopyName: 'Insurance_Doc.pdf',
          lastUpdated: new Date().toISOString().split('T')[0],
        },
      ],
      maintenanceReminders: [
        {
          id: `mr-${Date.now()}-1`,
          title: 'Servicing for 10,000 KM',
          dueKm: 10000,
          lastDoneKm: 0,
          status: 'nominal',
        },
        {
          id: `mr-${Date.now()}-2`,
          title: 'Major Servicing for 90,000 KM',
          dueKm: 90000,
          lastDoneKm: 0,
          status: 'nominal',
        },
        {
          id: `mr-${Date.now()}-3`,
          title: 'Timing Belt for 90,000 KM',
          dueKm: 90000,
          lastDoneKm: 0,
          status: 'nominal',
        },
      ],
      odometerHistory: [
        {
          id: `odo-init-${Date.now()}`,
          reading: initialOdo,
          recordedAt: new Date().toISOString(),
          recordedBy: 'Admin Fleet Controller',
          notes: 'Initial vehicle enrolment reading',
        },
      ],
    };

    setVehicles((prev) => [newVeh, ...prev]);
    recordAudit('vehicles', 'Vehicle Enrolled', `Vehicle ${newVeh.number} registered with capacity ${capacityKg} KG.`, newVeh.id);
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const addParty = (partyData: Partial<Party>) => {
    const newParty: Party = {
      id: `pty-${Date.now()}`,
      name: partyData.name || 'New Party',
      businessName: partyData.businessName || partyData.name || 'Commercial Entity',
      contactPerson: partyData.contactPerson || 'Authorized Representative',
      mobile: partyData.mobile || '+91 98000 00000',
      email: partyData.email,
      address: partyData.address || 'APMC Market Yard',
      city: partyData.city || 'Surat',
      state: partyData.state || 'Gujarat',
      partyType: partyData.partyType || 'both',
      gstin: partyData.gstin,
      panNumber: partyData.panNumber,
      aadhaarNumber: partyData.aadhaarNumber,
      totalTripsCount: partyData.totalTripsCount || 0,
      totalBusinessAmount: partyData.totalBusinessAmount || 0,
      outstandingBalance: partyData.outstandingBalance || 0,
      createdAt: new Date().toISOString().split('T')[0],
      documents: partyData.documents || [],
    };

    if (partyData.aadhaarNumber) {
      newParty.documents.push({
        id: `pdoc-${Date.now()}-1`,
        partyId: newParty.id,
        partyName: newParty.name,
        type: 'Aadhaar Card',
        documentName: `Aadhaar Card - ${newParty.contactPerson}`,
        documentNumber: partyData.aadhaarNumber,
        isNonExpiring: true,
        status: 'verified',
        softCopyName: `Aadhaar_${newParty.contactPerson.replace(/\s+/g, '_')}.pdf`,
        uploadedAt: new Date().toISOString().split('T')[0],
        notes: 'Primary Aadhaar KYC registered',
      });
    }

    if (partyData.panNumber) {
      newParty.documents.push({
        id: `pdoc-${Date.now()}-2`,
        partyId: newParty.id,
        partyName: newParty.name,
        type: 'PAN Card',
        documentName: `PAN Card - ${newParty.name}`,
        documentNumber: partyData.panNumber,
        isNonExpiring: true,
        status: 'verified',
        softCopyName: `PAN_${newParty.name.replace(/\s+/g, '_')}.pdf`,
        uploadedAt: new Date().toISOString().split('T')[0],
        notes: 'Tax identification PAN document registered',
      });
    }

    if (partyData.gstin) {
      newParty.documents.push({
        id: `pdoc-${Date.now()}-3`,
        partyId: newParty.id,
        partyName: newParty.name,
        type: 'GST Certificate',
        documentName: `GST Registration Certificate`,
        documentNumber: partyData.gstin,
        isNonExpiring: true,
        status: 'verified',
        softCopyName: `GST_${partyData.gstin}.pdf`,
        uploadedAt: new Date().toISOString().split('T')[0],
      });
    }

    setParties((prev) => [newParty, ...prev]);
    recordAudit('parties', 'Party Created', `Party ${newParty.name} (${newParty.city}) enrolled.`, newParty.id);
    return { success: true, party: newParty };
  };

  const addPartyDocument = (
    partyId: string,
    docData: {
      type: PartyDocument['type'];
      documentNumber: string;
      documentName: string;
      issueDate?: string;
      expiryDate?: string;
      isNonExpiring?: boolean;
      status?: PartyDocument['status'];
      softCopyName?: string;
      softCopyUrl?: string;
      notes?: string;
    }
  ) => {
    const targetParty = parties.find((p) => p.id === partyId);
    if (!targetParty) {
      return { success: false, message: 'Party not found.' };
    }

    const newDoc: PartyDocument = {
      id: `pdoc-${Date.now()}`,
      partyId,
      partyName: targetParty.name,
      type: docData.type,
      documentNumber: docData.documentNumber.trim(),
      documentName: docData.documentName.trim() || `${docData.type} - ${targetParty.name}`,
      issueDate: docData.issueDate,
      expiryDate: docData.expiryDate,
      isNonExpiring: docData.isNonExpiring ?? (docData.type === 'Aadhaar Card' || docData.type === 'PAN Card'),
      status: docData.status || 'verified',
      softCopyName: docData.softCopyName || `${docData.type.replace(/[\s/]+/g, '_')}_${Date.now()}.pdf`,
      softCopyUrl: docData.softCopyUrl,
      uploadedAt: new Date().toISOString().split('T')[0],
      notes: docData.notes,
    };

    setParties((prev) =>
      prev.map((p) => {
        if (p.id !== partyId) return p;
        let updatedAadhaar = p.aadhaarNumber;
        let updatedPan = p.panNumber;
        let updatedGst = p.gstin;

        if (docData.type === 'Aadhaar Card') updatedAadhaar = docData.documentNumber;
        else if (docData.type === 'PAN Card') updatedPan = docData.documentNumber;
        else if (docData.type === 'GST Certificate') updatedGst = docData.documentNumber;

        return {
          ...p,
          aadhaarNumber: updatedAadhaar,
          panNumber: updatedPan,
          gstin: updatedGst,
          documents: [newDoc, ...p.documents],
        };
      })
    );

    recordAudit('documents', 'Party KYC Added', `Document ${docData.type} added for ${targetParty.name}.`, newDoc.id);
    return { success: true, message: `${docData.type} added successfully!`, doc: newDoc };
  };

  const deletePartyDocument = (partyId: string, docId: string) => {
    setParties((prev) =>
      prev.map((p) => {
        if (p.id !== partyId) return p;
        return {
          ...p,
          documents: p.documents.filter((d) => d.id !== docId),
        };
      })
    );
    recordAudit('documents', 'Party KYC Deleted', `Document ${docId} deleted from party ${partyId}.`, docId);
  };

  const updatePartyDocumentStatus = (
    partyId: string,
    docId: string,
    newStatus: PartyDocument['status']
  ) => {
    setParties((prev) =>
      prev.map((p) => {
        if (p.id !== partyId) return p;
        return {
          ...p,
          documents: p.documents.map((d) => (d.id === docId ? { ...d, status: newStatus } : d)),
        };
      })
    );
  };

  const addDriverDailyWork = (
    workData: Partial<DriverDailyWork> & { vehicleNumber: string }
  ) => {
    const newId = workData.id || `WRK-${Date.now().toString().slice(-6)}`;
    const cleanVehicleNumber = workData.vehicleNumber.trim().toUpperCase();

    const matchedVehicle = vehicles.find(
      (v) => v.number.replace(/\s+/g, '').toUpperCase() === cleanVehicleNumber.replace(/\s+/g, '').toUpperCase()
    );

    const newWork: DriverDailyWork = {
      id: newId,
      date: workData.date || new Date().toISOString().split('T')[0],
      driverId: workData.driverId || 'drv-1',
      driverName: workData.driverName || 'Driver',
      vehicleNumber: cleanVehicleNumber,
      vehicleId: matchedVehicle ? matchedVehicle.id : workData.vehicleId,
      deliveriesCount: Number(workData.deliveriesCount) || 0,
      deliveryLocations: workData.deliveryLocations || [],
      workCategories:
        workData.workCategories && workData.workCategories.length > 0
          ? workData.workCategories
          : ['Fruit / Goods Delivery'],
      workDescription: workData.workDescription || 'Daily driving & transport work completed.',
      hadTyreChangeOrMaintenance: Boolean(workData.hadTyreChangeOrMaintenance),
      maintenanceDetails: workData.maintenanceDetails,
      startOdometer: workData.startOdometer,
      endOdometer: workData.endOdometer,
      totalKmRun:
        workData.totalKmRun !== undefined
          ? workData.totalKmRun
          : workData.startOdometer && workData.endOdometer && workData.endOdometer >= workData.startOdometer
          ? workData.endOdometer - workData.startOdometer
          : undefined,
      notes: workData.notes,
      status: workData.status || 'synced_to_cloud',
      createdAt: new Date().toISOString(),
    };

    setDriverDailyWorks((prev) => [newWork, ...prev.filter((w) => w.id !== newWork.id)]);

    if (workData.endOdometer && matchedVehicle) {
      updateOdometer(matchedVehicle.id, Number(workData.endOdometer));
    }

    recordAudit('vehicles', 'Driver Work Logged', `Work log for truck ${cleanVehicleNumber} recorded.`, newId);

    return {
      success: true,
      message: `Daily work for vehicle ${cleanVehicleNumber} saved successfully.`,
      work: newWork,
    };
  };

  const deleteDriverDailyWork = (id: string) => {
    setDriverDailyWorks((prev) => prev.filter((w) => w.id !== id));
  };

  const exportDataJSON = () => {
    recordAudit('permissions', 'Database Exported', 'Full JSON database backup exported.');
    return StorageEngine.exportBackupJSON();
  };

  const importDataJSON = (jsonStr: string) => {
    const res = StorageEngine.importBackupJSON(jsonStr);
    if (res.success) {
      setVehicles(StorageEngine.getVehicles());
      setDrivers(StorageEngine.getDrivers());
      setTrips(StorageEngine.getTrips());
      setPartyPayments(StorageEngine.getPayments());
      setParties(StorageEngine.getParties());
      setNotifications(StorageEngine.getNotifications());
      setDriverDailyWorks(StorageEngine.getDailyWorks());
      setCompanyName(StorageEngine.getCompanyName());
      setAuditLogs(StorageEngine.getAuditLogs());
      recordAudit('permissions', 'Database Imported', 'Full database restored from JSON backup.');
    }
    return res;
  };

  return (
    <TMSContext.Provider
      value={{
        role,
        setRole,
        activeTab,
        setActiveTab,
        userPermissions,
        setUserPermissions,
        driverCanViewDocs,
        setDriverCanViewDocs,
        vehicles,
        drivers,
        trips,
        partyPayments,
        notifications,
        parties,
        auditLogs,
        driverDailyWorks,
        addDriverDailyWork,
        deleteDriverDailyWork,
        addParty,
        addPartyDocument,
        deletePartyDocument,
        updatePartyDocumentStatus,
        addTrip,
        updateTripDestinations,
        approveTrip,
        rejectTrip,
        resubmitTrip,
        addReturnLoad,
        editReturnLoad,
        toggleLRSubmitted,
        settleReturnLoadPayment,
        recordPartialPayment,
        updateOdometer,
        addMultipurposeReminder,
        addVehicle,
        addDriver,
        updateDriver,
        toggleDriverStatus,
        sendWhatsAppLink,
        companyName,
        updateCompanyName,
        companyProfile,
        updateCompanyProfile,
        userAccounts,
        currentUser,
        setCurrentUser,
        addUserAccount,
        updateUserVerification,
        updateDriverVerification,
        goToPreviousTab,
        dismissNotification,
        uploadStampedLRPhoto,
        exportDataJSON,
        importDataJSON,
      }}
    >
      {children}
    </TMSContext.Provider>
  );
};

export const useTMS = () => {
  const context = useContext(TMSContext);
  if (!context) {
    throw new Error('useTMS must be used within a TMSProvider');
  }
  return context;
};
