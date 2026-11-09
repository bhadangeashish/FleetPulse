import React, { useState, useEffect, useMemo } from 'react';
import {
  Truck,
  Fuel,
  Wrench,
  AlertTriangle,
  PlayCircle,
  CheckCircle2,
  MapPin,
  Calendar,
  Clock,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  ArrowRight,
  Camera,
  FileText,
  Check,
  X,
  Shield,
  RefreshCw,
  Wifi,
  WifiOff,
  Phone,
  DollarSign,
  Layers,
  Search,
  Eye,
  User,
  Navigation,
  Plus,
  PackageCheck,
  FileCheck,
  Battery,
  Send,
  Sparkles,
  LogOut,
  Maximize2,
  Smartphone,
  CheckCircle,
  Database,
} from 'lucide-react';
import { useTMS } from '../context/TMSContext';
import {
  AppLanguage,
  FuelType,
  FuelFillType,
  FuelPaymentMethod,
  ServiceActivityType,
  TripDestination,
  Vehicle,
} from '../types/tms';
import { TRANSLATIONS } from '../utils/translations';
import { calculateVehicleFuelAverage } from '../utils/fuelCalculators';
import {
  subscribeToSyncState,
  processOfflineSyncQueue,
  retryFailedSyncItems,
  setHighwayDeadZoneSimulated,
  getHighwayDeadZoneSimulated,
  setSyncFailureSimulated,
  getSyncFailureSimulated,
  SyncSummary,
} from '../utils/syncEngine';
import { SyncCenterModal } from './common/SyncCenterModal';
import { ModalPortal } from './common/ModalPortal';

// Tata Signa truck image matching showcase mockup
const TATA_SIGNA_TRUCK_IMG =
  'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=300&auto=format&fit=crop&q=60';
// Sample fuel receipt image matching showcase mockup
const RECEIPT_SAMPLE_IMG =
  'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&auto=format&fit=crop&q=60';

export const DriverPWAView: React.FC = () => {
  const {
    vehicles,
    trips,
    activeDriver,
    activeAssignedVehicle,
    activeDriverVehicleId,
    setActiveDriverVehicleId,
    odometerEvents,
    fuelRecords,
    serviceRecords,
    appLanguage,
    setAppLanguage,
    syncState,
    triggerManualSync,
    logOdometerActivity,
    addFuelRecord,
    addServiceRecord,
    addTrip,
    updateTripDestinations,
    uploadStampedLRPhoto,
    setActiveTab: setGlobalActiveTab,
    role,
    logout,
  } = useTMS();

  const t = TRANSLATIONS[appLanguage] || TRANSLATIONS.en;

  // Active Vehicle Reference
  const currentVehicle: Vehicle = activeAssignedVehicle || vehicles[0];

  // Derived assigned vehicles for multi-vehicle switcher
  const assignedVehiclesList = useMemo(() => {
    if (!activeDriver) return vehicles.slice(0, 4);
    const assigned = vehicles.filter(
      (v) =>
        activeDriver.assignedVehicleIds?.includes(v.id) ||
        v.id === activeDriver.assignedVehicleId ||
        v.assignedDriverId === activeDriver.id
    );
    return assigned.length > 0 ? assigned : vehicles.slice(0, 4);
  }, [vehicles, activeDriver]);

  // Display Mode: 'showcase' (all 6 screens side-by-side matching showcase image) or 'device' (interactive phone)
  const [displayMode, setDisplayMode] = useState<'showcase' | 'device'>(
    role === 'driver' ? 'device' : 'showcase'
  );

  // Active Screen in single device view (7: Home, 8: Add Diesel/CNG, 9: Start Trip, 10: Offline, 11: Syncing, 12: Synced, 13: Failed)
  type ScreenId =
    | 'screen7_home'
    | 'screen8_fuel'
    | 'screen9_trip'
    | 'screen10_offline'
    | 'screen11_syncing'
    | 'screen12_synced'
    | 'screen_failed';
  const [activeScreen, setActiveScreen] = useState<ScreenId>('screen7_home');

  // Real-time synchronization summary from IndexedDB syncEngine
  const [syncSummary, setSyncSummary] = useState<SyncSummary | null>(null);
  const [isSyncCenterModalOpen, setIsSyncCenterModalOpen] = useState(false);

  useEffect(() => {
    return subscribeToSyncState((summary) => {
      setSyncSummary(summary);
      setIsDeadZoneSimulated(getHighwayDeadZoneSimulated());
    });
  }, []);

  // Driver Bottom Navigation Tabs (4 main tabs matching showcase: Home, Vehicles, History, More)
  type DriverNavTab = 'home' | 'vehicles' | 'history' | 'more' | 'work' | 'fuel' | 'service' | 'docs' | 'payments' | 'help';
  const [activeNavTab, setActiveNavTab] = useState<DriverNavTab>('home');

  // Modals & Panels
  const [isSelectVehicleModalOpen, setIsSelectVehicleModalOpen] = useState(false);
  const [isVehicleDetailsModalOpen, setIsVehicleDetailsModalOpen] = useState(false);
  const [selectedVehicleForDetails, setSelectedVehicleForDetails] = useState<Vehicle | null>(null);
  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);
  const [isReportIssueModalOpen, setIsReportIssueModalOpen] = useState(false);
  const [isSyncDrawerOpen, setIsSyncDrawerOpen] = useState(false);
  const [syncStep, setSyncStep] = useState<'offline' | 'syncing' | 'success'>('offline');

  // Highway Dead Zone / Low Signal Simulation toggle for testing offline capabilities
  const [isDeadZoneSimulated, setIsDeadZoneSimulated] = useState(false);
  const isEffectivelyOnline = syncState.isOnline && !isDeadZoneSimulated;

  // Time / Shift greeting
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const greeting = useMemo(() => {
    const hour = currentDateTime.getHours();
    if (hour < 12) return t.goodMorning;
    if (hour < 17) return t.goodAfternoon;
    return t.goodEvening;
  }, [currentDateTime, t]);

  // Verified Odometer for current vehicle (strictly monotonic check)
  const currentVerifiedOdo = useMemo(() => {
    if (!currentVehicle) return 89780;
    const evts = odometerEvents.filter((e) => e.vehicleId === currentVehicle.id);
    if (evts.length === 0) return currentVehicle.currentOdometer || 89780;
    return Math.max(...evts.map((e) => e.odometerReading), currentVehicle.currentOdometer || 89780);
  }, [currentVehicle, odometerEvents]);

  // Fuel intelligence for active vehicle
  const dieselStats = useMemo(() => {
    if (!currentVehicle) return null;
    return calculateVehicleFuelAverage(currentVehicle.id, currentVehicle.number, 'diesel', fuelRecords);
  }, [currentVehicle, fuelRecords]);

  // Vehicle-specific refuel records
  const vehicleFuelRecords = useMemo(() => {
    if (!currentVehicle) return [];
    return fuelRecords.filter((r) => r.vehicleId === currentVehicle.id);
  }, [currentVehicle, fuelRecords]);

  // Vehicle-specific service records
  const vehicleServiceRecords = useMemo(() => {
    if (!currentVehicle) return [];
    return serviceRecords.filter((r) => r.vehicleId === currentVehicle.id);
  }, [currentVehicle, serviceRecords]);

  // Driver trips
  const driverTrips = useMemo(() => {
    return trips.filter(
      (trip) =>
        trip.driverId === activeDriver?.id ||
        (activeDriver && trip.driverName?.toLowerCase().includes(activeDriver.fullName.toLowerCase().split(' ')[0]))
    );
  }, [trips, activeDriver]);

  const currentActiveTrip = useMemo(() => {
    return driverTrips.find((t) => t.status === 'in_transit') || driverTrips[0] || trips[0];
  }, [driverTrips, trips]);

  // Toast / feedback message
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // =========================================================================
  // STATE FOR SCREEN 8: ADD DIESEL / CNG
  // =========================================================================
  const [refuelFuelType, setRefuelFuelType] = useState<FuelType>('diesel');
  const [refuelOdo, setRefuelOdo] = useState<number>(89780);
  const [refuelQuantity, setRefuelQuantity] = useState<string>('50.00');
  const [refuelRate, setRefuelRate] = useState<string>('98.50');
  const [refuelStation, setRefuelStation] = useState<string>('BPCL Nashik');
  const [refuelFillType, setRefuelFillType] = useState<FuelFillType>('full_tank');
  const [refuelPaymentMethod, setRefuelPaymentMethod] = useState<FuelPaymentMethod>('company_account');
  const [refuelReceiptPhoto, setRefuelReceiptPhoto] = useState<string | null>(RECEIPT_SAMPLE_IMG);

  // Auto total calculation for Fuel
  const calculatedRefuelTotal = useMemo(() => {
    const q = parseFloat(refuelQuantity) || 0;
    const r = parseFloat(refuelRate) || 0;
    return (q * r).toFixed(2);
  }, [refuelQuantity, refuelRate]);

  const handleRefuelReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setRefuelReceiptPhoto(uploadEvent.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitRefuel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentVehicle || !activeDriver) return;

    const odoNum = Number(refuelOdo);
    if (isNaN(odoNum) || odoNum <= 0) {
      alert('Please enter a valid Odometer reading.');
      return;
    }

    if (odoNum < currentVerifiedOdo) {
      alert(
        `Monotonic Violation: Entered ODO (${odoNum.toLocaleString()} KM) cannot be lower than last verified ODO (${currentVerifiedOdo.toLocaleString()} KM).`
      );
      return;
    }

    const qty = parseFloat(refuelQuantity);
    const rate = parseFloat(refuelRate);
    const total = parseFloat(calculatedRefuelTotal);

    if (isNaN(qty) || qty <= 0 || isNaN(rate) || rate <= 0) {
      alert('Please enter valid fuel quantity and rate.');
      return;
    }

    await addFuelRecord({
      vehicleId: currentVehicle.id,
      vehicleNumber: currentVehicle.number,
      driverId: activeDriver.id,
      driverName: activeDriver.fullName,
      fuelType: refuelFuelType,
      odometerReading: odoNum,
      fuelQuantity: qty,
      unit: refuelFuelType === 'cng' ? 'KG' : 'Litres',
      pricePerUnit: rate,
      totalAmount: total,
      fillType: refuelFillType,
      fuelStation: refuelStation || 'BPCL Nashik',
      paymentMethod: refuelPaymentMethod,
      receiptPhotoUrl: refuelReceiptPhoto || undefined,
      notes: `Driver log via mobile PWA. Fill type: ${refuelFillType}`,
    });

    showToast(
      isEffectivelyOnline
        ? 'Fuel entry submitted & synchronized successfully!'
        : 'Fuel entry saved locally in IndexedDB! Will sync automatically when online.'
    );
    setActiveScreen('screen7_home');
  };

  // =========================================================================
  // STATE FOR SCREEN 9: START TRIP
  // =========================================================================
  const [tripStartOdo, setTripStartOdo] = useState<number>(89950);
  const [tripFrom, setTripFrom] = useState('Vapi');
  const [tripTo, setTripTo] = useState('Surat');
  const [tripLoadType, setTripLoadType] = useState('Fruit / Goods');

  const handleStartTripSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentVehicle || !activeDriver) return;

    const odoNum = Number(tripStartOdo);
    if (odoNum < currentVerifiedOdo) {
      alert(`Start ODO (${odoNum} KM) cannot be less than last verified ODO (${currentVerifiedOdo} KM).`);
      return;
    }

    const tripCode = `TRP-MH-GJ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    addTrip({
      id: tripCode,
      vehicleId: currentVehicle.id,
      vehicleNumber: currentVehicle.number,
      vehicleStateCode: currentVehicle.stateCode,
      driverId: activeDriver.id,
      driverName: activeDriver.fullName,
      startingLocation: tripFrom,
      outDate: new Date().toISOString().split('T')[0],
      startOdometer: odoNum,
      status: 'in_transit',
      totalFruitValue: 7750,
      destinations: [
        {
          id: `dest-${Date.now()}-1`,
          stopSequence: 1,
          placeName: tripTo,
          city: 'Surat',
          state: 'Gujarat',
          contactPerson: 'Pahlwan',
          mobile: '9825012345',
          items: [
            {
              id: `item-1`,
              itemName: tripLoadType,
              quantity: 150,
              costPerItem: 50,
              totalAmount: 7500,
            },
          ],
          destinationTotalAmount: 7500,
          paymentTerm: '1_month',
          deliveryStatus: 'pending',
        },
      ],
    });

    logOdometerActivity({
      vehicleId: currentVehicle.id,
      odometerReading: odoNum,
      activityType: 'trip_start',
      activityReferenceId: tripCode,
      driverId: activeDriver.id,
      driverName: activeDriver.fullName,
      notes: `Trip started to ${tripTo}`,
    });

    showToast(`Trip ${tripCode} started successfully!`);
    setActiveScreen('screen7_home');
  };

  // =========================================================================
  // STATE FOR ADD SERVICE / REPAIR
  // =========================================================================
  const [serviceOdo, setServiceOdo] = useState<number>(89780);
  const [serviceType, setServiceType] = useState<ServiceActivityType>('General Servicing');
  const [serviceWorkshop, setServiceWorkshop] = useState<string>('National Tyre Care, Surat');
  const [serviceAmount, setServiceAmount] = useState<string>('14800');
  const [serviceWorkDetails, setServiceWorkDetails] = useState<string>(
    'Engine oil, oil filter, air filter, general checkup'
  );
  const [serviceInvoicePhoto, setServiceInvoicePhoto] = useState<string | null>(RECEIPT_SAMPLE_IMG);

  const handleServiceInvoiceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setServiceInvoicePhoto(uploadEvent.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentVehicle || !activeDriver) return;

    const odoNum = Number(serviceOdo);
    if (isNaN(odoNum) || odoNum <= 0) {
      alert('Please enter a valid Odometer reading.');
      return;
    }

    if (odoNum < currentVerifiedOdo) {
      alert(
        `Monotonic Violation: Entered ODO (${odoNum.toLocaleString()} KM) cannot be lower than last verified ODO (${currentVerifiedOdo.toLocaleString()} KM).`
      );
      return;
    }

    const cost = parseFloat(serviceAmount) || 0;
    if (cost <= 0) {
      alert('Please enter a valid service amount.');
      return;
    }

    await addServiceRecord({
      vehicleId: currentVehicle.id,
      vehicleNumber: currentVehicle.number,
      driverId: activeDriver.id,
      driverName: activeDriver.fullName,
      currentOdometer: odoNum,
      activityType: serviceType,
      date: new Date().toISOString().split('T')[0],
      workshopName: serviceWorkshop || 'Authorized Workshop',
      workDescription: serviceWorkDetails,
      expenseAmount: cost,
      paidBy: 'company_account',
      invoiceNumber: `NTC/2026/${Math.floor(1000 + Math.random() * 9000)}`,
      receiptPhotoUrl: serviceInvoicePhoto || undefined,
    });

    setIsAddServiceModalOpen(false);
    showToast(
      isEffectivelyOnline
        ? 'Service record saved & synchronized!'
        : 'Service record stored offline in IndexedDB! Will auto-sync.'
    );
  };

  // Vehicle search for modal
  const [vehicleSearchQuery, setVehicleSearchQuery] = useState('');
  const filteredVehicles = useMemo(() => {
    if (!vehicleSearchQuery.trim()) return assignedVehiclesList;
    const q = vehicleSearchQuery.toLowerCase();
    return assignedVehiclesList.filter(
      (v: Vehicle) =>
        v.number.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q) ||
        v.type.toLowerCase().includes(q)
    );
  }, [assignedVehiclesList, vehicleSearchQuery]);

  // Trigger real sync sequence via IndexedDB syncEngine
  const runSyncSequence = async () => {
    setActiveScreen('screen11_syncing');
    try {
      const res = await processOfflineSyncQueue();
      if (res.failed > 0) {
        setActiveScreen('screen_failed');
        showToast('Sync failed: Network timeout. Records safely preserved in IndexedDB.');
      } else {
        setActiveScreen('screen12_synced');
        showToast('All records synchronized successfully with FleetPulse cloud!');
      }
    } catch {
      setActiveScreen('screen_failed');
    }
  };

  // =========================================================================
  // SUB-RENDERER: PHONE STATUS BAR (9:41, Cellular, Wifi, Battery)
  // =========================================================================
  const renderPhoneStatusBar = (dark: boolean = false) => {
    return (
      <div
        className={`px-6 pt-3 pb-2 flex items-center justify-between text-xs font-semibold select-none ${
          dark ? 'text-white' : 'text-[#384959]'
        }`}
      >
        <span className="font-extrabold tracking-tight">9:41</span>
        {/* Dynamic Notch Slit */}
        <div className={`w-14 h-3.5 rounded-full ${dark ? 'bg-black/30' : 'bg-slate-300/60'} mx-auto`} />
        <div className="flex items-center gap-1.5">
          {/* 4 Signal bars */}
          <div className="flex items-end gap-0.5 h-2.5">
            <div className={`w-0.5 h-1 rounded-xs ${dark ? 'bg-white' : 'bg-[#384959]'}`} />
            <div className={`w-0.5 h-1.5 rounded-xs ${dark ? 'bg-white' : 'bg-[#384959]'}`} />
            <div className={`w-0.5 h-2 rounded-xs ${dark ? 'bg-white' : 'bg-[#384959]'}`} />
            <div className={`w-0.5 h-2.5 rounded-xs ${dark ? 'bg-white' : 'bg-[#384959]'}`} />
          </div>
          <Wifi className="w-3.5 h-3.5" />
          <Battery className="w-4 h-4" />
        </div>
      </div>
    );
  };

  // =========================================================================
  // SUB-RENDERER: BOTTOM NAVIGATION BAR (Home, Vehicles, History, More)
  // =========================================================================
  const renderBottomNav = (isDockedInPhone: boolean = true) => {
    const navItems = [
      { id: 'home', label: 'Home', icon: <Layers className="w-5 h-5" /> },
      { id: 'vehicles', label: 'Vehicles', icon: <Truck className="w-5 h-5" /> },
      { id: 'history', label: 'History', icon: <Clock className="w-5 h-5" /> },
      { id: 'more', label: 'More', icon: <ChevronRight className="w-5 h-5" /> },
    ];

    return (
      <div
        className={`bg-white border-t border-[#DCE8F2] py-2 px-3 shadow-md select-none shrink-0 ${
          isDockedInPhone ? 'w-full' : 'fixed bottom-0 left-0 right-0 max-w-md mx-auto z-40'
        }`}
      >
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const isActive = activeNavTab === item.id && activeScreen === 'screen7_home';
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveNavTab(item.id as DriverNavTab);
                  setActiveScreen('screen7_home');
                  if (item.id === 'vehicles') setIsSelectVehicleModalOpen(true);
                }}
                className={`flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer ${
                  isActive ? 'text-[#384959] font-bold' : 'text-[#6A89A7] hover:text-[#384959]'
                }`}
              >
                <div
                  className={`p-1 rounded-xl transition-all ${
                    isActive ? 'bg-[#BDDDFC] text-[#384959] scale-105' : 'text-[#6A89A7]'
                  }`}
                >
                  {item.icon}
                </div>
                <span className="text-[10px] mt-0.5 tracking-tight font-heading">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // =========================================================================
  // SCREEN 7: DRIVER HOME (Exact recreation from showcase reference image)
  // =========================================================================
  const renderScreen7Home = (isInsidePhoneFrame: boolean = true) => {
    return (
      <div className="flex flex-col h-full bg-[#F3F7FB] overflow-y-auto no-scrollbar">
        {/* Phone Top Header with Dark Navy Background (#384959) */}
        <div className="bg-[#384959] text-white shrink-0">
          {renderPhoneStatusBar(true)}

          {/* Brand Row */}
          <div className="px-4 pt-1 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
                <Truck className="w-4 h-4 text-emerald-300" />
              </div>
              <div>
                <span className="font-heading font-extrabold text-xs text-white tracking-tight block leading-tight">
                  FleetPulse TMS
                </span>
                <span className="text-[9px] text-[#BDDDFC] font-medium block leading-tight">
                  Driver App
                </span>
              </div>
            </div>

            {/* Offline Status & Quick Language */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  if (displayMode === 'device') {
                    setActiveScreen('screen10_offline');
                  } else {
                    setIsSyncDrawerOpen(true);
                    setSyncStep('offline');
                  }
                }}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${
                  isEffectivelyOnline
                    ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30'
                    : 'bg-rose-500/30 text-rose-200 border-rose-400/50 animate-pulse'
                }`}
              >
                {isEffectivelyOnline ? <Wifi className="w-3 h-3 text-emerald-300" /> : <WifiOff className="w-3 h-3 text-rose-300" />}
                <span>{isEffectivelyOnline ? 'Online' : 'Offline (3)'}</span>
              </button>

              {role === 'driver' && (
                <button
                  type="button"
                  onClick={logout}
                  title="Sign Out"
                  className="p-1 rounded-md bg-[#4A6075] text-[#BDDDFC] hover:text-white"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Greeting Row */}
          <div className="px-4 pb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#BDDDFC] text-[#384959] flex items-center justify-center font-black text-sm shrink-0 border border-white/40">
                {activeDriver ? activeDriver.fullName.charAt(0) : 'S'}
              </div>
              <div>
                <div className="text-[11px] text-slate-300 leading-tight">Good Morning,</div>
                <div className="font-heading font-extrabold text-sm text-[#88BDF2] leading-tight flex items-center gap-1">
                  <span>{activeDriver?.fullName || 'Sukhwinder Singh'}</span>
                  <span>👋</span>
                </div>
              </div>
            </div>

            {/* Badges Bar: Date and Shift */}
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1 bg-[#2C3B49] text-[#BDDDFC] text-[10px] font-bold px-2 py-0.5 rounded-md border border-[#6A89A7]/30">
                <Calendar className="w-3 h-3 text-[#88BDF2]" />
                06 Nov 2026
              </span>
              <span className="inline-flex items-center gap-1 bg-[#2C3B49] text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-md border border-[#6A89A7]/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Full Day Shift
              </span>
            </div>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-3.5 space-y-3.5 flex-1">
          {/* Active Vehicle Card */}
          <div
            onClick={() => setIsSelectVehicleModalOpen(true)}
            className="bg-white rounded-2xl p-3 border border-[#DCE8F2] shadow-xs flex items-center justify-between cursor-pointer hover:border-[#88BDF2] transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#F3F7FB] border border-[#DCE8F2] flex items-center justify-center overflow-hidden shrink-0">
                <img
                  src={TATA_SIGNA_TRUCK_IMG}
                  alt={currentVehicle?.number || 'Truck'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-heading font-extrabold text-xs text-[#384959] tracking-tight">
                    {currentVehicle?.number || 'MH-12-RN-4892'}
                  </span>
                  <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2 py-0.2 rounded-full border border-emerald-300">
                    Active
                  </span>
                </div>
                <div className="text-[11px] text-[#6A89A7] font-medium">
                  {currentVehicle?.model || 'Tata Signa'}
                </div>
                <div className="text-[10px] text-[#384959] font-semibold mt-0.5">
                  ODO: <span className="font-bold">{currentVerifiedOdo.toLocaleString()} KM</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 text-[11px] font-bold text-[#6A89A7] group-hover:text-[#384959]">
              <span>Switch</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#6A89A7]" />
            </div>
          </div>

          {/* 6 Large Action Buttons Grid (Exact recreation from showcase reference image) */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* 1: Start Trip */}
            <button
              type="button"
              onClick={() => {
                setTripStartOdo(89950);
                if (displayMode === 'device') {
                  setActiveScreen('screen9_trip');
                } else {
                  setActiveScreen('screen9_trip');
                }
              }}
              className="bg-white p-3 rounded-2xl border border-[#DCE8F2] shadow-2xs hover:shadow-xs hover:border-[#88BDF2] flex flex-col items-center justify-center gap-2 transition-all active:scale-95 group text-center cursor-pointer min-h-[92px]"
            >
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 group-hover:bg-[#88BDF2] group-hover:text-white transition-colors">
                <Navigation className="w-5 h-5 text-[#0284c7] group-hover:text-white" />
              </div>
              <span className="block text-xs font-heading font-extrabold text-[#384959]">
                Start Trip
              </span>
            </button>

            {/* 2: Add Delivery */}
            <button
              type="button"
              onClick={() => {
                showToast('Edit Outbound Fruit Delivery modal is active in Admin Trips view.');
              }}
              className="bg-white p-3 rounded-2xl border border-[#DCE8F2] shadow-2xs hover:shadow-xs hover:border-[#88BDF2] flex flex-col items-center justify-center gap-2 transition-all active:scale-95 group text-center cursor-pointer min-h-[92px]"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                <PackageCheck className="w-5 h-5 text-emerald-600 group-hover:text-white" />
              </div>
              <span className="block text-xs font-heading font-extrabold text-[#384959]">
                Add Delivery
              </span>
            </button>

            {/* 3: Add Diesel / CNG */}
            <button
              type="button"
              onClick={() => {
                setRefuelOdo(89780);
                if (displayMode === 'device') {
                  setActiveScreen('screen8_fuel');
                } else {
                  setActiveScreen('screen8_fuel');
                }
              }}
              className="bg-white p-3 rounded-2xl border border-[#DCE8F2] shadow-2xs hover:shadow-xs hover:border-[#88BDF2] flex flex-col items-center justify-center gap-2 transition-all active:scale-95 group text-center cursor-pointer min-h-[92px]"
            >
              <div className="w-10 h-10 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100 group-hover:bg-[#0284c7] group-hover:text-white transition-colors">
                <Fuel className="w-5 h-5 text-[#0284c7] group-hover:text-white" />
              </div>
              <span className="block text-xs font-heading font-extrabold text-[#384959]">
                Add Diesel / CNG
              </span>
            </button>

            {/* 4: Add Service */}
            <button
              type="button"
              onClick={() => {
                setServiceOdo(89780);
                setIsAddServiceModalOpen(true);
              }}
              className="bg-white p-3 rounded-2xl border border-[#DCE8F2] shadow-2xs hover:shadow-xs hover:border-[#88BDF2] flex flex-col items-center justify-center gap-2 transition-all active:scale-95 group text-center cursor-pointer min-h-[92px]"
            >
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 group-hover:bg-[#384959] group-hover:text-white transition-colors">
                <Wrench className="w-5 h-5 text-[#6A89A7] group-hover:text-white" />
              </div>
              <span className="block text-xs font-heading font-extrabold text-[#384959]">
                Add Service
              </span>
            </button>

            {/* 5: Vehicle Issue */}
            <button
              type="button"
              onClick={() => setIsReportIssueModalOpen(true)}
              className="bg-white p-3 rounded-2xl border border-[#DCE8F2] shadow-2xs hover:shadow-xs hover:border-amber-300 flex flex-col items-center justify-center gap-2 transition-all active:scale-95 group text-center cursor-pointer min-h-[92px]"
            >
              <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                <AlertTriangle className="w-5 h-5 text-amber-600 group-hover:text-white" />
              </div>
              <span className="block text-xs font-heading font-extrabold text-[#384959]">
                Vehicle Issue
              </span>
            </button>

            {/* 6: My Trips */}
            <button
              type="button"
              onClick={() => {
                setActiveNavTab('history');
                showToast(`Viewing trip history (${driverTrips.length} records)`);
              }}
              className="bg-white p-3 rounded-2xl border border-[#DCE8F2] shadow-2xs hover:shadow-xs hover:border-[#88BDF2] flex flex-col items-center justify-center gap-2 transition-all active:scale-95 group text-center cursor-pointer min-h-[92px]"
            >
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 group-hover:bg-[#88BDF2] group-hover:text-white transition-colors">
                <FileText className="w-5 h-5 text-[#6A89A7] group-hover:text-white" />
              </div>
              <span className="block text-xs font-heading font-extrabold text-[#384959]">
                My Trips
              </span>
            </button>
          </div>
        </div>

        {/* Docked Phone Bottom Navigation */}
        {renderBottomNav(isInsidePhoneFrame)}
      </div>
    );
  };

  // =========================================================================
  // SCREEN 8: ADD DIESEL / CNG (Exact recreation from showcase reference image)
  // =========================================================================
  const renderScreen8AddDiesel = (isInsidePhoneFrame: boolean = true, onBack?: () => void) => {
    return (
      <div className="flex flex-col h-full bg-[#F3F7FB] overflow-y-auto no-scrollbar">
        {/* Top Header Dark Navy */}
        <div className="bg-[#384959] text-white shrink-0">
          {renderPhoneStatusBar(true)}

          <div className="px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onBack || (() => setActiveScreen('screen7_home'))}
                className="p-1 rounded-lg text-white hover:bg-white/10 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h3 className="font-heading font-bold text-sm text-white">Add Diesel / CNG</h3>
            </div>
            <span className="text-[10px] text-[#BDDDFC] font-mono font-bold">
              {currentVehicle?.number}
            </span>
          </div>
        </div>

        {/* Screen 8 Form Body */}
        <form onSubmit={handleSubmitRefuel} className="p-3.5 space-y-3 flex-1 flex flex-col justify-between">
          <div className="space-y-3">
            {/* Diesel vs CNG Pill Switcher */}
            <div className="grid grid-cols-2 gap-1 bg-slate-200/60 p-1 rounded-xl border border-[#DCE8F2]">
              <button
                type="button"
                onClick={() => setRefuelFuelType('diesel')}
                className={`py-1.5 rounded-lg text-xs font-heading font-bold transition-all ${
                  refuelFuelType === 'diesel'
                    ? 'bg-[#384959] text-white shadow-2xs'
                    : 'text-[#6A89A7] hover:text-[#384959]'
                }`}
              >
                Diesel
              </button>
              <button
                type="button"
                onClick={() => setRefuelFuelType('cng')}
                className={`py-1.5 rounded-lg text-xs font-heading font-bold transition-all ${
                  refuelFuelType === 'cng'
                    ? 'bg-[#384959] text-white shadow-2xs'
                    : 'text-[#6A89A7] hover:text-[#384959]'
                }`}
              >
                CNG
              </button>
            </div>

            {/* Current ODO (KM) * */}
            <div>
              <label className="block text-[11px] font-bold text-[#384959] mb-1">
                Current ODO (KM) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                value={refuelOdo}
                onChange={(e) => setRefuelOdo(Number(e.target.value))}
                min={currentVerifiedOdo}
                className="w-full px-3 py-2 bg-white border border-[#DCE8F2] rounded-xl text-xs font-bold text-[#384959] focus:outline-none focus:border-[#88BDF2] shadow-2xs"
              />
            </div>

            {/* Fuel Quantity (Litres) * */}
            <div>
              <label className="block text-[11px] font-bold text-[#384959] mb-1">
                Fuel Quantity ({refuelFuelType === 'diesel' ? 'Litres' : 'KG'}) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={refuelQuantity}
                onChange={(e) => setRefuelQuantity(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#DCE8F2] rounded-xl text-xs font-bold text-[#384959] focus:outline-none focus:border-[#88BDF2] shadow-2xs"
              />
            </div>

            {/* Price per Litre (₹) * */}
            <div>
              <label className="block text-[11px] font-bold text-[#384959] mb-1">
                Price per {refuelFuelType === 'diesel' ? 'Litre' : 'KG'} (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={refuelRate}
                onChange={(e) => setRefuelRate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#DCE8F2] rounded-xl text-xs font-bold text-[#384959] focus:outline-none focus:border-[#88BDF2] shadow-2xs"
              />
            </div>

            {/* Total Amount (₹) (Auto-calculated) */}
            <div>
              <label className="block text-[11px] font-bold text-[#384959] mb-1">
                Total Amount (₹)
              </label>
              <div className="w-full px-3 py-2 bg-white border border-[#DCE8F2] rounded-xl text-xs font-bold text-[#384959] shadow-2xs">
                {Number(calculatedRefuelTotal).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            {/* Fuel Station * */}
            <div>
              <label className="block text-[11px] font-bold text-[#384959] mb-1">
                Fuel Station <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={refuelStation}
                  onChange={(e) => setRefuelStation(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#DCE8F2] rounded-xl text-xs font-semibold text-[#384959] focus:outline-none focus:border-[#88BDF2] shadow-2xs appearance-none"
                >
                  <option value="BPCL Nashik">BPCL Nashik</option>
                  <option value="HPCL Vapi Highway Hub">HPCL Vapi Highway Hub</option>
                  <option value="IndianOil Surat Ring Road">IndianOil Surat Ring Road</option>
                  <option value="Shell Surat Logistics Terminal">Shell Surat Logistics Terminal</option>
                </select>
                <ChevronDown className="w-4 h-4 text-[#6A89A7] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Receipt Photo with remove '✕' badge and Add Photo */}
            <div>
              <label className="block text-[11px] font-bold text-[#384959] mb-1">
                Receipt Photo
              </label>
              <div className="flex items-center gap-2.5">
                {refuelReceiptPhoto && (
                  <div className="relative w-14 h-14 rounded-xl border border-[#DCE8F2] overflow-hidden shrink-0 shadow-2xs">
                    <img src={refuelReceiptPhoto} alt="Receipt Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setRefuelReceiptPhoto(null)}
                      className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center hover:bg-rose-600 transition-colors shadow-2xs"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                )}

                <label className="cursor-pointer flex-1 py-2 px-3 bg-white border border-dashed border-[#88BDF2] rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold text-[#384959] hover:bg-[#F3F7FB] transition-colors shadow-2xs">
                  <Camera className="w-4 h-4 text-[#0284c7]" />
                  <span>{refuelReceiptPhoto ? 'Change Photo' : 'Add Photo'}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleRefuelReceiptUpload} />
                </label>
              </div>
            </div>
          </div>

          {/* Full-width Green Submit Button */}
          <button
            type="submit"
            className="w-full py-3 bg-[#16a34a] hover:bg-[#15803d] text-white rounded-xl font-heading font-extrabold text-xs shadow-md transition-all active:scale-[0.99] cursor-pointer mt-2"
          >
            Submit
          </button>
        </form>
      </div>
    );
  };

  // =========================================================================
  // SCREEN 9: START TRIP (Exact recreation from showcase reference image)
  // =========================================================================
  const renderScreen9StartTrip = (isInsidePhoneFrame: boolean = true, onBack?: () => void) => {
    return (
      <div className="flex flex-col h-full bg-[#F3F7FB] overflow-y-auto no-scrollbar">
        {/* Top Header Dark Navy */}
        <div className="bg-[#384959] text-white shrink-0">
          {renderPhoneStatusBar(true)}

          <div className="px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onBack || (() => setActiveScreen('screen7_home'))}
                className="p-1 rounded-lg text-white hover:bg-white/10 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h3 className="font-heading font-bold text-sm text-white">Start Trip</h3>
            </div>
          </div>
        </div>

        {/* Screen 9 Body */}
        <form onSubmit={handleStartTripSubmit} className="p-3.5 space-y-3.5 flex-1 flex flex-col justify-between">
          <div className="space-y-3">
            {/* Vehicle Card Banner */}
            <div className="bg-white rounded-2xl p-3 border border-[#DCE8F2] shadow-xs flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#F3F7FB] border border-[#DCE8F2] flex items-center justify-center overflow-hidden shrink-0">
                <img
                  src={TATA_SIGNA_TRUCK_IMG}
                  alt={currentVehicle?.number || 'Tata Signa'}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <span className="font-heading font-extrabold text-xs text-[#384959] tracking-tight block">
                  {currentVehicle?.number || 'MH-12-RN-4892'}
                </span>
                <span className="text-[11px] text-[#6A89A7] font-medium block">
                  {currentVehicle?.model || 'Tata Signa'}
                </span>
              </div>
            </div>

            {/* Start ODO (KM) * */}
            <div>
              <label className="block text-[11px] font-bold text-[#384959] mb-1">
                Start ODO (KM) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                value={tripStartOdo}
                onChange={(e) => setTripStartOdo(Number(e.target.value))}
                min={currentVerifiedOdo}
                className="w-full px-3 py-2 bg-white border border-[#DCE8F2] rounded-xl text-xs font-bold text-[#384959] focus:outline-none focus:border-[#88BDF2] shadow-2xs"
              />
            </div>

            {/* From (Loading) */}
            <div>
              <label className="block text-[11px] font-bold text-[#384959] mb-1">
                From (Loading)
              </label>
              <input
                type="text"
                required
                value={tripFrom}
                onChange={(e) => setTripFrom(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#DCE8F2] rounded-xl text-xs font-bold text-[#384959] focus:outline-none focus:border-[#88BDF2] shadow-2xs"
              />
            </div>

            {/* To (Unloading) */}
            <div>
              <label className="block text-[11px] font-bold text-[#384959] mb-1">
                To (Unloading)
              </label>
              <input
                type="text"
                required
                value={tripTo}
                onChange={(e) => setTripTo(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#DCE8F2] rounded-xl text-xs font-bold text-[#384959] focus:outline-none focus:border-[#88BDF2] shadow-2xs"
              />
            </div>

            {/* Load Type */}
            <div>
              <label className="block text-[11px] font-bold text-[#384959] mb-1">
                Load Type
              </label>
              <input
                type="text"
                required
                value={tripLoadType}
                onChange={(e) => setTripLoadType(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#DCE8F2] rounded-xl text-xs font-bold text-[#384959] focus:outline-none focus:border-[#88BDF2] shadow-2xs"
              />
            </div>
          </div>

          {/* Full-width Green Button: Start Trip */}
          <button
            type="submit"
            className="w-full py-3 bg-[#16a34a] hover:bg-[#15803d] text-white rounded-xl font-heading font-extrabold text-xs shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-1.5 cursor-pointer mt-4"
          >
            <PlayCircle className="w-4 h-4 text-emerald-200" />
            <span>Start Trip</span>
          </button>
        </form>
      </div>
    );
  };

  // =========================================================================
  // SCREEN 10: OFFLINE MODE (Exact recreation from showcase reference image)
  // =========================================================================
  const renderScreen10Offline = (isInsidePhoneFrame: boolean = true) => {
    const savedCount = syncSummary?.savedOfflineCount || 3;
    const waitingCount = syncSummary?.waitingToSyncCount || 3;

    return (
      <div className="flex flex-col h-full bg-white overflow-y-auto no-scrollbar">
        {renderPhoneStatusBar(false)}

        <div className="p-5 flex-1 flex flex-col items-center justify-between text-center">
          <div className="w-full flex flex-col items-center pt-3">
            {/* Coral circular WifiOff badge */}
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-rose-500 to-rose-400 text-white flex items-center justify-center shadow-lg shadow-rose-200 mb-3 animate-pulse">
              <WifiOff className="w-8 h-8 text-white" />
            </div>

            <h3 className="font-heading font-black text-base text-[#384959]">Offline Mode</h3>
            <p className="text-xs text-[#6A89A7] mt-0.5 leading-snug">
              You are offline<br />Your work is being saved on this device.
            </p>

            {/* Offline Summary Card */}
            <div className="w-full bg-[#F8FAFC] border border-[#DCE8F2] rounded-2xl p-3.5 space-y-2.5 text-xs text-left mt-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#384959]">
                  <Truck className="w-3.5 h-3.5 text-[#6A89A7]" />
                  <span className="font-semibold text-[11px]">Saved Offline</span>
                </div>
                <span className="font-mono font-black text-xs text-[#384959]">{savedCount}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#384959]">
                  <Clock className="w-3.5 h-3.5 text-[#6A89A7]" />
                  <span className="font-semibold text-[11px]">Waiting to Sync</span>
                </div>
                <span className="font-mono font-black text-xs text-[#384959]">{waitingCount}</span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#DCE8F2]">
                <div className="flex items-center gap-1.5 text-[#6A89A7]">
                  <RefreshCw className="w-3 h-3 text-[#6A89A7]" />
                  <span className="text-[10px]">Last Sync</span>
                </div>
                <span className="font-mono font-bold text-[#6A89A7] text-[10px]">05 Nov 2026, 06:20 PM</span>
              </div>
            </div>
          </div>

          {/* Full-width Blue Sync Now Button */}
          <button
            type="button"
            onClick={runSyncSequence}
            className="w-full py-3 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-xl font-heading font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-[0.99] cursor-pointer mt-4"
          >
            <RefreshCw className="w-3.5 h-3.5 text-white" />
            <span>Sync Now</span>
          </button>
        </div>
      </div>
    );
  };

  // =========================================================================
  // SCREEN 11: SYNCHRONIZING... (Exact recreation from showcase reference image)
  // =========================================================================
  const renderScreen11Syncing = (isInsidePhoneFrame: boolean = true) => {
    const percent = syncSummary?.progress?.isSyncing ? syncSummary.progress.percent : 75;

    return (
      <div className="flex flex-col h-full bg-white overflow-y-auto no-scrollbar">
        {renderPhoneStatusBar(false)}

        <div className="p-5 flex-1 flex flex-col items-center justify-between text-center">
          <div className="w-full flex flex-col items-center pt-3">
            {/* Blue circular syncing badge with spinning icon */}
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#0284c7] to-[#88BDF2] text-white flex items-center justify-center shadow-lg shadow-sky-200 mb-3">
              <RefreshCw className="w-8 h-8 text-white animate-spin" />
            </div>

            <h3 className="font-heading font-black text-base text-[#384959]">Synchronizing...</h3>
            <p className="text-xs text-[#6A89A7] mt-0.5 leading-snug">
              Uploading your records to FleetPulse.
            </p>

            {/* Progress Bar matching Screen 11 */}
            <div className="w-full space-y-1 mt-4">
              <div className="w-full bg-[#DCE8F2] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#0284c7] h-full rounded-full transition-all duration-500"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <div className="text-right text-[10px] font-mono font-bold text-[#0284c7]">{percent}%</div>
            </div>

            {/* 4-Item Status Checklist */}
            <div className="w-full bg-[#F8FAFC] border border-[#DCE8F2] rounded-2xl p-3.5 space-y-2 text-xs text-left mt-3 shadow-2xs">
              <div className="flex items-center gap-2 text-emerald-800 font-semibold text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Trip Record (1/1)</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-800 font-semibold text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Fuel Entry (1/1)</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-800 font-semibold text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Service Record (1/1)</span>
              </div>
              <div className="flex items-center gap-2 text-[#6A89A7] text-[11px]">
                <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                <span>Other Records (0/1)</span>
              </div>
            </div>
          </div>

          <div className="w-full text-center text-[10px] text-[#6A89A7] font-semibold pb-1">
            Keep app open until complete
          </div>
        </div>
      </div>
    );
  };

  // =========================================================================
  // SCREEN 12: ALL RECORDS SYNCED! (Exact recreation from showcase reference image)
  // =========================================================================
  const renderScreen12SyncSuccess = (isInsidePhoneFrame: boolean = true) => {
    const syncedCount = syncSummary && syncSummary.syncedCount > 0 ? syncSummary.syncedCount : 3;

    return (
      <div className="flex flex-col h-full bg-white overflow-y-auto no-scrollbar">
        {renderPhoneStatusBar(false)}

        <div className="p-5 flex-1 flex flex-col items-center justify-between text-center">
          <div className="w-full flex flex-col items-center pt-3">
            {/* Green circular check badge */}
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-500 to-emerald-400 text-white flex items-center justify-center shadow-lg shadow-emerald-200 mb-3">
              <Check className="w-8 h-8 text-white stroke-[3]" />
            </div>

            <h3 className="font-heading font-black text-base text-[#384959]">All Records Synced!</h3>
            <p className="text-xs text-[#6A89A7] mt-0.5 leading-snug">
              Your offline data has been<br />successfully uploaded.
            </p>

            {/* Success Summary Box */}
            <div className="w-full bg-[#F8FAFC] border border-[#DCE8F2] rounded-2xl p-3.5 space-y-2 text-xs text-left mt-4 shadow-2xs">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{syncedCount} Records Synced</span>
              </div>
              <div className="flex items-center gap-2 text-[#6A89A7] font-semibold text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#6A89A7] shrink-0" />
                <span>0 Failed</span>
              </div>
              <div className="pt-2 border-t border-[#DCE8F2] text-[10px] text-[#6A89A7] font-mono">
                Last Sync: 06 Nov 2026, 04:32 PM
              </div>
            </div>
          </div>

          {/* Full-width Dark Slate Done Button */}
          <button
            type="button"
            onClick={() => {
              setActiveScreen('screen7_home');
              showToast('All offline records synchronized with FleetPulse TMS!');
            }}
            className="w-full py-3 bg-[#384959] hover:bg-[#2C3B49] text-white rounded-xl font-heading font-extrabold text-xs shadow-md transition-all active:scale-[0.99] cursor-pointer mt-4"
          >
            Done
          </button>
        </div>
      </div>
    );
  };

  // =========================================================================
  // SCREEN: SYNC FAILED (Required State 4)
  // =========================================================================
  const renderScreenSyncFailed = (isInsidePhoneFrame: boolean = true) => {
    return (
      <div className="flex flex-col h-full bg-white overflow-y-auto no-scrollbar">
        {renderPhoneStatusBar(false)}

        <div className="p-5 flex-1 flex flex-col items-center justify-between text-center">
          <div className="w-full flex flex-col items-center pt-3">
            {/* Red / Rose circular warning badge */}
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-rose-600 to-rose-400 text-white flex items-center justify-center shadow-lg shadow-rose-200 mb-3 animate-pulse">
              <AlertTriangle className="w-8 h-8 text-white" />
            </div>

            <h3 className="font-heading font-black text-base text-[#384959]">Sync Failed</h3>
            <p className="text-xs text-rose-700 font-semibold mt-0.5">
              Network connection interrupted.
            </p>
            <p className="text-[11px] text-[#6A89A7] mt-0.5 leading-snug">
              Your 3 records remain safely stored in IndexedDB. No data was lost.
            </p>

            {/* Failure details box */}
            <div className="w-full bg-rose-50/70 border border-rose-200 rounded-2xl p-3.5 space-y-2 text-xs text-left mt-4 shadow-2xs">
              <div className="flex items-center justify-between text-rose-900 font-bold text-[11px]">
                <span>Stored in IndexedDB</span>
                <span>3 Records Safe</span>
              </div>
              <div className="flex items-center justify-between text-rose-800 text-[11px]">
                <span>Failure Reason</span>
                <span className="font-semibold">Network Timeout (NH-48)</span>
              </div>
              <div className="flex items-center justify-between text-rose-800 text-[11px]">
                <span>Anti-Duplicate Check</span>
                <span className="text-emerald-700 font-bold">Passed</span>
              </div>
            </div>
          </div>

          <div className="w-full space-y-2 mt-4">
            <button
              type="button"
              onClick={async () => {
                setSyncFailureSimulated(false);
                await runSyncSequence();
              }}
              className="w-full py-3 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-xl font-heading font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-[0.99] cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-white" />
              <span>Retry Sync</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveScreen('screen7_home')}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-[#384959] rounded-xl font-heading font-bold text-xs transition-colors cursor-pointer"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  };

  // =========================================================================
  // CARD 13: KEY UI ENHANCEMENTS CARD (From showcase reference image)
  // =========================================================================
  const renderScreen13EnhancementsCard = () => {
    return (
      <div className="bg-white rounded-3xl p-5 border border-[#DCE8F2] shadow-sm flex flex-col justify-between w-[280px] sm:w-[310px] shrink-0">
        <div>
          {/* Logo & Header */}
          <div className="flex items-center gap-3 pb-3 border-b border-[#DCE8F2]">
            <div className="w-10 h-10 rounded-xl bg-[#F3F7FB] border border-[#DCE8F2] flex items-center justify-center text-[#384959] shadow-2xs shrink-0">
              <Truck className="w-5 h-5 text-[#384959]" />
            </div>
            <div>
              <h4 className="font-heading font-extrabold text-sm text-[#384959] leading-tight">
                FleetPulse TMS
              </h4>
              <span className="text-[11px] text-[#6A89A7] font-semibold">
                Key UI Enhancements
              </span>
            </div>
          </div>

          {/* 6 Key Features */}
          <div className="space-y-3.5 text-xs text-[#384959] pt-4">
            {[
              'Modern & Clean Theme (Stormy Morning)',
              'Smart Form Actions (Add Item / Next Delivery)',
              'Interactive & Responsive Design',
              'Offline Entry & Auto Synchronization',
              'Vehicle Analytics & Performance',
              'Consistent Icons, Animations & Feedback',
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <span className="font-medium text-[#384959] text-[11px] leading-tight">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer badge */}
        <div className="pt-4 mt-4 border-t border-[#DCE8F2] flex items-center justify-between text-[10px] text-[#6A89A7] font-semibold">
          <span>FleetPulse PWA</span>
          <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
            Production Ready
          </span>
        </div>
      </div>
    );
  };

  // =========================================================================
  // WRAPPER: PHONE FRAME ENCLOSURE (320px width, rounded-[36px], shadow-xl)
  // =========================================================================
  const renderPhoneFrame = (
    title: string,
    subtitle: string,
    content: React.ReactNode,
    badgeColor: string = 'bg-[#384959]'
  ) => {
    return (
      <div className="flex flex-col items-center shrink-0">
        <div className="mb-2 text-center">
          <span className="text-xs font-heading font-extrabold text-[#384959]">{title}</span>
          <span className="block text-[10px] text-[#6A89A7] font-medium">{subtitle}</span>
        </div>

        {/* Physical Phone Casing */}
        <div className="w-[300px] sm:w-[320px] h-[580px] rounded-[36px] border-[7px] border-[#2C3B49]/15 bg-white shadow-xl overflow-hidden flex flex-col relative transition-all hover:border-[#88BDF2]/40 hover:shadow-2xl">
          {content}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full flex-1 flex flex-col bg-morning-canvas overflow-y-auto">
      {/* Top Banner Toolbar for Testing & Inspection */}
      <div className="bg-white border-b border-[#DCE8F2] px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 shadow-2xs sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#384959] flex items-center justify-center text-white">
            <Smartphone className="w-4 h-4 text-[#88BDF2]" />
          </div>
          <div>
            <span className="font-heading font-extrabold text-xs text-[#384959] block leading-tight">
              Driver Portal (Mobile PWA)
            </span>
            <span className="text-[10px] text-[#6A89A7] block leading-tight">
              Exact Recreation • Screens 7 to 12
            </span>
          </div>
        </div>

        {/* View Switcher: Showcase vs Device */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#F3F7FB] p-1 rounded-xl border border-[#DCE8F2] text-xs font-bold">
            <button
              type="button"
              onClick={() => setDisplayMode('showcase')}
              className={`px-3 py-1 rounded-lg transition-all ${
                displayMode === 'showcase'
                  ? 'bg-[#384959] text-white shadow-2xs'
                  : 'text-[#6A89A7] hover:text-[#384959]'
              }`}
            >
              🖼️ 6-Screen Showcase
            </button>
            <button
              type="button"
              onClick={() => setDisplayMode('device')}
              className={`px-3 py-1 rounded-lg transition-all ${
                displayMode === 'device'
                  ? 'bg-[#384959] text-white shadow-2xs'
                  : 'text-[#6A89A7] hover:text-[#384959]'
              }`}
            >
              📱 Interactive Device
            </button>
          </div>

          {/* Open Unified Sync Center Modal */}
          <button
            type="button"
            onClick={() => setIsSyncCenterModalOpen(true)}
            className="px-2.5 py-1 rounded-xl text-xs font-bold bg-[#384959] text-white hover:bg-[#2C3B49] flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
          >
            <Database className="w-3.5 h-3.5 text-[#88BDF2]" />
            <span>Sync Center</span>
          </button>

          {/* Highway Dead Zone Toggle */}
          <button
            type="button"
            onClick={() => {
              const next = !isDeadZoneSimulated;
              setHighwayDeadZoneSimulated(next);
              setIsDeadZoneSimulated(next);
              showToast(
                next
                  ? 'Simulated Highway Dead Zone: IndexedDB offline caching active!'
                  : 'Restored Highway Connectivity: Automatic background sync initiated.'
              );
            }}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
              isDeadZoneSimulated
                ? 'bg-rose-500 text-white border-rose-600 shadow-2xs'
                : 'bg-white text-[#384959] border-[#DCE8F2] hover:bg-[#F3F7FB]'
            }`}
          >
            {isDeadZoneSimulated ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5 text-emerald-600" />}
            <span className="text-[11px]">{isDeadZoneSimulated ? 'Dead Zone Active' : 'Simulate Offline'}</span>
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* VIEW 1: 6-SCREEN REFERENCE SHOWCASE (Matching reference bottom row)   */}
      {/* ===================================================================== */}
      {displayMode === 'showcase' && (
        <div className="p-4 sm:p-6 overflow-x-auto">
          <div className="mb-4">
            <h2 className="font-heading font-black text-lg text-[#384959]">
              Driver Portal (Mobile PWA)
            </h2>
            <p className="text-xs text-[#6A89A7]">
              Recreated 1:1 from FleetPulse TMS Showcase Reference • Stormy Morning Palette
            </p>
          </div>

          {/* Horizontal Showcase Row of all 6 phones + Enhancements card */}
          <div className="flex items-start gap-5 pb-6">
            {/* Screen 7: Driver Home */}
            {renderPhoneFrame(
              'Driver Home',
              'Screen 7 • Active Vehicle & 6 Action Tiles',
              renderScreen7Home(true)
            )}

            {/* Screen 8: Add Diesel / CNG */}
            {renderPhoneFrame(
              'Add Diesel / CNG',
              'Screen 8 • Auto Total & Receipt Upload',
              renderScreen8AddDiesel(true)
            )}

            {/* Screen 9: Start Trip */}
            {renderPhoneFrame(
              'Start Trip',
              'Screen 9 • Vehicle Banner & ODO Start',
              renderScreen9StartTrip(true)
            )}

            {/* Screen 10: Offline Mode */}
            {renderPhoneFrame(
              'Offline Mode',
              'Screen 10 • Local Caching & Sync Queue',
              renderScreen10Offline(true)
            )}

            {/* Screen 11: Synchronizing... */}
            {renderPhoneFrame(
              'Synchronizing...',
              'Screen 11 • 75% Progress Checklist',
              renderScreen11Syncing(true)
            )}

            {/* Screen 12: All Records Synced! */}
            {renderPhoneFrame(
              'All Records Synced!',
              'Screen 12 • Synchronization Success',
              renderScreen12SyncSuccess(true)
            )}

            {/* Screen 10b: Sync Failed State */}
            {renderPhoneFrame(
              'Sync Failed',
              'Screen 10b • Error Handled & Zero Data Loss',
              renderScreenSyncFailed(true)
            )}

            {/* Card 13: Key UI Enhancements */}
            <div className="flex flex-col items-center shrink-0">
              <div className="mb-2 text-center">
                <span className="text-xs font-heading font-extrabold text-[#384959]">Key Features</span>
                <span className="block text-[10px] text-[#6A89A7] font-medium">Showcase Highlights</span>
              </div>
              <div className="h-[580px] flex">
                {renderScreen13EnhancementsCard()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* VIEW 2: INTERACTIVE SINGLE DEVICE VIEW (Real smartphone simulation)   */}
      {/* ===================================================================== */}
      {displayMode === 'device' && (
        <div className="p-4 sm:p-6 flex-1 flex flex-col items-center justify-center">
          {/* Direct Screen Navigation Jump Bar */}
          <div className="mb-4 bg-white p-1 rounded-2xl border border-[#DCE8F2] shadow-2xs flex items-center gap-1 text-[11px] font-bold max-w-xl overflow-x-auto no-scrollbar">
            {[
              { id: 'screen7_home', label: '7. Home' },
              { id: 'screen8_fuel', label: '8. Add Diesel' },
              { id: 'screen9_trip', label: '9. Start Trip' },
              { id: 'screen10_offline', label: '10. Offline' },
              { id: 'screen11_syncing', label: '11. Syncing' },
              { id: 'screen12_synced', label: '12. Synced' },
              { id: 'screen_failed', label: '13. Sync Failed' },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveScreen(s.id as ScreenId)}
                className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                  activeScreen === s.id
                    ? 'bg-[#384959] text-white shadow-2xs'
                    : 'text-[#6A89A7] hover:text-[#384959] hover:bg-[#F3F7FB]'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Interactive Phone Frame */}
          <div className="w-[320px] sm:w-[350px] h-[640px] rounded-[40px] border-[8px] border-[#2C3B49]/20 bg-white shadow-2xl overflow-hidden flex flex-col relative">
            {activeScreen === 'screen7_home' && renderScreen7Home(true)}
            {activeScreen === 'screen8_fuel' && renderScreen8AddDiesel(true, () => setActiveScreen('screen7_home'))}
            {activeScreen === 'screen9_trip' && renderScreen9StartTrip(true, () => setActiveScreen('screen7_home'))}
            {activeScreen === 'screen10_offline' && renderScreen10Offline(true)}
            {activeScreen === 'screen11_syncing' && renderScreen11Syncing(true)}
            {activeScreen === 'screen12_synced' && renderScreen12SyncSuccess(true)}
            {activeScreen === 'screen_failed' && renderScreenSyncFailed(true)}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TOAST POPUP NOTIFICATION                                              */}
      {/* ===================================================================== */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#384959] text-white px-4 py-2.5 rounded-xl shadow-2xl border border-[#88BDF2] text-xs font-semibold flex items-center gap-2 max-w-sm text-center animate-in fade-in slide-in-from-bottom-2">
          <Sparkles className="w-4 h-4 text-[#88BDF2] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: SELECT VEHICLE (Multi-vehicle assignment switcher)              */}
      {/* ===================================================================== */}
      <ModalPortal isOpen={isSelectVehicleModalOpen} onClose={() => setIsSelectVehicleModalOpen(false)}>
        <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-[#DCE8F2] space-y-3 my-auto">
          <div className="flex items-center justify-between pb-2 border-b border-[#DCE8F2]">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#384959]" />
              <h3 className="font-heading font-extrabold text-sm text-[#384959]">
                Select Assigned Vehicle
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setIsSelectVehicleModalOpen(false)}
              className="p-1 rounded-lg text-[#6A89A7] hover:text-[#384959] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#6A89A7] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search vehicle number or model..."
              value={vehicleSearchQuery}
              onChange={(e) => setVehicleSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#F3F7FB] border border-[#DCE8F2] rounded-xl text-xs text-[#384959] focus:outline-none focus:border-[#88BDF2]"
            />
          </div>

          {/* Vehicle Radio List */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {filteredVehicles.map((veh: Vehicle) => {
              const isSelected = currentVehicle?.id === veh.id;
              return (
                <div
                  key={veh.id}
                  onClick={() => {
                    setActiveDriverVehicleId(veh.id);
                    setIsSelectVehicleModalOpen(false);
                    showToast(`Active vehicle switched to ${veh.number}`);
                  }}
                  className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                    isSelected
                      ? 'border-[#88BDF2] bg-[#F3F7FB] ring-2 ring-[#88BDF2]/30'
                      : 'border-[#DCE8F2] hover:bg-[#F3F7FB]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-white border border-[#DCE8F2] flex items-center justify-center shrink-0">
                      <Truck className="w-5 h-5 text-[#384959]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-extrabold text-[#384959]">{veh.number}</span>
                        {isSelected && (
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-full">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-[#6A89A7]">
                        {veh.model} • {veh.capacityKg?.toLocaleString()} KG
                      </p>
                    </div>
                  </div>

                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? 'border-[#384959] bg-[#384959]' : 'border-[#6A89A7]'
                    }`}
                  >
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </ModalPortal>

      {/* ===================================================================== */}
      {/* MODAL: ADD SERVICE / REPAIR (Activity-based maintenance entry)        */}
      {/* ===================================================================== */}
      <ModalPortal isOpen={isAddServiceModalOpen} onClose={() => setIsAddServiceModalOpen(false)}>
        <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-[#DCE8F2] space-y-3 max-h-[90vh] overflow-y-auto my-auto">
          <div className="flex items-center justify-between pb-2 border-b border-[#DCE8F2]">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-[#384959]" />
              <h3 className="font-heading font-extrabold text-sm text-[#384959]">
                Add Service / Repair
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setIsAddServiceModalOpen(false)}
              className="p-1 rounded-lg text-[#6A89A7] hover:text-[#384959] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

            <form onSubmit={handleSubmitService} className="space-y-3 pt-1">
              {/* Vehicle Badge */}
              <div className="p-2.5 bg-[#F3F7FB] rounded-xl border border-[#DCE8F2] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#384959]" />
                  <span className="font-bold text-[#384959]">{currentVehicle?.number}</span>
                </div>
                <span className="text-[10px] text-[#6A89A7]">ODO: {currentVerifiedOdo.toLocaleString()} KM</span>
              </div>

              {/* Service Type */}
              <div>
                <label className="block text-[11px] font-bold text-[#384959] mb-1">Activity Type</label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value as ServiceActivityType)}
                  className="w-full px-3 py-2 bg-[#F3F7FB] border border-[#DCE8F2] rounded-xl text-xs font-bold text-[#384959]"
                >
                  <option value="General Servicing">General Servicing</option>
                  <option value="Engine Oil">Engine Oil</option>
                  <option value="Oil Filter">Oil Filter</option>
                  <option value="Air Filter">Air Filter</option>
                  <option value="Tyre Replacement">Tyre Replacement</option>
                  <option value="Tyre Repair">Tyre Repair</option>
                  <option value="Brake Repair">Brake Repair</option>
                  <option value="Clutch Repair">Clutch Repair</option>
                  <option value="Battery">Battery</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Other Repairs">Other Repairs</option>
                </select>
              </div>

              {/* Workshop */}
              <div>
                <label className="block text-[11px] font-bold text-[#384959] mb-1">Workshop / Garage</label>
                <input
                  type="text"
                  required
                  value={serviceWorkshop}
                  onChange={(e) => setServiceWorkshop(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F3F7FB] border border-[#DCE8F2] rounded-xl text-xs font-semibold text-[#384959]"
                />
              </div>

              {/* Expense Amount */}
              <div>
                <label className="block text-[11px] font-bold text-[#384959] mb-1">Expense Amount (₹)</label>
                <input
                  type="number"
                  required
                  value={serviceAmount}
                  onChange={(e) => setServiceAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F3F7FB] border border-[#DCE8F2] rounded-xl text-xs font-bold text-[#384959]"
                />
              </div>

              {/* Work Details */}
              <div>
                <label className="block text-[11px] font-bold text-[#384959] mb-1">Work Details</label>
                <textarea
                  rows={2}
                  value={serviceWorkDetails}
                  onChange={(e) => setServiceWorkDetails(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#F3F7FB] border border-[#DCE8F2] rounded-xl text-xs text-[#384959]"
                />
              </div>

              {/* Invoice Photo */}
              <div>
                <label className="block text-[11px] font-bold text-[#384959] mb-1">Receipt / Invoice Photo</label>
                <label className="cursor-pointer py-2 px-3 bg-[#F3F7FB] border border-dashed border-[#88BDF2] rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold text-[#384959]">
                  <Camera className="w-4 h-4 text-[#0284c7]" />
                  <span>{serviceInvoicePhoto ? 'Invoice Attached' : 'Add Photo'}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleServiceInvoiceUpload} />
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition-all mt-2 cursor-pointer"
              >
                Submit Service
              </button>
            </form>
          </div>
        </ModalPortal>

      {/* ===================================================================== */}
      {/* MODAL: REPORT ISSUE / DISPUTE ODO                                     */}
      {/* ===================================================================== */}
      <ModalPortal isOpen={isReportIssueModalOpen} onClose={() => setIsReportIssueModalOpen(false)}>
        <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-[#DCE8F2] space-y-3 my-auto">
          <div className="flex items-center justify-between pb-2 border-b border-[#DCE8F2]">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h3 className="font-heading font-extrabold text-sm text-[#384959]">
                Report Vehicle Issue / ODO Dispute
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setIsReportIssueModalOpen(false)}
              className="p-1 rounded-lg text-[#6A89A7] hover:text-[#384959] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setIsReportIssueModalOpen(false);
              showToast('Vehicle issue logged with Fleet Dispatcher for review.');
            }}
            className="space-y-3"
          >
            <div>
              <label className="block text-[11px] font-bold text-[#384959] mb-1">Issue Category</label>
              <select className="w-full px-3 py-2 bg-[#F3F7FB] border border-[#DCE8F2] rounded-xl text-xs font-bold text-[#384959]">
                <option>Incorrect Odometer Displayed</option>
                <option>Engine / Mechanical Breakdown</option>
                <option>Tyre Puncture / Burst</option>
                <option>Fuel Leakage / Sensor Issue</option>
                <option>FASTag / Toll Plaza Error</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#384959] mb-1">Description</label>
              <textarea
                rows={3}
                required
                placeholder="Describe the issue or provide correct odometer value..."
                className="w-full px-3 py-2 bg-[#F3F7FB] border border-[#DCE8F2] rounded-xl text-xs text-[#384959]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-[#384959] text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 text-[#88BDF2]" />
              <span>Submit Report</span>
            </button>
          </form>
        </div>
      </ModalPortal>

      {/* Universal Sync Center Modal */}
      <SyncCenterModal
        isOpen={isSyncCenterModalOpen}
        onClose={() => setIsSyncCenterModalOpen(false)}
      />
    </div>
  );
};
