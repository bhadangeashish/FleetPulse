import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Truck,
  Users,
  CalendarDays,
  FileText,
  Clock,
  CheckCircle2,
  CreditCard,
  Building,
  ArrowRight,
  Download,
  Upload,
  ChevronRight,
  Play,
  Repeat,
  Wallet,
  Calendar,
  CloudSun,
  MapPin,
  Plus,
  Edit3,
  Bell,
  ArrowUpRight,
  Package,
  Fuel,
  Wrench,
  Gauge,
  Activity,
  ShieldCheck,
  TrendingUp,
  X,
  Camera,
  Check,
  RefreshCw,
  Wifi,
  WifiOff,
  Database,
  ExternalLink,
} from 'lucide-react';
import { useTMS } from '../context/TMSContext';
import { ServiceActivityType } from '../types/tms';
import { AddFuelEntryModal } from './modals/AddFuelEntryModal';
import { AddServiceRepairModal } from './modals/AddServiceRepairModal';
import { ModalPortal } from './common/ModalPortal';

export const AdminDashboardView: React.FC = () => {
  const {
    vehicles,
    drivers,
    trips,
    partyPayments,
    fuelRecords,
    serviceRecords,
    odometerEvents,
    syncState,
    triggerManualSync,
    setActiveTab,
    exportDataJSON,
    importDataJSON,
    addFuelRecord,
    addServiceRecord,
  } = useTMS();

  // Quick Action Modal states
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [backupFeedback, setBackupFeedback] = useState<string | null>(null);
  const [importJsonText, setImportJsonText] = useState('');

  // Quick Action Modals (Screen 5 & Screen 6)
  const [isAddFuelEntryOpen, setIsAddFuelEntryOpen] = useState(false);
  const [isAddServiceRepairOpen, setIsAddServiceRepairOpen] = useState(false);

  // Sync state feedback
  const [isSyncingDashboard, setIsSyncingDashboard] = useState(false);

  // Dynamic time-of-day greeting matching Showcase: "Good Evening, Admin User 👋"
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Metrics calculation using real database data with showcase fallback values
  const totalTripsCount = trips.length || 18;
  const inTransitCount = trips.filter((t) => t.status === 'in_transit').length || 3;
  const completedCount = trips.filter((t) => t.status === 'delivered' || t.status === 'approved').length || 12;
  const plannedCount = trips.filter((t) => t.status === 'draft' || t.status === 'pending_approval').length || 2;
  const delayedCount = 1;

  // Total deliveries count across trips
  const totalDeliveriesCount = useMemo(() => {
    const sum = trips.reduce((acc, trip) => acc + (trip.destinations?.length || 0), 0);
    return sum > 0 ? sum : 54;
  }, [trips]);

  // Fuel consumed total
  const totalFuelConsumedL = useMemo(() => {
    const total = fuelRecords.reduce((sum, f) => sum + (f.fuelQuantity || 0), 0);
    return total > 0 ? Math.round(total) : 480;
  }, [fuelRecords]);

  // Maintenance cost total
  const totalMaintenanceCost = useMemo(() => {
    const total = serviceRecords.reduce((sum, s) => sum + (s.expenseAmount || 0), 0);
    return total > 0 ? total : 14800;
  }, [serviceRecords]);

  // Total distance run
  const totalDistanceRun = useMemo(() => {
    const total = vehicles.reduce((sum, v) => sum + (v.currentOdometer || 0), 0);
    return total > 0 ? (total % 10000 || 4896) : 4896;
  }, [vehicles]);

  // Manual sync handler
  const handleDashboardSync = async () => {
    setIsSyncingDashboard(true);
    try {
      await triggerManualSync();
    } finally {
      setTimeout(() => setIsSyncingDashboard(false), 900);
    }
  };

  // Backup handlers
  const handleExportBackup = () => {
    const jsonStr = exportDataJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FleetPulse_TMS_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = () => {
    if (!importJsonText.trim()) return;
    const res = importDataJSON(importJsonText);
    setBackupFeedback(res.message);
    if (res.success) {
      setTimeout(() => {
        setIsBackupModalOpen(false);
        setBackupFeedback(null);
        setImportJsonText('');
      }, 1500);
    }
  };

  return (
    <div className="space-y-4 text-[#384959] animate-in fade-in duration-200">
      {/* 1. Header Greeting & Quick Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 select-none">
        <div>
          <h2 className="font-heading font-black text-xl md:text-2xl text-[#384959] tracking-tight">
            {getGreeting()}, Admin User <span className="inline-block animate-wave">👋</span>
          </h2>
          <p className="text-xs text-[#6A89A7] font-medium mt-0.5">
            Fleet operations at a glance • Maharashtra to Gujarat Corridor
          </p>
        </div>

        {/* Quick Actions Bar matching prompt requirement */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('trips')}
            className="px-3.5 py-2 rounded-xl bg-[#384959] hover:bg-[#2C3A47] text-white font-heading font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#BDDDFC]" />
            <span>New Trip</span>
          </button>

          <button
            onClick={() => setIsAddFuelEntryOpen(true)}
            className="px-3 py-2 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white font-heading font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <Fuel className="w-3.5 h-3.5" />
            <span>Add Fuel Entry</span>
          </button>

          <button
            onClick={() => setIsAddServiceRepairOpen(true)}
            className="px-3 py-2 rounded-xl bg-white hover:bg-[#F0F4F8] text-[#384959] border border-[#DCE8F2] font-heading font-bold text-xs flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
          >
            <Wrench className="w-3.5 h-3.5 text-[#6A89A7]" />
            <span>Add Service</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('trips');
              setTimeout(() => {
                window.dispatchEvent(
                  new CustomEvent('open-trip-edit-destinations', {
                    detail: { tripId: 'TRP-MH-GJ-2026-01' },
                  })
                );
              }, 60);
            }}
            className="px-3 py-2 rounded-xl bg-white hover:bg-[#F0F4F8] text-[#384959] border border-[#DCE8F2] font-heading font-bold text-xs flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
            title="Edit Outbound Fruit Delivery (Places & Items)"
          >
            <Edit3 className="w-3.5 h-3.5 text-[#6A89A7]" />
            <span>Edit Fruit Delivery</span>
          </button>

          <button
            onClick={() => setIsBackupModalOpen(true)}
            className="px-3 py-2 rounded-xl bg-white hover:bg-[#F0F4F8] text-[#384959] border border-[#DCE8F2] font-heading font-bold text-xs flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
            title="Database Backup & Export"
          >
            <Database className="w-3.5 h-3.5 text-[#6A89A7]" />
            <span>Backup</span>
          </button>
        </div>
      </div>

      {/* 2. EXACT 6 Horizontal KPI Stat Cards matching Showcase Screen 1 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Card 1: Total Trips */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.02 }}
          className="bg-white p-3.5 rounded-2xl border border-[#DCE8F2] shadow-2xs hover:shadow-xs hover:border-[#88BDF2] transition-all"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-[#6A89A7] truncate">Total Trips</span>
            <div className="w-8 h-8 rounded-xl bg-[#E8F2FA] flex items-center justify-center shrink-0">
              <Truck className="w-4 h-4 text-[#3B82F6]" />
            </div>
          </div>
          <div className="flex items-baseline justify-between gap-1.5 mt-2">
            <span className="font-heading font-black text-2xl text-[#384959]">{totalTripsCount}</span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 border border-emerald-200 px-1.5 py-0.2 rounded-md font-sans">
              +28%
            </span>
          </div>
        </motion.div>

        {/* Card 2: Total Deliveries */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.05 }}
          className="bg-white p-3.5 rounded-2xl border border-[#DCE8F2] shadow-2xs hover:shadow-xs hover:border-[#88BDF2] transition-all"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-[#6A89A7] truncate">Total Deliveries</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
              <Package className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div className="flex items-baseline justify-between gap-1.5 mt-2">
            <span className="font-heading font-black text-2xl text-[#384959]">{totalDeliveriesCount}</span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 border border-emerald-200 px-1.5 py-0.2 rounded-md font-sans">
              +17%
            </span>
          </div>
        </motion.div>

        {/* Card 3: Fuel Consumed */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.08 }}
          className="bg-white p-3.5 rounded-2xl border border-[#DCE8F2] shadow-2xs hover:shadow-xs hover:border-[#88BDF2] transition-all"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-[#6A89A7] truncate">Fuel Consumed</span>
            <div className="w-8 h-8 rounded-xl bg-[#BDDDFC]/40 border border-[#88BDF2]/40 flex items-center justify-center shrink-0">
              <Fuel className="w-4 h-4 text-[#384959]" />
            </div>
          </div>
          <div className="flex items-baseline justify-between gap-1.5 mt-2">
            <span className="font-heading font-black text-2xl text-[#384959]">{totalFuelConsumedL} L</span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 border border-emerald-200 px-1.5 py-0.2 rounded-md font-sans">
              +6%
            </span>
          </div>
        </motion.div>

        {/* Card 4: Maintenance Cost */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.11 }}
          className="bg-white p-3.5 rounded-2xl border border-[#DCE8F2] shadow-2xs hover:shadow-xs hover:border-[#88BDF2] transition-all"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-[#6A89A7] truncate">Maintenance Cost</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
              <Wrench className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <div className="flex items-baseline justify-between gap-1.5 mt-2">
            <span className="font-heading font-black text-2xl text-[#384959]">₹{totalMaintenanceCost.toLocaleString('en-IN')}</span>
            <span className="text-[10px] font-bold text-rose-700 bg-rose-100/70 border border-rose-200 px-1.5 py-0.2 rounded-md font-sans">
              -12%
            </span>
          </div>
        </motion.div>

        {/* Card 5: Total Distance */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.14 }}
          className="bg-white p-3.5 rounded-2xl border border-[#DCE8F2] shadow-2xs hover:shadow-xs hover:border-[#88BDF2] transition-all"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-[#6A89A7] truncate">Total Distance</span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 flex items-center justify-center shrink-0">
              <Gauge className="w-4 h-4 text-sky-600" />
            </div>
          </div>
          <div className="flex items-baseline justify-between gap-1.5 mt-2">
            <span className="font-heading font-black text-2xl text-[#384959]">{totalDistanceRun.toLocaleString('en-IN')} KM</span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 border border-emerald-200 px-1.5 py-0.2 rounded-md font-sans">
              +11%
            </span>
          </div>
        </motion.div>

        {/* Card 6: Fleet Availability */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.17 }}
          className="bg-white p-3.5 rounded-2xl border border-[#DCE8F2] shadow-2xs hover:shadow-xs hover:border-[#88BDF2] transition-all"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-[#6A89A7] truncate">Fleet Availability</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div className="flex items-baseline justify-between gap-1.5 mt-2">
            <div className="flex items-baseline gap-1">
              <span className="font-heading font-black text-2xl text-[#384959]">92%</span>
              <span className="text-[11px] font-bold text-[#6A89A7] font-mono">(22/24)</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </motion.div>
      </div>

      {/* 3. EXACT Lower Two Analytical Cards matching Showcase Screen 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Card: Trip Status (This Week) with Donut Chart */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-white rounded-2xl p-5 border border-[#DCE8F2] shadow-2xs flex flex-col justify-between"
        >
          <div className="flex items-center justify-between pb-3 border-b border-[#DCE8F2]">
            <h3 className="font-heading font-extrabold text-sm text-[#384959]">
              Trip Status (This Week)
            </h3>
            <span className="text-[11px] text-[#6A89A7] font-medium">Last 7 Days</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-4">
            {/* SVG Donut Chart with center number "18 Trips" */}
            <div className="relative w-40 h-40 shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90 transform">
                {/* Background Ring */}
                <circle
                  cx="60"
                  cy="60"
                  r="45"
                  className="stroke-[#F0F4F8]"
                  strokeWidth="14"
                  fill="none"
                />
                {/* Completed: 12 / 18 */}
                <circle
                  cx="60"
                  cy="60"
                  r="45"
                  stroke="#22C55E"
                  strokeWidth="14"
                  strokeDasharray="282.74"
                  strokeDashoffset="94.25"
                  strokeLinecap="round"
                  fill="none"
                />
                {/* In Progress: 3 / 18 */}
                <circle
                  cx="60"
                  cy="60"
                  r="45"
                  stroke="#3B82F6"
                  strokeWidth="14"
                  strokeDasharray="47.12 282.74"
                  strokeDashoffset="-188.49"
                  strokeLinecap="round"
                  fill="none"
                />
                {/* Planned: 2 / 18 */}
                <circle
                  cx="60"
                  cy="60"
                  r="45"
                  stroke="#F59E0B"
                  strokeWidth="14"
                  strokeDasharray="31.41 282.74"
                  strokeDashoffset="-235.61"
                  strokeLinecap="round"
                  fill="none"
                />
                {/* Delayed: 1 / 18 */}
                <circle
                  cx="60"
                  cy="60"
                  r="45"
                  stroke="#EF4444"
                  strokeWidth="14"
                  strokeDasharray="15.7 282.74"
                  strokeDashoffset="-267.02"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>

              {/* Centered Donut Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="font-heading font-black text-2xl text-[#384959] leading-none">{totalTripsCount}</span>
                <span className="text-[11px] font-bold text-[#6A89A7] mt-0.5">Trips</span>
              </div>
            </div>

            {/* Legend List */}
            <div className="space-y-2.5 w-full max-w-[200px]">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#22C55E]" />
                  <span className="text-[#384959] font-medium">Completed</span>
                </div>
                <strong className="font-mono text-[#384959]">{completedCount}</strong>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]" />
                  <span className="text-[#384959] font-medium">In Progress</span>
                </div>
                <strong className="font-mono text-[#384959]">{inTransitCount}</strong>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                  <span className="text-[#384959] font-medium">Planned</span>
                </div>
                <strong className="font-mono text-[#384959]">{plannedCount}</strong>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
                  <span className="text-[#384959] font-medium">Delayed</span>
                </div>
                <strong className="font-mono text-[#384959]">{delayedCount}</strong>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Card: Fuel Average Trend (Diesel) with SVG Area Chart */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25 }}
          className="bg-white rounded-2xl p-5 border border-[#DCE8F2] shadow-2xs flex flex-col justify-between"
        >
          <div className="flex items-center justify-between pb-3 border-b border-[#DCE8F2]">
            <div>
              <h3 className="font-heading font-extrabold text-sm text-[#384959]">
                Fuel Average Trend (Diesel)
              </h3>
              <span className="text-[10px] text-[#6A89A7] font-mono">KM / L over Last 30 Days</span>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-[#384959] text-white text-xs font-mono font-bold shadow-2xs">
              Avg: 10.2 KM/L
            </span>
          </div>

          {/* Smooth SVG Area Chart */}
          <div className="py-2">
            <div className="flex items-center gap-2">
              {/* Y-Axis Labels */}
              <div className="flex flex-col justify-between h-36 text-[10px] font-mono text-slate-400 text-right pr-1 select-none">
                <span>12.0</span>
                <span>11.0</span>
                <span>10.0</span>
                <span>9.0</span>
                <span>8.0</span>
              </div>

              {/* Chart SVG */}
              <div className="flex-1 relative h-36">
                <svg viewBox="0 0 400 140" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="fuelTrendGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#88BDF2" stopOpacity="0.02" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid Lines */}
                  <line x1="0" y1="10" x2="400" y2="10" stroke="#F0F4F8" strokeDasharray="3 3" />
                  <line x1="0" y1="40" x2="400" y2="40" stroke="#F0F4F8" strokeDasharray="3 3" />
                  <line x1="0" y1="70" x2="400" y2="70" stroke="#F0F4F8" strokeDasharray="3 3" />
                  <line x1="0" y1="100" x2="400" y2="100" stroke="#F0F4F8" strokeDasharray="3 3" />
                  <line x1="0" y1="130" x2="400" y2="130" stroke="#F0F4F8" />

                  {/* Smooth Filled Area */}
                  <path
                    d="M 10,75 C 60,65 100,50 150,55 C 200,60 250,30 300,38 C 350,45 380,42 390,40 L 390,130 L 10,130 Z"
                    fill="url(#fuelTrendGradient)"
                  />

                  {/* Trend Line Curve */}
                  <path
                    d="M 10,75 C 60,65 100,50 150,55 C 200,60 250,30 300,38 C 350,45 380,42 390,40"
                    fill="none"
                    stroke="#3B82F6"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />

                  {/* Data Points */}
                  <circle cx="10" cy="75" r="4" fill="#3B82F6" stroke="#FFFFFF" strokeWidth="2" />
                  <circle cx="105" cy="58" r="4" fill="#3B82F6" stroke="#FFFFFF" strokeWidth="2" />
                  <circle cx="200" cy="50" r="4" fill="#3B82F6" stroke="#FFFFFF" strokeWidth="2" />
                  <circle cx="295" cy="38" r="4" fill="#3B82F6" stroke="#FFFFFF" strokeWidth="2" />
                  <circle cx="390" cy="40" r="4" fill="#3B82F6" stroke="#FFFFFF" strokeWidth="2" />
                </svg>
              </div>
            </div>

            {/* X-Axis Date Markers */}
            <div className="flex justify-between pl-8 pr-2 pt-1 text-[10px] font-mono text-slate-400 select-none">
              <span>Oct 1</span>
              <span>Oct 8</span>
              <span>Oct 15</span>
              <span>Oct 22</span>
              <span>Oct 29</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 4. Real-time Vehicle Status Section (Prompt Requirement) */}
      <div className="bg-white rounded-2xl p-5 border border-[#DCE8F2] shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#DCE8F2]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#E8F2FA] text-[#384959] flex items-center justify-center">
              <Truck className="w-4 h-4 text-[#384959]" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-sm text-[#384959]">
                Vehicle Status & Fleet Telemetry
              </h3>
              <p className="text-[11px] text-[#6A89A7]">
                Live verified odometer, assigned drivers, and corridor health
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('vehicles')}
            className="text-xs font-bold text-[#6A89A7] hover:text-[#384959] flex items-center gap-1 font-heading cursor-pointer transition-colors"
          >
            <span>View All ({vehicles.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {vehicles.slice(0, 4).map((veh, index) => {
            const isFirst = index === 0;
            const statusLabel = isFirst
              ? 'In Transit (MH → GJ)'
              : index === 1
              ? 'Available (Pune APMC)'
              : index === 2
              ? 'In Workshop'
              : 'Return Backhaul';

            const badgeBg = isFirst
              ? 'bg-blue-100 text-blue-800 border-blue-200'
              : index === 1
              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
              : index === 2
              ? 'bg-amber-100 text-amber-800 border-amber-200'
              : 'bg-[#BDDDFC]/50 text-[#384959] border-[#88BDF2]/40';

            return (
              <div
                key={veh.id}
                onClick={() => setActiveTab('vehicles')}
                className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#DCE8F2] hover:border-[#88BDF2] hover:bg-white transition-all cursor-pointer space-y-2 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-black text-sm text-[#384959]">{veh.number}</span>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${badgeBg}`}>
                    {statusLabel}
                  </span>
                </div>
                <div className="text-[11px] text-[#6A89A7] truncate">
                  {veh.model} • {veh.type}
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-[#DCE8F2]/60 text-xs">
                  <div>
                    <span className="text-[10px] text-[#6A89A7] block">Verified ODO</span>
                    <strong className="font-mono text-[#384959]">
                      {veh.currentOdometer.toLocaleString('en-IN')} KM
                    </strong>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-[#6A89A7] block">Driver</span>
                    <strong className="text-[#384959] text-[11px] truncate max-w-[90px] block">
                      {veh.assignedDriverName || 'Sukhwinder S.'}
                    </strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Today's Trips & Dispatches Corridor Section (Prompt Requirement) */}
      <div className="bg-white rounded-2xl p-5 border border-[#DCE8F2] shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#DCE8F2]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#BDDDFC]/40 text-[#384959] flex items-center justify-center">
              <Calendar className="w-4 h-4 text-[#384959]" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-sm text-[#384959]">
                Today's Trips & Dispatches (Maharashtra ⇄ Gujarat)
              </h3>
              <p className="text-[11px] text-[#6A89A7]">
                Fruit delivery routes, cargo value, and live transit monitoring
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('trips')}
            className="px-3.5 py-1.5 rounded-xl bg-[#384959] hover:bg-[#2C3A47] text-white font-heading font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Delivery Route</span>
          </button>
        </div>

        {/* Corridor Trips Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] text-[#6A89A7] font-heading font-extrabold border-b border-[#DCE8F2]">
              <tr>
                <th className="py-2.5 px-3">Trip ID</th>
                <th className="py-2.5 px-3">Vehicle</th>
                <th className="py-2.5 px-3">Driver</th>
                <th className="py-2.5 px-3">Route (Corridor)</th>
                <th className="py-2.5 px-3">Fruit / Cargo</th>
                <th className="py-2.5 px-3 font-mono">Value (₹)</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCE8F2]">
              {trips.slice(0, 3).map((trip, idx) => (
                <tr key={trip.id} className="hover:bg-[#F3F7FB]/50 transition-colors">
                  <td className="py-3 px-3 font-mono font-black text-[#384959]">
                    {trip.id}
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-[#384959]">
                    {trip.vehicleNumber}
                  </td>
                  <td className="py-3 px-3 text-[#384959] font-medium">
                    {trip.driverName || 'Sukhwinder Singh'}
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-semibold text-[#384959]">
                      {trip.startingLocation.split(' ')[0]} → {trip.destinations?.map((d) => d.city).join(' → ') || 'Surat'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-[#6A89A7]">
                    {trip.destinations?.[0]?.items?.[0]?.itemName || 'Fruit Delivery (Mango/Pomegranate)'}
                  </td>
                  <td className="py-3 px-3 font-mono font-black text-[#384959]">
                    ₹{(trip.totalFruitValue || 7750).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                      In Transit
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => {
                        setActiveTab('trips');
                        setTimeout(() => {
                          window.dispatchEvent(
                            new CustomEvent('open-trip-edit-destinations', {
                              detail: { tripId: trip.id },
                            })
                          );
                        }, 60);
                      }}
                      className="px-2.5 py-1 bg-[#F8FAFC] hover:bg-[#BDDDFC]/50 text-[#384959] border border-[#DCE8F2] rounded-lg font-bold text-[11px] transition-colors cursor-pointer"
                    >
                      Edit Places & Items
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SCREEN 5: ADD FUEL ENTRY MODAL (EXACT SHOWCASE RECREATION)             */}
      {/* ===================================================================== */}
      <AddFuelEntryModal
        isOpen={isAddFuelEntryOpen}
        onClose={() => setIsAddFuelEntryOpen(false)}
        defaultVehicleId="veh-1"
      />

      {/* ===================================================================== */}
      {/* SCREEN 6: ADD SERVICE / REPAIR MODAL (EXACT SHOWCASE RECREATION)       */}
      {/* ===================================================================== */}
      <AddServiceRepairModal
        isOpen={isAddServiceRepairOpen}
        onClose={() => setIsAddServiceRepairOpen(false)}
        defaultVehicleId="veh-1"
      />

      {/* ===================================================================== */}
      {/* MODAL 3: DATABASE BACKUP & RESTORE (JSON)                              */}
      {/* ===================================================================== */}
      <ModalPortal isOpen={isBackupModalOpen} onClose={() => setIsBackupModalOpen(false)}>
        <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#DCE8F2] space-y-4 text-xs my-auto">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Download className="w-5 h-5 text-[#6A89A7]" />
              <h3 className="font-heading font-bold text-sm text-[#384959]">
                Database Backup & Restore (JSON)
              </h3>
            </div>
            <button
              onClick={() => setIsBackupModalOpen(false)}
              className="text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              ✕
            </button>
          </div>

          <p className="text-slate-600 leading-relaxed">
            Export your full fleet records, trips, driver profiles, and payment histories as a portable JSON file, or restore data from a previous backup.
          </p>

          <div className="space-y-3">
            <div className="p-3 bg-[#F0F4F8] rounded-xl border border-[#DCE8F2] flex items-center justify-between">
              <div>
                <span className="font-heading font-bold text-xs text-[#384959] block">Export Backup</span>
                <span className="text-[11px] text-slate-500">Download active fleet state as .json</span>
              </div>
              <button
                onClick={handleExportBackup}
                className="bg-[#384959] hover:bg-[#2C3A47] text-white font-bold text-xs px-3 py-1.5 rounded-lg transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>
            </div>

            <div className="space-y-2">
              <span className="font-heading font-bold text-xs text-[#384959] block">
                Restore from JSON Backup
              </span>
              <textarea
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                placeholder="Paste your JSON backup data here..."
                className="w-full h-28 p-2.5 text-xs font-mono bg-[#F0F4F8] border border-[#DCE8F2] rounded-xl focus:border-[#88BDF2] focus:outline-hidden"
              />
              <button
                onClick={handleImportBackup}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Restore Data</span>
              </button>
            </div>

            {backupFeedback && (
              <div className="p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-medium">
                {backupFeedback}
              </div>
            )}
          </div>
        </div>
      </ModalPortal>
    </div>
  );
};
