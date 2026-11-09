import React, { useState, useMemo } from 'react';
import {
  Truck,
  Plus,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Gauge,
  Wrench,
  FileText,
  Calendar,
  CheckCircle2,
  Bell,
  Eye,
  Check,
  Disc,
  MapPin,
  PackageCheck,
  AlertCircle,
  Fuel,
  Sparkles,
  Search,
  Filter,
  ArrowRight,
  ArrowLeft,
  TrendingUp,
  DollarSign,
  Activity,
  Layers,
  History,
  FileSpreadsheet,
  Download,
  CheckCheck,
  RotateCcw,
  Camera,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  X,
  Check as CheckIcon,
  HelpCircle,
} from 'lucide-react';
import { useTMS } from '../context/TMSContext';
import {
  Vehicle,
  OdometerEvent,
  FuelRecord,
  ServiceRepairRecord,
  ServiceActivityType,
} from '../types/tms';
import { AddFuelEntryModal } from './modals/AddFuelEntryModal';
import { AddServiceRepairModal } from './modals/AddServiceRepairModal';
import { EmptyState } from './common/EmptyState';
import { ModalPortal } from './common/ModalPortal';
import { calculateVehicleFuelAverage } from '../utils/fuelCalculators';

export type VehicleViewTab =
  | 'performance'
  | 'odo_history'
  | 'roster'
  | 'audit_trail'
  | 'fuel_intelligence'
  | 'maintenance_log'
  | 'suspicious_review'
  | 'analytics';

interface VehiclesViewProps {
  defaultTab?: VehicleViewTab;
}

export const VehiclesView: React.FC<VehiclesViewProps> = ({ defaultTab = 'performance' }) => {
  const {
    vehicles,
    updateOdometer,
    addMultipurposeReminder,
    addVehicle,
    role,
    driverDailyWorks,
    odometerEvents,
    fuelRecords,
    serviceRecords,
    logOdometerActivity,
    requestOdoCorrection,
    addFuelRecord,
    addServiceRecord,
  } = useTMS();

  const [activeSubTab, setActiveSubTab] = useState<VehicleViewTab>(defaultTab);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle>(vehicles[0] || {
    id: 'V1',
    number: 'MH-12-RN-4892',
    type: '24-Ton Heavy Fruit Carrier',
    model: 'Tata Signa 2823',
    capacityMt: 24,
    capacityKg: 24000,
    currentOdometer: 89780,
    status: 'active',
    assignedDriverName: 'Sukhwinder Singh',
    documents: [],
    maintenanceReminders: [],
  });

  // Screen 2: Performance tab sub-selection
  const [perfSubTab, setPerfSubTab] = useState<string>('Overview');
  const [perfPeriod, setPerfPeriod] = useState<string>('Last 30 Days');

  // Modals state (Screen 5 & Screen 6)
  const [isAddFuelEntryOpen, setIsAddFuelEntryOpen] = useState(false);
  const [isAddServiceRepairOpen, setIsAddServiceRepairOpen] = useState(false);

  // Other Modals
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
  const [isOdoModalOpen, setIsOdoModalOpen] = useState(false);
  const [newOdoInput, setNewOdoInput] = useState<number>(vehicles[0]?.currentOdometer || 89780);
  const [odoError, setOdoError] = useState<string | null>(null);

  // Add Reminder Modal
  const [isAddReminderOpen, setIsAddReminderOpen] = useState(false);
  const [reminderTitle, setReminderTitle] = useState('Brake Lining Replacement');
  const [reminderDueKm, setReminderDueKm] = useState<number>(20000);

  // New Vehicle Form State
  const [newPlate, setNewPlate] = useState('MH-12-');
  const [newType, setNewType] = useState('24-Ton Heavy Fruit Carrier');
  const [newModel, setNewModel] = useState('Tata Signa 2823');
  const [newCapacityUnit, setNewCapacityUnit] = useState<'Ton' | 'KG'>('Ton');
  const [newCapacityMt, setNewCapacityMt] = useState<number>(24);
  const [newOdo, setNewOdo] = useState<number>(45000);

  // Audit Trail Filters
  const [auditVehicleFilter, setAuditVehicleFilter] = useState<string>('all');
  const [auditActivityFilter, setAuditActivityFilter] = useState<string>('all');

  // Admin ODO Correction Dialog State
  const [correctingEvent, setCorrectingEvent] = useState<OdometerEvent | null>(null);
  const [correctedReadingInput, setCorrectedReadingInput] = useState<number>(0);
  const [correctionReasonInput, setCorrectionReasonInput] = useState<string>('');

  const handleOpenOdoModal = (v: Vehicle) => {
    setSelectedVehicle(v);
    setNewOdoInput(v.currentOdometer + 150);
    setOdoError(null);
    setIsOdoModalOpen(true);
  };

  const handleSaveOdo = (e: React.FormEvent) => {
    e.preventDefault();
    const result = updateOdometer(selectedVehicle.id, Number(newOdoInput));
    if (!result.success) {
      setOdoError(result.message);
      return;
    }
    logOdometerActivity({
      vehicleId: selectedVehicle.id,
      odometerReading: Number(newOdoInput),
      activityType: 'maintenance_other',
      notes: `Admin manually updated ODO from dashboard.`,
    });
    setIsOdoModalOpen(false);
    setOdoError(null);
    const updated = vehicles.find((v) => v.id === selectedVehicle.id);
    if (updated) setSelectedVehicle(updated);
  };

  const handleSaveCustomReminder = (e: React.FormEvent) => {
    e.preventDefault();
    addMultipurposeReminder(selectedVehicle.id, reminderTitle, reminderDueKm);
    setIsAddReminderOpen(false);
    const updated = vehicles.find((v) => v.id === selectedVehicle.id);
    if (updated) setSelectedVehicle(updated);
  };

  const handleCreateVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    const capacityKg = newCapacityUnit === 'KG' ? newCapacityMt : newCapacityMt * 1000;
    const capacityMt = newCapacityUnit === 'Ton' ? newCapacityMt : Math.round(newCapacityMt / 1000);

    addVehicle({
      number: newPlate.toUpperCase(),
      type: newType,
      model: newModel,
      capacityUnit: newCapacityUnit,
      capacityMt,
      capacityKg,
      currentOdometer: newOdo,
    });
    setIsAddVehicleOpen(false);
  };

  // Filtered ODO audit trail
  const filteredOdoEvents = useMemo(() => {
    return odometerEvents.filter((evt) => {
      if (auditVehicleFilter !== 'all' && evt.vehicleId !== auditVehicleFilter) return false;
      if (auditActivityFilter !== 'all' && evt.activityType !== auditActivityFilter) return false;
      return true;
    });
  }, [odometerEvents, auditVehicleFilter, auditActivityFilter]);

  // Suspicious events
  const suspiciousEvents = useMemo(() => {
    return odometerEvents.filter(
      (evt) =>
        evt.submissionStatus === 'flagged_suspicious' ||
        evt.verificationStatus === 'pending_admin_review' ||
        Boolean(evt.flagReason)
    );
  }, [odometerEvents]);

  // Fuel stats across vehicles
  const vehicleFuelAverages = useMemo(() => {
    return vehicles.map((veh) => {
      const stats = calculateVehicleFuelAverage(veh.id, veh.number, 'diesel', fuelRecords);
      return {
        vehicle: veh,
        stats,
      };
    });
  }, [vehicles, fuelRecords]);

  // Screen 3: Verified ODO History data matching the reference image exactly
  const odoHistoryRows = [
    { id: 1, date: '06 Nov 2026, 09:20', activity: 'Trip Start', icon: 'start', odo: '89,950', dist: '-', driver: 'Sukhwinder S.', status: 'Verified' },
    { id: 2, date: '06 Nov 2026, 17:40', activity: 'Trip Complete', icon: 'complete', odo: '89,780', dist: '170', driver: 'Sukhwinder S.', status: 'Verified' },
    { id: 3, date: '03 Nov 2026, 11:15', activity: 'Diesel Refuel', icon: 'refuel', odo: '89,500', dist: '-', driver: 'Sukhwinder S.', status: 'Verified' },
    { id: 4, date: '28 Oct 2026, 10:30', activity: 'General Service', icon: 'service', odo: '88,900', dist: '-', driver: 'Workshop', status: 'Verified' },
    { id: 5, date: '25 Oct 2026, 18:40', activity: 'Trip Complete', icon: 'complete', odo: '88,450', dist: '310', driver: 'Ashok P.', status: 'Verified' },
    { id: 6, date: '24 Oct 2026, 08:10', activity: 'Trip Start', icon: 'start', odo: '88,140', dist: '-', driver: 'Ashok P.', status: 'Verified' },
    { id: 7, date: '20 Oct 2026, 16:20', activity: 'Diesel Refuel', icon: 'refuel', odo: '87,980', dist: '-', driver: 'Sukhwinder S.', status: 'Verified' },
  ];

  // Screen 2: Monthly Fuel Average chart data (May–Oct)
  const monthlyFuelBars = [
    { month: 'May', value: 9.6 },
    { month: 'Jun', value: 9.8 },
    { month: 'Jul', value: 10.0 },
    { month: 'Aug', value: 10.1 },
    { month: 'Sep', value: 10.3 },
    { month: 'Oct', value: 10.2 },
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Action Header */}
      <div className="bg-white p-4 sm:p-5 border border-[#DCE8F2] rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 morning-card">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-heading text-lg font-extrabold text-[#384959]">
              Vehicle Performance & Monotonic ODO Stream
            </h2>
            <span className="bg-[#BDDDFC]/50 text-[#384959] border border-[#BDDDFC] text-xs font-bold px-2.5 py-0.5 rounded-full font-heading">
              MH-12-RN-4892 • Tata Signa
            </span>
          </div>
          <p className="text-xs text-[#6A89A7] mt-1 font-medium">
            Centralized vehicle management, full-tank-to-full-tank fuel intelligence, garage repairs and audit stream.
          </p>
        </div>

        {/* Action Buttons to open Screen 5 & Screen 6 Modals */}
        <div className="flex items-center gap-2 self-start md:self-auto shrink-0 flex-wrap">
          <button
            onClick={() => setIsAddFuelEntryOpen(true)}
            className="px-3.5 py-2 text-xs font-bold text-white bg-[#0284c7] hover:bg-[#0369a1] rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer font-heading"
          >
            <Fuel className="w-3.5 h-3.5" />
            <span>Add Fuel Entry</span>
          </button>

          <button
            onClick={() => setIsAddServiceRepairOpen(true)}
            className="px-3.5 py-2 text-xs font-bold text-[#384959] bg-[#BDDDFC]/60 hover:bg-[#BDDDFC] border border-[#BDDDFC] rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer font-heading"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Add Service / Repair</span>
          </button>

          <button
            onClick={() => setIsAddVehicleOpen(true)}
            className="px-3.5 py-2 text-xs font-bold text-white bg-[#384959] hover:bg-[#2C3A47] rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer font-heading"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New Vehicle</span>
          </button>
        </div>
      </div>

      {/* Subtabs Navigation Bar matching Showcase Panels */}
      <div className="bg-white p-1.5 rounded-2xl border border-[#DCE8F2] shadow-2xs flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {[
          { id: 'performance', label: 'Vehicle Performance', icon: <TrendingUp className="w-4 h-4" /> },
          { id: 'odo_history', label: 'ODO History (MH-12-RN-4892)', icon: <History className="w-4 h-4" /> },
          { id: 'roster', label: 'Fleet Vehicles & Specs', icon: <Truck className="w-4 h-4" /> },
          { id: 'audit_trail', label: 'Central ODO Audit Trail', icon: <Activity className="w-4 h-4" /> },
          { id: 'fuel_intelligence', label: 'Fuel & Mileage Intelligence', icon: <Fuel className="w-4 h-4" /> },
          { id: 'maintenance_log', label: 'Maintenance & Repair Log', icon: <Wrench className="w-4 h-4" /> },
          {
            id: 'suspicious_review',
            label: `Suspicious Review (${suspiciousEvents.length})`,
            icon: <AlertTriangle className="w-4 h-4 text-amber-500" />,
          },
          { id: 'analytics', label: 'Fleet Analytics', icon: <Layers className="w-4 h-4" /> },
        ].map((tab) => {
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as VehicleViewTab)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer font-heading ${
                isActive
                  ? 'bg-[#384959] text-white shadow-xs'
                  : 'bg-transparent text-[#6A89A7] hover:bg-[#F3F7FB] hover:text-[#384959]'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ===================================================================== */}
      {/* SCREEN 2: VEHICLE PERFORMANCE (EXACT RECREATION OF SHOWCASE SCREEN 2) */}
      {/* ===================================================================== */}
      {activeSubTab === 'performance' && (
        <div className="bg-white border border-[#DCE8F2] rounded-2xl p-5 shadow-xs space-y-5 animate-in fade-in duration-150">
          {/* Header Strip with Back arrow & Range Selector */}
          <div className="flex items-center justify-between pb-3 border-b border-[#DCE8F2]">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveSubTab('roster')}
                className="w-8 h-8 rounded-xl bg-[#F8FAFC] border border-[#DCE8F2] text-[#384959] flex items-center justify-center hover:bg-[#BDDDFC]/30 transition-colors"
                title="Back to fleet roster"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h3 className="font-heading text-base font-extrabold text-[#384959]">Vehicle Performance</h3>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={perfPeriod}
                onChange={(e) => setPerfPeriod(e.target.value)}
                className="px-3 py-1.5 bg-[#F8FAFC] border border-[#DCE8F2] rounded-xl text-xs font-bold text-[#384959] focus:outline-none"
              >
                <option value="Last 30 Days">Last 30 Days</option>
                <option value="Last 90 Days">Last 90 Days</option>
                <option value="Year to Date">Year to Date</option>
              </select>
            </div>
          </div>

          {/* Vehicle Card Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#DCE8F2]">
            <div className="flex items-center gap-3.5">
              <div className="w-16 h-12 rounded-xl bg-[#F8FAFC] border border-[#DCE8F2] flex items-center justify-center p-1 overflow-hidden relative shadow-2xs">
                <img
                  src="https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=300&auto=format&fit=crop&q=60"
                  alt="Tata Signa Truck"
                  className="w-full h-full object-cover rounded-lg"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <Truck className="w-7 h-7 text-[#384959] absolute" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-base text-[#384959]">MH-12-RN-4892</span>
                  <span className="bg-emerald-500 text-white font-bold text-[10px] px-2 py-0.5 rounded-full shadow-2xs">
                    Active
                  </span>
                </div>
                <span className="text-xs text-[#6A89A7] font-semibold">Tata Signa (Truck)</span>
              </div>
            </div>

            {/* Sub-tabs pills: Overview, Fuel, Service, Repair, Trip, Expenses */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {['Overview', 'Fuel', 'Service', 'Repair', 'Trip', 'Expenses'].map((tab) => {
                const isSelected = perfSubTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setPerfSubTab(tab)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#384959] text-white shadow-2xs'
                        : 'bg-[#F8FAFC] text-[#6A89A7] hover:bg-[#BDDDFC]/30 hover:text-[#384959]'
                    }`}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 6 Metric KPI Tiles in 3x2 Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5">
            {/* 1: Current ODO */}
            <div className="bg-[#F8FAFC] p-3.5 rounded-xl border border-[#DCE8F2] flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                <Gauge className="w-5 h-5 text-[#6A89A7]" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#6A89A7] uppercase block font-heading">
                  Current ODO
                </span>
                <span className="text-base font-black font-mono text-[#384959]">89,780 KM</span>
              </div>
            </div>

            {/* 2: Diesel Average (Green Tinted) */}
            <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-300">
                <Fuel className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-emerald-800 uppercase block font-heading">
                  Diesel Average
                </span>
                <span className="text-base font-black font-mono text-emerald-700">10.2 KM/L</span>
              </div>
            </div>

            {/* 3: Total Fuel */}
            <div className="bg-[#F8FAFC] p-3.5 rounded-xl border border-[#DCE8F2] flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                <Fuel className="w-5 h-5 text-[#88BDF2]" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#6A89A7] uppercase block font-heading">
                  Total Fuel
                </span>
                <span className="text-base font-black font-mono text-[#384959]">480 L</span>
              </div>
            </div>

            {/* 4: Fuel Cost */}
            <div className="bg-[#F8FAFC] p-3.5 rounded-xl border border-[#DCE8F2] flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
                <DollarSign className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#6A89A7] uppercase block font-heading">
                  Fuel Cost
                </span>
                <span className="text-base font-black font-mono text-[#384959]">₹47,280</span>
              </div>
            </div>

            {/* 5: Maintenance Cost */}
            <div className="bg-[#F8FAFC] p-3.5 rounded-xl border border-[#DCE8F2] flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
                <Wrench className="w-5 h-5 text-rose-500" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#6A89A7] uppercase block font-heading">
                  Maintenance Cost
                </span>
                <span className="text-base font-black font-mono text-[#384959]">₹14,800</span>
              </div>
            </div>

            {/* 6: Total Distance */}
            <div className="bg-[#F8FAFC] p-3.5 rounded-xl border border-[#DCE8F2] flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#E8F2FA] text-[#384959] flex items-center justify-center shrink-0 border border-[#DCE8F2]">
                <Activity className="w-5 h-5 text-[#384959]" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#6A89A7] uppercase block font-heading">
                  Total Distance
                </span>
                <span className="text-base font-black font-mono text-[#384959]">4,896 KM</span>
              </div>
            </div>
          </div>

          {/* Monthly Fuel Average (KM/L) Bar Chart */}
          <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#DCE8F2] space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-[#384959] font-heading">
                Monthly Fuel Average (KM/L)
              </h4>
              <span className="text-[11px] text-[#6A89A7] font-mono font-bold">Corridor Benchmark: 10.0 KM/L</span>
            </div>

            {/* Chart Container */}
            <div className="relative pt-6 pb-2">
              <div className="flex items-end justify-between gap-4 h-48 px-2 sm:px-6 border-b border-[#DCE8F2]">
                {monthlyFuelBars.map((item) => {
                  // Normalize height between 8.0 and 12.0
                  const heightPercent = Math.min(100, Math.max(15, ((item.value - 7.5) / 4.5) * 100));
                  return (
                    <div key={item.month} className="flex-1 flex flex-col items-center gap-2 group">
                      <span className="text-xs font-mono font-bold text-[#384959] group-hover:text-blue-600 transition-colors">
                        {item.value.toFixed(1)}
                      </span>
                      <div className="w-full max-w-[48px] bg-slate-200 rounded-t-lg h-36 flex items-end overflow-hidden">
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className="w-full bg-[#88BDF2] group-hover:bg-[#6A89A7] transition-all rounded-t-lg shadow-xs"
                        />
                      </div>
                      <span className="text-[11px] font-bold text-[#6A89A7] mt-1">{item.month}</span>
                    </div>
                  );
                })}
              </div>

              {/* Y Axis Guide Lines */}
              <div className="absolute left-0 top-6 bottom-8 flex flex-col justify-between pointer-events-none text-[10px] font-mono text-slate-400">
                <span>12.0</span>
                <span>10.0</span>
                <span>8.0</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SCREEN 3: ODO HISTORY (MH-12-RN-4892) (EXACT RECREATION OF SCREEN 3) */}
      {/* ===================================================================== */}
      {activeSubTab === 'odo_history' && (
        <div className="bg-white border border-[#DCE8F2] rounded-2xl p-5 shadow-xs space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-[#DCE8F2]">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveSubTab('performance')}
                className="w-8 h-8 rounded-xl bg-[#F8FAFC] border border-[#DCE8F2] text-[#384959] flex items-center justify-center hover:bg-[#BDDDFC]/30 transition-colors"
                title="Back to vehicle performance"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h3 className="font-heading text-base font-extrabold text-[#384959]">
                ODO History (MH-12-RN-4892)
              </h3>
            </div>

            <button
              onClick={() => alert('Exporting verified ODO ledger as CSV...')}
              className="px-3.5 py-1.5 bg-[#F8FAFC] border border-[#DCE8F2] rounded-xl text-xs font-bold text-[#384959] hover:bg-[#BDDDFC]/30 transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-[#6A89A7]" />
              <span>Export ▾</span>
            </button>
          </div>

          {/* ODO History Audit Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] text-[#6A89A7] font-heading font-extrabold border-b border-[#DCE8F2]">
                <tr>
                  <th className="py-2.5 px-3 w-10">#</th>
                  <th className="py-2.5 px-3">Date & Time</th>
                  <th className="py-2.5 px-3">Activity</th>
                  <th className="py-2.5 px-3 font-mono">ODO (KM)</th>
                  <th className="py-2.5 px-3 font-mono">Distance</th>
                  <th className="py-2.5 px-3">Driver</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE8F2]">
                {odoHistoryRows.map((row) => (
                  <tr key={row.id} className="hover:bg-[#F3F7FB]/50 transition-colors">
                    <td className="py-3 px-3 font-mono text-[#6A89A7]">{row.id}</td>
                    <td className="py-3 px-3 font-mono text-[#384959] font-medium">{row.date}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        {row.icon === 'start' && (
                          <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                            <ArrowRight className="w-3 h-3 text-blue-600" />
                          </div>
                        )}
                        {row.icon === 'complete' && (
                          <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                            <CheckIcon className="w-3 h-3 text-emerald-600" />
                          </div>
                        )}
                        {row.icon === 'refuel' && (
                          <div className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                            <Fuel className="w-3 h-3 text-sky-600" />
                          </div>
                        )}
                        {row.icon === 'service' && (
                          <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                            <Wrench className="w-3 h-3 text-amber-600" />
                          </div>
                        )}
                        <span className="font-semibold text-[#384959]">{row.activity}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono font-extrabold text-[#384959] text-sm">
                      {row.odo}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-[#384959]">
                      {row.dist !== '-' ? `${row.dist} KM` : '-'}
                    </td>
                    <td className="py-3 px-3 text-[#384959] font-medium">{row.driver}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUBTAB: FLEET ROSTER */}
      {/* ===================================================================== */}
      {activeSubTab === 'roster' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Vehicle Cards */}
          <div className="lg:col-span-4 space-y-3">
            <span className="text-[11px] font-bold text-[#384959] uppercase tracking-wider block font-heading">
              Fleet Roster ({vehicles.length} Trucks)
            </span>

            <div className="space-y-2.5">
              {vehicles.map((v) => {
                const isSelected = selectedVehicle?.id === v.id;
                const hasExpiring = v.documents.some((d) => d.status === 'expiring_soon' || d.status === 'expired');

                return (
                  <div
                    key={v.id}
                    onClick={() => setSelectedVehicle(v)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white border-[#384959] shadow-md ring-2 ring-[#88BDF2]/30'
                        : 'bg-white border-[#DCE8F2] hover:border-[#88BDF2] shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#F8FAFC] border border-[#DCE8F2] flex items-center justify-center shrink-0">
                          <Truck className="w-5 h-5 text-[#384959]" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-black text-sm text-[#384959]">{v.number}</span>
                            <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                              Active
                            </span>
                          </div>
                          <p className="text-[11px] text-[#6A89A7]">{v.model}</p>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-xs text-[#384959]">
                        {v.currentOdometer.toLocaleString('en-IN')} KM
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Vehicle Details & Documents */}
          <div className="lg:col-span-8 space-y-4">
            {selectedVehicle && (
              <div className="bg-white p-5 border border-[#DCE8F2] rounded-2xl shadow-xs space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-[#DCE8F2]">
                  <div>
                    <span className="font-mono font-black text-lg text-[#384959]">{selectedVehicle.number}</span>
                    <p className="text-xs text-[#6A89A7]">{selectedVehicle.type} • {selectedVehicle.model}</p>
                  </div>
                  <button
                    onClick={() => handleOpenOdoModal(selectedVehicle)}
                    className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#384959] rounded-xl hover:bg-[#2C3B49]"
                  >
                    Update ODO Reading
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#DCE8F2]">
                    <span className="text-[10px] font-bold text-[#6A89A7] uppercase block font-heading">Current ODO</span>
                    <span className="font-mono font-black text-[#384959] text-sm">{selectedVehicle.currentOdometer.toLocaleString('en-IN')} KM</span>
                  </div>
                  <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#DCE8F2]">
                    <span className="text-[10px] font-bold text-[#6A89A7] uppercase block font-heading">Driver</span>
                    <span className="font-bold text-[#384959] text-sm truncate">{selectedVehicle.assignedDriverName || 'Sukhwinder Singh'}</span>
                  </div>
                  <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#DCE8F2]">
                    <span className="text-[10px] font-bold text-[#6A89A7] uppercase block font-heading">Mileage</span>
                    <span className="font-bold text-emerald-700 text-sm">10.2 KM/L</span>
                  </div>
                  <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#DCE8F2]">
                    <span className="text-[10px] font-bold text-[#6A89A7] uppercase block font-heading">Capacity</span>
                    <span className="font-mono font-bold text-[#384959] text-sm">{selectedVehicle.capacityMt} MT</span>
                  </div>
                </div>

                {/* Documents list */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between pb-1 border-b border-[#DCE8F2]">
                    <h4 className="text-xs font-bold text-[#384959] uppercase tracking-wider font-heading">Vehicle Documents</h4>
                    <span className="text-[11px] text-[#6A89A7]">Auto Reminder when Expiring</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {selectedVehicle.documents.map((doc) => (
                      <div key={doc.id} className="p-3 rounded-xl bg-[#F8FAFC] border border-[#DCE8F2] flex items-start justify-between">
                        <div>
                          <span className="font-bold text-xs text-[#384959]">{doc.type}</span>
                          <div className="font-mono text-[11px] text-slate-600 mt-0.5">Doc #: {doc.number}</div>
                          <div className="text-[11px] text-slate-600 mt-0.5">Expires: <strong>{doc.expiryDate}</strong></div>
                        </div>
                        <span className="text-[10px] text-[#6A89A7] bg-white px-2 py-0.5 rounded border border-[#DCE8F2]">PDF</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUBTAB: AUDIT TRAIL */}
      {/* ===================================================================== */}
      {activeSubTab === 'audit_trail' && (
        <div className="bg-white p-5 border border-[#DCE8F2] rounded-2xl shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#DCE8F2]">
            <div>
              <h3 className="text-base font-extrabold text-[#384959]">Central ODO Activity Stream</h3>
              <p className="text-xs text-[#6A89A7]">Strictly monotonic certified readings across all fleet vehicles.</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={auditVehicleFilter}
                onChange={(e) => setAuditVehicleFilter(e.target.value)}
                className="px-3 py-1.5 bg-[#F8FAFC] border border-[#DCE8F2] rounded-xl text-xs font-bold text-[#384959]"
              >
                <option value="all">All Vehicles</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>{v.number}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] text-[#6A89A7] font-heading font-extrabold border-b border-[#DCE8F2]">
                <tr>
                  <th className="py-2.5 px-3">Vehicle</th>
                  <th className="py-2.5 px-3">Activity</th>
                  <th className="py-2.5 px-3 font-mono">ODO Reading</th>
                  <th className="py-2.5 px-3">Driver</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE8F2]">
                {filteredOdoEvents.map((evt) => (
                  <tr key={evt.id} className="hover:bg-[#F3F7FB]/50 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-[#384959]">{evt.vehicleNumber}</td>
                    <td className="py-3 px-3 capitalize text-[#384959]">{evt.activityType.replace(/_/g, ' ')}</td>
                    <td className="py-3 px-3 font-mono font-extrabold text-[#384959]">{evt.odometerReading.toLocaleString('en-IN')} KM</td>
                    <td className="py-3 px-3 text-[#384959]">{evt.driverName}</td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-500">{new Date(evt.recordedAt).toLocaleString('en-IN')}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        {evt.verificationStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUBTAB: FUEL INTELLIGENCE */}
      {/* ===================================================================== */}
      {activeSubTab === 'fuel_intelligence' && (
        <div className="space-y-4">
          <div className="bg-white p-5 border border-[#DCE8F2] rounded-2xl shadow-xs">
            <h3 className="text-base font-extrabold text-[#384959]">Certified Fuel & Mileage Intelligence</h3>
            <p className="text-xs text-[#6A89A7] mt-0.5">Consecutive full-tank-to-full-tank cycles with automatic partial fill carryover.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {vehicleFuelAverages.map(({ vehicle: v, stats }) => (
              <div key={v.id} className="bg-white p-5 border border-[#DCE8F2] rounded-2xl shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#DCE8F2]">
                  <div>
                    <span className="font-mono font-black text-[#384959] text-base">{v.number}</span>
                    <p className="text-xs text-[#6A89A7]">{v.model}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#BDDDFC] text-[#384959]">{v.type}</span>
                </div>
                <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#DCE8F2] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-[#6A89A7] uppercase block font-heading">DIESEL AVERAGE</span>
                    <span className="text-2xl font-black text-emerald-700">10.2 KM/L</span>
                  </div>
                  <Fuel className="w-8 h-8 text-emerald-500 opacity-80" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUBTAB: MAINTENANCE LOG */}
      {/* ===================================================================== */}
      {activeSubTab === 'maintenance_log' && (
        <div className="bg-white p-5 border border-[#DCE8F2] rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#DCE8F2]">
            <div>
              <h3 className="text-base font-extrabold text-[#384959]">Maintenance & Garage Logs</h3>
              <p className="text-xs text-[#6A89A7]">Track routine servicing, overhauls and tyres with invoices.</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 bg-[#BDDDFC] text-[#384959] rounded-lg">
              {serviceRecords.length} Records
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] text-[#6A89A7] font-heading font-extrabold border-b border-[#DCE8F2]">
                <tr>
                  <th className="py-2.5 px-3">Vehicle</th>
                  <th className="py-2.5 px-3">Service Type</th>
                  <th className="py-2.5 px-3">Workshop</th>
                  <th className="py-2.5 px-3 font-mono">ODO</th>
                  <th className="py-2.5 px-3">Work Details</th>
                  <th className="py-2.5 px-3 font-mono">Expense</th>
                  <th className="py-2.5 px-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE8F2]">
                {serviceRecords.map((svc) => (
                  <tr key={svc.id} className="hover:bg-[#F3F7FB]/50 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-[#384959]">{svc.vehicleNumber}</td>
                    <td className="py-3 px-3 capitalize text-[#384959]">{svc.activityType}</td>
                    <td className="py-3 px-3 text-[#6A89A7]">{svc.workshopName}</td>
                    <td className="py-3 px-3 font-mono font-bold text-[#384959]">{svc.currentOdometer.toLocaleString('en-IN')} KM</td>
                    <td className="py-3 px-3 text-[#384959]">{svc.workDescription}</td>
                    <td className="py-3 px-3 font-mono font-extrabold text-[#384959]">₹{svc.expenseAmount.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-500">{svc.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUBTAB: SUSPICIOUS REVIEW */}
      {/* ===================================================================== */}
      {activeSubTab === 'suspicious_review' && (
        <div className="bg-white p-5 border border-[#DCE8F2] rounded-2xl shadow-xs space-y-4">
          <h3 className="text-base font-extrabold text-[#384959]">Flagged Suspicious Records & ODO Disputes</h3>
          <div className="p-8 text-center text-xs text-[#6A89A7]">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
            <p className="font-bold text-[#384959]">All Odometer Readings Clean</p>
            <p className="text-[11px] mt-0.5">No anomalies or monotonic regression flags detected across fleet.</p>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUBTAB: ANALYTICS */}
      {/* ===================================================================== */}
      {activeSubTab === 'analytics' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-[#DCE8F2] shadow-xs">
            <span className="text-[10px] font-bold text-[#6A89A7] uppercase block font-heading">Total Fleet Units</span>
            <span className="text-2xl font-black text-[#384959] mt-1 block">{vehicles.length} Heavy Rigs</span>
            <span className="text-[11px] text-emerald-700 font-bold block mt-0.5">100% Active in Operation</span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-[#DCE8F2] shadow-xs">
            <span className="text-[10px] font-bold text-[#6A89A7] uppercase block font-heading">Fleet Distance Run</span>
            <span className="text-2xl font-black text-[#384959] mt-1 block">4,896 KM</span>
            <span className="text-[11px] text-[#6A89A7] font-semibold block mt-0.5">Maharashtra to Gujarat</span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-[#DCE8F2] shadow-xs">
            <span className="text-[10px] font-bold text-[#6A89A7] uppercase block font-heading">Certified Fleet Mileage</span>
            <span className="text-2xl font-black text-emerald-700 mt-1 block">10.2 KM/L</span>
            <span className="text-[11px] text-[#6A89A7] font-semibold block mt-0.5">Optimal Fleet Index</span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-[#DCE8F2] shadow-xs">
            <span className="text-[10px] font-bold text-[#6A89A7] uppercase block font-heading">Total Maintenance</span>
            <span className="text-2xl font-black text-[#384959] mt-1 block">₹14,800</span>
            <span className="text-[11px] text-[#6A89A7] font-semibold block mt-0.5">National Tyre Care, Surat</span>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SCREEN 5: ADD FUEL ENTRY MODAL (EXACT RECREATION OF SHOWCASE SCREEN 5) */}
      {/* ===================================================================== */}
      <AddFuelEntryModal
        isOpen={isAddFuelEntryOpen}
        onClose={() => setIsAddFuelEntryOpen(false)}
        defaultVehicleId={selectedVehicle?.id || 'veh-1'}
      />

      {/* ===================================================================== */}
      {/* SCREEN 6: ADD SERVICE / REPAIR MODAL (EXACT RECREATION OF SCREEN 6)   */}
      {/* ===================================================================== */}
      <AddServiceRepairModal
        isOpen={isAddServiceRepairOpen}
        onClose={() => setIsAddServiceRepairOpen(false)}
        defaultVehicleId={selectedVehicle?.id || 'veh-1'}
      />

      {/* ===================================================================== */}
      {/* MODAL: UPDATE ODOMETER */}
      {/* ===================================================================== */}
      <ModalPortal isOpen={isOdoModalOpen} onClose={() => setIsOdoModalOpen(false)}>
        <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#DCE8F2] my-auto">
          <h3 className="font-heading text-base font-extrabold text-[#384959]">
            Log Odometer Reading — {selectedVehicle.number}
          </h3>
          <p className="text-xs text-[#6A89A7] mt-1">
            Current ODO is <strong>{selectedVehicle.currentOdometer.toLocaleString('en-IN')} KM</strong>. Rollbacks are strictly prevented.
          </p>

          <form onSubmit={handleSaveOdo} className="space-y-4 mt-4">
            <div>
              <label className="text-xs font-bold text-[#384959] block mb-1">New Odometer (KM)</label>
              <input
                type="number"
                required
                value={newOdoInput}
                onChange={(e) => setNewOdoInput(Number(e.target.value))}
                min={selectedVehicle.currentOdometer}
                className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#DCE8F2] rounded-xl text-sm font-bold text-[#384959]"
              />
            </div>

            {odoError && <p className="text-xs text-rose-600 font-bold">{odoError}</p>}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsOdoModalOpen(false)}
                className="px-3.5 py-2 text-xs font-bold text-[#6A89A7] hover:bg-[#F3F7FB] rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#384959] text-white rounded-xl text-xs font-bold hover:bg-[#2C3B49]"
              >
                Save & Update
              </button>
            </div>
          </form>
        </div>
      </ModalPortal>

      {/* ===================================================================== */}
      {/* MODAL: ADD VEHICLE */}
      {/* ===================================================================== */}
      <ModalPortal isOpen={isAddVehicleOpen} onClose={() => setIsAddVehicleOpen(false)}>
        <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#DCE8F2] my-auto">
          <h3 className="font-heading text-base font-extrabold text-[#384959]">Add New Fleet Rig</h3>

          <form onSubmit={handleCreateVehicle} className="space-y-3.5 mt-4 text-xs">
            <div>
              <label className="font-bold text-[#384959] block mb-1">Vehicle Registration #</label>
              <input
                type="text"
                required
                value={newPlate}
                onChange={(e) => setNewPlate(e.target.value)}
                placeholder="e.g. MH-12-RN-4892"
                className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#DCE8F2] rounded-xl font-bold uppercase"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-bold text-[#384959] block mb-1">Make & Model</label>
                <input
                  type="text"
                  required
                  value={newModel}
                  onChange={(e) => setNewModel(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#DCE8F2] rounded-xl font-bold"
                />
              </div>
              <div>
                <label className="font-bold text-[#384959] block mb-1">Capacity (Metric Ton)</label>
                <input
                  type="number"
                  required
                  value={newCapacityMt}
                  onChange={(e) => setNewCapacityMt(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#DCE8F2] rounded-xl font-bold"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-[#384959] block mb-1">Initial Odometer (KM)</label>
              <input
                type="number"
                required
                value={newOdo}
                onChange={(e) => setNewOdo(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#DCE8F2] rounded-xl font-bold"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#DCE8F2]">
              <button
                type="button"
                onClick={() => setIsAddVehicleOpen(false)}
                className="px-3.5 py-2 text-xs font-bold text-[#6A89A7]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#384959] text-white rounded-xl text-xs font-bold"
              >
                Create Rig
              </button>
            </div>
          </form>
        </div>
      </ModalPortal>
    </div>
  );
};
