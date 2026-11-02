import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Smartphone,
  Truck,
  MapPin,
  Package,
  Camera,
  CheckCircle2,
  Clock,
  Gauge,
  UploadCloud,
  FileText,
  AlertTriangle,
  Send,
  Plus,
  Eye,
  Lock,
  Edit3,
  Save,
  Trash2,
  Wifi,
  WifiOff,
  Database,
  RefreshCw,
  HardDrive,
  Check,
  ChevronRight,
  Shield,
  History,
  X,
  FileCheck,
  ArrowRight,
  ChevronUp,
  ChevronDown,
  Navigation,
  Disc,
  Wrench,
  Search,
  Filter,
  Printer,
  Fuel,
  Sparkles,
  Calendar,
  Battery,
} from 'lucide-react';
import { useTMS } from '../context/TMSContext';
import { TripDestination, Trip, ReturnLoad, ReturnLoadDeliveryLocation, DriverDailyWork } from '../types/tms';
import {
  saveTripOffline,
  getOfflineTrips,
  saveReturnLoadOffline,
  getOfflineReturnLoads,
  queueOfflineMutation,
  getSyncQueue,
  markQueueItemStatus,
  clearSyncedQueue,
  saveOfflinePhoto,
  getOfflinePhoto,
  getOfflineStorageSummary,
  setMetaValue,
  SyncQueueItem,
  OfflineStorageSummary,
} from '../utils/indexedDBStorage';
import { handleFormKeyDown } from '../utils/keyboardNavigation';

export const DriverPWAView: React.FC = () => {
  const {
    trips,
    vehicles,
    drivers,
    addTrip,
    updateTripDestinations,
    driverCanViewDocs,
    uploadStampedLRPhoto,
    updateOdometer,
    addReturnLoad,
    driverDailyWorks,
    addDriverDailyWork,
    deleteDriverDailyWork,
  } = useTMS();

  // Active driver (Sukhwinder Singh or first assigned driver)
  const activeDriver = drivers[0];
  const assignedVehicle = vehicles.find((v) => v.id === activeDriver?.assignedVehicleId) || vehicles[0];

  // Driver trips
  const driverTrips = trips.filter((t) => t.driverId === activeDriver?.id || t.driverName.includes('Sukhwinder'));
  const currentTrip = driverTrips[0] || trips[0];

  // Tab inside Driver Portal: 'daily_trip' | 'return_loads' | 'vehicle_docs' | 'stamped_lr'
  const [driverTab, setDriverTab] = useState<'daily_trip' | 'return_loads' | 'vehicle_docs' | 'stamped_lr'>('daily_trip');

  // ==========================================
  // OFFLINE & INDEXEDDB STATE MANAGEMENT
  // ==========================================
  const [isBrowserOnline, setIsBrowserOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  // Highway Dead Zone / Low Signal Simulation (allows user to test offline IndexedDB fallback on any connection)
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(false);
  const isEffectiveOffline = !isBrowserOnline || isSimulatedOffline;

  const [dbSummary, setDbSummary] = useState<OfflineStorageSummary>({
    isSupported: true,
    isFallback: false,
    tripsCount: 0,
    loadsCount: 0,
    pendingCount: 0,
    photosCount: 0,
    lastSyncedAt: null,
  });

  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [isQueueDrawerOpen, setIsQueueDrawerOpen] = useState<boolean>(false);

  // Locally stored return loads from IndexedDB (persisted for driver view)
  const [localReturnLoads, setLocalReturnLoads] = useState<ReturnLoad[]>([]);
  // Locally stored trips from IndexedDB
  const [localOfflineTrips, setLocalOfflineTrips] = useState<Trip[]>([]);

  // Refresh IndexedDB statistics
  const refreshStorageInfo = useCallback(async () => {
    try {
      const summary = await getOfflineStorageSummary();
      setDbSummary(summary);
      const queue = await getSyncQueue();
      setSyncQueue(queue);
      const loads = await getOfflineReturnLoads();
      setLocalReturnLoads(loads);
      const offlineTrips = await getOfflineTrips();
      setLocalOfflineTrips(offlineTrips);
    } catch (err) {
      console.error('Error refreshing IndexedDB storage:', err);
    }
  }, []);

  // Online / Offline window listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsBrowserOnline(true);
      // Auto sync when reconnected if not manually simulating dead zone
      if (!isSimulatedOffline) {
        handleTriggerSync();
      }
    };
    const handleOffline = () => {
      setIsBrowserOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial storage check
    refreshStorageInfo();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isSimulatedOffline]);

  // Seed IndexedDB cache with current active trip and return load when online
  useEffect(() => {
    if (!isEffectiveOffline && currentTrip) {
      saveTripOffline(currentTrip);
      if (currentTrip.returnLoad) {
        saveReturnLoadOffline(currentTrip.returnLoad);
      }
      refreshStorageInfo();
    }
  }, [currentTrip, isEffectiveOffline]);

  // ==========================================
  // SYNC ENGINE: Flushes queued actions to TMS
  // ==========================================
  const handleTriggerSync = async () => {
    if (isEffectiveOffline) {
      alert('Cannot synchronize while offline or in simulated highway dead zone. Reconnect to network first.');
      return;
    }

    setIsSyncing(true);
    setSyncFeedback('Synchronizing local IndexedDB records to Fleet Cloud...');

    try {
      const queue = await getSyncQueue();
      const pendingItems = queue.filter((item) => item.status === 'pending' || item.status === 'failed');

      if (pendingItems.length === 0) {
        setSyncFeedback('IndexedDB is already in sync with Cloud!');
        setIsSyncing(false);
        setTimeout(() => setSyncFeedback(null), 3500);
        return;
      }

      let successCount = 0;

      for (const item of pendingItems) {
        if (!item.id) continue;
        await markQueueItemStatus(item.id, 'syncing');

        try {
          switch (item.actionType) {
            case 'SAVE_TRIP': {
              addTrip(item.payload);
              break;
            }
            case 'UPDATE_DESTINATIONS': {
              updateTripDestinations(item.payload.tripId, item.payload.destinations);
              break;
            }
            case 'SAVE_RETURN_LOAD': {
              addReturnLoad(item.payload.tripId, item.payload.returnData);
              break;
            }
            case 'UPDATE_ODOMETER': {
              updateOdometer(item.payload.vehicleId, item.payload.newOdo);
              break;
            }
            case 'UPLOAD_STAMPED_LR': {
              uploadStampedLRPhoto(item.payload.tripId, item.payload.photoName);
              break;
            }
            case 'SAVE_DRIVER_DAILY_WORK': {
              addDriverDailyWork(item.payload);
              break;
            }
          }

          await markQueueItemStatus(item.id, 'synced');
          successCount++;
        } catch (err: any) {
          console.error(`Error syncing item #${item.id}:`, err);
          await markQueueItemStatus(item.id, 'failed', err.message || 'Sync failed');
        }
      }

      const syncTimestamp = new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      await setMetaValue('last_synced_at', syncTimestamp);
      await refreshStorageInfo();

      setSyncFeedback(`Successfully synchronized ${successCount} local IndexedDB record(s) with Fleet Cloud!`);
    } catch (err: any) {
      console.error('Fatal sync failure:', err);
      setSyncFeedback('Sync encountered an issue: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncFeedback(null), 5000);
    }
  };

  const handleClearSyncedItems = async () => {
    await clearSyncedQueue();
    await refreshStorageInfo();
  };

  // ==========================================
  // DRIVER DAILY WORK & VEHICLE TRACKING STATE
  // User Requirement:
  // "instead of this create a option to save a Daily Work of Driver,
  // How many Delivery they Delivered, and what work they did like for Vehical
  // if Vehical has to change a tier thay can add they have changes the Tier of this Vehical
  // and when driver saving the Daily Work they did they can also mention the Vehical Number to Track the work fast"
  // ==========================================
  const [isDailyWorkFormOpen, setIsDailyWorkFormOpen] = useState(false);
  const [workVehicleNumber, setWorkVehicleNumber] = useState(assignedVehicle.number);
  const [workDate, setWorkDate] = useState(new Date().toISOString().split('T')[0]);
  const [workShift, setWorkShift] = useState<'Full Day Shift' | 'Outbound Mandi Delivery' | 'Return Leg' | 'Night Transit'>('Full Day Shift');
  const [deliveriesCount, setDeliveriesCount] = useState<number>(2);
  const [deliveryPlaces, setDeliveryPlaces] = useState<Array<{
    id: string;
    placeName: string;
    city: string;
    quantityBoxes?: number;
    notes?: string;
  }>>([
    {
      id: 'drop-1',
      placeName: 'Surat Ring Road Fruit Mandi (Shop #42)',
      city: 'Surat',
      quantityBoxes: 120,
      notes: 'Alphonso Mango crates delivered in good condition, empties collected.',
    },
    {
      id: 'drop-2',
      placeName: 'Navsari APMC Yard',
      city: 'Navsari',
      quantityBoxes: 80,
      notes: 'Pomegranate boxes delivered, signed challan received.',
    },
  ]);

  // Categories of work done
  const [workCategories, setWorkCategories] = useState<string[]>([
    'Fruit / Goods Delivery',
    'Tyre Replacement / Change',
  ]);

  const [workDescription, setWorkDescription] = useState(
    'Completed 2 scheduled mandi fruit deliveries in Surat & Navsari. While on NH-48 bypass, noticed severe sidewall damage on rear-right outer tyre. Replaced tyre with new MRF radial tyre at highway workshop to prevent highway breakdown.'
  );

  // Vehicle Maintenance & Tyre Replacement Details
  const [hadVehicleMaintenance, setHadVehicleMaintenance] = useState(true);
  const [maintenanceComponent, setMaintenanceComponent] = useState('Rear Right Outer Tyre');
  const [maintenanceAction, setMaintenanceAction] = useState('Replaced with New Radial Tyre');
  const [maintenanceTyreBrand, setMaintenanceTyreBrand] = useState('MRF Steel Muscle 10.00 R20');
  const [maintenanceWorkshop, setMaintenanceWorkshop] = useState('National Tyre Care & Alignment, Surat NH-48 Bypass');
  const [maintenanceExpense, setMaintenanceExpense] = useState<number>(14800);
  const [maintenancePaidBy, setMaintenancePaidBy] = useState<'driver_cash' | 'company_account' | 'fastag_fuel_card'>('company_account');
  const [maintenanceBillNumber, setMaintenanceBillNumber] = useState('INV-TYR-9981');
  const [maintenanceBillPhoto, setMaintenanceBillPhoto] = useState<string | null>(
    'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?w=600&auto=format&fit=crop&q=60'
  );

  // Odometer readings for the day
  const [startOdoKm, setStartOdoKm] = useState<number>(assignedVehicle.currentOdometer - 330);
  const [endOdoKm, setEndOdoKm] = useState<number>(assignedVehicle.currentOdometer);

  // Fast Tracking Filter state for logs
  const [filterVehicleNumber, setFilterVehicleNumber] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected work log for viewing/printing detailed voucher slip
  const [selectedWorkSlip, setSelectedWorkSlip] = useState<DriverDailyWork | null>(null);

  // Stamped LR Photo Upload simulation / file input
  const [uploadedStampPhoto, setUploadedStampPhoto] = useState<string | null>(
    currentTrip?.returnLoad?.stampedLrPhotoUrl || null
  );
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // End ODO logger
  const [endOdo, setEndOdo] = useState<number>(assignedVehicle.currentOdometer + 280);

  const DRIVER_MAHA_DROPS = [
    { city: 'Bhiwandi', placeName: 'Bhiwandi Textile Central Godown #12', consigneeName: 'Prakash Textile Agency', mobile: '+91 98201 11223' },
    { city: 'Pune', placeName: 'Pune Market Yard Wholesale Depot #4', consigneeName: 'Vikas Trading Co.', mobile: '+91 98224 55667' },
    { city: 'Thane', placeName: 'Thane Majiwada Industrial Warehouse', consigneeName: 'ChemTech Logistics', mobile: '+91 98211 44556' },
    { city: 'Nashik', placeName: 'Nashik Ambad MIDC Complex', consigneeName: 'Maharashtra Tiles Hub', mobile: '+91 94222 33445' },
  ];

  // Return Load Creation State
  const [isNewReturnLoadOpen, setIsNewReturnLoadOpen] = useState(false);
  const [returnLoadData, setReturnLoadData] = useState({
    loadingPartyName: 'Surat Poly-Tex Fabrics Ltd.',
    loadingCity: 'Surat',
    deliveryCity: 'Pune (Hadapsar Cargo Hub)',
    goodsDescription: 'Export Synthetic Yarn & Textile Bales (28 Bales)',
    quantity: 28,
    weightKg: 11500,
    loadRentCharge: 16500,
    lrNumber: `LR-RT-${Date.now().toString().slice(-4)}`,
    hasStampedLR: false,
    notes: 'Fragile textile consignments. Keep dry and avoid rain exposure.',
  });

  // Driver Return Load Multi-Location Delivery State ("How many locations to delivered on which location")
  const [driverDeliveryLocations, setDriverDeliveryLocations] = useState<ReturnLoadDeliveryLocation[]>([
    {
      id: 'drv-rdel-1',
      dropOrder: 1,
      placeName: 'Bhiwandi Textile Central Godown #12',
      city: 'Bhiwandi',
      state: 'Maharashtra',
      consigneeName: 'Prakash Textile Agency',
      mobile: '+91 98201 11223',
      quantity: 14,
      weightKg: 5500,
      deliveryStatus: 'pending',
      notes: 'Drop 1: 14 bales unloaded at Bhiwandi bypass',
    },
    {
      id: 'drv-rdel-2',
      dropOrder: 2,
      placeName: 'Pune (Hadapsar Cargo Hub)',
      city: 'Pune',
      state: 'Maharashtra',
      consigneeName: 'Vikas Trading Co.',
      mobile: '+91 98224 55667',
      quantity: 14,
      weightKg: 6000,
      deliveryStatus: 'pending',
      notes: 'Drop 2 (Final): 14 bales unloaded at Pune depot',
    },
  ]);

  const handleDriverSetReturnLocationCount = (targetCount: number) => {
    const validCount = Math.max(1, Math.min(5, targetCount));
    if (validCount === driverDeliveryLocations.length) return;

    if (validCount < driverDeliveryLocations.length) {
      setDriverDeliveryLocations(
        driverDeliveryLocations.slice(0, validCount).map((l, i) => ({ ...l, dropOrder: i + 1 }))
      );
    } else {
      const updated = [...driverDeliveryLocations];
      for (let i = driverDeliveryLocations.length; i < validCount; i++) {
        const tmpl = DRIVER_MAHA_DROPS[i % DRIVER_MAHA_DROPS.length];
        updated.push({
          id: `drv-rdel-${Date.now()}-${i}`,
          dropOrder: i + 1,
          placeName: tmpl.placeName,
          city: tmpl.city,
          state: 'Maharashtra',
          consigneeName: tmpl.consigneeName,
          mobile: tmpl.mobile,
          quantity: 10,
          weightKg: 3000,
          deliveryStatus: 'pending',
          notes: `Drop ${i + 1} at ${tmpl.city}`,
        });
      }
      setDriverDeliveryLocations(updated);
    }
  };

  const handleDriverAddReturnLocation = () => {
    if (driverDeliveryLocations.length >= 5) {
      alert('Maximum 5 delivery drop locations allowed.');
      return;
    }
    const nextIdx = driverDeliveryLocations.length;
    const tmpl = DRIVER_MAHA_DROPS[nextIdx % DRIVER_MAHA_DROPS.length];
    const newLoc: ReturnLoadDeliveryLocation = {
      id: `drv-rdel-${Date.now()}`,
      dropOrder: nextIdx + 1,
      placeName: tmpl.placeName,
      city: tmpl.city,
      state: 'Maharashtra',
      consigneeName: tmpl.consigneeName,
      mobile: tmpl.mobile,
      quantity: 10,
      weightKg: 3000,
      deliveryStatus: 'pending',
      notes: `Drop ${nextIdx + 1} at ${tmpl.city}`,
    };
    setDriverDeliveryLocations([...driverDeliveryLocations, newLoc]);
  };

  const handleDriverRemoveReturnLocation = (idx: number) => {
    if (driverDeliveryLocations.length <= 1) {
      alert('At least one delivery location is required.');
      return;
    }
    const updated = driverDeliveryLocations.filter((_, i) => i !== idx);
    setDriverDeliveryLocations(updated.map((l, i) => ({ ...l, dropOrder: i + 1 })));
  };

  const handleDriverReturnLocationChange = (
    idx: number,
    field: keyof ReturnLoadDeliveryLocation,
    value: any
  ) => {
    const updated = [...driverDeliveryLocations];
    updated[idx] = { ...updated[idx], [field]: value };
    setDriverDeliveryLocations(updated);
  };

  // ==========================================
  // HANDLERS FOR DRIVER DAILY WORK & VEHICLE TRACKING
  // ==========================================
  const handleToggleCategory = (category: string) => {
    setWorkCategories((prev) => {
      const exists = prev.includes(category);
      const next = exists ? prev.filter((c) => c !== category) : [...prev, category];
      if (!exists && category === 'Tyre Replacement / Change') {
        setHadVehicleMaintenance(true);
      }
      return next;
    });
  };

  const handleAddDeliveryDrop = () => {
    const newDrop = {
      id: `drop-${Date.now()}-${deliveryPlaces.length + 1}`,
      placeName: '',
      city: 'Surat',
      quantityBoxes: 50,
      notes: '',
    };
    const updated = [...deliveryPlaces, newDrop];
    setDeliveryPlaces(updated);
    setDeliveriesCount(updated.length);
  };

  const handleRemoveDeliveryDrop = (idx: number) => {
    const updated = deliveryPlaces.filter((_, i) => i !== idx);
    setDeliveryPlaces(updated);
    setDeliveriesCount(updated.length);
  };

  const handleDeliveryDropChange = (
    idx: number,
    field: 'placeName' | 'city' | 'quantityBoxes' | 'notes',
    val: any
  ) => {
    const updated = [...deliveryPlaces];
    updated[idx] = { ...updated[idx], [field]: val };
    setDeliveryPlaces(updated);
  };

  const handleQuickSnippet = (snippet: string) => {
    setWorkDescription((prev) => {
      const trimmed = prev.trim();
      return trimmed ? `${trimmed} ${snippet}` : snippet;
    });
  };

  const handleReceiptPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setMaintenanceBillPhoto(dataUrl);
      // Save offline image if available
      try {
        await saveOfflinePhoto({
          id: `photo-work-${Date.now()}`,
          photoName: file.name,
          dataUrl,
          timestamp: new Date().toISOString(),
          synced: !isEffectiveOffline,
        });
      } catch (err) {
        console.error('Offline photo cache error:', err);
      }
    };
    reader.readAsDataURL(file);
  };

  // Submit Driver Daily Work Form (IndexedDB Safe & Offline First)
  const handleSaveDriverDailyWork = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!workVehicleNumber.trim()) {
      alert('Please mention the Vehicle Number to track work fast.');
      return;
    }

    const cleanVehicle = workVehicleNumber.trim().toUpperCase();
    const finalDeliveriesCount = Number(deliveriesCount) || deliveryPlaces.length || 0;
    const totalKm = Math.max(0, Number(endOdoKm) - Number(startOdoKm));

    const workPayload: Partial<DriverDailyWork> & { vehicleNumber: string } = {
      id: `WRK-${Date.now().toString().slice(-6)}`,
      date: workDate,
      driverId: activeDriver?.id || 'drv-1',
      driverName: activeDriver?.fullName || 'Sukhwinder Singh',
      vehicleNumber: cleanVehicle,
      deliveriesCount: finalDeliveriesCount,
      deliveryLocations: deliveryPlaces.filter((p) => p.placeName.trim() !== ''),
      workCategories: workCategories.length > 0 ? workCategories : ['Fruit / Goods Delivery'],
      workDescription: workDescription.trim(),
      hadTyreChangeOrMaintenance: hadVehicleMaintenance,
      maintenanceDetails: hadVehicleMaintenance
        ? {
            component: maintenanceComponent,
            actionTaken: maintenanceAction,
            workshopName: maintenanceWorkshop,
            expenseAmount: Number(maintenanceExpense) || 0,
            paidBy: maintenancePaidBy,
            billInvoiceNumber: maintenanceBillNumber,
            billPhotoUrl: maintenanceBillPhoto || undefined,
          }
        : undefined,
      startOdometer: Number(startOdoKm) || undefined,
      endOdometer: Number(endOdoKm) || undefined,
      totalKmRun: totalKm,
      notes: `Work Shift: ${workShift}`,
      status: isEffectiveOffline ? 'saved_locally' : 'synced_to_cloud',
    };

    if (isEffectiveOffline) {
      // 1. Save locally via context
      addDriverDailyWork(workPayload);

      // 2. Queue mutation in IndexedDB
      await queueOfflineMutation(
        'SAVE_DRIVER_DAILY_WORK',
        `Daily Work [${cleanVehicle}]: ${finalDeliveriesCount} Deliveries • ${hadVehicleMaintenance ? maintenanceComponent : 'Transport Run'}`,
        workPayload
      );

      await refreshStorageInfo();
      setIsDailyWorkFormOpen(false);
      alert(
        `⚡ Driver Daily Work Saved to Local IndexedDB!\n\nVehicle Number: ${cleanVehicle}\nDeliveries: ${finalDeliveriesCount}\nMaintenance: ${hadVehicleMaintenance ? maintenanceComponent : 'None'}\n\nRecord is stored offline-safe on this phone and will automatically sync with Fleet Cloud.`
      );
    } else {
      // Online save
      addDriverDailyWork(workPayload);
      setIsDailyWorkFormOpen(false);
      alert(
        `✓ Driver Daily Work Recorded!\nVehicle ${cleanVehicle} work details, delivery counts, and maintenance tracked successfully.`
      );
    }
  };

  // ==========================================
  // ACTION: SAVE RETURN LOAD (IndexedDB Safe with Multi-Location Delivery)
  // User Prompt: "...add option How many location to Delivered on which Location"
  // ==========================================
  const handleSaveReturnLoad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTrip) {
      alert('Please select or create an active trip first.');
      return;
    }

    const totalQty = driverDeliveryLocations.reduce((sum, l) => sum + (Number(l.quantity) || 0), 0);
    const totalWt = driverDeliveryLocations.reduce((sum, l) => sum + (Number(l.weightKg) || 0), 0);
    const consolidatedCities = driverDeliveryLocations.map((l) => l.city).filter(Boolean);
    const computedCity = consolidatedCities.length > 1
      ? `${consolidatedCities.join(' → ')} (${consolidatedCities.length} Locations)`
      : (consolidatedCities[0] || 'Pune') + ' (Maharashtra)';

    const loadId = `RET-${Date.now().toString().slice(-4)}`;
    const fullLoad: ReturnLoad = {
      id: loadId,
      tripId: currentTrip.id,
      loadingPartyName: returnLoadData.loadingPartyName,
      loadingCity: returnLoadData.loadingCity,
      deliveryCity: computedCity,
      deliveryLocationsCount: driverDeliveryLocations.length,
      deliveryLocations: driverDeliveryLocations,
      goodsDescription: returnLoadData.goodsDescription,
      quantity: totalQty || Number(returnLoadData.quantity) || 1,
      weightKg: totalWt || Number(returnLoadData.weightKg) || 1000,
      loadRentCharge: Number(returnLoadData.loadRentCharge) || 5000,
      isSettled: false,
      lrNumber: returnLoadData.lrNumber || `LR-RT-${Date.now().toString().slice(-4)}`,
      hasStampedLR: returnLoadData.hasStampedLR,
      lrSubmittedToParty: false,
      paymentStatus: 'pending',
      dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      vehicleNumber: assignedVehicle.number,
      driverName: activeDriver.fullName,
      notes: returnLoadData.notes,
    };

    // Always persist to IndexedDB store for zero-loss offline accessibility
    await saveReturnLoadOffline(fullLoad);

    if (isEffectiveOffline) {
      await queueOfflineMutation(
        'SAVE_RETURN_LOAD',
        `Return Load: ${fullLoad.loadingPartyName} (${fullLoad.loadingCity} → ${fullLoad.deliveryCity}) ₹${fullLoad.loadRentCharge.toLocaleString('en-IN')}`,
        {
          tripId: currentTrip.id,
          returnData: fullLoad,
        }
      );
      await refreshStorageInfo();
      setIsNewReturnLoadOpen(false);
      alert(
        `⚡ Return Load Saved locally in IndexedDB!\n\nYour return load details (${fullLoad.goodsDescription}) from ${fullLoad.loadingCity} have been securely stored in this device's IndexedDB. They will automatically sync when network coverage is restored.`
      );
    } else {
      addReturnLoad(currentTrip.id, fullLoad);
      await refreshStorageInfo();
      setIsNewReturnLoadOpen(false);
      alert(`Return Load ${fullLoad.id} saved successfully and added to Fleet records!`);
    }
  };

  // ==========================================
  // ACTION: CAPTURE & UPLOAD STAMPED LR PHOTO (IndexedDB Safe)
  // ==========================================
  const handlePhotoFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      const photoName = `stamped_lr_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      setPhotoDataUrl(dataUrl);
      setUploadedStampPhoto(photoName);

      // Save to IndexedDB photos store
      await saveOfflinePhoto({
        id: `photo-${Date.now()}`,
        tripId: currentTrip?.id,
        photoName,
        dataUrl,
        timestamp: new Date().toISOString(),
        synced: !isEffectiveOffline,
      });

      if (isEffectiveOffline) {
        await queueOfflineMutation(
          'UPLOAD_STAMPED_LR',
          `Stamped LR Photo: ${photoName} (${currentTrip?.id || 'Active Trip'})`,
          {
            tripId: currentTrip?.id,
            photoName,
          }
        );
        alert(
          '⚡ Stamped LR Photo stored in device IndexedDB! Safe from network dropouts. Queued for auto-upload upon network restoration.'
        );
      } else {
        if (currentTrip) {
          uploadStampedLRPhoto(currentTrip.id, dataUrl, photoName);
        }
        alert('Stamped LR photo uploaded successfully! Transmitted to Admin/User.');
      }

      await refreshStorageInfo();
    };
    reader.readAsDataURL(file);
  };

  const handleSimulatePhotoUpload = async () => {
    const photoName = `stamped_lr_photo_${Date.now().toString().slice(-4)}.jpg`;
    setUploadedStampPhoto(photoName);

    // Save offline photo entry
    await saveOfflinePhoto({
      id: `photo-${Date.now()}`,
      tripId: currentTrip?.id,
      photoName,
      dataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"><rect width="100%" height="100%" fill="%23e0f2fe"/><text x="50%" y="45%" font-size="14" font-family="sans-serif" fill="%230369a1" text-anchor="middle" font-weight="bold">STAMPED LR VERIFIED</text><text x="50%" y="65%" font-size="11" font-family="sans-serif" fill="%230284c7" text-anchor="middle">OFFICIAL CONSIGNEE RUBBER STAMP</text></svg>',
      timestamp: new Date().toISOString(),
      synced: !isEffectiveOffline,
    });

    if (isEffectiveOffline) {
      await queueOfflineMutation(
        'UPLOAD_STAMPED_LR',
        `Stamped LR Photo: ${photoName} (${currentTrip?.id || 'Active Trip'})`,
        {
          tripId: currentTrip?.id,
          photoName,
        }
      );
      alert(
        '⚡ Stamped LR photo saved in device IndexedDB! Queued for auto-upload when you regain network coverage.'
      );
    } else {
      if (currentTrip) {
        uploadStampedLRPhoto(currentTrip.id, photoName);
      }
      alert('Stamped LR photo uploaded successfully! Transmitted to Admin/User.');
    }

    await refreshStorageInfo();
  };

  // ==========================================
  // ACTION: SAVE ODOMETER (IndexedDB Safe)
  // ==========================================
  const handleSaveEndOdo = async (e: React.FormEvent) => {
    e.preventDefault();
    const odoValue = Number(endOdo);

    if (isEffectiveOffline) {
      await queueOfflineMutation(
        'UPDATE_ODOMETER',
        `Log Odometer: ${assignedVehicle.number} → ${odoValue} KM`,
        {
          vehicleId: assignedVehicle.id,
          newOdo: odoValue,
        }
      );
      await refreshStorageInfo();
      alert(`⚡ End Odometer ${odoValue} KM stored in local IndexedDB! Queued for cloud sync.`);
    } else {
      updateOdometer(assignedVehicle.id, odoValue);
      alert(`End Odometer ${odoValue} KM logged successfully!`);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* ======================================================== */}
      {/* 1. HIGHWAY NETWORK CONNECTIVITY & INDEXEDDB STATUS BANNER */}
      {/* ======================================================== */}
      <div
        className={`p-3.5 rounded-2xl border transition-all ${
          isEffectiveOffline
            ? 'bg-amber-500/10 border-amber-300 text-amber-950 shadow-sm'
            : 'bg-emerald-500/10 border-emerald-300 text-emerald-950 shadow-xs'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                isEffectiveOffline
                  ? 'bg-amber-500 text-white animate-pulse'
                  : 'bg-emerald-600 text-white'
              }`}
            >
              {isEffectiveOffline ? <WifiOff className="w-5 h-5" /> : <Wifi className="w-5 h-5" />}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-extrabold text-xs sm:text-sm">
                  {isEffectiveOffline
                    ? 'Poor Highway Network / Offline Mode'
                    : 'Network Connected (Cloud Synced)'}
                </span>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    isEffectiveOffline
                      ? 'bg-amber-200/80 text-amber-900 border border-amber-300'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  }`}
                >
                  {isEffectiveOffline ? 'IndexedDB Active' : 'Live Cloud'}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5">
                {isEffectiveOffline
                  ? 'All trip entries, return loads, and photos are safely stored in your phone’s IndexedDB.'
                  : `Online. Using IndexedDB local storage cache (${dbSummary.tripsCount} trips, ${dbSummary.loadsCount} loads cached).`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Highway Dead Zone Simulator Toggle (Lets user easily test offline IndexedDB behavior) */}
            <button
              type="button"
              onClick={() => setIsSimulatedOffline(!isSimulatedOffline)}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer font-heading flex items-center gap-1 ${
                isSimulatedOffline
                  ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
              title="Toggle to simulate poor network reception on highway routes (e.g., Kasara Ghat / Bharuch stretch)"
            >
              <HardDrive className="w-3.5 h-3.5" />
              <span>{isSimulatedOffline ? 'End Simulation' : 'Simulate Low Coverage'}</span>
            </button>

            {/* Sync Queue Badge / Drawer Trigger */}
            <button
              type="button"
              onClick={() => setIsQueueDrawerOpen(true)}
              className={`relative px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer font-heading flex items-center gap-1 ${
                dbSummary.pendingCount > 0
                  ? 'bg-amber-600 text-white border-amber-700 animate-pulse'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Queue ({dbSummary.pendingCount})</span>
            </button>
          </div>
        </div>

        {/* Sync Feedback Message */}
        {syncFeedback && (
          <div className="mt-2 text-xs font-bold font-mono text-sky-900 bg-white/80 p-2 rounded-lg border border-sky-200 flex items-center gap-2 animate-fadeIn">
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-sky-600' : 'text-emerald-600'}`} />
            <span>{syncFeedback}</span>
          </div>
        )}

        {/* Quick Pending Bar with Sync Now button if items pending */}
        {dbSummary.pendingCount > 0 && !isEffectiveOffline && (
          <div className="mt-2 pt-2 border-t border-amber-200/80 flex items-center justify-between text-xs">
            <span className="text-amber-900 font-medium">
              ⚡ <strong>{dbSummary.pendingCount} record(s)</strong> saved in local IndexedDB awaiting cloud sync.
            </span>
            <button
              type="button"
              onClick={handleTriggerSync}
              disabled={isSyncing}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-md shadow-xs flex items-center gap-1 font-heading cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
            </button>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 2. DRIVER CAB PROFILE HEADER & TABS                      */}
      {/* ======================================================== */}
      <div className="bg-gradient-to-r from-sky-800 via-sky-700 to-sky-600 text-white p-5 rounded-2xl shadow-md shadow-sky-900/10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-xs border border-white/30 text-white font-heading font-black text-lg flex items-center justify-center">
              {activeDriver.fullName[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading font-extrabold text-base leading-tight">
                  {activeDriver.fullName}
                </h2>
                <span className="bg-emerald-400/25 border border-emerald-300/40 text-[10px] font-bold px-2 py-0.5 rounded-full text-emerald-100 font-mono">
                  Offline-Ready PWA
                </span>
              </div>
              <p className="text-xs text-sky-100 font-mono mt-0.5">
                Assigned Truck: <strong className="text-white bg-sky-900/60 px-1.5 py-0.2 rounded">{assignedVehicle.number}</strong> ({assignedVehicle.capacityMt} MT / {assignedVehicle.capacityKg.toLocaleString()} KG)
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="bg-sky-400/30 text-sky-100 border border-sky-300/40 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider font-mono block">
              Active in Cab
            </span>
            <span className="text-[10px] text-sky-200 font-mono mt-1 block">
              Storage: {dbSummary.isFallback ? 'Local Backup' : 'IndexedDB'}
            </span>
          </div>
        </div>

        {/* 4 Driver Subtabs (Including Return Loads) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-sky-900/50 backdrop-blur-xs p-1 rounded-xl text-xs font-bold border border-sky-500/30">
          <button
            onClick={() => setDriverTab('daily_trip')}
            className={`py-2 px-2 rounded-lg transition-all cursor-pointer font-heading text-center flex items-center justify-center gap-1 ${
              driverTab === 'daily_trip'
                ? 'bg-white text-sky-950 shadow-sm'
                : 'text-sky-100 hover:text-white hover:bg-white/10'
            }`}
          >
            <span>1. Daily Work of Driver</span>
            {driverDailyWorks.length > 0 && (
              <span className="bg-sky-500 text-white text-[9px] px-1.5 py-0.2 rounded-full font-mono">
                {driverDailyWorks.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setDriverTab('return_loads')}
            className={`py-2 px-2 rounded-lg transition-all cursor-pointer font-heading text-center flex items-center justify-center gap-1 ${
              driverTab === 'return_loads'
                ? 'bg-white text-sky-950 shadow-sm'
                : 'text-sky-100 hover:text-white hover:bg-white/10'
            }`}
          >
            <span>2. Return Loads</span>
            {localReturnLoads.length > 0 && (
              <span className="bg-sky-500 text-white text-[9px] px-1.5 py-0.2 rounded-full font-mono">
                {localReturnLoads.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setDriverTab('stamped_lr')}
            className={`py-2 px-2 rounded-lg transition-all cursor-pointer font-heading text-center ${
              driverTab === 'stamped_lr'
                ? 'bg-white text-sky-950 shadow-sm'
                : 'text-sky-100 hover:text-white hover:bg-white/10'
            }`}
          >
            3. Stamped LR
          </button>
          <button
            onClick={() => setDriverTab('vehicle_docs')}
            className={`py-2 px-2 rounded-lg transition-all cursor-pointer font-heading text-center ${
              driverTab === 'vehicle_docs'
                ? 'bg-white text-sky-950 shadow-sm'
                : 'text-sky-100 hover:text-white hover:bg-white/10'
            }`}
          >
            4. Vehicle Docs
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: SAVE DAILY WORK OF DRIVER & VEHICLE TRACKING      */}
      {/* User Requirement:                                       */}
      {/* "instead of this create a option to save a Daily Work of */}
      {/* Driver, How many Delivery they Delivered, and what work  */}
      {/* they did like for Vehical if Vehical has to change a tier*/}
      {/* thay can add they have changes the Tier of this Vehical   */}
      {/* and when driver saving the Daily Work they did they can   */}
      {/* also mention the Vehical Number to Track the work fast"   */}
      {/* ======================================================== */}
      {driverTab === 'daily_trip' && (
        <div className="space-y-4">
          {/* Quick Stats & Action Ribbon */}
          <div className="bg-white p-4 border border-sky-100 rounded-xl shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-heading font-extrabold text-sm text-sky-950 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-sky-600" />
                    <span>Daily Work of Driver</span>
                  </h3>
                  <span className="bg-sky-100 text-sky-800 border border-sky-200 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
                    {driverDailyWorks.length} Logged
                  </span>
                  {isEffectiveOffline && (
                    <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Database className="w-3 h-3 text-amber-700" />
                      <span>IndexedDB Offline Safe</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Save deliveries completed, vehicle maintenance (e.g. tyre changes), and mention Vehicle Number to track work fast.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsDailyWorkFormOpen(!isDailyWorkFormOpen)}
                className="px-4 py-2 bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-700 hover:to-sky-600 text-white font-bold text-xs rounded-xl shadow-sm shadow-sky-600/20 flex items-center gap-1.5 cursor-pointer font-heading self-start sm:self-auto transition-all"
              >
                {isDailyWorkFormOpen ? (
                  <>
                    <X className="w-4 h-4" />
                    <span>Close Form</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Save Daily Work</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-sky-50">
              <div className="p-2.5 bg-sky-50/60 border border-sky-100 rounded-lg">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 font-heading block">
                  Tracked Truck
                </span>
                <span className="font-mono font-black text-xs text-sky-950 truncate block mt-0.5">
                  {workVehicleNumber || assignedVehicle.number}
                </span>
              </div>
              <div className="p-2.5 bg-sky-50/60 border border-sky-100 rounded-lg">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 font-heading block">
                  Deliveries Done
                </span>
                <span className="font-mono font-black text-xs text-sky-950 block mt-0.5">
                  {driverDailyWorks.reduce((s, w) => s + (w.deliveriesCount || 0), 0)} Drops Logged
                </span>
              </div>
              <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-lg">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 font-heading block flex items-center gap-1">
                  <Disc className="w-3 h-3 text-amber-700" />
                  <span>Tyre / Repairs</span>
                </span>
                <span className="font-mono font-black text-xs text-amber-950 block mt-0.5">
                  {driverDailyWorks.filter((w) => w.hadTyreChangeOrMaintenance).length} Vehicle Works
                </span>
              </div>
              <div className="p-2.5 bg-sky-50/60 border border-sky-100 rounded-lg">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 font-heading block">
                  Current ODO
                </span>
                <span className="font-mono font-black text-xs text-sky-950 block mt-0.5">
                  {assignedVehicle.currentOdometer.toLocaleString()} KM
                </span>
              </div>
            </div>
          </div>

          {/* Form: SAVE DAILY WORK OF DRIVER */}
          {isDailyWorkFormOpen && (
            <div className="bg-white p-5 border-2 border-sky-200 rounded-2xl shadow-md space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-sky-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-heading font-extrabold text-sm text-sky-950">
                      Log Driver Daily Work & Vehicle Action
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Record deliveries completed, vehicle maintenance/tyre changes, and track fast by vehicle plate.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsDailyWorkFormOpen(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveDriverDailyWork} onKeyDown={(e) => handleFormKeyDown(e)} className="space-y-4 text-xs">
                {/* 1. VEHICLE NUMBER (PROMINENT - TO TRACK WORK FAST) */}
                <div className="p-3.5 bg-gradient-to-r from-sky-50 to-indigo-50/40 border border-sky-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <label className="font-heading font-extrabold text-sky-950 text-xs flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-sky-700" />
                      <span>Mention Vehicle Number (For Fast Work Tracking) *</span>
                    </label>
                    <span className="text-[10px] text-sky-700 font-mono font-bold">
                      Required for fleet maintenance history
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      value={workVehicleNumber}
                      onChange={(e) => setWorkVehicleNumber(e.target.value.toUpperCase())}
                      placeholder="e.g. MH-12-RN-4892 or GJ-03-XX-5512"
                      className="w-full bg-white border-2 border-sky-300 rounded-lg px-3 py-2 font-mono font-black text-sm text-sky-950 tracking-wider shadow-2xs focus:border-sky-600 focus:outline-none"
                    />

                    {/* Quick tap chips for all company fleet vehicles */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-slate-500 font-bold uppercase font-heading">
                        Select Truck:
                      </span>
                      {vehicles.map((v) => (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => {
                            setWorkVehicleNumber(v.number);
                            setEndOdoKm(v.currentOdometer);
                            setStartOdoKm(Math.max(0, v.currentOdometer - 280));
                          }}
                          className={`px-2 py-1 rounded-md font-mono text-[11px] font-bold border transition-all cursor-pointer ${
                            workVehicleNumber.replace(/\s+/g, '').toUpperCase() === v.number.replace(/\s+/g, '').toUpperCase()
                              ? 'bg-sky-600 text-white border-sky-700 shadow-2xs'
                              : 'bg-white text-sky-900 border-sky-200 hover:bg-sky-100'
                          }`}
                        >
                          {v.number}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 2. DATE, DRIVER & SHIFT */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-sky-800 mb-1 font-heading">
                      Date of Work
                    </label>
                    <input
                      type="date"
                      required
                      value={workDate}
                      onChange={(e) => setWorkDate(e.target.value)}
                      className="w-full bg-sky-50/50 border border-sky-200 rounded-lg px-2.5 py-1.5 font-mono text-xs font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-sky-800 mb-1 font-heading">
                      Driver Name
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={activeDriver?.fullName || 'Sukhwinder Singh'}
                      className="w-full bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-sky-800 mb-1 font-heading">
                      Shift / Run Type
                    </label>
                    <select
                      value={workShift}
                      onChange={(e) => setWorkShift(e.target.value as any)}
                      className="w-full bg-sky-50/50 border border-sky-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900"
                    >
                      <option value="Full Day Shift">Full Day Shift</option>
                      <option value="Outbound Mandi Delivery">Outbound Mandi Delivery</option>
                      <option value="Return Leg">Return Backhaul Leg</option>
                      <option value="Night Transit">Night Highway Transit</option>
                    </select>
                  </div>
                </div>

                {/* 3. HOW MANY DELIVERIES THEY DELIVERED */}
                <div className="p-3.5 bg-sky-50/40 border border-sky-200 rounded-xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <label className="font-heading font-extrabold text-sky-950 text-xs flex items-center gap-1.5">
                        <Package className="w-4 h-4 text-sky-700" />
                        <span>How Many Deliveries They Delivered Today?</span>
                      </label>
                      <p className="text-[11px] text-slate-500">
                        Select count or enter details of unloading places / mandis delivered
                      </p>
                    </div>

                    {/* Quick Count Selector */}
                    <div className="flex items-center gap-1 flex-wrap">
                      {[0, 1, 2, 3, 4, 5].map((cnt) => (
                        <button
                          key={cnt}
                          type="button"
                          onClick={() => {
                            setDeliveriesCount(cnt);
                            if (cnt === 0) {
                              setDeliveryPlaces([]);
                            } else if (deliveryPlaces.length < cnt) {
                              const diff = cnt - deliveryPlaces.length;
                              const toAdd = Array.from({ length: diff }, (_, i) => ({
                                id: `drop-${Date.now()}-${deliveryPlaces.length + i + 1}`,
                                placeName: i === 0 && cnt === 1 ? 'Surat Ring Road Fruit Mandi' : '',
                                city: 'Surat',
                                quantityBoxes: 50,
                                notes: '',
                              }));
                              setDeliveryPlaces([...deliveryPlaces, ...toAdd]);
                            } else if (deliveryPlaces.length > cnt) {
                              setDeliveryPlaces(deliveryPlaces.slice(0, cnt));
                            }
                          }}
                          className={`w-7 h-7 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
                            deliveriesCount === cnt
                              ? 'bg-sky-600 text-white shadow-2xs'
                              : 'bg-white text-sky-900 border border-sky-200 hover:bg-sky-100'
                          }`}
                        >
                          {cnt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* List of Delivery Places */}
                  {deliveriesCount > 0 && (
                    <div className="space-y-2 pt-2 border-t border-sky-100">
                      <div className="flex items-center justify-between text-[11px] font-bold text-sky-800 font-heading">
                        <span>Places / Mandis Delivered ({deliveryPlaces.length} Locations):</span>
                        <button
                          type="button"
                          onClick={handleAddDeliveryDrop}
                          className="text-sky-600 hover:underline flex items-center gap-0.5 cursor-pointer font-bold"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Another Location</span>
                        </button>
                      </div>

                      {deliveryPlaces.map((drop, dropIdx) => (
                        <div
                          key={drop.id}
                          className="p-2.5 bg-white border border-sky-200 rounded-lg grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                        >
                          <div className="sm:col-span-1 flex items-center gap-1 font-mono font-bold text-sky-800">
                            <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-800 text-[10px] flex items-center justify-center">
                              {dropIdx + 1}
                            </span>
                          </div>
                          <div className="sm:col-span-4">
                            <input
                              type="text"
                              value={drop.placeName}
                              onChange={(e) => handleDeliveryDropChange(dropIdx, 'placeName', e.target.value)}
                              placeholder="Mandi / Unloading Godown Name"
                              className="w-full bg-sky-50/30 border border-sky-200 rounded px-2 py-1 text-xs"
                            />
                          </div>
                          <div className="sm:col-span-3">
                            <input
                              type="text"
                              value={drop.city}
                              onChange={(e) => handleDeliveryDropChange(dropIdx, 'city', e.target.value)}
                              placeholder="City (e.g. Surat, Ahmedabad)"
                              className="w-full bg-sky-50/30 border border-sky-200 rounded px-2 py-1 text-xs font-bold"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <input
                              type="number"
                              min="0"
                              value={drop.quantityBoxes || ''}
                              onChange={(e) => handleDeliveryDropChange(dropIdx, 'quantityBoxes', Number(e.target.value))}
                              placeholder="Boxes/Crates"
                              className="w-full bg-sky-50/30 border border-sky-200 rounded px-2 py-1 text-xs font-mono text-center"
                            />
                          </div>
                          <div className="sm:col-span-2 flex items-center gap-1 justify-end">
                            <input
                              type="text"
                              value={drop.notes || ''}
                              onChange={(e) => handleDeliveryDropChange(dropIdx, 'notes', e.target.value)}
                              placeholder="Notes (e.g. Empties taken)"
                              className="w-full bg-sky-50/30 border border-sky-200 rounded px-2 py-1 text-[11px]"
                            />
                            {deliveryPlaces.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveDeliveryDrop(dropIdx)}
                                className="text-slate-300 hover:text-rose-600 p-1 cursor-pointer"
                                title="Remove location"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 4. WHAT WORK THEY DID (ACTIVITY CATEGORIES & WORK SUMMARY) */}
                <div className="p-3.5 bg-sky-50/40 border border-sky-200 rounded-xl space-y-3">
                  <div>
                    <label className="font-heading font-extrabold text-sky-950 text-xs flex items-center gap-1.5">
                      <Wrench className="w-4 h-4 text-sky-700" />
                      <span>What Work Did They Do Today? (Select Work Types) *</span>
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Tap all work activities completed today:
                    </p>
                  </div>

                  {/* Multi-select Work Category Badges */}
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { name: 'Tyre Replacement / Change', icon: Disc, highlight: true },
                      { name: 'Fruit / Goods Delivery', icon: Package },
                      { name: 'Return Goods Unloading', icon: Truck },
                      { name: 'Tyre Puncture & Air Check', icon: Gauge },
                      { name: 'Engine Oil & Filter Service', icon: Wrench },
                      { name: 'Washing & Greasing', icon: Sparkles },
                      { name: 'Brake / Clutch Repair', icon: Wrench },
                      { name: 'Battery / Electrical', icon: Battery },
                      { name: 'Diesel Refuel', icon: Fuel },
                      { name: 'Toll / Border Tax / RTO', icon: FileCheck },
                      { name: 'Transit Driving', icon: Navigation },
                    ].map((cat) => {
                      const isSelected = workCategories.includes(cat.name);
                      const Icon = cat.icon || Wrench;
                      return (
                        <button
                          key={cat.name}
                          type="button"
                          onClick={() => handleToggleCategory(cat.name)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            isSelected
                              ? cat.highlight
                                ? 'bg-amber-500 text-white shadow-xs ring-2 ring-amber-300'
                                : 'bg-sky-600 text-white shadow-xs'
                              : cat.highlight
                              ? 'bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 font-extrabold'
                              : 'bg-white text-slate-700 border border-sky-200 hover:bg-sky-50'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5 shrink-0" />
                          <span>{cat.name}</span>
                          {isSelected && <Check className="w-3 h-3 ml-0.5" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Work Description Text Area */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] uppercase font-bold text-sky-900 font-heading">
                        Work Description & Details
                      </label>
                      <div className="flex items-center gap-1 text-[10px] text-sky-700">
                        <span className="font-bold">Quick Templates:</span>
                        <button
                          type="button"
                          onClick={() => handleQuickSnippet('Changed rear right tyre with new MRF radial tyre at highway workshop due to puncture.')}
                          className="hover:underline font-semibold bg-white px-1.5 py-0.5 rounded border border-sky-200 cursor-pointer text-amber-800"
                        >
                          + Tyre Changed
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickSnippet('Delivered fruit crates to Surat & Navsari Mandis without damages.')}
                          className="hover:underline font-semibold bg-white px-1.5 py-0.5 rounded border border-sky-200 cursor-pointer"
                        >
                          + Mandi Delivered
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickSnippet('Completed full vehicle greasing and checked all tyre air pressures.')}
                          className="hover:underline font-semibold bg-white px-1.5 py-0.5 rounded border border-sky-200 cursor-pointer"
                        >
                          + Greasing & Air
                        </button>
                      </div>
                    </div>
                    <textarea
                      rows={3}
                      required
                      value={workDescription}
                      onChange={(e) => setWorkDescription(e.target.value)}
                      placeholder="Describe the work done today (e.g. Delivered 120 crates in Surat APMC, changed tyre at Surat bypass due to puncture, checked engine oil)..."
                      className="w-full bg-white border border-sky-200 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-sky-500"
                    />
                  </div>
                </div>

                {/* 5. VEHICLE TYRE CHANGE & MAINTENANCE DETAILS (FEATURED USER REQUIREMENT) */}
                <div
                  className={`p-4 rounded-xl border-2 transition-all space-y-3 ${
                    hadVehicleMaintenance
                      ? 'bg-amber-50/60 border-amber-300'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold">
                        <Disc className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-heading font-extrabold text-amber-950 text-xs block">
                          Vehicle Tyre Change & Maintenance Entry
                        </span>
                        <span className="text-[11px] text-amber-800">
                          Did this vehicle ({workVehicleNumber}) undergo a Tyre Change, Puncture, or Repair today?
                        </span>
                      </div>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer font-heading font-bold text-xs bg-white px-3 py-1.5 rounded-lg border border-amber-300 shadow-2xs">
                      <input
                        type="checkbox"
                        checked={hadVehicleMaintenance}
                        onChange={(e) => setHadVehicleMaintenance(e.target.checked)}
                        className="w-4 h-4 text-amber-600 rounded border-amber-300 focus:ring-amber-500 cursor-pointer"
                      />
                      <span className="text-amber-950">Yes, Tyre / Vehicle Work Done</span>
                    </label>
                  </div>

                  {hadVehicleMaintenance && (
                    <div className="space-y-3 pt-3 border-t border-amber-200 animate-in fade-in duration-100">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-amber-950 font-heading mb-1">
                            Tyre Position / Component *
                          </label>
                          <select
                            value={maintenanceComponent}
                            onChange={(e) => setMaintenanceComponent(e.target.value)}
                            className="w-full bg-white border border-amber-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900"
                          >
                            <option value="Rear Right Outer Tyre">Rear Right Outer Tyre</option>
                            <option value="Rear Right Inner Tyre">Rear Right Inner Tyre</option>
                            <option value="Rear Left Outer Tyre">Rear Left Outer Tyre</option>
                            <option value="Rear Left Inner Tyre">Rear Left Inner Tyre</option>
                            <option value="Front Left Steer Tyre">Front Left Steer Tyre</option>
                            <option value="Front Right Steer Tyre">Front Right Steer Tyre</option>
                            <option value="Spare Stepney Tyre">Spare Stepney Tyre</option>
                            <option value="All 10 Tyres Pressure & Alignment">All 10 Tyres Pressure & Alignment</option>
                            <option value="Engine Oil & Oil Filter">Engine Oil & Oil Filter</option>
                            <option value="Brake Shoes & Liner">Brake Shoes & Liner</option>
                            <option value="Battery / Electrical">Battery / Electrical</option>
                            <option value="Chassis Greasing & Washing">Chassis Greasing & Washing</option>
                            <option value="Other Vehicle Part">Other Vehicle Part</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase font-bold text-amber-950 font-heading mb-1">
                            Action Taken *
                          </label>
                          <select
                            value={maintenanceAction}
                            onChange={(e) => setMaintenanceAction(e.target.value)}
                            className="w-full bg-white border border-amber-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900"
                          >
                            <option value="Replaced with New Radial Tyre">Replaced with New Radial Tyre</option>
                            <option value="Retreaded / Remould Tyre Installed">Retreaded / Remould Tyre Installed</option>
                            <option value="Puncture Repaired / Vulcanized">Puncture Repaired / Vulcanized</option>
                            <option value="Tyres Rotated & Balanced">Tyres Rotated & Balanced</option>
                            <option value="New Spare Part Installed">New Spare Part Installed</option>
                            <option value="Oil Topped up / Replaced">Oil Topped up / Replaced</option>
                            <option value="Greasing & Washing Done">Greasing & Washing Done</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase font-bold text-amber-950 font-heading mb-1">
                            Tyre / Part Brand & Model
                          </label>
                          <input
                            type="text"
                            value={maintenanceTyreBrand}
                            onChange={(e) => setMaintenanceTyreBrand(e.target.value)}
                            placeholder="e.g. MRF Steel Muscle 10.00 R20, Apollo, JK Tyre"
                            className="w-full bg-white border border-amber-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-medium"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] uppercase font-bold text-amber-950 font-heading mb-1">
                            Workshop / Tyre Shop Name & Location
                          </label>
                          <input
                            type="text"
                            value={maintenanceWorkshop}
                            onChange={(e) => setMaintenanceWorkshop(e.target.value)}
                            placeholder="e.g. National Tyre Care, Surat NH-48 Bypass"
                            className="w-full bg-white border border-amber-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase font-bold text-amber-950 font-heading mb-1">
                            Expense Amount (₹)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={maintenanceExpense}
                            onChange={(e) => setMaintenanceExpense(Number(e.target.value))}
                            className="w-full bg-white border border-amber-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-amber-950"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase font-bold text-amber-950 font-heading mb-1">
                            Paid By
                          </label>
                          <select
                            value={maintenancePaidBy}
                            onChange={(e) => setMaintenancePaidBy(e.target.value as any)}
                            className="w-full bg-white border border-amber-300 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-900"
                          >
                            <option value="company_account">Company Account / UPI</option>
                            <option value="driver_cash">Driver Cash (Reimbursable)</option>
                            <option value="fastag_fuel_card">Fleet Card / Fastag</option>
                          </select>
                        </div>
                      </div>

                      {/* Bill Number & Photo Upload */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-center pt-1">
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-amber-950 font-heading mb-1">
                            Bill / Challan Invoice Number
                          </label>
                          <input
                            type="text"
                            value={maintenanceBillNumber}
                            onChange={(e) => setMaintenanceBillNumber(e.target.value)}
                            placeholder="e.g. INV-TYR-9981"
                            className="w-full bg-white border border-amber-300 rounded-lg px-2.5 py-1.5 text-xs font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase font-bold text-amber-950 font-heading mb-1">
                            Bill / Tyre Receipt Photo
                          </label>
                          <div className="flex items-center gap-2">
                            <label className="px-3 py-1.5 bg-white border border-amber-300 hover:bg-amber-50 rounded-lg text-xs font-bold text-amber-900 flex items-center gap-1.5 cursor-pointer shadow-2xs font-heading">
                              <Camera className="w-3.5 h-3.5 text-amber-700" />
                              <span>{maintenanceBillPhoto ? 'Change Photo' : 'Upload / Capture Bill'}</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleReceiptPhotoUpload}
                                className="hidden"
                              />
                            </label>
                            {maintenanceBillPhoto && (
                              <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 font-mono">
                                <Check className="w-3 h-3" />
                                <span>Receipt Attached</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 6. ODOMETER & DISTANCE RUN */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-sky-50/40 border border-sky-200 rounded-xl">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-sky-800 mb-1 font-heading">
                      Start Odometer (KM)
                    </label>
                    <input
                      type="number"
                      value={startOdoKm}
                      onChange={(e) => setStartOdoKm(Number(e.target.value))}
                      className="w-full bg-white border border-sky-200 rounded-lg px-2.5 py-1.5 font-mono text-xs font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-sky-800 mb-1 font-heading">
                      End Odometer (KM)
                    </label>
                    <input
                      type="number"
                      value={endOdoKm}
                      onChange={(e) => setEndOdoKm(Number(e.target.value))}
                      className="w-full bg-white border border-sky-200 rounded-lg px-2.5 py-1.5 font-mono text-xs font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-sky-800 mb-1 font-heading">
                      Calculated KM Run
                    </label>
                    <div className="w-full bg-sky-100 border border-sky-200 rounded-lg px-2.5 py-1.5 font-mono text-xs font-black text-sky-950 flex items-center justify-between">
                      <span>{Math.max(0, endOdoKm - startOdoKm).toLocaleString()} KM</span>
                      <span className="text-[10px] font-medium text-sky-700">Today's Run</span>
                    </div>
                  </div>
                </div>

                {/* 7. SUBMIT BUTTON */}
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsDailyWorkFormOpen(false)}
                    className="px-4 py-2 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer font-heading"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-700 hover:to-sky-600 text-white font-bold text-xs rounded-xl shadow-md shadow-sky-600/20 flex items-center gap-2 cursor-pointer font-heading transition-all"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Daily Work for Vehicle ({workVehicleNumber})</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* FAST TRACKING FILTER & HISTORY OF DRIVER DAILY WORK */}
          <div className="bg-white p-4 border border-sky-100 rounded-xl shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-sky-100">
              <div>
                <h4 className="font-heading font-extrabold text-sm text-sky-950 flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-sky-600" />
                  <span>Track Daily Work by Vehicle Number</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  Search & inspect daily deliveries, tyre changes, and maintenance for any vehicle
                </p>
              </div>

              {/* Search input */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search vehicle #, tyre, mandi..."
                  className="w-full bg-sky-50/50 border border-sky-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:outline-sky-500"
                />
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              {/* Vehicle Number Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-bold uppercase text-sky-800 font-heading">
                  Filter Vehicle:
                </span>
                <button
                  type="button"
                  onClick={() => setFilterVehicleNumber('ALL')}
                  className={`px-2 py-0.5 rounded-full text-xs font-bold transition-all cursor-pointer font-mono ${
                    filterVehicleNumber === 'ALL'
                      ? 'bg-sky-600 text-white'
                      : 'bg-sky-50 text-sky-800 border border-sky-200 hover:bg-sky-100'
                  }`}
                >
                  All Vehicles ({driverDailyWorks.length})
                </button>
                {vehicles.map((v) => {
                  const countForV = driverDailyWorks.filter(
                    (w) => w.vehicleNumber.replace(/\s+/g, '').toUpperCase() === v.number.replace(/\s+/g, '').toUpperCase()
                  ).length;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setFilterVehicleNumber(v.number)}
                      className={`px-2 py-0.5 rounded-full text-xs font-bold transition-all cursor-pointer font-mono ${
                        filterVehicleNumber === v.number
                          ? 'bg-sky-600 text-white shadow-2xs'
                          : 'bg-sky-50 text-sky-800 border border-sky-200 hover:bg-sky-100'
                      }`}
                    >
                      {v.number} ({countForV})
                    </button>
                  );
                })}
              </div>

              {/* Work Category Pills */}
              <div className="flex items-center gap-1 flex-wrap">
                <button
                  type="button"
                  onClick={() => setFilterCategory('ALL')}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all cursor-pointer font-heading ${
                    filterCategory === 'ALL'
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  All Types
                </button>
                <button
                  type="button"
                  onClick={() => setFilterCategory('TYRE')}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all cursor-pointer font-heading flex items-center gap-1 ${
                    filterCategory === 'TYRE'
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  <Disc className="w-3 h-3" />
                  <span>Tyre Changes Only</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFilterCategory('DELIVERY')}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all cursor-pointer font-heading ${
                    filterCategory === 'DELIVERY'
                      ? 'bg-sky-700 text-white'
                      : 'bg-sky-50 text-sky-900 border border-sky-200 hover:bg-sky-100'
                  }`}
                >
                  Deliveries Only
                </button>
              </div>
            </div>

            {/* List of Filtered Daily Work Records */}
            <div className="space-y-3 pt-2">
              {driverDailyWorks
                .filter((work) => {
                  if (
                    filterVehicleNumber !== 'ALL' &&
                    work.vehicleNumber.replace(/\s+/g, '').toUpperCase() !== filterVehicleNumber.replace(/\s+/g, '').toUpperCase()
                  ) {
                    return false;
                  }
                  if (filterCategory === 'TYRE' && !work.hadTyreChangeOrMaintenance) {
                    return false;
                  }
                  if (filterCategory === 'DELIVERY' && (!work.deliveriesCount || work.deliveriesCount === 0)) {
                    return false;
                  }
                  if (searchQuery.trim()) {
                    const q = searchQuery.toLowerCase();
                    const matchVehicle = work.vehicleNumber.toLowerCase().includes(q);
                    const matchDesc = work.workDescription.toLowerCase().includes(q);
                    const matchDriver = work.driverName.toLowerCase().includes(q);
                    const matchShop = work.maintenanceDetails?.workshopName?.toLowerCase().includes(q);
                    const matchPart = work.maintenanceDetails?.component?.toLowerCase().includes(q);
                    return matchVehicle || matchDesc || matchDriver || matchShop || matchPart;
                  }
                  return true;
                })
                .map((work) => (
                  <div
                    key={work.id}
                    className="p-4 bg-sky-50/30 border border-sky-200 rounded-xl space-y-2.5 hover:border-sky-400 transition-all shadow-2xs"
                  >
                    {/* Top Row: Vehicle Number, Date, Status */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-sky-100">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Prominent Vehicle Number Badge */}
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-sky-800 to-sky-700 text-white rounded-lg shadow-2xs">
                          <Truck className="w-3.5 h-3.5 text-sky-200" />
                          <span className="font-mono font-black text-xs tracking-wider">
                            {work.vehicleNumber}
                          </span>
                        </div>

                        {/* Deliveries Badge */}
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                          <Package className="w-3 h-3 text-emerald-700" />
                          <span>{work.deliveriesCount} Deliveries Completed</span>
                        </span>

                        {/* Tyre Change Tag */}
                        {work.hadTyreChangeOrMaintenance && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-heading bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                            <Disc className="w-3 h-3 text-amber-700" />
                            <span>Tyre / Maintenance Done</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-slate-500 font-bold">
                          {work.date} • {work.driverName}
                        </span>

                        <span
                          className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase ${
                            work.status === 'saved_locally'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-sky-100 text-sky-800 border border-sky-300'
                          }`}
                        >
                          {work.status === 'saved_locally' ? 'IndexedDB Local' : 'Cloud Synced'}
                        </span>
                      </div>
                    </div>

                    {/* Tyre / Maintenance Highlight Card if present */}
                    {work.hadTyreChangeOrMaintenance && work.maintenanceDetails && (
                      <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-lg space-y-1.5">
                        <div className="flex items-center justify-between flex-wrap gap-1">
                          <span className="font-heading font-extrabold text-xs text-amber-950 flex items-center gap-1.5">
                            <Disc className="w-3.5 h-3.5 text-amber-700" />
                            <span>
                              {work.maintenanceDetails.component}: {work.maintenanceDetails.actionTaken}
                            </span>
                          </span>

                          {work.maintenanceDetails.expenseAmount !== undefined && (
                            <span className="font-mono font-black text-xs text-amber-950 bg-white px-2 py-0.5 rounded border border-amber-200">
                              ₹{work.maintenanceDetails.expenseAmount.toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-amber-900 font-medium flex flex-wrap items-center gap-x-3 gap-y-1">
                          {work.maintenanceDetails.workshopName && (
                            <span>Workshop: <strong>{work.maintenanceDetails.workshopName}</strong></span>
                          )}
                          {work.maintenanceDetails.billInvoiceNumber && (
                            <span className="font-mono">Bill #: <strong>{work.maintenanceDetails.billInvoiceNumber}</strong></span>
                          )}
                          {work.maintenanceDetails.paidBy && (
                            <span className="capitalize">Paid via: <strong>{work.maintenanceDetails.paidBy.replace(/_/g, ' ')}</strong></span>
                          )}
                        </div>

                        {/* Bill Photo Thumbnail */}
                        {work.maintenanceDetails.billPhotoUrl && (
                          <div className="pt-1 flex items-center gap-2">
                            <img
                              src={work.maintenanceDetails.billPhotoUrl}
                              alt="Bill receipt"
                              className="w-14 h-14 object-cover rounded-md border border-amber-300 shadow-2xs cursor-pointer hover:scale-105 transition-all"
                              onClick={() => setSelectedWorkSlip(work)}
                              title="Click to view full voucher receipt"
                            />
                            <span className="text-[10px] text-amber-800 font-medium">
                              (Bill receipt photo attached)
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Delivery Locations breakdown */}
                    {work.deliveryLocations && work.deliveryLocations.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                        <span className="text-slate-500 font-bold">Unloaded At:</span>
                        {work.deliveryLocations.map((loc, i) => (
                          <span
                            key={i}
                            className="bg-white px-2 py-0.5 rounded border border-sky-200 text-sky-900 font-medium"
                          >
                            {loc.placeName || loc.city} ({loc.quantityBoxes || 0} boxes)
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Work Description text */}
                    <p className="text-xs text-slate-800 font-normal leading-relaxed bg-white p-2.5 rounded-lg border border-sky-100">
                      {work.workDescription}
                    </p>

                    {/* Bottom Row: Odometer, KM run & Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-600">
                      <div className="flex items-center gap-3 font-mono">
                        {work.totalKmRun !== undefined && (
                          <span>
                            Distance Run: <strong className="text-sky-950 font-bold">{work.totalKmRun} KM</strong>
                          </span>
                        )}
                        {work.endOdometer !== undefined && (
                          <span>
                            ODO: <strong className="text-slate-900">{work.endOdometer.toLocaleString()} KM</strong>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedWorkSlip(work)}
                          className="px-2.5 py-1 text-xs font-bold text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg flex items-center gap-1 cursor-pointer font-heading shadow-2xs"
                        >
                          <Printer className="w-3.5 h-3.5 text-sky-600" />
                          <span>View Slip</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Delete daily work log for vehicle ${work.vehicleNumber}?`)) {
                              deleteDriverDailyWork(work.id);
                            }
                          }}
                          className="p-1 text-slate-300 hover:text-rose-600 rounded cursor-pointer"
                          title="Delete entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

              {driverDailyWorks.length === 0 && (
                <div className="p-8 text-center text-slate-500 text-xs space-y-2 border border-dashed border-sky-200 rounded-xl">
                  <FileText className="w-8 h-8 text-sky-400 mx-auto" />
                  <p className="font-heading font-bold text-slate-700">No Driver Daily Work Logged Yet</p>
                  <p className="text-slate-500 text-[11px]">
                    Click the <strong>"Save Daily Work"</strong> button above to record deliveries and vehicle tyre changes.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: RETURN LOADS (Gujarat → Maharashtra Backhauls)    */}
      {/* User Prompt: "...so drivers can save trip data and load   */}
      {/* information while in areas with poor network coverage."  */}
      {/* ======================================================== */}
      {driverTab === 'return_loads' && (
        <div className="space-y-4">
          {/* Header Card */}
          <div className="bg-white p-5 border border-sky-100 rounded-xl shadow-xs space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="font-heading font-extrabold text-sm text-sky-950 flex items-center gap-2">
                  <Package className="w-4 h-4 text-sky-600" />
                  <span>Return Load Backhaul Information</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Save backhaul load details taken from Gujarat consignors while in remote Mandis/loading docks
                </p>
              </div>

              <button
                onClick={() => setIsNewReturnLoadOpen(!isNewReturnLoadOpen)}
                className="px-3.5 py-1.5 bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-700 hover:to-sky-600 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer font-heading"
              >
                <Plus className="w-4 h-4" />
                <span>{isNewReturnLoadOpen ? 'Close Form' : 'Add Return Load'}</span>
              </button>
            </div>

            {/* Offline Helper Notice */}
            {isEffectiveOffline && (
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs flex items-center gap-2">
                <Database className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Highway Offline Mode Active:</strong> You can safely record return loads even in zero network zones. All load details are stored into device IndexedDB immediately.
                </span>
              </div>
            )}

            {/* In-Line Return Load Entry Form */}
            {isNewReturnLoadOpen && (
              <form onSubmit={handleSaveReturnLoad} onKeyDown={(e) => handleFormKeyDown(e)} className="space-y-3.5 pt-3 border-t border-sky-100 text-xs">
                {/* 1. Consignor & Freight Info */}
                <div className="space-y-2.5">
                  <span className="text-[11px] font-extrabold uppercase text-sky-900 tracking-wider block font-heading">
                    Gujarat Consignor & Freight Information
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-sky-800 mb-1 font-heading">
                        Gujarat Loading Party Name
                      </label>
                      <input
                        type="text"
                        required
                        value={returnLoadData.loadingPartyName}
                        onChange={(e) => setReturnLoadData({ ...returnLoadData, loadingPartyName: e.target.value })}
                        placeholder="e.g. Surat Poly-Tex Fabrics Ltd."
                        className="w-full bg-sky-50/40 border border-sky-200 rounded-lg px-2.5 py-1.5 font-bold text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-sky-800 mb-1 font-heading">
                        Loading City (Gujarat)
                      </label>
                      <select
                        value={returnLoadData.loadingCity}
                        onChange={(e) => setReturnLoadData({ ...returnLoadData, loadingCity: e.target.value })}
                        className="w-full bg-white border border-sky-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-900"
                      >
                        <option value="Surat">Surat (Textiles / Diamonds / Chemicals)</option>
                        <option value="Vapi">Vapi (Industrial & Packaging)</option>
                        <option value="Ahmedabad">Ahmedabad (Ceramics & Hardware)</option>
                        <option value="Bharuch">Bharuch (Heavy Chemicals)</option>
                        <option value="Vadodara">Vadodara (Engineering Spares)</option>
                        <option value="Rajkot">Rajkot (Foundry Goods)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-sky-800 mb-1 font-heading">
                        Goods Description
                      </label>
                      <input
                        type="text"
                        required
                        value={returnLoadData.goodsDescription}
                        onChange={(e) => setReturnLoadData({ ...returnLoadData, goodsDescription: e.target.value })}
                        placeholder="e.g. Textile Bales, Ceramic Tiles"
                        className="w-full bg-sky-50/40 border border-sky-200 rounded-lg px-2.5 py-1.5 text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-sky-800 mb-1 font-heading">
                        Total Weight (KG)
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={returnLoadData.weightKg || ''}
                        onChange={(e) => setReturnLoadData({ ...returnLoadData, weightKg: Number(e.target.value) })}
                        placeholder="e.g. 11500"
                        className="w-full bg-sky-50/40 border border-sky-200 rounded-lg px-2.5 py-1.5 font-mono font-bold text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-sky-800 mb-1 font-heading">
                        Total Quantity (Units / Bales)
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={returnLoadData.quantity || ''}
                        onChange={(e) => setReturnLoadData({ ...returnLoadData, quantity: Number(e.target.value) })}
                        placeholder="e.g. 28"
                        className="w-full bg-sky-50/40 border border-sky-200 rounded-lg px-2.5 py-1.5 font-mono font-bold text-slate-900"
                      />
                    </div>
                  </div>
                </div>

                {/* Multi-Drop Delivery Locations: How Many Locations to Deliver & Which Locations */}
                <div className="p-3 bg-sky-50/70 border border-sky-200 rounded-xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1.5 border-b border-sky-200">
                    <div>
                      <span className="text-[11px] font-extrabold text-sky-950 uppercase font-heading flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-sky-600" />
                        <span>How Many Locations to Deliver & Which Locations</span>
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-bold text-sky-800">
                          How Many Delivered Locations:
                        </span>
                        <span className="bg-white px-2 py-0.5 rounded-full border border-sky-200 font-mono font-bold text-sky-800 text-xs">
                          {driverDeliveryLocations.length}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleDriverAddReturnLocation}
                      className="px-2.5 py-1 text-[11px] font-bold text-white bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-700 hover:to-sky-600 rounded-lg flex items-center gap-1 cursor-pointer font-heading shadow-2xs self-start sm:self-auto"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Places</span>
                    </button>
                  </div>

                  {/* Drop Cards */}
                  <div className="space-y-2.5">
                    {driverDeliveryLocations.map((loc, locIdx) => (
                      <div
                        key={loc.id || locIdx}
                        className="p-2.5 bg-white rounded-lg border border-sky-100 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded-full bg-sky-700 text-white font-mono text-[9px] flex items-center justify-center font-bold">
                              {locIdx + 1}
                            </span>
                            <span className="font-heading font-extrabold text-sky-950 text-xs">
                              Location {locIdx + 1}: {loc.city || 'Destination'}
                            </span>
                            {locIdx === 0 && (
                              <span className="text-[9px] font-bold text-sky-700 bg-sky-100 px-1 rounded">1st Stop</span>
                            )}
                            {locIdx === driverDeliveryLocations.length - 1 && driverDeliveryLocations.length > 1 && (
                              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1 rounded">Final Stop</span>
                            )}
                          </div>

                          {driverDeliveryLocations.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDriverRemoveReturnLocation(locIdx)}
                              className="text-rose-500 hover:text-rose-700 p-0.5 cursor-pointer"
                              title="Remove drop"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[9px] uppercase font-bold text-sky-800 mb-0.5">
                              Which Location / City
                            </label>
                            <input
                              type="text"
                              required
                              value={loc.city}
                              onChange={(e) => handleDriverReturnLocationChange(locIdx, 'city', e.target.value)}
                              placeholder="e.g. Bhiwandi, Pune, Mumbai, Nashik"
                              className="w-full bg-sky-50/30 border border-sky-200 rounded px-2 py-1 text-xs font-bold"
                            />
                          </div>

                          <div>
                            <label className="block text-[9px] uppercase font-bold text-sky-800 mb-0.5">
                              Unloading Godown / Place Name
                            </label>
                            <input
                              type="text"
                              value={loc.placeName}
                              onChange={(e) => handleDriverReturnLocationChange(locIdx, 'placeName', e.target.value)}
                              placeholder="e.g. Godown #12, Market Yard"
                              className="w-full bg-white border border-sky-200 rounded px-2 py-1 text-xs font-medium"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Calculated Route Banner */}
                  <div className="p-2 bg-sky-100/70 border border-sky-200 rounded-lg flex items-center justify-between flex-wrap gap-1 text-[11px]">
                    <div className="flex items-center gap-1 flex-wrap">
                      <Navigation className="w-3 h-3 text-sky-700 shrink-0" />
                      <span className="font-heading font-bold text-sky-950">Route:</span>
                      <span className="font-mono font-bold text-sky-900">
                        {returnLoadData.loadingCity} (GJ) → {driverDeliveryLocations.map((l) => l.city || 'Stop').join(' → ')} ({driverDeliveryLocations.length} Locations)
                      </span>
                    </div>
                    <span className="font-mono text-sky-800 font-bold">
                      Total: {returnLoadData.quantity} Units • {(returnLoadData.weightKg || 0).toLocaleString()} KG
                    </span>
                  </div>
                </div>

                {/* Freight Charge, LR & Payment Terms */}
                <div className="p-3 bg-sky-50/50 border border-sky-200 rounded-xl space-y-2.5">
                  <span className="text-[11px] font-extrabold uppercase text-sky-900 tracking-wider block font-heading">
                    Freight Charge, LR & Payment Terms
                  </span>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[9px] uppercase font-bold text-sky-800 mb-1 font-heading">
                        Freight Charge (₹)
                      </label>
                      <input
                        type="number"
                        required
                        value={returnLoadData.loadRentCharge}
                        onChange={(e) => setReturnLoadData({ ...returnLoadData, loadRentCharge: Number(e.target.value) })}
                        className="w-full bg-sky-50/70 border border-sky-300 rounded px-2 py-1 font-mono font-extrabold text-sky-900 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] uppercase font-bold text-sky-800 mb-1 font-heading">
                        LR Number
                      </label>
                      <input
                        type="text"
                        value={returnLoadData.lrNumber}
                        onChange={(e) => setReturnLoadData({ ...returnLoadData, lrNumber: e.target.value })}
                        className="w-full bg-white border border-sky-200 rounded px-2 py-1 font-mono font-bold text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-sky-800 mb-1 font-heading">
                    Consignment Notes / Handling Instructions
                  </label>
                  <input
                    type="text"
                    value={returnLoadData.notes}
                    onChange={(e) => setReturnLoadData({ ...returnLoadData, notes: e.target.value })}
                    placeholder="e.g. Keep dry, stack max 3 high, check consignee stamp on delivery"
                    className="w-full bg-sky-50/30 border border-sky-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-700 hover:to-sky-600 text-white font-bold text-xs rounded-lg shadow-sm flex items-center justify-center gap-1.5 cursor-pointer font-heading"
                >
                  <Save className="w-4 h-4" />
                  <span>
                    {isEffectiveOffline
                      ? `Save Return Load (${driverDeliveryLocations.length} Delivery Locations) to IndexedDB (Offline)`
                      : `Save Return Load (${driverDeliveryLocations.length} Delivery Locations) to Fleet System`}
                  </span>
                </button>
              </form>
            )}
          </div>

          {/* List of Return Loads (Cloud + IndexedDB Offline Cached) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-heading font-bold text-sky-950">
                Current & Cached Return Loads ({localReturnLoads.length})
              </span>
              <span className="text-slate-500 font-mono text-[11px]">
                Persisted in IndexedDB: <strong>Safe on Highway</strong>
              </span>
            </div>

            {localReturnLoads.length === 0 ? (
              <div className="p-8 bg-white border border-dashed border-sky-200 rounded-xl text-center space-y-2">
                <Package className="w-8 h-8 text-sky-300 mx-auto" />
                <p className="font-heading font-bold text-slate-700 text-xs">No Return Loads Logged Yet</p>
                <p className="text-slate-500 text-[11px]">
                  When picking up backhauls in Surat, Vapi, or Ahmedabad, tap &quot;Add Return Load&quot; above to store load information.
                </p>
              </div>
            ) : (
              localReturnLoads.map((load) => (
                <div
                  key={load.id}
                  className="bg-white p-4 border border-sky-100 hover:border-sky-300 rounded-xl shadow-2xs space-y-2.5 transition-all text-xs"
                >
                  <div className="flex items-center justify-between flex-wrap gap-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-heading font-bold text-sky-950">
                        {load.loadingPartyName}
                      </span>
                      <span className="bg-sky-50 text-sky-800 border border-sky-200 font-mono text-[10px] px-2 py-0.5 rounded-md">
                        {load.lrNumber}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="bg-emerald-50 text-emerald-800 border border-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Database className="w-2.5 h-2.5 text-emerald-600" />
                        <span>IndexedDB Safe</span>
                      </span>
                      <span className="font-mono font-extrabold text-sky-900 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                        ₹{load.loadRentCharge.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <div className="text-slate-700 font-medium flex items-center gap-1 text-[11px] flex-wrap">
                    <span className="font-bold text-sky-800">{load.loadingCity} (GJ)</span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                    <span className="font-bold text-slate-800">{load.deliveryCity}</span>
                  </div>

                  {/* Multi-Drop Delivery Locations display in Driver card */}
                  {load.deliveryLocations && load.deliveryLocations.length > 0 && (
                    <div className="p-2 bg-sky-50/70 border border-sky-200 rounded-lg space-y-1.5">
                      <span className="text-[10px] font-bold text-sky-900 uppercase flex items-center gap-1 font-heading">
                        <MapPin className="w-3 h-3 text-sky-600" />
                        <span>Delivery Drops ({load.deliveryLocations.length} Locations):</span>
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {load.deliveryLocations.map((dLoc, dIdx) => (
                          <div key={dLoc.id || dIdx} className="p-1.5 bg-white rounded border border-sky-100 text-[10px] space-y-0.5">
                            <div className="flex items-center justify-between font-bold">
                              <span className="text-sky-950">#{dLoc.dropOrder || dIdx + 1}: {dLoc.city}</span>
                              <span className="font-mono text-sky-800">{dLoc.quantity ? `${dLoc.quantity} Units` : ''}</span>
                            </div>
                            <div className="text-slate-600 truncate">{dLoc.placeName}</div>
                            {dLoc.consigneeName && (
                              <div className="text-slate-500">Contact: {dLoc.consigneeName}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="p-2 bg-sky-50/50 rounded-lg border border-sky-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-600">
                      Goods: <strong className="text-slate-900">{load.goodsDescription}</strong>
                    </span>
                    <span className="font-mono text-slate-700">
                      {load.quantity} Units • {(load.weightKg / 1000).toFixed(1)} MT
                    </span>
                  </div>

                  {load.notes && (
                    <p className="text-[11px] text-slate-500 italic">
                      Note: {load.notes}
                    </p>
                  )}

                  <div className="pt-2 border-t border-sky-50 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">
                      Payment Status: <strong className="text-amber-800 uppercase font-mono">{load.paymentStatus}</strong>
                    </span>
                    <span className="text-slate-500 font-mono">
                      Truck: {load.vehicleNumber}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: UPLOAD STAMPED LR (Camera / Photo Storage)        */}
      {/* ======================================================== */}
      {driverTab === 'stamped_lr' && (
        <div className="bg-white p-5 border border-sky-100 rounded-xl shadow-xs space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-sm text-sky-950">
                Upload Stamped LR Photo from Delivered Location
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-300 flex items-center gap-1">
                <Database className="w-3 h-3 text-sky-600" />
                <span>Stores Blobs in IndexedDB</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              After return goods are delivered, take a clear photo of the physical Lorry Receipt showing the official consignee rubber stamp and receiver signature.
            </p>
          </div>

          {/* Hidden HTML5 File Input with Camera Support for Smartphones */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handlePhotoFileSelected}
          />

          {uploadedStampPhoto ? (
            <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl text-xs space-y-3">
              <div className="flex items-center gap-2 text-sky-950 font-bold">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Stamped LR Photo Successfully Captured & Saved!</span>
              </div>

              {photoDataUrl && (
                <div className="rounded-lg overflow-hidden border border-sky-200 max-h-48 flex items-center justify-center bg-slate-100">
                  <img
                    src={photoDataUrl}
                    alt="Stamped LR Preview"
                    className="max-h-48 object-contain"
                  />
                </div>
              )}

              <div className="text-[11px] text-sky-800 font-mono bg-white p-2 rounded border border-sky-100">
                File: {uploadedStampPhoto}
                {isEffectiveOffline && (
                  <span className="ml-2 text-amber-700 font-bold">
                    (Saved in local IndexedDB photo store)
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-bold text-sky-700 hover:underline cursor-pointer"
                >
                  Take Another Photo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUploadedStampPhoto(null);
                    setPhotoDataUrl(null);
                  }}
                  className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                >
                  Clear Photo
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Native Camera Capture Button */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-sky-300 hover:border-sky-500 bg-sky-50/40 hover:bg-sky-50/80 rounded-2xl p-6 text-center cursor-pointer transition-colors space-y-2.5"
              >
                <div className="w-12 h-12 rounded-full bg-sky-100 text-sky-700 mx-auto flex items-center justify-center">
                  <Camera className="w-6 h-6" />
                </div>
                <div>
                  <span className="font-heading font-bold text-sky-950 text-xs sm:text-sm block">
                    Use Phone Camera
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    Capture physical LR sheet with receiver stamp
                  </span>
                </div>
              </div>

              {/* Instant Simulated Capture Button (for easy desktop testing) */}
              <div
                onClick={handleSimulatePhotoUpload}
                className="border-2 border-dashed border-sky-200 hover:border-sky-400 bg-white hover:bg-sky-50/50 rounded-2xl p-6 text-center cursor-pointer transition-colors space-y-2.5"
              >
                <div className="w-12 h-12 rounded-full bg-sky-50 text-sky-600 mx-auto flex items-center justify-center">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <span className="font-heading font-bold text-sky-950 text-xs sm:text-sm block">
                    Simulate Stamped LR
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    Generates verified stamped proof with consignee stamp
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: VEHICLE DOCUMENTATION                             */}
      {/* ======================================================== */}
      {driverTab === 'vehicle_docs' && (
        <div className="bg-white p-5 border border-sky-100 rounded-xl shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-sky-100">
            <div>
              <h3 className="font-heading font-bold text-sm text-sky-950">
                Vehicle Documents: {assignedVehicle.number}
              </h3>
              <p className="text-xs text-slate-500">
                Official RTO documents for interstate checkposts and highway police
              </p>
            </div>
            {driverCanViewDocs ? (
              <span className="bg-sky-100 text-sky-800 border border-sky-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                ✓ Permitted by Admin
              </span>
            ) : (
              <span className="bg-rose-50 text-rose-800 border border-rose-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <Lock className="w-3 h-3" />
                <span>Locked by Admin</span>
              </span>
            )}
          </div>

          {driverCanViewDocs ? (
            <div className="space-y-2 text-xs">
              {assignedVehicle.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="p-3 bg-sky-50/40 border border-sky-100 rounded-xl flex items-center justify-between gap-3 hover:border-sky-300 transition-colors"
                >
                  <div>
                    <div className="font-heading font-bold text-sky-950">{doc.type}</div>
                    <div className="text-[11px] font-mono text-slate-500">
                      Doc #: {doc.number} • Valid Till: <strong className="text-slate-800">{doc.expiryDate}</strong>
                    </div>
                  </div>

                  <button
                    onClick={() => alert(`Showing soft copy on mobile screen: ${doc.softCopyName}`)}
                    className="px-3 py-1.5 bg-white border border-sky-200 rounded-lg text-xs font-bold text-sky-700 hover:bg-sky-50 flex items-center gap-1 shadow-2xs cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-sky-500" />
                    <span>View Doc</span>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 text-xs space-y-2">
              <Lock className="w-8 h-8 text-sky-400 mx-auto" />
              <p className="font-heading font-bold text-slate-700">Vehicle Documents Access Restricted</p>
              <p className="text-slate-500 text-[11px]">
                The Admin has not granted permission for drivers to view vehicle documents on this account.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: DRIVER DAILY WORK SLIP / VOUCHER VIEW             */}
      {/* ======================================================== */}
      {selectedWorkSlip && (
        <div className="fixed inset-0 z-50 bg-sky-950/45 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-sky-200 shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden text-xs animate-in fade-in duration-150">
            {/* Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-sky-800 via-sky-700 to-sky-600 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Printer className="w-4 h-4 text-sky-200" />
                  <h3 className="font-heading font-extrabold text-sm tracking-tight">
                    Driver Daily Work Slip ({selectedWorkSlip.id})
                  </h3>
                </div>
                <p className="text-[11px] text-sky-100 mt-0.5">
                  Vehicle: <strong>{selectedWorkSlip.vehicleNumber}</strong> • Date: {selectedWorkSlip.date} • Driver: {selectedWorkSlip.driverName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedWorkSlip(null)}
                className="text-sky-100 hover:text-white p-1 rounded-md hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            {/* Slip Printable Content */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1 bg-slate-50/50">
              {/* Slip Card */}
              <div className="p-4 bg-white border border-sky-200 rounded-xl space-y-3 shadow-2xs">
                {/* Vehicle & Deliveries Ribbon */}
                <div className="flex items-center justify-between pb-3 border-b border-sky-100">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 font-heading block">
                      Tracked Vehicle Number
                    </span>
                    <span className="font-mono font-black text-base text-sky-950 tracking-wider">
                      {selectedWorkSlip.vehicleNumber}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-500 font-heading block">
                      Deliveries Handed Over
                    </span>
                    <span className="font-mono font-black text-sm text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {selectedWorkSlip.deliveriesCount} Deliveries
                    </span>
                  </div>
                </div>

                {/* Tyre / Maintenance Section */}
                {selectedWorkSlip.hadTyreChangeOrMaintenance && selectedWorkSlip.maintenanceDetails && (
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 space-y-1.5">
                    <span className="font-heading font-extrabold text-xs text-amber-950 flex items-center gap-1.5">
                      <Disc className="w-3.5 h-3.5 text-amber-700" />
                      <span>Tyre Change / Vehicle Maintenance Record</span>
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-amber-900 pt-1">
                      <div>
                        Component: <strong>{selectedWorkSlip.maintenanceDetails.component}</strong>
                      </div>
                      <div>
                        Action: <strong>{selectedWorkSlip.maintenanceDetails.actionTaken}</strong>
                      </div>
                      <div>
                        Workshop: <strong>{selectedWorkSlip.maintenanceDetails.workshopName || 'Highway Garage'}</strong>
                      </div>
                      <div>
                        Cost: <strong>₹{selectedWorkSlip.maintenanceDetails.expenseAmount?.toLocaleString('en-IN') || 0}</strong>
                      </div>
                      {selectedWorkSlip.maintenanceDetails.billInvoiceNumber && (
                        <div>
                          Bill #: <strong>{selectedWorkSlip.maintenanceDetails.billInvoiceNumber}</strong>
                        </div>
                      )}
                      {selectedWorkSlip.maintenanceDetails.paidBy && (
                        <div className="capitalize">
                          Paid by: <strong>{selectedWorkSlip.maintenanceDetails.paidBy.replace(/_/g, ' ')}</strong>
                        </div>
                      )}
                    </div>

                    {/* Bill Receipt Photo */}
                    {selectedWorkSlip.maintenanceDetails.billPhotoUrl && (
                      <div className="pt-2 border-t border-amber-200/80">
                        <span className="text-[10px] font-bold uppercase text-amber-900 block mb-1">
                          Uploaded Bill / Receipt Photo:
                        </span>
                        <img
                          src={selectedWorkSlip.maintenanceDetails.billPhotoUrl}
                          alt="Receipt photo"
                          className="w-full max-h-48 object-contain rounded-lg border border-amber-300 bg-black/5"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Delivery Locations */}
                {selectedWorkSlip.deliveryLocations && selectedWorkSlip.deliveryLocations.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="font-heading font-bold text-xs text-sky-950 block">
                      Delivery Drop Locations Handed Over:
                    </span>
                    <div className="space-y-1">
                      {selectedWorkSlip.deliveryLocations.map((loc, idx) => (
                        <div
                          key={idx}
                          className="p-2 bg-sky-50/60 rounded border border-sky-100 flex items-center justify-between text-[11px]"
                        >
                          <div>
                            <span className="font-bold text-sky-950">{idx + 1}. {loc.placeName || loc.city}</span>
                            {loc.notes && <span className="text-slate-500 block text-[10px]">{loc.notes}</span>}
                          </div>
                          <span className="font-mono font-bold text-sky-800">
                            {loc.quantityBoxes || 0} boxes
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Work Description */}
                <div>
                  <span className="font-heading font-bold text-xs text-sky-950 block mb-1">
                    Work Description:
                  </span>
                  <p className="p-2.5 bg-slate-50 rounded border border-slate-200 text-xs text-slate-800">
                    {selectedWorkSlip.workDescription}
                  </p>
                </div>

                {/* Distance & Odometer */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-sky-100 text-[11px] font-mono">
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase">Start ODO</span>
                    <strong className="text-slate-800">{selectedWorkSlip.startOdometer?.toLocaleString() || '-'} KM</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase">End ODO</span>
                    <strong className="text-slate-800">{selectedWorkSlip.endOdometer?.toLocaleString() || '-'} KM</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase">Distance Run</span>
                    <strong className="text-sky-900">{selectedWorkSlip.totalKmRun || 0} KM</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer with Print & Close */}
            <div className="px-5 py-3 bg-white border-t border-sky-100 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-mono">
                Printed from Driver Mobile PWA
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedWorkSlip(null)}
                  className="px-3 py-1.5 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-1.5 font-bold text-white bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-700 hover:to-sky-600 rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer font-heading"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Slip</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DRAWER / MODAL: INDEXEDDB STORAGE STATS & SYNC QUEUE     */}
      {/* ======================================================== */}
      {isQueueDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-sky-950/50 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl border border-sky-200 shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden text-xs">
            {/* Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-sky-900 via-sky-800 to-sky-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-sky-300" />
                <div>
                  <h3 className="font-heading font-extrabold text-sm">
                    Device IndexedDB Offline Storage
                  </h3>
                  <p className="text-[11px] text-sky-200 font-mono">
                    transpulse_driver_offline_db • Version 1
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsQueueDrawerOpen(false)}
                className="text-sky-200 hover:text-white p-1 rounded-md"
              >
                ✕
              </button>
            </div>

            {/* Storage Summary Metrics */}
            <div className="p-4 bg-sky-50/70 border-b border-sky-100 grid grid-cols-4 gap-2 text-center">
              <div className="bg-white p-2 rounded-lg border border-sky-200 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Trips</span>
                <span className="font-heading font-black text-sm text-sky-900">{dbSummary.tripsCount}</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-sky-200 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Loads</span>
                <span className="font-heading font-black text-sm text-sky-900">{dbSummary.loadsCount}</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-sky-200 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Photos</span>
                <span className="font-heading font-black text-sm text-sky-900">{dbSummary.photosCount}</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-sky-200 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Pending</span>
                <span className={`font-heading font-black text-sm ${dbSummary.pendingCount > 0 ? 'text-amber-600' : 'text-emerald-700'}`}>
                  {dbSummary.pendingCount}
                </span>
              </div>
            </div>

            {/* Sync History / Queue Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-heading font-bold text-sky-950">
                  Offline Queue Items ({syncQueue.length}):
                </span>
                {syncQueue.some((q) => q.status === 'synced') && (
                  <button
                    type="button"
                    onClick={handleClearSyncedItems}
                    className="text-[11px] text-slate-500 hover:text-rose-600 hover:underline cursor-pointer"
                  >
                    Clear Synced
                  </button>
                )}
              </div>

              {syncQueue.length === 0 ? (
                <div className="text-center py-8 text-slate-500 space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p className="font-bold text-slate-800">Queue is Clear</p>
                  <p className="text-[11px] text-slate-500">
                    All driver entries are synchronized with the fleet server. Any changes made offline will appear here until synced.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {syncQueue.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl border text-xs space-y-1 ${
                        item.status === 'pending'
                          ? 'bg-amber-50/70 border-amber-200'
                          : item.status === 'synced'
                          ? 'bg-emerald-50/50 border-emerald-200'
                          : item.status === 'syncing'
                          ? 'bg-sky-50 border-sky-200'
                          : 'bg-rose-50 border-rose-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-slate-900">
                          #{item.id} • {item.actionType}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            item.status === 'pending'
                              ? 'bg-amber-200 text-amber-900'
                              : item.status === 'synced'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.status === 'syncing'
                              ? 'bg-sky-200 text-sky-900 animate-pulse'
                              : 'bg-rose-200 text-rose-900'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-700 font-medium">
                        {item.summary}
                      </p>
                      <span className="text-[10px] text-slate-400 font-mono block">
                        Queued: {new Date(item.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-sky-100 bg-slate-50 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-mono">
                {dbSummary.lastSyncedAt ? `Last Sync: ${dbSummary.lastSyncedAt}` : 'Not synced yet'}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsQueueDrawerOpen(false)}
                  className="px-3 py-1.5 font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleTriggerSync}
                  disabled={isSyncing || isEffectiveOffline || dbSummary.pendingCount === 0}
                  className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
