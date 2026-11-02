import React, { useState } from 'react';
import {
  Truck,
  Users,
  ShieldCheck,
  CalendarDays,
  FileText,
  AlertTriangle,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileCheck2,
  CreditCard,
  Building,
  ArrowRight,
  TrendingUp,
  Download,
  Upload,
  RefreshCw,
  Search,
  Filter,
  Check,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useTMS } from '../context/TMSContext';

export const AdminDashboardView: React.FC = () => {
  const {
    vehicles,
    drivers,
    trips,
    partyPayments,
    parties,
    setActiveTab,
    companyName,
    exportDataJSON,
    importDataJSON,
  } = useTMS();

  const [importJsonText, setImportJsonText] = useState('');
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [backupFeedback, setBackupFeedback] = useState<string | null>(null);

  // 1. Vehicles Metrics
  const totalVehicles = vehicles.length;
  const activeVehicles = vehicles.filter((v) => v.status === 'in_transit' || v.status === 'active' || v.status === 'loading').length;
  const idleVehicles = vehicles.filter((v) => v.status === 'unloaded_idle' || v.status === 'inactive').length;

  // 2. Drivers Metrics
  const activeDrivers = drivers.filter((d) => d.status === 'active' || d.status === 'on_trip').length;
  const activeUsers = 3; // Admin, User 1 (Operations), User 2 (Accounts)

  // 3. Trips Metrics
  const todayStr = new Date().toISOString().split('T')[0];
  const todaysTrips = trips.filter((t) => t.outDate === todayStr || t.createdAt.toLowerCase().includes('today') || t.createdAt.toLowerCase().includes('just now')).length;
  const pendingTripApprovals = trips.filter((t) => t.status === 'pending_approval');

  // 4. Documents & Compliance
  let docsExpiringSoon = 0;
  let docsExpired = 0;
  vehicles.forEach((v) => {
    v.documents.forEach((d) => {
      if (d.status === 'expired') docsExpired++;
      else if (d.status === 'expiring_soon') docsExpiringSoon++;
    });
  });

  // 5. Maintenance Reminders Due
  const maintenanceDueVehicles = vehicles.filter((v) =>
    v.maintenanceReminders.some((r) => r.status === 'due_soon' || r.status === 'overdue')
  );

  // 6. LR Lifecycle
  const pendingLrSubmission = partyPayments.filter((p) => !p.lrSubmittedToParty && p.type === 'return_load_party');
  const missingStampedLr = trips.filter((t) => t.returnLoad && !t.returnLoad.hasStampedLR);

  // 7. Payments & Financials
  const pendingPayments = partyPayments.filter((p) => p.status === 'pending');
  const partiallyPaidPayments = partyPayments.filter((p) => p.status === 'partially_paid');
  const overduePayments = partyPayments.filter((p) => p.status === 'overdue');
  const totalOutstandingDue = partyPayments.reduce((acc, p) => acc + (p.amountDue || 0), 0);

  // Upcoming Due Dates (within next 7 days)
  const sevenDaysFromNow = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
  const upcomingPayments = partyPayments.filter(
    (p) => p.amountDue > 0 && p.dueDate >= todayStr && p.dueDate <= sevenDaysFromNow
  );

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
    <div className="space-y-6">
      {/* Top Welcome & Executive Banner */}
      <div className="bg-gradient-to-r from-sky-900 via-sky-800 to-sky-700 text-white p-6 rounded-2xl shadow-lg border border-sky-600/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-white/20 backdrop-blur-md text-sky-100 border border-white/20 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-widest font-mono">
                Admin Control Room
              </span>
              <span className="text-xs text-sky-200 font-mono">
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-heading font-black tracking-tight text-white">
              {companyName} Operations Dashboard
            </h1>
            <p className="text-xs text-sky-100/80 mt-1 max-w-2xl font-medium">
              Interstate Freight Command Center: Tracking {totalVehicles} fleet trucks, {activeDrivers} active drivers, multi-drop fruit dispatches, and backhaul return freight reconciliations.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setActiveTab('reports')}
              className="bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Dedicated Reports</span>
            </button>
            <button
              onClick={() => setIsBackupModalOpen(true)}
              className="bg-white/15 hover:bg-white/25 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl border border-white/20 transition-all flex items-center gap-2 cursor-pointer"
              title="Backup & Restore Full Database JSON"
            >
              <Download className="w-4 h-4 text-sky-200" />
              <span>Backup / JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* 14 CORE KPI METRIC CARDS (Master Prompt Section 11) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-heading font-extrabold text-sky-950 uppercase tracking-wider flex items-center gap-2">
            <span>Operational Key Performance Indicators</span>
            <span className="bg-sky-100 text-sky-800 text-[10px] px-2 py-0.5 rounded-full font-mono">
              Live Fleet Pulse
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          {/* 1. Total Vehicles */}
          <div
            onClick={() => setActiveTab('vehicles')}
            className="bg-white p-3.5 rounded-xl border border-sky-100 shadow-xs hover:border-sky-300 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-400 group-hover:text-sky-600 transition-colors">
              <span className="text-[11px] font-bold text-slate-600 uppercase font-heading">Total Vehicles</span>
              <Truck className="w-4 h-4" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black font-mono text-sky-950">{totalVehicles}</span>
              <span className="text-[10px] font-bold text-slate-500">Fleet Roster</span>
            </div>
          </div>

          {/* 2. Active Vehicles */}
          <div
            onClick={() => setActiveTab('vehicles')}
            className="bg-white p-3.5 rounded-xl border border-sky-100 shadow-xs hover:border-emerald-300 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-emerald-500">
              <span className="text-[11px] font-bold text-slate-600 uppercase font-heading">Active Trucks</span>
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black font-mono text-emerald-700">{activeVehicles}</span>
              <span className="text-[10px] font-bold text-emerald-600">{Math.round((activeVehicles / (totalVehicles || 1)) * 100)}% active</span>
            </div>
          </div>

          {/* 3. Active Drivers */}
          <div
            onClick={() => setActiveTab('drivers')}
            className="bg-white p-3.5 rounded-xl border border-sky-100 shadow-xs hover:border-sky-300 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-sky-500">
              <span className="text-[11px] font-bold text-slate-600 uppercase font-heading">Active Drivers</span>
              <Users className="w-4 h-4" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black font-mono text-sky-950">{activeDrivers}</span>
              <span className="text-[10px] font-bold text-sky-600">On Duty / Trip</span>
            </div>
          </div>

          {/* 4. Active Users */}
          <div
            onClick={() => setActiveTab('permissions')}
            className="bg-white p-3.5 rounded-xl border border-sky-100 shadow-xs hover:border-sky-300 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-purple-500">
              <span className="text-[11px] font-bold text-slate-600 uppercase font-heading">Active Users</span>
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black font-mono text-purple-900">{activeUsers}</span>
              <span className="text-[10px] font-bold text-purple-600">Admin + Ops</span>
            </div>
          </div>

          {/* 5. Today's Trips */}
          <div
            onClick={() => setActiveTab('trips')}
            className="bg-white p-3.5 rounded-xl border border-sky-100 shadow-xs hover:border-sky-300 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-sky-600">
              <span className="text-[11px] font-bold text-slate-600 uppercase font-heading">Today's Trips</span>
              <CalendarDays className="w-4 h-4" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black font-mono text-sky-900">{todaysTrips}</span>
              <span className="text-[10px] font-bold text-sky-700">Dispatched</span>
            </div>
          </div>

          {/* 6. Pending Trip Approvals */}
          <div
            onClick={() => setActiveTab('trips')}
            className={`p-3.5 rounded-xl border shadow-xs transition-all cursor-pointer group ${
              pendingTripApprovals.length > 0 ? 'bg-amber-50/70 border-amber-300 hover:border-amber-400' : 'bg-white border-sky-100'
            }`}
          >
            <div className="flex items-center justify-between text-amber-600">
              <span className="text-[11px] font-bold text-amber-950 uppercase font-heading">Pending Approvals</span>
              <Clock className="w-4 h-4" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black font-mono text-amber-900">{pendingTripApprovals.length}</span>
              <span className="text-[10px] font-bold text-amber-700">Need Review</span>
            </div>
          </div>

          {/* 7. Documents Expiring Soon */}
          <div
            onClick={() => setActiveTab('vehicles')}
            className={`p-3.5 rounded-xl border shadow-xs transition-all cursor-pointer group ${
              docsExpiringSoon > 0 ? 'bg-amber-50/60 border-amber-200 hover:border-amber-300' : 'bg-white border-sky-100'
            }`}
          >
            <div className="flex items-center justify-between text-amber-600">
              <span className="text-[11px] font-bold text-slate-600 uppercase font-heading">Docs Expiring</span>
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black font-mono text-amber-800">{docsExpiringSoon}</span>
              <span className="text-[10px] font-bold text-amber-600">Within 30 Days</span>
            </div>
          </div>

          {/* 8. Expired Documents */}
          <div
            onClick={() => setActiveTab('vehicles')}
            className={`p-3.5 rounded-xl border shadow-xs transition-all cursor-pointer group ${
              docsExpired > 0 ? 'bg-rose-50 border-rose-300 hover:border-rose-400' : 'bg-white border-sky-100'
            }`}
          >
            <div className="flex items-center justify-between text-rose-600">
              <span className="text-[11px] font-bold text-rose-950 uppercase font-heading">Docs Expired</span>
              <AlertCircle className="w-4 h-4" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black font-mono text-rose-700">{docsExpired}</span>
              <span className="text-[10px] font-bold text-rose-600">Urgent Renewal</span>
            </div>
          </div>

          {/* 9. Maintenance Due */}
          <div
            onClick={() => setActiveTab('vehicles')}
            className={`p-3.5 rounded-xl border shadow-xs transition-all cursor-pointer group ${
              maintenanceDueVehicles.length > 0 ? 'bg-orange-50 border-orange-200' : 'bg-white border-sky-100'
            }`}
          >
            <div className="flex items-center justify-between text-orange-600">
              <span className="text-[11px] font-bold text-slate-600 uppercase font-heading">Maintenance Due</span>
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black font-mono text-orange-900">{maintenanceDueVehicles.length}</span>
              <span className="text-[10px] font-bold text-orange-600">KM Target</span>
            </div>
          </div>

          {/* 10. Pending LR Submission */}
          <div
            onClick={() => setActiveTab('payments')}
            className={`p-3.5 rounded-xl border shadow-xs transition-all cursor-pointer group ${
              pendingLrSubmission.length > 0 ? 'bg-sky-50 border-sky-200' : 'bg-white border-sky-100'
            }`}
          >
            <div className="flex items-center justify-between text-sky-600">
              <span className="text-[11px] font-bold text-slate-600 uppercase font-heading">Pending LR Handover</span>
              <FileCheck2 className="w-4 h-4" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black font-mono text-sky-950">{pendingLrSubmission.length}</span>
              <span className="text-[10px] font-bold text-sky-700">Awaiting Party Handover</span>
            </div>
          </div>

          {/* 11. Missing Stamped LR */}
          <div
            onClick={() => setActiveTab('trips')}
            className={`p-3.5 rounded-xl border shadow-xs transition-all cursor-pointer group ${
              missingStampedLr.length > 0 ? 'bg-amber-50/70 border-amber-200' : 'bg-white border-sky-100'
            }`}
          >
            <div className="flex items-center justify-between text-amber-600">
              <span className="text-[11px] font-bold text-amber-950 uppercase font-heading">Missing Stamped LR</span>
              <Clock className="w-4 h-4" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black font-mono text-amber-900">{missingStampedLr.length}</span>
              <span className="text-[10px] font-bold text-amber-600">Driver Upload</span>
            </div>
          </div>

          {/* 12. Pending Payments */}
          <div
            onClick={() => setActiveTab('payments')}
            className="bg-white p-3.5 rounded-xl border border-sky-100 shadow-xs hover:border-sky-300 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-sky-600">
              <span className="text-[11px] font-bold text-slate-600 uppercase font-heading">Pending Payments</span>
              <CreditCard className="w-4 h-4" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black font-mono text-sky-950">{pendingPayments.length}</span>
              <span className="text-[10px] font-bold text-sky-700">Uncleared</span>
            </div>
          </div>

          {/* 13. Partially Paid Payments */}
          <div
            onClick={() => setActiveTab('payments')}
            className="bg-white p-3.5 rounded-xl border border-sky-100 shadow-xs hover:border-sky-300 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-blue-600">
              <span className="text-[11px] font-bold text-slate-600 uppercase font-heading">Partially Paid</span>
              <TrendingUp className="w-4 h-4" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black font-mono text-blue-950">{partiallyPaidPayments.length}</span>
              <span className="text-[10px] font-bold text-blue-700">In Installments</span>
            </div>
          </div>

          {/* 14. Overdue Payments */}
          <div
            onClick={() => setActiveTab('payments')}
            className={`p-3.5 rounded-xl border shadow-xs transition-all cursor-pointer group ${
              overduePayments.length > 0 ? 'bg-rose-50 border-rose-300' : 'bg-white border-sky-100'
            }`}
          >
            <div className="flex items-center justify-between text-rose-600">
              <span className="text-[11px] font-bold text-rose-950 uppercase font-heading">Overdue Payments</span>
              <AlertCircle className="w-4 h-4" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black font-mono text-rose-800">{overduePayments.length}</span>
              <span className="text-[10px] font-bold text-rose-600">Immediate Chase</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2-COLUMN SECTION: Fleet Capacity & Operational Load (Left) + Urgent Action Center (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 Cols): Vehicle Capacity Monitor */}
        <div className="lg:col-span-8 bg-white border border-sky-100 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-sky-100 pb-3">
            <div>
              <h3 className="text-sm font-heading font-extrabold text-sky-950 flex items-center gap-2">
                <Truck className="w-4 h-4 text-sky-600" />
                <span>Vehicle Load & Capacity Monitor</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time capacity tracking: Max Capacity vs Estimated Load vs Remaining Capacity.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('vehicles')}
              className="text-xs font-bold text-sky-600 hover:text-sky-800 flex items-center gap-1 cursor-pointer"
            >
              <span>Manage Fleet</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {vehicles.map((v) => {
              // Find if vehicle has an active trip to compute current load
              const activeTrip = trips.find((t) => t.vehicleId === v.id && (t.status === 'in_transit' || t.status === 'pending_approval' || t.status === 'approved'));
              const currentLoadKg = activeTrip?.totalWeightKg || (v.status === 'in_transit' ? Math.round(v.capacityKg * 0.85) : 0);
              const remainingKg = Math.max(0, v.capacityKg - currentLoadKg);
              const percentUsed = Math.min(100, Math.round((currentLoadKg / v.capacityKg) * 100));

              return (
                <div key={v.id} className="p-3.5 bg-sky-50/40 rounded-xl border border-sky-100 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-black text-sm bg-sky-900 text-white px-2.5 py-1 rounded-lg">
                        {v.number}
                      </span>
                      <div>
                        <span className="font-heading font-bold text-xs text-sky-950 block">{v.model} ({v.type})</span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          Driver: {v.assignedDriverName || 'Standby Driver'} • ODO: {v.currentOdometer.toLocaleString('en-IN')} KM
                        </span>
                      </div>
                    </div>

                    <div className="text-right flex items-center gap-2 self-start sm:self-auto">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                          v.status === 'in_transit'
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : v.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : 'bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                      >
                        {v.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Capacity Bar Display (Master Prompt Section 4) */}
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-slate-600">
                        Max Capacity: <strong className="text-sky-950 font-bold">{v.capacityKg.toLocaleString('en-IN')} KG</strong>
                      </span>
                      <span className="text-slate-600">
                        Current Load: <strong className={percentUsed > 90 ? 'text-rose-600 font-bold' : 'text-sky-800 font-bold'}>{currentLoadKg.toLocaleString('en-IN')} KG</strong>
                      </span>
                      <span className="text-slate-600">
                        Remaining: <strong className="text-emerald-700 font-bold">{remainingKg.toLocaleString('en-IN')} KG</strong> ({100 - percentUsed}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          percentUsed > 95
                            ? 'bg-rose-500'
                            : percentUsed > 80
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${percentUsed}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column (4 Cols): Urgent Action Feed & Quick Chases */}
        <div className="lg:col-span-4 space-y-4">
          {/* Outstanding Freight Ledger Summary */}
          <div className="bg-gradient-to-br from-white to-sky-50/80 border border-sky-100 rounded-2xl p-5 shadow-xs space-y-3">
            <span className="text-[11px] font-bold text-sky-800 uppercase tracking-wider block font-heading">
              Freight Accounts Receivable
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-slate-500 font-medium">Total Pending Due:</span>
              <span className="text-xl font-mono font-black text-rose-700">
                ₹{totalOutstandingDue.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-sky-100 text-xs space-y-1.5 font-medium">
              <div className="flex justify-between text-slate-600">
                <span>Overdue Freight:</span>
                <span className="font-mono font-bold text-rose-600">
                  ₹{overduePayments.reduce((a, b) => a + b.amountDue, 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Due in Next 7 Days:</span>
                <span className="font-mono font-bold text-amber-600">
                  ₹{upcomingPayments.reduce((a, b) => a + b.amountDue, 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('reports')}
              className="w-full py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-lg transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Open Pending Payment Report</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Pending Approvals Notice */}
          {pendingTripApprovals.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-xs space-y-2.5">
              <div className="flex items-center gap-2 text-amber-800">
                <Clock className="w-4 h-4 shrink-0" />
                <h4 className="font-heading font-extrabold text-xs">
                  {pendingTripApprovals.length} Driver Trip{pendingTripApprovals.length > 1 ? 's' : ''} Awaiting Approval
                </h4>
              </div>
              <p className="text-[11px] text-amber-900/80 leading-relaxed">
                Drivers have submitted new trip manifests that require Admin or Operations authorization before dispatch.
              </p>
              <button
                onClick={() => setActiveTab('trips')}
                className="text-xs font-bold text-amber-900 bg-white border border-amber-300 hover:bg-amber-100 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
              >
                <span>Review Trips Now</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Expiring Documents Alert */}
          {(docsExpired > 0 || docsExpiringSoon > 0) && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 shadow-xs space-y-2">
              <div className="flex items-center gap-2 text-rose-800">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <h4 className="font-heading font-extrabold text-xs">
                  Statutory Document Expiry Alert
                </h4>
              </div>
              <p className="text-[11px] text-rose-900/80 leading-relaxed">
                {docsExpired > 0 ? `${docsExpired} document(s) expired. ` : ''}
                {docsExpiringSoon > 0 ? `${docsExpiringSoon} document(s) expiring within 30 days.` : ''} Check PUC, Permits and Insurance.
              </p>
              <button
                onClick={() => setActiveTab('vehicles')}
                className="text-xs font-bold text-rose-900 bg-white border border-rose-300 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
              >
                <span>Check Vehicle Documents</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Backup / Restore Modal */}
      {isBackupModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-sky-100 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-sky-100">
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5 text-sky-600" />
                <h3 className="font-heading font-bold text-base text-sky-950">
                  Database Backup & Restore (JSON)
                </h3>
              </div>
              <button
                onClick={() => setIsBackupModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Export your full fleet records, trips, driver profiles, and payment histories as a portable JSON file, or restore data from a previous backup.
            </p>

            <div className="space-y-3">
              <div className="p-3 bg-sky-50 rounded-xl border border-sky-100 flex items-center justify-between">
                <div>
                  <span className="font-heading font-bold text-xs text-sky-950 block">Export Backup</span>
                  <span className="text-[11px] text-slate-500">Download active fleet state as `.json`</span>
                </div>
                <button
                  onClick={handleExportBackup}
                  className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>

              <div className="space-y-2">
                <span className="font-heading font-bold text-xs text-sky-950 block">
                  Restore from JSON Backup
                </span>
                <textarea
                  value={importJsonText}
                  onChange={(e) => setImportJsonText(e.target.value)}
                  placeholder="Paste your JSON backup data here..."
                  className="w-full h-28 p-2.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:border-sky-500 focus:outline-hidden"
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

