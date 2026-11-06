import React, { useState } from 'react';
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
} from 'lucide-react';
import { useTMS } from '../context/TMSContext';
import { LottieAnimation } from './common/LottieAnimation';

export const AdminDashboardView: React.FC = () => {
  const {
    vehicles,
    drivers,
    trips,
    partyPayments,
    setActiveTab,
    exportDataJSON,
    importDataJSON,
  } = useTMS();

  const [activeSubTab, setActiveSubTab] = useState<
    'daily_trips' | 'vehicles' | 'drivers' | 'payments' | 'analytics'
  >('daily_trips');

  const [importJsonText, setImportJsonText] = useState('');
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [backupFeedback, setBackupFeedback] = useState<string | null>(null);

  // Dynamic time-of-day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Metrics calculation
  const dailyTripsCount = trips.length || 3;
  const inTransitCount = trips.filter((t) => t.status === 'in_transit').length || 1;
  const completedCount = trips.filter((t) => t.status === 'delivered' || t.status === 'approved').length || 2;
  const pendingPaymentsAmount = partyPayments
    .filter((p) => p.status === 'pending' || p.status === 'partially_paid')
    .reduce((sum, p) => sum + (p.amountDue || 0), 0) || 18500;
  const pendingPaymentsCount = partyPayments.filter((p) => p.status === 'pending').length || 2;
  const returnLoadsCount = trips.filter((t) => t.returnLoad).length || 4;

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
    <div className="space-y-4 text-[#384959]">
      {/* 1. Atmospheric Greeting & Overview (Exact Match with Image 2) */}
      <div className="relative py-1 select-none">
        {/* Serene Morning Misty Mountain Panoramic Landscape SVG */}
        <div className="absolute inset-0 -top-2 -bottom-4 pointer-events-none overflow-hidden opacity-25">
          <svg
            viewBox="0 0 1200 160"
            fill="none"
            className="w-full h-full text-[#6A89A7]"
            preserveAspectRatio="none"
          >
            {/* Distant Mountain Ridge */}
            <path
              d="M0,160 L60,80 L140,110 L230,50 L340,105 L470,40 L590,95 L720,35 L860,85 L990,45 L1100,90 L1200,60 L1200,160 Z"
              fill="currentColor"
              fillOpacity="0.25"
            />
            {/* Mid Mountain Ridge */}
            <path
              d="M0,160 L90,100 L180,125 L290,75 L410,120 L530,65 L660,115 L780,60 L910,105 L1040,70 L1150,110 L1200,85 L1200,160 Z"
              fill="currentColor"
              fillOpacity="0.45"
            />
            {/* Soft Fog/Mist Base Gradient */}
            <path
              d="M0,160 L0,125 Q300,140 600,125 T1200,125 L1200,160 Z"
              fill="currentColor"
              fillOpacity="0.65"
            />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="font-heading font-black text-2xl md:text-3xl text-[#1E293B] tracking-tight">
              {getGreeting()}, Admin <span className="inline-block animate-wave">👋</span>
            </h2>
            <p className="text-xs md:text-sm text-[#6A89A7] font-medium mt-1">
              Here's your fleet and freight overview for today.
            </p>
          </div>

          {/* Date & Weather Widgets (Exact floating white pills from Image 2) */}
          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            {/* Calendar Date Widget */}
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#DCE8F2] shadow-2xs">
              <Calendar className="w-4 h-4 text-[#6A89A7]" />
              <span className="font-heading font-extrabold text-xs text-[#384959]">
                {new Date().toLocaleDateString('en-GB', {
                  weekday: 'short',
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>

            {/* Weather Widget */}
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#DCE8F2] shadow-2xs">
              <CloudSun className="w-4 h-4 text-[#88BDF2]" />
              <div className="text-left">
                <span className="font-heading font-black text-xs text-[#384959] block leading-tight">
                  28°C
                </span>
                <span className="text-[10px] text-[#6A89A7] font-medium block leading-tight">
                  Nashik
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Five Horizontal KPI Stat Cards (With Staggered Animation & Lottie Integration) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Card 1: Daily Trips */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, delay: 0.04 }}
          className="morning-card morning-card-hover p-4 rounded-2xl flex items-center justify-between gap-3 border border-[#DCE8F2]"
        >
          <div className="w-11 h-11 rounded-xl bg-[#E8F2FA] flex items-center justify-center shrink-0">
            <Truck className="w-5 h-5 text-[#384959] interactive-icon" />
          </div>
          <div className="text-right flex-1 min-w-0">
            <span className="text-[11px] font-semibold text-[#6A89A7] block truncate">
              Daily Trips
            </span>
            <div className="flex items-center justify-end gap-1.5 mt-0.5">
              <span className="font-heading font-black text-2xl text-[#1E293B]">
                {dailyTripsCount}
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 border border-emerald-200 px-1.5 py-0.5 rounded-md">
                ↑ +1
              </span>
            </div>
          </div>
        </motion.div>

        {/* Card 2: In Transit (With Lottie Truck Animation) */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, delay: 0.08 }}
          className="morning-card morning-card-hover p-4 rounded-2xl flex items-center justify-between gap-3 border border-[#DCE8F2]"
        >
          <div className="w-11 h-11 rounded-xl bg-[#E8F2FA] flex items-center justify-center shrink-0 overflow-hidden">
            <LottieAnimation
              animationPath="/assets/animations/truck-in-transit.json"
              className="w-10 h-7"
              fallbackIcon={<Play className="w-4 h-4 text-[#384959] fill-[#384959]" />}
              ariaLabel="Truck In Transit Animation"
            />
          </div>
          <div className="text-right flex-1 min-w-0">
            <span className="text-[11px] font-semibold text-[#6A89A7] block truncate">
              In Transit
            </span>
            <span className="font-heading font-black text-2xl text-[#1E293B] block mt-0.5">
              {inTransitCount}
            </span>
          </div>
        </motion.div>

        {/* Card 3: Completed (With Lottie Success Check Animation) */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, delay: 0.12 }}
          className="morning-card morning-card-hover p-4 rounded-2xl flex items-center justify-between gap-3 border border-[#DCE8F2]"
        >
          <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0 overflow-hidden">
            <LottieAnimation
              animationPath="/assets/animations/success-check.json"
              className="w-8 h-8"
              fallbackIcon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              ariaLabel="Completed Trips Animation"
            />
          </div>
          <div className="text-right flex-1 min-w-0">
            <span className="text-[11px] font-semibold text-[#6A89A7] block truncate">
              Completed
            </span>
            <span className="font-heading font-black text-2xl text-[#1E293B] block mt-0.5">
              {completedCount}
            </span>
          </div>
        </motion.div>

        {/* Card 4: Pending Payments */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, delay: 0.16 }}
          className="morning-card morning-card-hover p-4 rounded-2xl flex items-center justify-between gap-3 border border-[#DCE8F2]"
        >
          <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5 text-amber-600 interactive-icon" />
          </div>
          <div className="text-right flex-1 min-w-0">
            <span className="text-[11px] font-semibold text-[#6A89A7] block truncate">
              Pending Payments
            </span>
            <div className="flex items-center justify-end gap-1.5 mt-0.5">
              <span className="font-mono font-black text-lg text-[#1E293B]">
                ₹{pendingPaymentsAmount.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] font-bold text-rose-700 bg-rose-100/70 border border-rose-200 px-1.5 py-0.5 rounded-md font-mono">
                {pendingPaymentsCount}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Card 5: Return Loads */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, delay: 0.20 }}
          className="morning-card morning-card-hover p-4 rounded-2xl flex items-center justify-between gap-3 border border-[#DCE8F2]"
        >
          <div className="w-11 h-11 rounded-xl bg-[#E8F2FA] flex items-center justify-center shrink-0">
            <Repeat className="w-5 h-5 text-[#384959] interactive-icon" />
          </div>
          <div className="text-right flex-1 min-w-0">
            <span className="text-[11px] font-semibold text-[#6A89A7] block truncate">
              Return Loads
            </span>
            <span className="font-heading font-black text-2xl text-[#1E293B] block mt-0.5">
              {returnLoadsCount}
            </span>
          </div>
        </motion.div>
      </div>

      {/* 3. Sub-Navigation / Quick Filter Tabs Pill Bar (Exact Match with Image 2) */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        <button
          onClick={() => setActiveSubTab('daily_trips')}
          className={`px-4 py-2 rounded-xl text-xs font-heading font-extrabold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
            activeSubTab === 'daily_trips'
              ? 'bg-[#6A89A7] text-white shadow-xs'
              : 'bg-white hover:bg-[#F0F4F8] text-[#384959] border border-[#DCE8F2]'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          <span>Daily Trips ({dailyTripsCount})</span>
        </button>

        <button
          onClick={() => {
            setActiveSubTab('vehicles');
            setActiveTab('vehicles');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-heading font-extrabold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
            activeSubTab === 'vehicles'
              ? 'bg-[#6A89A7] text-white shadow-xs'
              : 'bg-white hover:bg-[#F0F4F8] text-[#384959] border border-[#DCE8F2]'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-[#6A89A7]" />
          <span>Vehicles & ODO Reminders ({vehicles.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveSubTab('drivers');
            setActiveTab('drivers');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-heading font-extrabold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
            activeSubTab === 'drivers'
              ? 'bg-[#6A89A7] text-white shadow-xs'
              : 'bg-white hover:bg-[#F0F4F8] text-[#384959] border border-[#DCE8F2]'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-[#6A89A7]" />
          <span>Drivers & WhatsApp Link</span>
        </button>

        <button
          onClick={() => {
            setActiveSubTab('payments');
            setActiveTab('payments');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-heading font-extrabold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
            activeSubTab === 'payments'
              ? 'bg-[#6A89A7] text-white shadow-xs'
              : 'bg-white hover:bg-[#F0F4F8] text-[#384959] border border-[#DCE8F2]'
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-[#6A89A7]" />
          <span>Parties, Docs & Payments ({partyPayments.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveSubTab('analytics');
            setActiveTab('analytics');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-heading font-extrabold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
            activeSubTab === 'analytics'
              ? 'bg-[#6A89A7] text-white shadow-xs'
              : 'bg-white hover:bg-[#F0F4F8] text-[#384959] border border-[#DCE8F2]'
          }`}
        >
          <ArrowUpRight className="w-3.5 h-3.5 text-[#6A89A7]" />
          <span>Return Load Analytics</span>
        </button>
      </div>

      {/* 4. Featured Dispatches Canvas (Exact Match with Image 2) */}
      <div className="space-y-3.5">
        {/* Top Corridor Banner Card */}
        <div className="morning-card p-4 md:p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-[#DCE8F2]">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-[#E8F2FA] border border-[#BDDDFC] flex items-center justify-center shrink-0">
              <Truck className="w-7 h-7 text-[#384959]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-heading font-black text-sm md:text-base text-[#1E293B]">
                  Maharashtra to Gujarat Daily Routing & Dispatches
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#BDDDFC]/50 text-[#384959] border border-[#BDDDFC]">
                  Fruit Outbound + Gujarat Return Load
                </span>
              </div>
              <p className="text-[11px] md:text-xs text-[#6A89A7] font-medium mt-0.5">
                Deliver fruits from Maharashtra to 3-4 Gujarat places (Immediate / 1-3 months payment), then load return goods with stamped LR and settlement tracking.
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('trips')}
            className="px-4 py-2.5 rounded-xl bg-[#384959] hover:bg-[#2C3A47] text-white font-heading font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Daily Trip (Fruit Delivery)</span>
          </button>
        </div>

        {/* Featured Active Trip Card (Exact Match with Image 2) */}
        <div className="morning-card rounded-2xl overflow-hidden shadow-xs border border-[#DCE8F2]">
          {/* Trip Header Line */}
          <div className="p-4 bg-white border-b border-[#DCE8F2] flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-2.5 text-xs">
              <span className="w-7 h-7 rounded-lg bg-[#6A89A7] text-white font-mono font-black text-xs flex items-center justify-center shadow-2xs">
                MH
              </span>

              <span className="font-mono font-black text-xs text-[#1E293B] bg-[#F0F4F8] px-2.5 py-1 rounded-md border border-[#DCE8F2]">
                TRP-MH-GJ-2026-01
              </span>

              <span className="font-mono font-bold text-xs text-slate-700 bg-white px-2.5 py-1 rounded-md border border-[#DCE8F2]">
                MH-12-RN-4892
              </span>

              <span className="font-semibold text-slate-700">
                Driver: <strong className="text-slate-900 font-bold">Sukhwinder Singh</strong>
              </span>

              <span className="text-slate-500 flex items-center gap-1 font-mono text-[11px]">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Out Date: 2026-10-22</span>
              </span>

              <span className="text-slate-500 flex items-center gap-1 text-[11px] hidden sm:flex">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>Origin: Pune Agricultural Produce Terminal (APMC Market)</span>
              </span>
            </div>

            <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 font-heading">
              <Truck className="w-3.5 h-3.5" />
              <span>In Transit (MH → GJ)</span>
            </span>
          </div>

          {/* Fruit Deliveries Sub-Header Bar */}
          <div className="px-4 py-2.5 bg-[#F8FAFC] border-b border-[#DCE8F2] flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-rose-500" />
              <span className="font-heading font-extrabold text-[11px] text-[#384959] uppercase tracking-wider">
                Outbound Fruit Delivery Places in Gujarat (4 Stops)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-lg bg-[#BDDDFC]/40 text-[#384959] border border-[#BDDDFC] font-mono font-black text-xs">
                Total Fruit Value: ₹12,200
              </span>

              <button
                onClick={() => setActiveTab('trips')}
                className="px-3 py-1 rounded-lg bg-white border border-[#DCE8F2] hover:bg-[#F0F4F8] text-[#384959] font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-2xs font-heading"
              >
                <Edit3 className="w-3 h-3" />
                <span>Edit Delivery Places</span>
              </button>
            </div>
          </div>

          {/* 2-Column Stop Grid (Exact Match with Image 2) */}
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3.5 bg-white">
            {/* Stop 1 Card */}
            <div className="rounded-xl border border-[#DCE8F2] bg-[#FBFDFF] p-3.5 space-y-2.5 text-xs">
              <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-100">
                <div>
                  <h4 className="font-heading font-black text-xs text-[#1E293B]">
                    1. Vapi APMC Wholesale Fruit Yard
                  </h4>
                  <span className="text-[11px] text-[#6A89A7] block">Vapi, Gujarat</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#BDDDFC]/50 text-[#384959] border border-[#BDDDFC] font-mono uppercase">
                  Immediate Pay
                </span>
              </div>

              {/* Items List */}
              <div className="space-y-1.5 text-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-heading">
                  Items List:
                </span>
                <div className="flex items-center justify-between text-slate-700">
                  <span className="truncate">Ratnagiri Alphonso Mango</span>
                  <span className="font-mono text-slate-600 shrink-0">
                    30 × ₹30 = <strong className="text-slate-900 font-bold">₹900</strong>
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-700">
                  <span className="truncate">Solapur Kesar Bhagwa</span>
                  <span className="font-mono text-slate-600 shrink-0">
                    40 × ₹50 = <strong className="text-slate-900 font-bold">₹2,000</strong>
                  </span>
                </div>
              </div>

              {/* Place Total */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="font-heading font-bold text-slate-700">Place Total:</span>
                <span className="font-mono font-black text-sm text-[#384959]">₹2,900</span>
              </div>

              {/* Yellow Payment Reminder Banner */}
              <div className="p-2 rounded-lg bg-amber-50/90 border border-amber-200 flex items-center gap-1.5 text-amber-900 text-[11px] font-medium">
                <LottieAnimation
                  animationPath="/assets/animations/bell-reminder.json"
                  className="w-5 h-5 shrink-0"
                  fallbackIcon={<Bell className="w-3.5 h-3.5 text-amber-600" />}
                  ariaLabel="Payment Reminder"
                />
                <span>Payment Reminder: 2026-10-23</span>
              </div>
            </div>

            {/* Stop 2 Card */}
            <div className="rounded-xl border border-[#DCE8F2] bg-[#FBFDFF] p-3.5 space-y-2.5 text-xs">
              <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-100">
                <div>
                  <h4 className="font-heading font-black text-xs text-[#1E293B]">
                    2. Surat Ring Road Fruit Mandi (Shop #42)
                  </h4>
                  <span className="text-[11px] text-[#6A89A7] block">Surat, Gujarat</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#BDDDFC]/50 text-[#384959] border border-[#BDDDFC] font-mono uppercase">
                  1 Month Due
                </span>
              </div>

              {/* Items List */}
              <div className="space-y-1.5 text-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-heading">
                  Items List:
                </span>
                <div className="flex items-center justify-between text-slate-700">
                  <span className="truncate">Nashik Export Green Grapes</span>
                  <span className="font-mono text-slate-600 shrink-0">
                    50 × ₹40 = <strong className="text-slate-900 font-bold">₹2,000</strong>
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-700">
                  <span className="truncate">Jalgaon Premium Banana Crates</span>
                  <span className="font-mono text-slate-600 shrink-0">
                    60 × ₹25 = <strong className="text-slate-900 font-bold">₹1,500</strong>
                  </span>
                </div>
              </div>

              {/* Place Total */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="font-heading font-bold text-slate-700">Place Total:</span>
                <span className="font-mono font-black text-sm text-[#384959]">₹3,500</span>
              </div>

              {/* Yellow Payment Reminder Banner */}
              <div className="p-2 rounded-lg bg-amber-50/90 border border-amber-200 flex items-center gap-1.5 text-amber-900 text-[11px] font-medium">
                <LottieAnimation
                  animationPath="/assets/animations/bell-reminder.json"
                  className="w-5 h-5 shrink-0"
                  fallbackIcon={<Bell className="w-3.5 h-3.5 text-amber-600" />}
                  ariaLabel="Payment Reminder"
                />
                <span>Payment Reminder: 2026-11-22</span>
              </div>
            </div>
          </div>

          {/* Integrated Return Load Section (Section D Product Requirement) */}
          <div className="px-4 py-3 bg-[#F0F4F8] border-t border-[#DCE8F2] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-md bg-[#6A89A7] text-white flex items-center justify-center shrink-0">
                <Repeat className="w-3.5 h-3.5" />
              </span>
              <div>
                <span className="font-heading font-extrabold text-xs text-[#384959] block">
                  Gujarat Return Load (Backhaul to Maharashtra)
                </span>
                <span className="text-[11px] text-[#6A89A7]">
                  Consignor: Patel Ceramics & Chemicals Ltd. | Goods: 320 Ceramic Vitrified Floor Tiles (14.5 Tons)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono font-bold text-[11px]">
                Freight: ₹34,000 (Adv: ₹15,000)
              </span>
              <button
                onClick={() => setActiveTab('analytics')}
                className="px-2.5 py-1 rounded-md bg-white border border-[#DCE8F2] text-[#384959] font-bold text-[11px] hover:bg-[#E2EDF8] transition-colors cursor-pointer"
              >
                View Stamped LR
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Database Backup & Restore Utility Bar */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#DCE8F2] text-xs">
        <span className="text-slate-500 font-medium">
          FleetPulse System Data: Portable JSON Database Backup & Restore
        </span>
        <button
          onClick={() => setIsBackupModalOpen(true)}
          className="px-3 py-1.5 rounded-lg bg-[#F0F4F8] hover:bg-[#E2EDF8] text-[#384959] font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Manage Backup</span>
        </button>
      </div>

      {/* Backup / Restore Modal */}
      {isBackupModalOpen && (
        <div className="fixed inset-0 bg-[#384959]/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#DCE8F2] space-y-4 text-xs">
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
                  <span className="text-[11px] text-slate-500">Download active fleet state as `.json`</span>
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
        </div>
      )}
    </div>
  );
};
