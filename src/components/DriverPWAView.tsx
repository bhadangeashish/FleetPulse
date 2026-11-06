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
  FileCheck,
  Battery,
  Send,
  Sparkles,
  LogOut,
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
    if (!activeDriver) return vehicles.slice(0, 3);
    const assigned = vehicles.filter(
      (v) =>
        activeDriver.assignedVehicleIds?.includes(v.id) ||
        v.id === activeDriver.assignedVehicleId ||
        v.assignedDriverId === activeDriver.id
    );
    return assigned.length > 0 ? assigned : vehicles.slice(0, 3);
  }, [vehicles, activeDriver]);

  // Driver Navigation Tabs (9 tabs total)
  type DriverNavTab =
    | 'home'
    | 'vehicles'
    | 'work'
    | 'trips'
    | 'fuel'
    | 'service'
    | 'docs'
    | 'payments'
    | 'help';

  const [activeTab, setActiveTab] = useState<DriverNavTab>('home');

  // Modals & Panels
  const [isSelectVehicleModalOpen, setIsSelectVehicleModalOpen] = useState(false);
  const [isAddRefuelModalOpen, setIsAddRefuelModalOpen] = useState(false);
  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);
  const [isTripWorkModalOpen, setIsTripWorkModalOpen] = useState(false);
  const [isVehicleDetailsModalOpen, setIsVehicleDetailsModalOpen] = useState(false);
  const [selectedVehicleForDetails, setSelectedVehicleForDetails] = useState<Vehicle | null>(null);
  const [isSyncDrawerOpen, setIsSyncDrawerOpen] = useState(false);
  const [isReportIssueModalOpen, setIsReportIssueModalOpen] = useState(false);

  // Highway Dead Zone / Low Signal Simulation toggle for testing offline capabilities
  const [isDeadZoneSimulated, setIsDeadZoneSimulated] = useState(false);

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
    if (!currentVehicle) return 89450;
    const evts = odometerEvents.filter((e) => e.vehicleId === currentVehicle.id);
    if (evts.length === 0) return currentVehicle.currentOdometer || 89450;
    return Math.max(...evts.map((e) => e.odometerReading), currentVehicle.currentOdometer || 0);
  }, [currentVehicle, odometerEvents]);

  // Fuel intelligence for active vehicle using consecutive full-tank-to-full-tank calculation
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
  // MODAL 1: SELECT VEHICLE (Multi-vehicle assignment)
  // =========================================================================
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

  // =========================================================================
  // MODAL 2: ADD REFUEL FORM STATE
  // =========================================================================
  const [refuelFuelType, setRefuelFuelType] = useState<FuelType>('diesel');
  const [refuelOdo, setRefuelOdo] = useState<number>(currentVerifiedOdo);
  const [refuelQuantity, setRefuelQuantity] = useState<string>('50.00');
  const [refuelRate, setRefuelRate] = useState<string>('98.50');
  const [refuelFillType, setRefuelFillType] = useState<FuelFillType>('full_tank');
  const [refuelStation, setRefuelStation] = useState<string>('BPCL Highway Hub, Nashik');
  const [refuelPaymentMethod, setRefuelPaymentMethod] = useState<FuelPaymentMethod>('fuel_card');
  const [refuelReceiptPhoto, setRefuelReceiptPhoto] = useState<string | null>(
    'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&auto=format&fit=crop&q=60'
  );

  useEffect(() => {
    setRefuelOdo(currentVerifiedOdo);
  }, [currentVerifiedOdo]);

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
      fuelStation: refuelStation || 'Highway Petrol Pump',
      paymentMethod: refuelPaymentMethod,
      receiptPhotoUrl: refuelReceiptPhoto || undefined,
      notes: `Driver log via mobile PWA. Fill type: ${refuelFillType}`,
    });

    setIsAddRefuelModalOpen(false);
    showToast(
      syncState.isOnline && !isDeadZoneSimulated
        ? 'Fuel entry submitted & synchronized successfully!'
        : 'Fuel entry saved locally in IndexedDB! Will sync automatically when online.'
    );
  };

  // =========================================================================
  // MODAL 3: ADD SERVICE / MAINTENANCE FORM STATE
  // =========================================================================
  const [serviceOdo, setServiceOdo] = useState<number>(currentVerifiedOdo);
  const [serviceType, setServiceType] = useState<ServiceActivityType>('General Servicing');
  const [serviceWorkshop, setServiceWorkshop] = useState<string>('National Tyre Care, Surat');
  const [serviceAmount, setServiceAmount] = useState<string>('14800');
  const [serviceWorkDetails, setServiceWorkDetails] = useState<string>(
    'Engine oil, oil filter, air filter, general checkup'
  );
  const [serviceInvoicePhoto, setServiceInvoicePhoto] = useState<string | null>(
    'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&auto=format&fit=crop&q=60'
  );

  useEffect(() => {
    setServiceOdo(currentVerifiedOdo);
  }, [currentVerifiedOdo]);

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
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
      receiptPhotoUrl: serviceInvoicePhoto || undefined,
    });

    setIsAddServiceModalOpen(false);
    showToast(
      syncState.isOnline && !isDeadZoneSimulated
        ? 'Service record saved & synchronized!'
        : 'Service record stored offline in IndexedDB! Will auto-sync.'
    );
  };

  // =========================================================================
  // MODAL 4: TRIP WORK (START TRIP / END TRIP)
  // =========================================================================
  const [tripWorkTab, setTripWorkTab] = useState<'start' | 'end'>('start');
  const [tripStartOdo, setTripStartOdo] = useState<number>(currentVerifiedOdo);
  const [tripFrom, setTripFrom] = useState('Pune APMC Wholesale Yard');
  const [tripTo, setTripTo] = useState('Surat Ring Road Mandi');
  const [tripItemName, setTripItemName] = useState('Alphonso Mango Box');
  const [tripItemQty, setTripItemQty] = useState(150);

  const [tripEndOdo, setTripEndOdo] = useState<number>(currentVerifiedOdo + 350);
  const [tripEndRemarks, setTripEndRemarks] = useState('All 3 stops delivered safely. Stamped LR received.');
  const [tripLrPhoto, setTripLrPhoto] = useState<string | null>(null);

  const handleTripLrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setTripLrPhoto(uploadEvent.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStartTripSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentVehicle || !activeDriver) return;

    const odoNum = Number(tripStartOdo);
    if (odoNum < currentVerifiedOdo) {
      alert(`Start ODO cannot be less than last verified ODO (${currentVerifiedOdo} KM).`);
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
      totalFruitValue: tripItemQty * 45,
      destinations: [
        {
          id: `dest-${Date.now()}-1`,
          stopSequence: 1,
          placeName: tripTo,
          city: 'Surat',
          state: 'Gujarat',
          contactPerson: 'Ramesh Patel',
          mobile: '9825012345',
          items: [
            {
              id: `item-1`,
              itemName: tripItemName,
              quantity: tripItemQty,
              costPerItem: 45,
              totalAmount: tripItemQty * 45,
            },
          ],
          destinationTotalAmount: tripItemQty * 45,
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

    setIsTripWorkModalOpen(false);
    showToast(`Trip ${tripCode} started successfully!`);
  };

  const handleEndTripSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentVehicle || !activeDriver || !currentActiveTrip) return;

    const odoNum = Number(tripEndOdo);
    if (odoNum < (currentActiveTrip.startOdometer || currentVerifiedOdo)) {
      alert(`End ODO must be greater than Start ODO (${currentActiveTrip.startOdometer || currentVerifiedOdo} KM).`);
      return;
    }

    if (tripLrPhoto) {
      uploadStampedLRPhoto(currentActiveTrip.id, 'stamped_lr_delivery.jpg');
    }

    logOdometerActivity({
      vehicleId: currentVehicle.id,
      odometerReading: odoNum,
      activityType: 'trip_completion',
      activityReferenceId: currentActiveTrip.id,
      driverId: activeDriver.id,
      driverName: activeDriver.fullName,
      evidencePhotoUrl: tripLrPhoto || undefined,
      notes: tripEndRemarks,
    });

    setIsTripWorkModalOpen(false);
    showToast(`Trip ${currentActiveTrip.id} completed! ODO verified at ${odoNum.toLocaleString()} KM.`);
  };

  // =========================================================================
  // SUB-RENDER: BOTTOM NAVIGATION BAR
  // =========================================================================
  const renderBottomNav = () => {
    const navItems: { id: DriverNavTab; label: string; icon: React.ReactNode }[] = [
      { id: 'home', label: t.tabHome, icon: <Layers className="w-5 h-5" /> },
      { id: 'vehicles', label: t.tabVehicles, icon: <Truck className="w-5 h-5" /> },
      { id: 'work', label: t.tabWork, icon: <PlayCircle className="w-5 h-5" /> },
      { id: 'fuel', label: t.tabFuel, icon: <Fuel className="w-5 h-5" /> },
      { id: 'service', label: t.tabService, icon: <Wrench className="w-5 h-5" /> },
    ];

    return (
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#DCE8F2] shadow-lg max-w-md mx-auto md:max-w-2xl">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
                  isActive ? 'text-[#384959] font-bold' : 'text-[#6A89A7] hover:text-[#384959]'
                }`}
              >
                <div
                  className={`p-1 rounded-xl transition-all ${
                    isActive ? 'bg-[#BDDDFC] text-[#384959] scale-110' : 'text-[#6A89A7]'
                  }`}
                >
                  {item.icon}
                </div>
                <span className="text-[11px] mt-0.5 tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // =========================================================================
  // SUB-RENDER: TOP APP BAR & STATUS PILL
  // =========================================================================
  const isEffectivelyOnline = syncState.isOnline && !isDeadZoneSimulated;

  const renderTopAppBar = () => {
    return (
      <div className="bg-[#384959] text-white px-4 pt-3 pb-4 shadow-md sticky top-0 z-30">
        <div className="flex items-center justify-between mb-3">
          {/* Logo & App Title */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#88BDF2] flex items-center justify-center text-[#384959] shadow-sm font-black">
              <Truck className="w-5 h-5 text-[#384959]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight">{t.appName}</span>
                <span className="text-[10px] bg-[#6A89A7] text-[#F3F7FB] px-1.5 py-0.5 rounded font-medium">
                  {t.driverPortal}
                </span>
              </div>
              <p className="text-[11px] text-[#BDDDFC]">Offline-Ready Freight System</p>
            </div>
          </div>

          {/* Language Switcher, Sync Status & Exit Button */}
          <div className="flex items-center gap-2">
            {/* Language Toggle */}
            <div className="flex items-center bg-[#293642] rounded-lg p-0.5 border border-[#6A89A7]/40">
              {(['en', 'mr', 'hi'] as AppLanguage[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setAppLanguage(lang)}
                  className={`px-2 py-0.5 text-[11px] font-bold rounded ${
                    appLanguage === lang ? 'bg-[#88BDF2] text-[#384959]' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {lang === 'en' ? 'EN' : lang === 'mr' ? 'मराठी' : 'हिंदी'}
                </button>
              ))}
            </div>

            {/* Sync Status Button */}
            <button
              onClick={() => setIsSyncDrawerOpen(true)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm transition-all ${
                isEffectivelyOnline
                  ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/40'
                  : 'bg-amber-500/30 text-amber-200 border border-amber-400/50 animate-pulse'
              }`}
            >
              {isEffectivelyOnline ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-300" />
                  <span className="text-[11px]">
                    {syncState.pendingCount > 0 ? `${syncState.pendingCount} Queued` : 'Online'}
                  </span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-300" />
                  <span className="text-[11px]">
                    {syncState.pendingCount > 0 ? `${syncState.pendingCount} Offline` : 'Offline'}
                  </span>
                </>
              )}
            </button>

            {/* Exit / Sign Out Button */}
            <button
              onClick={() => {
                if (role === 'driver') {
                  logout();
                } else {
                  setGlobalActiveTab('dashboard');
                }
              }}
              title={role === 'driver' ? 'Sign Out of Driver App' : 'Return to Admin Dashboard'}
              className="flex items-center gap-1 px-2.5 py-1 bg-[#6A89A7]/50 hover:bg-[#6A89A7] text-white rounded-lg text-xs font-bold border border-white/20 transition-colors cursor-pointer"
            >
              <LogOut className="w-3 h-3 text-[#BDDDFC]" />
              <span>{role === 'driver' ? 'Sign Out' : 'Exit'}</span>
            </button>
          </div>
        </div>

        {/* Greeting & Shift Bar */}
        <div className="bg-[#2C3B49] rounded-xl p-3 border border-[#6A89A7]/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#BDDDFC] text-[#384959] flex items-center justify-center font-black text-sm">
              {activeDriver ? activeDriver.fullName.charAt(0) : 'D'}
            </div>
            <div>
              <div className="text-sm font-semibold flex items-center gap-1.5 text-white">
                <span>{greeting},</span>
                <span className="text-[#88BDF2]">{activeDriver?.fullName || 'Sukhwinder Singh'}</span>
                <span>👋</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-[#BDDDFC]">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[#88BDF2]" />
                  {currentDateTime.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
                <span>•</span>
                <span className="text-emerald-300 font-medium">Full Day Shift</span>
              </div>
            </div>
          </div>

          {/* Test Highway Dead Zone Mode Toggle */}
          <button
            onClick={() => {
              setIsDeadZoneSimulated(!isDeadZoneSimulated);
              showToast(
                !isDeadZoneSimulated
                  ? 'Simulated Highway Dead Zone: IndexedDB offline caching active!'
                  : 'Restored Highway Connectivity: Automatic background sync initiated.'
              );
            }}
            title="Simulate Highway Dead Zone / Low Signal to test offline capability"
            className={`p-2 rounded-lg text-xs font-semibold flex flex-col items-center transition-all ${
              isDeadZoneSimulated
                ? 'bg-amber-500 text-white shadow-md'
                : 'bg-[#384959] text-slate-300 border border-[#6A89A7]/40 hover:text-white'
            }`}
          >
            {isDeadZoneSimulated ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
            <span className="text-[9px] mt-0.5">{isDeadZoneSimulated ? 'Dead Zone' : 'Sim Signal'}</span>
          </button>
        </div>
      </div>
    );
  };

  // =========================================================================
  // SUB-RENDER: ACTIVE VEHICLE CARD (Matching reference image)
  // =========================================================================
  const renderActiveVehicleCard = () => {
    if (!currentVehicle) return null;

    return (
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#DCE8F2] mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-[#F3F7FB] border border-[#DCE8F2] flex items-center justify-center p-1 overflow-hidden flex-shrink-0">
              <Truck className="w-8 h-8 text-[#384959]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold text-[#384959] tracking-tight">
                  {currentVehicle.number}
                </span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                  Active
                </span>
              </div>
              <p className="text-xs text-[#6A89A7] font-medium">
                {currentVehicle.model} • {currentVehicle.type} • {currentVehicle.capacityKg?.toLocaleString()} KG
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[11px] font-semibold text-[#384959]">
                  {t.lastVerifiedOdo}:{' '}
                  <span className="text-[#384959] font-bold">{currentVerifiedOdo.toLocaleString()} KM</span>
                </span>
              </div>
            </div>
          </div>

          {/* Switch Vehicle Button */}
          <button
            onClick={() => setIsSelectVehicleModalOpen(true)}
            className="flex items-center gap-1 px-3 py-2 bg-[#F3F7FB] hover:bg-[#BDDDFC]/40 text-[#384959] rounded-xl text-xs font-bold border border-[#DCE8F2] transition-colors"
          >
            <span>Switch</span>
            <ChevronDown className="w-4 h-4 text-[#6A89A7]" />
          </button>
        </div>
      </div>
    );
  };

  // =========================================================================
  // SUB-RENDER: 4 BIG ACTION TILES (Reference UI layout)
  // =========================================================================
  const renderFourBigActionTiles = () => {
    return (
      <div className="grid grid-cols-2 gap-3 mb-5">
        {/* Tile 1: Refuel */}
        <button
          onClick={() => {
            setRefuelOdo(currentVerifiedOdo);
            setIsAddRefuelModalOpen(true);
          }}
          className="bg-white p-4 rounded-2xl border border-[#DCE8F2] shadow-sm hover:shadow-md hover:border-[#88BDF2] flex flex-col items-center justify-center gap-2 transition-all active:scale-95 group text-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-[#F3F7FB] text-[#384959] flex items-center justify-center border border-[#DCE8F2] group-hover:bg-[#BDDDFC] group-hover:text-[#384959] transition-colors">
            <Fuel className="w-7 h-7 text-[#6A89A7] group-hover:text-[#384959]" />
          </div>
          <div>
            <span className="block text-sm font-extrabold text-[#384959]">{t.refuelAction}</span>
            <span className="block text-[11px] text-[#6A89A7] font-medium">(Diesel / CNG)</span>
          </div>
        </button>

        {/* Tile 2: Service / Maintenance */}
        <button
          onClick={() => {
            setServiceOdo(currentVerifiedOdo);
            setServiceType('General Servicing');
            setIsAddServiceModalOpen(true);
          }}
          className="bg-white p-4 rounded-2xl border border-[#DCE8F2] shadow-sm hover:shadow-md hover:border-[#88BDF2] flex flex-col items-center justify-center gap-2 transition-all active:scale-95 group text-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-[#F3F7FB] text-[#384959] flex items-center justify-center border border-[#DCE8F2] group-hover:bg-[#BDDDFC] group-hover:text-[#384959] transition-colors">
            <Wrench className="w-7 h-7 text-[#6A89A7] group-hover:text-[#384959]" />
          </div>
          <div>
            <span className="block text-sm font-extrabold text-[#384959]">{t.serviceAction}</span>
            <span className="block text-[11px] text-[#6A89A7] font-medium">Routine Servicing</span>
          </div>
        </button>

        {/* Tile 3: Repair / Breakdown */}
        <button
          onClick={() => {
            setServiceOdo(currentVerifiedOdo);
            setServiceType('Other Repairs');
            setIsAddServiceModalOpen(true);
          }}
          className="bg-white p-4 rounded-2xl border border-[#DCE8F2] shadow-sm hover:shadow-md hover:border-[#88BDF2] flex flex-col items-center justify-center gap-2 transition-all active:scale-95 group text-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-[#F3F7FB] text-[#384959] flex items-center justify-center border border-[#DCE8F2] group-hover:bg-amber-100 group-hover:text-amber-800 transition-colors">
            <AlertTriangle className="w-7 h-7 text-amber-600" />
          </div>
          <div>
            <span className="block text-sm font-extrabold text-[#384959]">{t.repairAction}</span>
            <span className="block text-[11px] text-[#6A89A7] font-medium">Breakdown / Tyre</span>
          </div>
        </button>

        {/* Tile 4: Trip Work (Start / End) */}
        <button
          onClick={() => {
            setTripStartOdo(currentVerifiedOdo);
            setIsTripWorkModalOpen(true);
          }}
          className="bg-white p-4 rounded-2xl border border-[#DCE8F2] shadow-sm hover:shadow-md hover:border-[#88BDF2] flex flex-col items-center justify-center gap-2 transition-all active:scale-95 group text-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-[#F3F7FB] text-[#384959] flex items-center justify-center border border-[#DCE8F2] group-hover:bg-[#BDDDFC] group-hover:text-[#384959] transition-colors">
            <PlayCircle className="w-7 h-7 text-[#6A89A7] group-hover:text-[#384959]" />
          </div>
          <div>
            <span className="block text-sm font-extrabold text-[#384959]">{t.tripWorkAction}</span>
            <span className="block text-[11px] text-[#6A89A7] font-medium">(Start / End)</span>
          </div>
        </button>
      </div>
    );
  };

  // =========================================================================
  // SUB-RENDER: VEHICLE PERFORMANCE CARD (View Only - from screenshot)
  // =========================================================================
  const renderVehiclePerformanceCard = () => {
    const avgKmplDisplay =
      dieselStats && dieselStats.latestAverage > 0
        ? dieselStats.latestAverage.toFixed(1)
        : currentVehicle.dieselAverage
        ? currentVehicle.dieselAverage.toFixed(1)
        : '10.2';

    const totalFuelDisplay =
      dieselStats && dieselStats.totalFuelQuantity > 0
        ? `${Math.round(dieselStats.totalFuelQuantity)} L`
        : '480 L';

    const totalDistanceDisplay =
      dieselStats && dieselStats.totalDistanceRun > 0
        ? `${dieselStats.totalDistanceRun.toLocaleString()} KM`
        : '4,896 KM';

    const totalSpendDisplay =
      dieselStats && dieselStats.totalExpenditure > 0
        ? `₹${dieselStats.totalExpenditure.toLocaleString()}`
        : '₹47,280';

    return (
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#DCE8F2] mb-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-extrabold text-[#384959]">Vehicle Performance</span>
            <span className="text-[10px] bg-[#F3F7FB] text-[#6A89A7] px-2 py-0.5 rounded font-semibold border border-[#DCE8F2]">
              {t.viewOnly}
            </span>
          </div>
          <div className="flex gap-1 bg-[#F3F7FB] p-1 rounded-lg border border-[#DCE8F2]">
            <button className="px-2 py-0.5 text-[11px] font-bold bg-[#88BDF2] text-[#384959] rounded">
              This Month
            </button>
            <button className="px-2 py-0.5 text-[11px] font-semibold text-[#6A89A7]">Last Month</button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Stat 1: Fuel Average */}
          <div className="bg-[#F3F7FB] p-3 rounded-xl border border-[#DCE8F2] flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
              <Fuel className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-[11px] text-[#6A89A7] font-semibold">{t.fuelAverage}</span>
              <span className="block text-base font-extrabold text-emerald-800">{avgKmplDisplay} KM/L</span>
            </div>
          </div>

          {/* Stat 2: Total Fuel */}
          <div className="bg-[#F3F7FB] p-3 rounded-xl border border-[#DCE8F2] flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#BDDDFC] text-[#384959] flex items-center justify-center flex-shrink-0">
              <Battery className="w-5 h-5 text-[#384959]" />
            </div>
            <div>
              <span className="block text-[11px] text-[#6A89A7] font-semibold">{t.totalFuel}</span>
              <span className="block text-base font-extrabold text-[#384959]">{totalFuelDisplay}</span>
            </div>
          </div>

          {/* Stat 3: Total Distance */}
          <div className="bg-[#F3F7FB] p-3 rounded-xl border border-[#DCE8F2] flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-[11px] text-[#6A89A7] font-semibold">{t.totalDistance}</span>
              <span className="block text-base font-extrabold text-[#384959]">{totalDistanceDisplay}</span>
            </div>
          </div>

          {/* Stat 4: Fuel Cost */}
          <div className="bg-[#F3F7FB] p-3 rounded-xl border border-[#DCE8F2] flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-[11px] text-[#6A89A7] font-semibold">{t.fuelCost}</span>
              <span className="block text-base font-extrabold text-[#384959]">{totalSpendDisplay}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // =========================================================================
  // SUB-RENDER: RECENT ACTIVITY FEED (History from screenshot)
  // =========================================================================
  const renderRecentActivityFeed = () => {
    return (
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#DCE8F2] mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-extrabold text-[#384959]">My Activity (History)</span>
          <button
            onClick={() => setActiveTab('trips')}
            className="text-xs font-bold text-[#6A89A7] hover:text-[#384959] flex items-center gap-0.5"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2.5">
          {/* Activity 1: Diesel Added */}
          <div className="p-3 bg-[#F3F7FB] rounded-xl border border-[#DCE8F2] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <Fuel className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#384959]">Diesel Added</p>
                <p className="text-[11px] text-[#6A89A7]">50.00 L • ₹4,925</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-semibold text-[#384959]">03 Nov 2026</p>
              <p className="text-[10px] text-[#6A89A7]">ODO: 89,780 KM</p>
            </div>
          </div>

          {/* Activity 2: Servicing */}
          <div className="p-3 bg-[#F3F7FB] rounded-xl border border-[#DCE8F2] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#BDDDFC] text-[#384959] flex items-center justify-center">
                <Wrench className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#384959]">Servicing</p>
                <p className="text-[11px] text-[#6A89A7]">General Servicing</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-semibold text-[#384959]">28 Oct 2026</p>
              <p className="text-[10px] text-[#6A89A7]">ODO: 88,900 KM</p>
            </div>
          </div>

          {/* Activity 3: Trip Completed */}
          <div className="p-3 bg-[#F3F7FB] rounded-xl border border-[#DCE8F2] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#384959]">Trip Completed</p>
                <p className="text-[11px] text-[#6A89A7]">Vapi → Surat</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-semibold text-[#384959]">25 Oct 2026</p>
              <p className="text-[10px] text-[#6A89A7]">ODO: 88,450 KM</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // =========================================================================
  // SUB-RENDER: TAB 2 - MY VEHICLES (ROSTER & SPEC CARDS)
  // =========================================================================
  const renderMyVehiclesTab = () => {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-[#384959]">{t.tabVehicles}</h2>
            <p className="text-xs text-[#6A89A7]">Vehicles assigned to you by Fleet Manager</p>
          </div>
          <span className="text-xs font-bold px-2 py-1 bg-[#BDDDFC] text-[#384959] rounded-lg">
            {assignedVehiclesList.length} Assigned
          </span>
        </div>

        <div className="space-y-3">
          {assignedVehiclesList.map((veh: Vehicle) => {
            const isCurrent = currentVehicle?.id === veh.id;
            return (
              <div
                key={veh.id}
                className={`bg-white rounded-2xl p-4 border transition-all ${
                  isCurrent ? 'border-[#88BDF2] shadow-md ring-2 ring-[#88BDF2]/20' : 'border-[#DCE8F2] shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[#F3F7FB] border border-[#DCE8F2] flex items-center justify-center">
                      <Truck className="w-6 h-6 text-[#384959]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-[#384959]">{veh.number}</span>
                        {isCurrent && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                            Selected
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#6A89A7]">
                        {veh.model} • {veh.type} • {veh.capacityKg?.toLocaleString()} KG
                      </p>
                      <p className="text-xs font-semibold text-[#384959] mt-0.5">
                        {t.lastVerifiedOdo}: {veh.currentOdometer?.toLocaleString()} KM
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 items-end">
                    <button
                      onClick={() => {
                        setSelectedVehicleForDetails(veh);
                        setIsVehicleDetailsModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-[#F3F7FB] hover:bg-[#BDDDFC]/50 text-[#384959] text-xs font-bold rounded-lg border border-[#DCE8F2] flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Details</span>
                    </button>
                    {!isCurrent && (
                      <button
                        onClick={() => {
                          setActiveDriverVehicleId(veh.id);
                          showToast(`Active vehicle switched to ${veh.number}`);
                        }}
                        className="px-3 py-1.5 bg-[#88BDF2] text-[#384959] text-xs font-bold rounded-lg hover:bg-[#6A89A7] hover:text-white transition-colors"
                      >
                        Set Active
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // =========================================================================
  // SUB-RENDER: TAB 3 - TODAY'S WORK (STOPS CHECKLIST & TRIP RUNNER)
  // =========================================================================
  const renderWorkTab = () => {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-[#384959]">{t.tabWork}</h2>
            <p className="text-xs text-[#6A89A7]">Active dispatch stops and LR sign-off</p>
          </div>
          <button
            onClick={() => {
              setTripStartOdo(currentVerifiedOdo);
              setIsTripWorkModalOpen(true);
            }}
            className="px-3 py-1.5 bg-[#384959] text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm"
          >
            <PlayCircle className="w-4 h-4 text-[#88BDF2]" />
            <span>Trip Actions</span>
          </button>
        </div>

        {currentActiveTrip ? (
          <div className="bg-white rounded-2xl p-4 border border-[#DCE8F2] shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#DCE8F2] pb-3">
              <div>
                <span className="text-xs font-bold text-[#6A89A7]">Active Outbound Trip</span>
                <p className="text-base font-extrabold text-[#384959]">{currentActiveTrip.id}</p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                In Transit (MH → GJ)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-[#F3F7FB] p-2.5 rounded-xl border border-[#DCE8F2]">
                <span className="text-[#6A89A7] font-semibold block text-[10px]">ORIGIN</span>
                <span className="font-bold text-[#384959]">{currentActiveTrip.startingLocation}</span>
              </div>
              <div className="bg-[#F3F7FB] p-2.5 rounded-xl border border-[#DCE8F2]">
                <span className="text-[#6A89A7] font-semibold block text-[10px]">START ODO</span>
                <span className="font-bold text-[#384959]">
                  {(currentActiveTrip.startOdometer || currentVerifiedOdo).toLocaleString()} KM
                </span>
              </div>
            </div>

            {/* Delivery Stops Checklist */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold text-[#384959]">Delivery Stops Checklist</span>
                <span className="text-[11px] text-[#6A89A7] font-semibold">
                  {currentActiveTrip.destinations.filter((d: TripDestination) => d.deliveryStatus === 'delivered').length}/
                  {currentActiveTrip.destinations.length} Completed
                </span>
              </div>

              <div className="space-y-2">
                {currentActiveTrip.destinations.map((dest: TripDestination, idx: number) => {
                  const isDelivered = dest.deliveryStatus === 'delivered';
                  return (
                    <div
                      key={dest.id || idx}
                      className={`p-3 rounded-xl border transition-all ${
                        isDelivered
                          ? 'bg-emerald-50/70 border-emerald-200'
                          : 'bg-[#F3F7FB] border-[#DCE8F2] hover:border-[#88BDF2]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                              isDelivered ? 'bg-emerald-500 text-white' : 'bg-[#384959] text-white'
                            }`}
                          >
                            {isDelivered ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-[#384959]">{dest.placeName}</p>
                            <p className="text-[11px] text-[#6A89A7]">{dest.city}, Gujarat</p>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            const updated = currentActiveTrip.destinations.map((d: TripDestination) =>
                              d.id === dest.id
                                ? {
                                    ...d,
                                    deliveryStatus: (isDelivered ? 'pending' : 'delivered') as 'pending' | 'delivered',
                                  }
                                : d
                            );
                            updateTripDestinations(currentActiveTrip.id, updated);
                            showToast(
                              isDelivered
                                ? `Marked ${dest.placeName} as pending`
                                : `Marked ${dest.placeName} as delivered!`
                            );
                          }}
                          className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors ${
                            isDelivered
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : 'bg-white text-[#384959] border-[#DCE8F2] hover:bg-[#BDDDFC]'
                          }`}
                        >
                          {isDelivered ? 'Delivered' : 'Mark Delivered'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Stamped LR Section */}
            <div className="p-3 bg-[#F3F7FB] rounded-xl border border-[#DCE8F2] flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#384959]">Stamped LR / Delivery Proof</p>
                <p className="text-[11px] text-[#6A89A7]">
                  {currentActiveTrip.returnLoad?.hasStampedLR
                    ? 'LR Document Attached'
                    : 'Photo proof required before completion'}
                </p>
              </div>

              <label className="cursor-pointer px-3 py-1.5 bg-[#88BDF2] hover:bg-[#6A89A7] text-[#384959] hover:text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors">
                <Camera className="w-3.5 h-3.5" />
                <span>{currentActiveTrip.returnLoad?.hasStampedLR ? 'Change LR' : 'Capture LR'}</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      uploadStampedLRPhoto(currentActiveTrip.id, e.target.files[0].name);
                      showToast('Stamped LR uploaded to Trip dossier!');
                    }
                  }}
                />
              </label>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 text-center border border-[#DCE8F2] shadow-sm">
            <Truck className="w-12 h-12 text-[#6A89A7] mx-auto mb-2 opacity-50" />
            <h3 className="font-bold text-[#384959]">No Active Trip Dispatched</h3>
            <p className="text-xs text-[#6A89A7] mt-1 max-w-xs mx-auto">
              You can start a new journey or backhaul load anytime using the Trip Actions button.
            </p>
          </div>
        )}
      </div>
    );
  };

  // =========================================================================
  // SUB-RENDER: TAB 4 - FUEL & EXPENSES
  // =========================================================================
  const renderFuelTab = () => {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-[#384959]">{t.tabFuel}</h2>
            <p className="text-xs text-[#6A89A7]">Refuel logs and mileage consumption</p>
          </div>
          <button
            onClick={() => {
              setRefuelOdo(currentVerifiedOdo);
              setIsAddRefuelModalOpen(true);
            }}
            className="px-3.5 py-1.5 bg-[#384959] text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm"
          >
            <Plus className="w-4 h-4 text-[#88BDF2]" />
            <span>Add Refuel</span>
          </button>
        </div>

        {/* Mileage Intelligence Summary Card */}
        <div className="bg-gradient-to-br from-[#384959] to-[#2C3B49] text-white p-4 rounded-2xl shadow-md border border-[#6A89A7]/30">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[#BDDDFC]">Current Vehicle Efficiency</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#88BDF2] text-[#384959]">
              {currentVehicle?.number}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#1F2A33]/70 p-3 rounded-xl border border-[#6A89A7]/30">
              <span className="text-[10px] text-slate-300 block">DIESEL AVERAGE (KM/L)</span>
              <span className="text-xl font-black text-emerald-400">
                {dieselStats && dieselStats.latestAverage > 0
                  ? `${dieselStats.latestAverage.toFixed(1)} KM/L`
                  : currentVehicle.dieselAverage
                  ? `${currentVehicle.dieselAverage.toFixed(1)} KM/L`
                  : '10.2 KM/L'}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Consecutive Full Tank Cycle</span>
            </div>

            <div className="bg-[#1F2A33]/70 p-3 rounded-xl border border-[#6A89A7]/30">
              <span className="text-[10px] text-slate-300 block">TOTAL EXPENSE</span>
              <span className="text-xl font-black text-[#88BDF2]">
                ₹{(dieselStats?.totalExpenditure || 47280).toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Across logged fills</span>
            </div>
          </div>
        </div>

        {/* Refuel Records List */}
        <div className="space-y-3">
          <span className="text-xs font-extrabold text-[#384959] block">Refuel History Log</span>

          {vehicleFuelRecords.length > 0 ? (
            vehicleFuelRecords.map((rec) => (
              <div key={rec.id} className="bg-white rounded-xl p-3.5 border border-[#DCE8F2] shadow-sm">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase px-2 py-0.5 bg-[#BDDDFC] text-[#384959] rounded">
                      {rec.fuelType}
                    </span>
                    <span className="text-xs font-bold text-[#384959]">
                      {rec.fuelQuantity} {rec.unit.toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-extrabold text-[#384959]">₹{rec.totalAmount.toLocaleString()}</span>
                </div>

                <div className="flex items-center justify-between text-xs text-[#6A89A7]">
                  <span>{rec.fuelStation}</span>
                  <span className="font-semibold text-[#384959]">ODO: {rec.odometerReading.toLocaleString()} KM</span>
                </div>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#DCE8F2] text-[11px]">
                  <span className="text-slate-400">{rec.recordedAt.split('T')[0]}</span>
                  <span
                    className={`font-semibold ${
                      rec.fillType === 'full_tank' ? 'text-emerald-700' : 'text-blue-700'
                    }`}
                  >
                    {rec.fillType === 'full_tank' ? 'Full Tank Fill' : 'Partial Fill'}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white p-6 rounded-xl text-center text-xs text-[#6A89A7] border border-[#DCE8F2]">
              No refuel entries logged yet for this vehicle.
            </div>
          )}
        </div>
      </div>
    );
  };

  // =========================================================================
  // SUB-RENDER: TAB 5 - SERVICE & REPAIR
  // =========================================================================
  const renderServiceTab = () => {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-[#384959]">{t.tabService}</h2>
            <p className="text-xs text-[#6A89A7]">12 Maintenance & repair categories</p>
          </div>
          <button
            onClick={() => {
              setServiceOdo(currentVerifiedOdo);
              setIsAddServiceModalOpen(true);
            }}
            className="px-3.5 py-1.5 bg-[#384959] text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm"
          >
            <Plus className="w-4 h-4 text-[#88BDF2]" />
            <span>Add Service</span>
          </button>
        </div>

        <div className="space-y-3">
          {vehicleServiceRecords.length > 0 ? (
            vehicleServiceRecords.map((svc) => (
              <div key={svc.id} className="bg-white rounded-xl p-3.5 border border-[#DCE8F2] shadow-sm">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-[#384959] capitalize">{svc.activityType}</span>
                  <span className="text-sm font-extrabold text-[#384959]">₹{svc.expenseAmount.toLocaleString()}</span>
                </div>

                <p className="text-xs text-[#6A89A7] mb-1">{svc.workshopName}</p>
                <p className="text-[11px] text-slate-600 bg-[#F3F7FB] p-2 rounded-lg border border-[#DCE8F2]">
                  {svc.workDescription}
                </p>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#DCE8F2] text-[11px]">
                  <span className="text-slate-400">{svc.date}</span>
                  <span className="font-semibold text-[#384959]">
                    At ODO: {svc.currentOdometer.toLocaleString()} KM
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white p-6 rounded-xl text-center text-xs text-[#6A89A7] border border-[#DCE8F2]">
              No service or breakdown records logged for this vehicle.
            </div>
          )}
        </div>
      </div>
    );
  };

  // =========================================================================
  // SUB-RENDER: TAB 6 - MY TRIPS
  // =========================================================================
  const renderTripsTab = () => {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-[#384959]">{t.tabTrips}</h2>
            <p className="text-xs text-[#6A89A7]">Completed and active freight consignments</p>
          </div>
        </div>

        <div className="space-y-3">
          {driverTrips.map((tr) => (
            <div key={tr.id} className="bg-white rounded-2xl p-4 border border-[#DCE8F2] shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-extrabold text-[#384959]">{tr.id}</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    tr.status === 'delivered'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {tr.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-[#6A89A7] mb-2">
                <MapPin className="w-3.5 h-3.5 text-[#384959]" />
                <span className="font-medium text-[#384959]">{tr.startingLocation}</span>
                <span>→</span>
                <span>{tr.destinations[0]?.placeName || 'Destinations'}</span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#DCE8F2] text-xs">
                <span className="text-slate-400">{tr.outDate}</span>
                <span className="font-bold text-[#384959]">
                  Start: {(tr.startOdometer || 0).toLocaleString()} KM
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // =========================================================================
  // SUB-RENDER: TAB 7 - DOCUMENTS
  // =========================================================================
  const renderDocumentsTab = () => {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-[#384959]">{t.tabDocs}</h2>
            <p className="text-xs text-[#6A89A7]">Compliance, RC, Insurance & Permits</p>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg">
            All Verified
          </span>
        </div>

        <div className="space-y-3">
          {/* RC Document */}
          <div className="bg-white rounded-xl p-3.5 border border-[#DCE8F2] shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#BDDDFC] text-[#384959] flex items-center justify-center">
                <FileCheck className="w-5 h-5 text-[#384959]" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#384959]">Vehicle RC (Registration)</p>
                <p className="text-[11px] text-[#6A89A7]">{currentVehicle?.number}</p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-600">Active</span>
          </div>

          {/* Insurance */}
          <div className="bg-white rounded-xl p-3.5 border border-[#DCE8F2] shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#BDDDFC] text-[#384959] flex items-center justify-center">
                <Shield className="w-5 h-5 text-[#384959]" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#384959]">Comprehensive Insurance</p>
                <p className="text-[11px] text-[#6A89A7]">Valid till 12 Mar 2027</p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-600">Valid</span>
          </div>

          {/* PUC */}
          <div className="bg-white rounded-xl p-3.5 border border-[#DCE8F2] shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#BDDDFC] text-[#384959] flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-[#384959]" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#384959]">PUC Certificate</p>
                <p className="text-[11px] text-[#6A89A7]">Valid till 28 Feb 2027</p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-600">Valid</span>
          </div>

          {/* National Permit */}
          <div className="bg-white rounded-xl p-3.5 border border-[#DCE8F2] shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#BDDDFC] text-[#384959] flex items-center justify-center">
                <FileText className="w-5 h-5 text-[#384959]" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#384959]">All India / Interstate Permit</p>
                <p className="text-[11px] text-[#6A89A7]">Valid till 30 Nov 2026</p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-600">Active</span>
          </div>
        </div>
      </div>
    );
  };

  // =========================================================================
  // SUB-RENDER: TAB 8 - MY PAYMENTS
  // =========================================================================
  const renderPaymentsTab = () => {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-[#384959]">{t.tabPayments}</h2>
            <p className="text-xs text-[#6A89A7]">Advances, bata allowance and settlements</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#DCE8F2] shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-[#DCE8F2] pb-3">
            <div>
              <span className="text-xs text-[#6A89A7]">Pending Settlement</span>
              <p className="text-xl font-black text-[#384959]">₹18,500</p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
              Clearance in 2 Days
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-[#F3F7FB] p-2.5 rounded-xl border border-[#DCE8F2]">
              <span className="text-[#6A89A7] block text-[10px]">DIESEL ADVANCE</span>
              <span className="font-bold text-[#384959]">₹12,000</span>
            </div>
            <div className="bg-[#F3F7FB] p-2.5 rounded-xl border border-[#DCE8F2]">
              <span className="text-[#6A89A7] block text-[10px]">TRIP BATA / ALLOWANCE</span>
              <span className="font-bold text-[#384959]">₹6,500</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // =========================================================================
  // SUB-RENDER: TAB 9 - HELP & SUPPORT
  // =========================================================================
  const renderHelpTab = () => {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-[#384959]">{t.tabHelp}</h2>
            <p className="text-xs text-[#6A89A7]">Emergency highway toll-free & fleet support</p>
          </div>
        </div>

        <div className="space-y-3">
          <a
            href="tel:18002097979"
            className="bg-white rounded-xl p-4 border border-[#DCE8F2] shadow-sm flex items-center justify-between hover:border-[#88BDF2] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#384959]">24x7 Highway Breakdown Helpline</p>
                <p className="text-[11px] text-[#6A89A7]">Toll-Free: 1800-209-7979</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#6A89A7]" />
          </a>

          <a
            href="tel:919876543210"
            className="bg-white rounded-xl p-4 border border-[#DCE8F2] shadow-sm flex items-center justify-between hover:border-[#88BDF2] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#BDDDFC] text-[#384959] flex items-center justify-center">
                <User className="w-5 h-5 text-[#384959]" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#384959]">Fleet Dispatcher (Head Office)</p>
                <p className="text-[11px] text-[#6A89A7]">+91 98765 43210</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#6A89A7]" />
          </a>

          {/* Report Problem / Dispute ODO */}
          <button
            onClick={() => setIsReportIssueModalOpen(true)}
            className="w-full bg-[#F3F7FB] rounded-xl p-3.5 border border-[#DCE8F2] text-left hover:bg-white transition-colors"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-[#384959]">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Report Incorrect ODO or Breakdown Problem</span>
            </div>
            <p className="text-[11px] text-[#6A89A7] mt-1">
              Submit an official correction request to the Fleet Manager for audit review.
            </p>
          </button>
        </div>
      </div>
    );
  };

  // =========================================================================
  // MAIN RENDER LOGIC BASED ON ACTIVE TAB
  // =========================================================================
  const renderCurrentTabContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="p-4">
            {renderActiveVehicleCard()}
            {renderFourBigActionTiles()}
            {renderVehiclePerformanceCard()}
            {renderRecentActivityFeed()}
          </div>
        );
      case 'vehicles':
        return renderMyVehiclesTab();
      case 'work':
        return renderWorkTab();
      case 'trips':
        return renderTripsTab();
      case 'fuel':
        return renderFuelTab();
      case 'service':
        return renderServiceTab();
      case 'docs':
        return renderDocumentsTab();
      case 'payments':
        return renderPaymentsTab();
      case 'help':
        return renderHelpTab();
      default:
        return null;
    }
  };

  // =========================================================================
  // RETURN: WRAPPER COMPONENT WITH MODALS & SLIDE-OVERS
  // =========================================================================
  return (
    <div className="min-h-screen bg-[#F3F7FB] pb-24 font-sans text-[#384959]">
      {/* Container simulating high-fidelity mobile PWA screen (or responsive tablet/desktop) */}
      <div className="max-w-md mx-auto md:max-w-xl bg-[#F3F7FB] min-h-screen shadow-2xl relative border-x border-[#DCE8F2]">
        {/* Top App Bar with Branding, Language, & Sync status */}
        {renderTopAppBar()}

        {/* Quick Tabs Pill Nav (Allowing direct access to all 9 modules) */}
        <div className="bg-white px-3 py-2 border-b border-[#DCE8F2] flex items-center gap-1.5 overflow-x-auto no-scrollbar shadow-sm sticky top-[116px] z-20">
          {(
            [
              { id: 'home', label: t.tabHome },
              { id: 'vehicles', label: t.tabVehicles },
              { id: 'work', label: t.tabWork },
              { id: 'trips', label: t.tabTrips },
              { id: 'fuel', label: t.tabFuel },
              { id: 'service', label: t.tabService },
              { id: 'docs', label: t.tabDocs },
              { id: 'payments', label: t.tabPayments },
              { id: 'help', label: t.tabHelp },
            ] as { id: DriverNavTab; label: string }[]
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1 text-xs font-bold rounded-lg whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-[#384959] text-white shadow-sm'
                  : 'bg-[#F3F7FB] text-[#6A89A7] hover:bg-[#BDDDFC]/40 hover:text-[#384959]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Main Tab Body */}
        {renderCurrentTabContent()}

        {/* Persistent Bottom Bar */}
        {renderBottomNav()}
      </div>

      {/* ===================================================================== */}
      {/* TOAST POPUP NOTIFICATION */}
      {/* ===================================================================== */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-[#384959] text-white px-4 py-2.5 rounded-xl shadow-2xl border border-[#88BDF2] text-xs font-semibold flex items-center gap-2 max-w-sm text-center">
          <Sparkles className="w-4 h-4 text-[#88BDF2]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 1: SELECT VEHICLE (Matching screenshot) */}
      {/* ===================================================================== */}
      {isSelectVehicleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE8F2]">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsSelectVehicleModalOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-[#F3F7FB] text-[#384959]"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h3 className="text-base font-extrabold text-[#384959]">{t.selectVehicle}</h3>
              </div>
              <button
                onClick={() => setIsSelectVehicleModalOpen(false)}
                className="p-1 rounded-lg hover:bg-[#F3F7FB] text-[#6A89A7]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative my-3">
              <Search className="w-4 h-4 text-[#6A89A7] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search vehicle number..."
                value={vehicleSearchQuery}
                onChange={(e) => setVehicleSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#F3F7FB] border border-[#DCE8F2] rounded-xl text-xs text-[#384959] focus:outline-none focus:border-[#88BDF2]"
              />
            </div>

            {/* Radio Vehicle List */}
            <div className="space-y-2.5 my-3">
              {filteredVehicles.map((veh: Vehicle) => {
                const isSelected = currentVehicle?.id === veh.id;
                return (
                  <div
                    key={veh.id}
                    onClick={() => {
                      setActiveDriverVehicleId(veh.id);
                    }}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#88BDF2] bg-[#F3F7FB] ring-2 ring-[#88BDF2]/30'
                        : 'border-[#DCE8F2] hover:bg-[#F3F7FB]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-white border border-[#DCE8F2] flex items-center justify-center">
                        <Truck className="w-6 h-6 text-[#384959]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-extrabold text-[#384959]">{veh.number}</span>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                            Active
                          </span>
                        </div>
                        <p className="text-xs text-[#6A89A7]">
                          {veh.model} • {veh.type} • {veh.capacityKg?.toLocaleString()} KG
                        </p>
                      </div>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? 'border-[#384959] bg-[#384959]' : 'border-[#6A89A7]'
                      }`}
                    >
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Continue Button */}
            <button
              onClick={() => {
                setIsSelectVehicleModalOpen(false);
                showToast(`Selected ${currentVehicle?.number}`);
              }}
              className="w-full py-3 bg-[#384959] hover:bg-[#2C3B49] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-colors mt-4"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4 text-[#88BDF2]" />
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 2: ADD REFUEL (Matching screenshot) */}
      {/* ===================================================================== */}
      {isAddRefuelModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE8F2]">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAddRefuelModalOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-[#F3F7FB] text-[#384959]"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h3 className="text-base font-extrabold text-[#384959]">Add Refuel</h3>
              </div>
              <button
                onClick={() => setIsAddRefuelModalOpen(false)}
                className="p-1 rounded-lg hover:bg-[#F3F7FB] text-[#6A89A7]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitRefuel} className="space-y-4 pt-3">
              {/* Segmented Fuel Type Toggle */}
              <div className="grid grid-cols-2 gap-1 bg-[#F3F7FB] p-1 rounded-xl border border-[#DCE8F2]">
                <button
                  type="button"
                  onClick={() => setRefuelFuelType('diesel')}
                  className={`py-2 rounded-lg text-xs font-extrabold transition-all ${
                    refuelFuelType === 'diesel' ? 'bg-[#384959] text-white shadow-sm' : 'text-[#6A89A7]'
                  }`}
                >
                  {t.diesel}
                </button>
                <button
                  type="button"
                  onClick={() => setRefuelFuelType('cng')}
                  className={`py-2 rounded-lg text-xs font-extrabold transition-all ${
                    refuelFuelType === 'cng' ? 'bg-[#384959] text-white shadow-sm' : 'text-[#6A89A7]'
                  }`}
                >
                  {t.cng}
                </button>
              </div>

              {/* Truck Badge */}
              <div className="p-3 bg-[#F3F7FB] rounded-xl border border-[#DCE8F2] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Truck className="w-5 h-5 text-[#384959]" />
                  <div>
                    <span className="text-xs font-extrabold text-[#384959] block">
                      {currentVehicle?.number}
                    </span>
                    <span className="text-[10px] text-[#6A89A7]">
                      {currentVehicle?.model} • {currentVehicle?.type}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  Active
                </span>
              </div>

              {/* Current ODO (KM) */}
              <div>
                <label className="block text-xs font-bold text-[#384959] mb-1">
                  Current ODO (KM) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    value={refuelOdo}
                    onChange={(e) => setRefuelOdo(Number(e.target.value))}
                    min={currentVerifiedOdo}
                    className="w-full px-3 py-2.5 bg-[#F3F7FB] border border-[#DCE8F2] rounded-xl text-sm font-bold text-[#384959] focus:outline-none focus:border-[#88BDF2]"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#6A89A7]">
                    KM
                  </span>
                </div>
                <p className="text-[10px] text-[#6A89A7] mt-1">
                  Last verified: {currentVerifiedOdo.toLocaleString()} KM (Cannot be lower)
                </p>
              </div>

              {/* Fuel Quantity & Rate */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#384959] mb-1">
                    {refuelFuelType === 'diesel' ? 'Fuel Qty (Litres)' : 'Fuel Qty (KG)'}{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={refuelQuantity}
                    onChange={(e) => setRefuelQuantity(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#F3F7FB] border border-[#DCE8F2] rounded-xl text-sm font-bold text-[#384959] focus:outline-none focus:border-[#88BDF2]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#384959] mb-1">
                    {refuelFuelType === 'diesel' ? 'Rate (₹ / Litre)' : 'Rate (₹ / KG)'}{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={refuelRate}
                    onChange={(e) => setRefuelRate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#F3F7FB] border border-[#DCE8F2] rounded-xl text-sm font-bold text-[#384959] focus:outline-none focus:border-[#88BDF2]"
                  />
                </div>
              </div>

              {/* Total Amount (Auto-calculated) */}
              <div>
                <label className="block text-xs font-bold text-[#384959] mb-1">
                  Total Amount (₹) <span className="text-emerald-700">(Auto-calculated)</span>
                </label>
                <div className="px-3 py-2.5 bg-[#BDDDFC]/30 border border-[#88BDF2] rounded-xl text-base font-extrabold text-[#384959]">
                  ₹{Number(calculatedRefuelTotal).toLocaleString()}
                </div>
              </div>

              {/* Fill Type: Full Tank vs Partial Fill */}
              <div>
                <label className="block text-xs font-bold text-[#384959] mb-1">Fill Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRefuelFillType('full_tank')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      refuelFillType === 'full_tank'
                        ? 'bg-[#384959] text-white border-[#384959]'
                        : 'bg-[#F3F7FB] text-[#6A89A7] border-[#DCE8F2]'
                    }`}
                  >
                    Full Tank (For Avg KM/L)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRefuelFillType('partial_fill')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      refuelFillType === 'partial_fill'
                        ? 'bg-[#384959] text-white border-[#384959]'
                        : 'bg-[#F3F7FB] text-[#6A89A7] border-[#DCE8F2]'
                    }`}
                  >
                    Partial Fill
                  </button>
                </div>
              </div>

              {/* Fuel Station */}
              <div>
                <label className="block text-xs font-bold text-[#384959] mb-1">Fuel Station</label>
                <input
                  type="text"
                  value={refuelStation}
                  onChange={(e) => setRefuelStation(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F3F7FB] border border-[#DCE8F2] rounded-xl text-xs text-[#384959] focus:outline-none focus:border-[#88BDF2]"
                />
              </div>

              {/* Receipt Photo */}
              <div>
                <label className="block text-xs font-bold text-[#384959] mb-1">
                  Receipt Photo <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-3">
                  {refuelReceiptPhoto && (
                    <img
                      src={refuelReceiptPhoto}
                      alt="Receipt"
                      className="w-16 h-16 rounded-xl object-cover border border-[#DCE8F2]"
                    />
                  )}
                  <label className="cursor-pointer flex-1 py-3 px-4 bg-[#F3F7FB] border-2 border-dashed border-[#DCE8F2] rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-[#6A89A7] hover:border-[#88BDF2]">
                    <Camera className="w-4 h-4 text-[#384959]" />
                    <span>{refuelReceiptPhoto ? 'Change Photo' : 'Add Photo'}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleRefuelReceiptUpload} />
                  </label>
                </div>
              </div>

              {/* Submit Refuel Entry */}
              <button
                type="submit"
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-colors mt-2"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-200" />
                <span>Submit Refuel Entry</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 3: ADD SERVICE / MAINTENANCE (Matching screenshot) */}
      {/* ===================================================================== */}
      {isAddServiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE8F2]">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAddServiceModalOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-[#F3F7FB] text-[#384959]"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h3 className="text-base font-extrabold text-[#384959]">Add Service / Maintenance</h3>
              </div>
              <button
                onClick={() => setIsAddServiceModalOpen(false)}
                className="p-1 rounded-lg hover:bg-[#F3F7FB] text-[#6A89A7]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitService} className="space-y-4 pt-3">
              {/* Truck Banner */}
              <div className="p-3 bg-[#F3F7FB] rounded-xl border border-[#DCE8F2] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Truck className="w-5 h-5 text-[#384959]" />
                  <div>
                    <span className="text-xs font-extrabold text-[#384959] block">
                      {currentVehicle?.number}
                    </span>
                    <span className="text-[10px] text-[#6A89A7]">
                      {currentVehicle?.model} • {currentVehicle?.type}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  Active
                </span>
              </div>

              {/* Current ODO (KM) */}
              <div>
                <label className="block text-xs font-bold text-[#384959] mb-1">
                  Current ODO (KM) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  value={serviceOdo}
                  onChange={(e) => setServiceOdo(Number(e.target.value))}
                  min={currentVerifiedOdo}
                  className="w-full px-3 py-2.5 bg-[#F3F7FB] border border-[#DCE8F2] rounded-xl text-sm font-bold text-[#384959] focus:outline-none focus:border-[#88BDF2]"
                />
              </div>

              {/* Service Type (12 Categories) */}
              <div>
                <label className="block text-xs font-bold text-[#384959] mb-1">
                  Service Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value as ServiceActivityType)}
                  className="w-full px-3 py-2.5 bg-[#F3F7FB] border border-[#DCE8F2] rounded-xl text-xs font-bold text-[#384959] focus:outline-none focus:border-[#88BDF2]"
                >
                  <option value="General Servicing">1. General Servicing</option>
                  <option value="Engine Oil">2. Engine Oil</option>
                  <option value="Oil Filter">3. Oil Filter</option>
                  <option value="Air Filter">4. Air Filter</option>
                  <option value="Tyre Replacement">5. Tyre Replacement</option>
                  <option value="Tyre Repair">6. Tyre Repair / Puncture</option>
                  <option value="Brake Repair">7. Brake Repair</option>
                  <option value="Clutch Repair">8. Clutch Repair</option>
                  <option value="Battery">9. Battery</option>
                  <option value="Electrical">10. Electrical</option>
                  <option value="Washing and Greasing">11. Washing and Greasing</option>
                  <option value="Other Repairs">12. Other Highway Repairs</option>
                </select>
              </div>

              {/* Workshop / Garage */}
              <div>
                <label className="block text-xs font-bold text-[#384959] mb-1">
                  Workshop / Garage <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={serviceWorkshop}
                  onChange={(e) => setServiceWorkshop(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F3F7FB] border border-[#DCE8F2] rounded-xl text-xs text-[#384959] focus:outline-none focus:border-[#88BDF2]"
                />
              </div>

              {/* Amount (₹) */}
              <div>
                <label className="block text-xs font-bold text-[#384959] mb-1">
                  Amount (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  value={serviceAmount}
                  onChange={(e) => setServiceAmount(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#F3F7FB] border border-[#DCE8F2] rounded-xl text-sm font-bold text-[#384959] focus:outline-none focus:border-[#88BDF2]"
                />
              </div>

              {/* Work Details */}
              <div>
                <label className="block text-xs font-bold text-[#384959] mb-1">Work Details</label>
                <textarea
                  rows={2}
                  value={serviceWorkDetails}
                  onChange={(e) => setServiceWorkDetails(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F3F7FB] border border-[#DCE8F2] rounded-xl text-xs text-[#384959] focus:outline-none focus:border-[#88BDF2]"
                />
              </div>

              {/* Invoice Photo */}
              <div>
                <label className="block text-xs font-bold text-[#384959] mb-1">
                  Invoice / Receipt Photo <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-3">
                  {serviceInvoicePhoto && (
                    <img
                      src={serviceInvoicePhoto}
                      alt="Invoice"
                      className="w-16 h-16 rounded-xl object-cover border border-[#DCE8F2]"
                    />
                  )}
                  <label className="cursor-pointer flex-1 py-3 px-4 bg-[#F3F7FB] border-2 border-dashed border-[#DCE8F2] rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-[#6A89A7] hover:border-[#88BDF2]">
                    <Camera className="w-4 h-4 text-[#384959]" />
                    <span>{serviceInvoicePhoto ? 'Change Invoice' : 'Add Photo'}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleServiceInvoiceUpload} />
                  </label>
                </div>
              </div>

              {/* Submit Service */}
              <button
                type="submit"
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-colors mt-2"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-200" />
                <span>Submit Service Record</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 4: TRIP WORK (START TRIP / END TRIP) (Matching screenshot) */}
      {/* ===================================================================== */}
      {isTripWorkModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE8F2]">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsTripWorkModalOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-[#F3F7FB] text-[#384959]"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h3 className="text-base font-extrabold text-[#384959]">Trip Work</h3>
              </div>
              <button
                onClick={() => setIsTripWorkModalOpen(false)}
                className="p-1 rounded-lg hover:bg-[#F3F7FB] text-[#6A89A7]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Toggle Start Trip vs End Trip */}
            <div className="grid grid-cols-2 gap-1 bg-[#F3F7FB] p-1 rounded-xl border border-[#DCE8F2] my-3">
              <button
                type="button"
                onClick={() => setTripWorkTab('start')}
                className={`py-2 rounded-lg text-xs font-extrabold transition-all ${
                  tripWorkTab === 'start' ? 'bg-[#384959] text-white shadow-sm' : 'text-[#6A89A7]'
                }`}
              >
                Start Trip
              </button>
              <button
                type="button"
                onClick={() => setTripWorkTab('end')}
                className={`py-2 rounded-lg text-xs font-extrabold transition-all ${
                  tripWorkTab === 'end' ? 'bg-[#384959] text-white shadow-sm' : 'text-[#6A89A7]'
                }`}
              >
                End Trip
              </button>
            </div>

            {/* Truck Banner */}
            <div className="p-3 bg-[#F3F7FB] rounded-xl border border-[#DCE8F2] flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <Truck className="w-5 h-5 text-[#384959]" />
                <div>
                  <span className="text-xs font-extrabold text-[#384959] block">
                    {currentVehicle?.number}
                  </span>
                  <span className="text-[10px] text-[#6A89A7]">
                    {currentVehicle?.model} • {currentVehicle?.type}
                  </span>
                </div>
              </div>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                Active
              </span>
            </div>

            {tripWorkTab === 'start' ? (
              <form onSubmit={handleStartTripSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#384959] mb-1">
                    Start ODO (KM) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={tripStartOdo}
                    onChange={(e) => setTripStartOdo(Number(e.target.value))}
                    min={currentVerifiedOdo}
                    className="w-full px-3 py-2.5 bg-[#F3F7FB] border border-[#DCE8F2] rounded-xl text-sm font-bold text-[#384959] focus:outline-none focus:border-[#88BDF2]"
                  />
                  <p className="text-[10px] text-[#6A89A7] mt-1">
                    Last verified: {currentVerifiedOdo.toLocaleString()} KM
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#384959] mb-1">
                    From (Loading) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={tripFrom}
                    onChange={(e) => setTripFrom(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F3F7FB] border border-[#DCE8F2] rounded-xl text-xs text-[#384959] focus:outline-none focus:border-[#88BDF2]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#384959] mb-1">
                    To (Unloading) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={tripTo}
                    onChange={(e) => setTripTo(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F3F7FB] border border-[#DCE8F2] rounded-xl text-xs text-[#384959] focus:outline-none focus:border-[#88BDF2]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-[#384959] mb-1">Fruit / Cargo Item</label>
                    <input
                      type="text"
                      value={tripItemName}
                      onChange={(e) => setTripItemName(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F3F7FB] border border-[#DCE8F2] rounded-xl text-xs text-[#384959]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#384959] mb-1">Box / Unit Count</label>
                    <input
                      type="number"
                      value={tripItemQty}
                      onChange={(e) => setTripItemQty(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-[#F3F7FB] border border-[#DCE8F2] rounded-xl text-xs text-[#384959]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-colors mt-2"
                >
                  <PlayCircle className="w-5 h-5 text-emerald-200" />
                  <span>Start Trip</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleEndTripSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#384959] mb-1">Active Trip</label>
                  <div className="p-2.5 bg-[#F3F7FB] rounded-xl border border-[#DCE8F2] text-xs font-bold text-[#384959]">
                    {currentActiveTrip ? `${currentActiveTrip.id} (${currentActiveTrip.startingLocation})` : 'No Active Trip'}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#384959] mb-1">
                    End ODO (KM) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={tripEndOdo}
                    onChange={(e) => setTripEndOdo(Number(e.target.value))}
                    min={currentVerifiedOdo}
                    className="w-full px-3 py-2.5 bg-[#F3F7FB] border border-[#DCE8F2] rounded-xl text-sm font-bold text-[#384959] focus:outline-none focus:border-[#88BDF2]"
                  />
                  <p className="text-[10px] text-[#6A89A7] mt-1">
                    Must be ≥ start ODO ({currentActiveTrip?.startOdometer || currentVerifiedOdo} KM)
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#384959] mb-1">Remarks</label>
                  <textarea
                    rows={2}
                    value={tripEndRemarks}
                    onChange={(e) => setTripEndRemarks(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F3F7FB] border border-[#DCE8F2] rounded-xl text-xs text-[#384959]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#384959] mb-1">Stamped LR Photo</label>
                  <label className="cursor-pointer block py-3 px-4 bg-[#F3F7FB] border-2 border-dashed border-[#DCE8F2] rounded-xl text-center text-xs font-bold text-[#6A89A7] hover:border-[#88BDF2]">
                    <Camera className="w-4 h-4 text-[#384959] mx-auto mb-1" />
                    <span>{tripLrPhoto ? 'LR Attached' : 'Capture Stamped LR'}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleTripLrUpload} />
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-colors mt-2"
                >
                  <CheckCircle2 className="w-5 h-5 text-blue-200" />
                  <span>Complete & End Trip</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 5: VEHICLE DETAILS (STRICTLY VIEW ONLY - from screenshot) */}
      {/* ===================================================================== */}
      {isVehicleDetailsModalOpen && selectedVehicleForDetails && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE8F2]">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsVehicleDetailsModalOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-[#F3F7FB] text-[#384959]"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h3 className="text-base font-extrabold text-[#384959]">Vehicle Details</h3>
              </div>
              <span className="text-[10px] bg-[#BDDDFC] text-[#384959] px-2 py-0.5 rounded font-extrabold">
                {t.viewOnly}
              </span>
            </div>

            {/* Truck Banner */}
            <div className="p-3 bg-[#F3F7FB] rounded-xl border border-[#DCE8F2] flex items-center gap-3 my-3">
              <div className="w-12 h-12 rounded-xl bg-white border border-[#DCE8F2] flex items-center justify-center">
                <Truck className="w-6 h-6 text-[#384959]" />
              </div>
              <div>
                <span className="text-base font-extrabold text-[#384959] block">
                  {selectedVehicleForDetails.number}
                </span>
                <span className="text-xs text-[#6A89A7]">
                  {selectedVehicleForDetails.model} • {selectedVehicleForDetails.type}
                </span>
              </div>
            </div>

            {/* View Only Specifications */}
            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-[#F3F7FB] border border-[#DCE8F2] flex items-center justify-between">
                <span className="text-[#6A89A7] font-semibold">{t.vehicleType}</span>
                <span className="font-bold text-[#384959]">
                  {selectedVehicleForDetails.type} ({selectedVehicleForDetails.capacityKg?.toLocaleString()} KG)
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#F3F7FB] border border-[#DCE8F2] flex items-center justify-between">
                <span className="text-[#6A89A7] font-semibold">{t.lastVerifiedOdo}</span>
                <span className="font-extrabold text-[#384959]">
                  {selectedVehicleForDetails.currentOdometer?.toLocaleString()} KM
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#F3F7FB] border border-[#DCE8F2] flex items-center justify-between">
                <span className="text-[#6A89A7] font-semibold">{t.insuranceValidTill}</span>
                <span className="font-bold text-emerald-700">12 Mar 2027</span>
              </div>

              <div className="p-3 rounded-xl bg-[#F3F7FB] border border-[#DCE8F2] flex items-center justify-between">
                <span className="text-[#6A89A7] font-semibold">{t.pucValidTill}</span>
                <span className="font-bold text-emerald-700">28 Feb 2027</span>
              </div>

              <div className="p-3 rounded-xl bg-[#F3F7FB] border border-[#DCE8F2] flex items-center justify-between">
                <span className="text-[#6A89A7] font-semibold">Fitness Certificate</span>
                <span className="font-bold text-emerald-700">15 Jan 2028</span>
              </div>

              <div className="p-3 rounded-xl bg-[#F3F7FB] border border-[#DCE8F2] flex items-center justify-between">
                <span className="text-[#6A89A7] font-semibold">National Freight Permit</span>
                <span className="font-bold text-emerald-700">30 Nov 2026</span>
              </div>
            </div>

            <button
              onClick={() => setIsVehicleDetailsModalOpen(false)}
              className="w-full py-3 bg-[#384959] text-white rounded-xl font-bold text-xs mt-4"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* DRAWER: OFFLINE SYNC STATUS & TELEMETRY */}
      {/* ===================================================================== */}
      {isSyncDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE8F2]">
              <div className="flex items-center gap-2">
                <Wifi className="w-5 h-5 text-[#384959]" />
                <h3 className="text-base font-extrabold text-[#384959]">Offline Synchronization</h3>
              </div>
              <button
                onClick={() => setIsSyncDrawerOpen(false)}
                className="p-1 rounded-lg hover:bg-[#F3F7FB] text-[#6A89A7]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div className="p-4 rounded-2xl bg-[#F3F7FB] border border-[#DCE8F2] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#6A89A7]">Network Connection</span>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      isEffectivelyOnline ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {isEffectivelyOnline ? 'Online Connected' : 'Offline / Highway Dead Zone'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#6A89A7]">Pending Offline Mutations</span>
                  <span className="text-xs font-bold text-[#384959]">{syncState.pendingCount} records</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#6A89A7]">Last Synced Timestamp</span>
                  <span className="text-xs font-semibold text-[#384959]">
                    {syncState.lastSyncedAt ? new Date(syncState.lastSyncedAt).toLocaleTimeString() : 'Just now'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#6A89A7]">Monotonic ODO Validation</span>
                  <span className="text-xs font-bold text-emerald-700">Strict Active</span>
                </div>
              </div>

              {/* Dead Zone Simulator info */}
              <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 text-xs text-blue-900">
                <p className="font-bold flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>Full Offline Guarantee</span>
                </p>
                <p className="text-[11px] leading-relaxed text-blue-800">
                  All refuels, trips, and service records saved while crossing highway low-connectivity zones are persisted
                  in IndexedDB and automatically pushed when network returns.
                </p>
              </div>

              {/* Manual Sync Trigger */}
              <button
                onClick={async () => {
                  if (!isEffectivelyOnline) {
                    alert('Cannot sync while highway dead zone simulation is enabled or network is offline.');
                    return;
                  }
                  await triggerManualSync();
                  showToast('Sync completed with Fleet Cloud!');
                }}
                disabled={syncState.status === 'syncing' || !isEffectivelyOnline}
                className="w-full py-3 bg-[#384959] hover:bg-[#2C3B49] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 text-[#88BDF2] ${syncState.status === 'syncing' ? 'animate-spin' : ''}`} />
                <span>{syncState.status === 'syncing' ? 'Syncing...' : 'Sync Now'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 6: REPORT ISSUE / DISPUTE ODO */}
      {/* ===================================================================== */}
      {isReportIssueModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE8F2]">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-extrabold text-[#384959]">Report Problem / ODO Dispute</h3>
              </div>
              <button
                onClick={() => setIsReportIssueModalOpen(false)}
                className="p-1 rounded-lg hover:bg-[#F3F7FB] text-[#6A89A7]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setIsReportIssueModalOpen(false);
                showToast('Problem report filed with Fleet Manager.');
              }}
              className="space-y-4 pt-3"
            >
              <div>
                <label className="block text-xs font-bold text-[#384959] mb-1">Issue Category</label>
                <select className="w-full px-3 py-2 bg-[#F3F7FB] border border-[#DCE8F2] rounded-xl text-xs font-bold text-[#384959]">
                  <option>Incorrect Odometer Displayed</option>
                  <option>Engine / Mechanical Breakdown</option>
                  <option>Tyre Puncture / Burst</option>
                  <option>Fuel Sensor Discrepancy</option>
                  <option>Toll / FASTag Issue</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#384959] mb-1">Description</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain the problem or correct meter value with reason..."
                  className="w-full px-3 py-2 bg-[#F3F7FB] border border-[#DCE8F2] rounded-xl text-xs text-[#384959]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#384959] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md"
              >
                <Send className="w-4 h-4 text-[#88BDF2]" />
                <span>Submit Report</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
