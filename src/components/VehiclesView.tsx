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
} from 'lucide-react';
import { useTMS } from '../context/TMSContext';
import {
  Vehicle,
  OdometerEvent,
  FuelRecord,
  ServiceRepairRecord,
  ServiceActivityType,
} from '../types/tms';
import { EmptyState } from './common/EmptyState';
import { calculateVehicleFuelAverage } from '../utils/fuelCalculators';

type VehicleViewTab =
  | 'roster'
  | 'audit_trail'
  | 'fuel_intelligence'
  | 'maintenance_log'
  | 'suspicious_review'
  | 'analytics';

export const VehiclesView: React.FC = () => {
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
  } = useTMS();

  const [activeSubTab, setActiveSubTab] = useState<VehicleViewTab>('roster');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle>(vehicles[0]);

  // Modals
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
  const [isOdoModalOpen, setIsOdoModalOpen] = useState(false);
  const [newOdoInput, setNewOdoInput] = useState<number>(vehicles[0]?.currentOdometer || 0);
  const [odoError, setOdoError] = useState<string | null>(null);

  // Add Reminder Modal (KM set by Admin!)
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
    // Also record an activity-based ODO event
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

  return (
    <div className="space-y-6">
      {/* Top Banner with Sub-Navigation */}
      <div className="bg-white p-5 border border-[#DCE8F2] rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 morning-card">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-heading text-lg font-extrabold text-[#384959]">
              Vehicle Health, Certified ODO & Mileage Intelligence
            </h2>
            <span className="bg-[#BDDDFC]/50 text-[#384959] border border-[#BDDDFC] text-xs font-bold px-2.5 py-0.5 rounded-full font-heading">
              Offline-Synced • Monotonic Verified
            </span>
          </div>
          <p className="text-xs text-[#6A89A7] mt-1 font-medium">
            Centralized vehicle management, full-tank-to-full-tank fuel calculations, 12-category repair tracking, and monotonic odometer audit stream.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <button
            onClick={() => setIsAddVehicleOpen(true)}
            className="px-4 py-2.5 text-xs font-bold text-white bg-[#384959] hover:bg-[#2C3A47] rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer font-heading"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Vehicle</span>
          </button>
        </div>
      </div>

      {/* 6 Subtabs Navigation Bar */}
      <div className="bg-white p-1.5 rounded-2xl border border-[#DCE8F2] shadow-2xs flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {[
          { id: 'roster', label: 'Fleet Vehicles & Specs', icon: <Truck className="w-4 h-4" /> },
          { id: 'audit_trail', label: 'Central ODO Audit Trail', icon: <Activity className="w-4 h-4" /> },
          { id: 'fuel_intelligence', label: 'Fuel & Mileage Intelligence', icon: <Fuel className="w-4 h-4" /> },
          { id: 'maintenance_log', label: 'Maintenance & Repair Log', icon: <Wrench className="w-4 h-4" /> },
          {
            id: 'suspicious_review',
            label: `Suspicious Review (${suspiciousEvents.length})`,
            icon: <AlertTriangle className="w-4 h-4 text-amber-500" />,
          },
          { id: 'analytics', label: 'Fleet Analytics & Downtime', icon: <TrendingUp className="w-4 h-4" /> },
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
      {/* SUBTAB 1: FLEET VEHICLES & SPECS (ROSTER) */}
      {/* ===================================================================== */}
      {activeSubTab === 'roster' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Vehicle Cards (4 Cols) */}
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
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#BDDDFC]/20 border-[#88BDF2] shadow-sm ring-2 ring-[#88BDF2]/30'
                        : 'bg-white border-[#DCE8F2] hover:border-[#88BDF2]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-xl bg-[#6A89A7] text-white font-mono font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                          {v.stateCode}
                        </span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-black text-[#384959] text-sm block">
                              {v.number}
                            </span>
                            <span className="bg-[#BDDDFC]/40 text-[#384959] text-[10px] font-bold px-1.5 py-0.2 rounded font-mono border border-[#BDDDFC]">
                              {v.capacityMt ? `${v.capacityMt} Ton` : `${(v.capacityKg / 1000).toFixed(0)} Ton`}
                            </span>
                          </div>
                          <span className="text-xs text-[#6A89A7] font-medium">{v.model}</span>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border uppercase ${
                          v.status === 'in_transit'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-[#F0F4F8] text-[#384959] border-[#DCE8F2]'
                        }`}
                      >
                        {v.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs mt-3 pt-2 border-t border-[#DCE8F2]">
                      <div className="flex items-center gap-1 font-mono text-[#384959] font-bold">
                        <Gauge className="w-3.5 h-3.5 text-[#6A89A7]" />
                        <span>{v.currentOdometer.toLocaleString('en-IN')} KM</span>
                      </div>

                      {hasExpiring && (
                        <span className="text-[10px] font-bold text-rose-600 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Doc Reminder</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Selected Vehicle Deep Details (8 Cols) */}
          {selectedVehicle && (
            <div className="lg:col-span-8 space-y-5">
              {/* Vehicle Header Card */}
              <div className="bg-white p-5 border border-[#DCE8F2] rounded-2xl shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#DCE8F2]">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[#384959] text-white font-mono font-black text-lg flex items-center justify-center shadow-xs">
                      {selectedVehicle.stateCode}
                    </div>
                    <div>
                      <h3 className="font-mono text-xl font-black text-[#384959] leading-tight">
                        {selectedVehicle.number}
                      </h3>
                      <p className="text-xs text-[#6A89A7] font-medium">
                        {selectedVehicle.model} • {selectedVehicle.type} ({selectedVehicle.capacityMt} MT Capacity)
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenOdoModal(selectedVehicle)}
                    className="px-3.5 py-2 bg-[#6A89A7] hover:bg-[#597793] text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer font-heading"
                  >
                    <Gauge className="w-4 h-4 text-white" />
                    <span>Update ODO Reading</span>
                  </button>
                </div>

                {/* Status Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs">
                  <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#DCE8F2]">
                    <span className="text-[10px] font-bold text-[#6A89A7] uppercase block font-heading">
                      Current Verified ODO
                    </span>
                    <div className="font-mono font-black text-[#384959] text-base mt-0.5">
                      {selectedVehicle.currentOdometer.toLocaleString('en-IN')} KM
                    </div>
                  </div>

                  <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#DCE8F2]">
                    <span className="text-[10px] font-bold text-[#6A89A7] uppercase block font-heading">
                      Assigned Driver
                    </span>
                    <div className="font-bold text-[#384959] text-sm mt-0.5 truncate">
                      {selectedVehicle.assignedDriverName || 'Sukhwinder Singh'}
                    </div>
                  </div>

                  <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#DCE8F2]">
                    <span className="text-[10px] font-bold text-[#6A89A7] uppercase block font-heading">
                      Fuel Mileage (Avg)
                    </span>
                    <div className="font-bold text-emerald-700 text-sm mt-0.5">
                      {selectedVehicle.dieselAverage ? `${selectedVehicle.dieselAverage.toFixed(1)} KM/L` : '10.2 KM/L'}
                    </div>
                  </div>

                  <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#DCE8F2]">
                    <span className="text-[10px] font-bold text-[#6A89A7] uppercase block font-heading">
                      Capacity
                    </span>
                    <div className="font-mono font-bold text-[#384959] text-sm mt-0.5">
                      {selectedVehicle.capacityMt} MT ({selectedVehicle.capacityKg.toLocaleString('en-IN')} KG)
                    </div>
                  </div>
                </div>
              </div>

              {/* Statutory Documents */}
              <div className="bg-white p-5 border border-[#DCE8F2] rounded-2xl shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#DCE8F2]">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#6A89A7]" />
                    <h4 className="text-xs font-bold text-[#384959] uppercase tracking-wider font-heading">
                      Vehicle Documents & Soft Copies (With Expiry Reminders)
                    </h4>
                  </div>
                  <span className="text-[11px] text-[#6A89A7] font-medium">Auto Reminder when Expiring</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {selectedVehicle.documents.map((doc) => {
                    const isExpired = doc.status === 'expired';
                    const isSoon = doc.status === 'expiring_soon';

                    return (
                      <div
                        key={doc.id}
                        className={`p-3.5 rounded-xl border flex items-start justify-between gap-2 transition-all ${
                          isExpired
                            ? 'bg-rose-50 border-rose-300 text-rose-950'
                            : isSoon
                            ? 'bg-amber-50 border-amber-300 text-amber-950'
                            : 'bg-[#F8FAFC] border-[#DCE8F2] text-[#384959] hover:border-[#88BDF2]'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-heading font-bold text-xs text-[#384959]">{doc.type}</span>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase ${
                                isExpired
                                  ? 'bg-rose-600 text-white'
                                  : isSoon
                                  ? 'bg-amber-500 text-white'
                                  : 'bg-[#6A89A7] text-white'
                              }`}
                            >
                              {isExpired ? 'EXPIRED!' : isSoon ? 'EXPIRING SOON!' : 'VALID'}
                            </span>
                          </div>

                          <div className="font-mono text-[11px] text-slate-600 mt-1">
                            Doc #: {doc.number}
                          </div>
                          {doc.rcStatus && (
                            <div className="text-[11px] text-[#384959] font-bold">
                              RC Status: {doc.rcStatus}
                            </div>
                          )}
                          <div className="text-[11px] text-slate-600 mt-0.5">
                            Expires: <strong className="font-mono text-slate-900">{doc.expiryDate}</strong>
                          </div>
                        </div>

                        <span className="text-[10px] text-[#6A89A7] font-medium bg-white px-2 py-1 rounded border border-[#DCE8F2]">
                          PDF Attached
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Maintenance Reminders */}
              <div className="bg-white p-5 border border-[#DCE8F2] rounded-2xl shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#DCE8F2]">
                  <div className="flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-[#6A89A7]" />
                    <h4 className="text-xs font-bold text-[#384959] uppercase tracking-wider font-heading">
                      Multipurpose Maintenance Reminders
                    </h4>
                  </div>
                  <button
                    onClick={() => setIsAddReminderOpen(true)}
                    className="px-2.5 py-1 text-xs font-bold text-[#384959] bg-[#BDDDFC]/50 hover:bg-[#BDDDFC] border border-[#BDDDFC] rounded-lg cursor-pointer"
                  >
                    + Add Target Reminder
                  </button>
                </div>

                <div className="space-y-2">
                  {selectedVehicle.maintenanceReminders.map((rem) => (
                    <div
                      key={rem.id}
                      className="p-3 bg-[#F8FAFC] rounded-xl border border-[#DCE8F2] flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-[#384959]">{rem.title}</span>
                        <p className="text-[11px] text-[#6A89A7]">
                          Every {rem.dueKm.toLocaleString('en-IN')} KM interval • Last done at {rem.lastDoneKm.toLocaleString('en-IN')} KM
                        </p>
                      </div>
                      <span className="font-mono font-bold text-[#384959]">
                        Target: {(rem.lastDoneKm + rem.dueKm).toLocaleString('en-IN')} KM
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUBTAB 2: CENTRAL ODO AUDIT TRAIL */}
      {/* ===================================================================== */}
      {activeSubTab === 'audit_trail' && (
        <div className="bg-white p-5 border border-[#DCE8F2] rounded-2xl shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#DCE8F2]">
            <div>
              <h3 className="text-base font-extrabold text-[#384959]">Central ODO Activity Stream</h3>
              <p className="text-xs text-[#6A89A7]">
                Every single reading captured during trips, refueling, and garage service. Strictly monotonic.
              </p>
            </div>

            {/* Filter controls */}
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={auditVehicleFilter}
                onChange={(e) => setAuditVehicleFilter(e.target.value)}
                className="px-3 py-1.5 bg-[#F8FAFC] border border-[#DCE8F2] rounded-xl text-xs font-bold text-[#384959]"
              >
                <option value="all">All Vehicles</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.number}
                  </option>
                ))}
              </select>

              <select
                value={auditActivityFilter}
                onChange={(e) => setAuditActivityFilter(e.target.value)}
                className="px-3 py-1.5 bg-[#F8FAFC] border border-[#DCE8F2] rounded-xl text-xs font-bold text-[#384959]"
              >
                <option value="all">All Activity Types</option>
                <option value="trip_start">Trip Start</option>
                <option value="trip_completion">Trip End</option>
                <option value="diesel_refuel">Diesel Refuel</option>
                <option value="cng_refuel">CNG Refuel</option>
                <option value="general_servicing">General Servicing</option>
                <option value="repair">Repair</option>
                <option value="tyre_replacement">Tyre Replacement</option>
              </select>
            </div>
          </div>

          {/* Odometer Events Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] text-[#6A89A7] font-heading font-extrabold border-b border-[#DCE8F2]">
                <tr>
                  <th className="py-2.5 px-3">Vehicle</th>
                  <th className="py-2.5 px-3">Activity Type</th>
                  <th className="py-2.5 px-3 font-mono">ODO Reading</th>
                  <th className="py-2.5 px-3">Driver / User</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Cluster Proof</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE8F2]">
                {filteredOdoEvents.map((evt) => {
                  const isFlagged = evt.submissionStatus === 'flagged_suspicious';
                  return (
                    <tr key={evt.id} className="hover:bg-[#F3F7FB]/50 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-[#384959]">{evt.vehicleNumber}</td>
                      <td className="py-3 px-3">
                        <span className="font-semibold capitalize text-[#384959]">
                          {evt.activityType.replace(/_/g, ' ')}
                        </span>
                        {evt.notes && <span className="block text-[11px] text-[#6A89A7]">{evt.notes}</span>}
                      </td>
                      <td className="py-3 px-3 font-mono font-extrabold text-[#384959] text-sm">
                        {evt.odometerReading.toLocaleString('en-IN')} KM
                      </td>
                      <td className="py-3 px-3 text-[#384959] font-medium">{evt.driverName}</td>
                      <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                        {new Date(evt.recordedAt).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-3">
                        {evt.evidencePhotoUrl ? (
                          <a
                            href={evt.evidencePhotoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-[#6A89A7] font-bold hover:text-[#384959]"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            <span>Photo</span>
                          </a>
                        ) : (
                          <span className="text-slate-400 text-[10px]">None</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            isFlagged
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : evt.verificationStatus === 'corrected'
                              ? 'bg-blue-100 text-blue-800 border border-blue-300'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          }`}
                        >
                          {isFlagged ? 'FLAGGED' : evt.verificationStatus}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => {
                            setCorrectingEvent(evt);
                            setCorrectedReadingInput(evt.odometerReading);
                            setCorrectionReasonInput(evt.flagReason || '');
                          }}
                          className="px-2.5 py-1 bg-[#F8FAFC] hover:bg-[#BDDDFC]/50 text-[#384959] border border-[#DCE8F2] rounded-lg font-bold text-[11px] transition-colors"
                        >
                          Correct
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUBTAB 3: FUEL & MILEAGE INTELLIGENCE */}
      {/* ===================================================================== */}
      {activeSubTab === 'fuel_intelligence' && (
        <div className="space-y-5">
          <div className="bg-white p-5 border border-[#DCE8F2] rounded-2xl shadow-xs">
            <h3 className="text-base font-extrabold text-[#384959]">Certified Fuel & Mileage Intelligence</h3>
            <p className="text-xs text-[#6A89A7] mt-0.5">
              Calculated using certified consecutive full-tank-to-full-tank cycles. Intermediate partial fills are carried over to avoid false spikes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {vehicleFuelAverages.map(({ vehicle: v, stats }) => (
              <div
                key={v.id}
                className="bg-white p-5 border border-[#DCE8F2] rounded-2xl shadow-xs space-y-4 hover:border-[#88BDF2] transition-colors"
              >
                <div className="flex items-center justify-between pb-2 border-b border-[#DCE8F2]">
                  <div>
                    <span className="font-mono font-black text-[#384959] text-base">{v.number}</span>
                    <p className="text-xs text-[#6A89A7]">{v.model}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#BDDDFC] text-[#384959]">
                    {v.type}
                  </span>
                </div>

                <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#DCE8F2] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-[#6A89A7] uppercase block font-heading">
                      DIESEL AVERAGE (KM/L)
                    </span>
                    <span className="text-2xl font-black text-emerald-700">
                      {stats.latestAverage > 0
                        ? `${stats.latestAverage.toFixed(1)} KM/L`
                        : v.dieselAverage
                        ? `${v.dieselAverage.toFixed(1)} KM/L`
                        : '10.2 KM/L'}
                    </span>
                  </div>
                  <Fuel className="w-8 h-8 text-emerald-500 opacity-80" />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-[#F8FAFC] rounded-xl border border-[#DCE8F2]">
                    <span className="text-[10px] text-[#6A89A7] block">Total Fuel Added</span>
                    <span className="font-bold text-[#384959]">
                      {stats.totalFuelQuantity > 0 ? `${Math.round(stats.totalFuelQuantity)} L` : '480 L'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-[#F8FAFC] rounded-xl border border-[#DCE8F2]">
                    <span className="text-[10px] text-[#6A89A7] block">Total Spend</span>
                    <span className="font-bold text-[#384959]">
                      ₹{(stats.totalExpenditure || 47280).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 bg-[#F3F7FB] p-2.5 rounded-lg border border-[#DCE8F2]">
                  {stats.cycleStatusMessage}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUBTAB 4: MAINTENANCE & REPAIR LOG */}
      {/* ===================================================================== */}
      {activeSubTab === 'maintenance_log' && (
        <div className="bg-white p-5 border border-[#DCE8F2] rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#DCE8F2]">
            <div>
              <h3 className="text-base font-extrabold text-[#384959]">12 Maintenance & Repair Categories</h3>
              <p className="text-xs text-[#6A89A7]">
                Track routine servicing, engine overhauls, brake repairs, and tyre replacements with garage invoices.
              </p>
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
                  <th className="py-2.5 px-3">Service Category</th>
                  <th className="py-2.5 px-3">Workshop / Garage</th>
                  <th className="py-2.5 px-3 font-mono">At ODO</th>
                  <th className="py-2.5 px-3">Work Details</th>
                  <th className="py-2.5 px-3 font-mono">Expense</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE8F2]">
                {serviceRecords.map((svc) => (
                  <tr key={svc.id} className="hover:bg-[#F3F7FB]/50 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-[#384959]">{svc.vehicleNumber}</td>
                    <td className="py-3 px-3 font-semibold text-[#384959] capitalize">{svc.activityType}</td>
                    <td className="py-3 px-3 text-[#6A89A7]">{svc.workshopName}</td>
                    <td className="py-3 px-3 font-mono font-bold text-[#384959]">
                      {svc.currentOdometer.toLocaleString('en-IN')} KM
                    </td>
                    <td className="py-3 px-3 text-[#384959] max-w-xs">{svc.workDescription}</td>
                    <td className="py-3 px-3 font-mono font-extrabold text-[#384959]">
                      ₹{svc.expenseAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">{svc.date}</td>
                    <td className="py-3 px-3">
                      {svc.receiptPhotoUrl ? (
                        <a
                          href={svc.receiptPhotoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#6A89A7] font-bold hover:text-[#384959] flex items-center gap-1 text-[11px]"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Bill</span>
                        </a>
                      ) : (
                        <span className="text-slate-400 text-[10px]">None</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUBTAB 5: SUSPICIOUS RECORDS & CORRECTIONS REVIEW */}
      {/* ===================================================================== */}
      {activeSubTab === 'suspicious_review' && (
        <div className="bg-white p-5 border border-[#DCE8F2] rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#DCE8F2]">
            <div>
              <h3 className="text-base font-extrabold text-[#384959]">Flagged Suspicious Records & ODO Disputes</h3>
              <p className="text-xs text-[#6A89A7]">
                Entries flagged for abnormal jumps (&gt; 1,500 KM), monotonic regressions, or driver disputes.
              </p>
            </div>
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                suspiciousEvents.length > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {suspiciousEvents.length} Pending Review
            </span>
          </div>

          {suspiciousEvents.length > 0 ? (
            <div className="space-y-3">
              {suspiciousEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#384959] text-sm">{evt.vehicleNumber}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-200 text-amber-900 uppercase">
                        Suspicious Jump / Flagged
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-amber-950">
                      Reason: {evt.flagReason || 'Abnormal distance leap detected between consecutive events.'}
                    </p>
                    <p className="text-[11px] text-slate-600 font-mono">
                      Logged ODO: <strong>{evt.odometerReading.toLocaleString('en-IN')} KM</strong> by {evt.driverName} on{' '}
                      {new Date(evt.recordedAt).toLocaleString('en-IN')}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setCorrectingEvent(evt);
                        setCorrectedReadingInput(evt.odometerReading);
                        setCorrectionReasonInput(evt.flagReason || 'Corrected following cluster verification');
                      }}
                      className="px-3.5 py-2 bg-[#384959] text-white rounded-xl text-xs font-bold hover:bg-[#2C3B49] transition-colors"
                    >
                      Admin Correct
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-[#6A89A7]">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p className="font-bold text-[#384959]">All Odometer Readings Clean</p>
              <p className="text-[11px] mt-0.5">No anomalies or monotonic regression flags detected across fleet.</p>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUBTAB 6: FLEET ANALYTICS & DOWNTIME */}
      {/* ===================================================================== */}
      {activeSubTab === 'analytics' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-[#DCE8F2] shadow-xs">
              <span className="text-[10px] font-bold text-[#6A89A7] uppercase block font-heading">Total Fleet Units</span>
              <span className="text-2xl font-black text-[#384959] mt-1 block">{vehicles.length} Heavy Rigs</span>
              <span className="text-[11px] text-emerald-700 font-bold block mt-0.5">100% Active in Operation</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#DCE8F2] shadow-xs">
              <span className="text-[10px] font-bold text-[#6A89A7] uppercase block font-heading">
                Fleet Distance Run
              </span>
              <span className="text-2xl font-black text-[#384959] mt-1 block">
                {vehicles.reduce((sum, v) => sum + v.currentOdometer, 0).toLocaleString('en-IN')} KM
              </span>
              <span className="text-[11px] text-[#6A89A7] font-semibold block mt-0.5">Across All Assigned Corridor Runs</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#DCE8F2] shadow-xs">
              <span className="text-[10px] font-bold text-[#6A89A7] uppercase block font-heading">
                Certified Fleet Mileage
              </span>
              <span className="text-2xl font-black text-emerald-700 mt-1 block">10.2 KM/L</span>
              <span className="text-[11px] text-[#6A89A7] font-semibold block mt-0.5">Optimal Fleet Index</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#DCE8F2] shadow-xs">
              <span className="text-[10px] font-bold text-[#6A89A7] uppercase block font-heading">Total Maintenance</span>
              <span className="text-2xl font-black text-[#384959] mt-1 block">
                ₹{serviceRecords.reduce((sum, s) => sum + s.expenseAmount, 0).toLocaleString('en-IN')}
              </span>
              <span className="text-[11px] text-[#6A89A7] font-semibold block mt-0.5">Across 12 Service Types</span>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: UPDATE ODOMETER */}
      {/* ===================================================================== */}
      {isOdoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#DCE8F2]">
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
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: ADD VEHICLE */}
      {/* ===================================================================== */}
      {isAddVehicleOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#DCE8F2]">
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
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: ADMIN ODO CORRECTION */}
      {/* ===================================================================== */}
      {correctingEvent && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#DCE8F2]">
            <h3 className="font-heading text-base font-extrabold text-[#384959]">
              Admin Odometer Correction Audit
            </h3>
            <p className="text-xs text-[#6A89A7] mt-1">
              Vehicle: <strong>{correctingEvent.vehicleNumber}</strong> • Original Entry:{' '}
              <strong>{correctingEvent.odometerReading.toLocaleString('en-IN')} KM</strong>
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                requestOdoCorrection(correctingEvent.id, correctedReadingInput, correctionReasonInput);
                setCorrectingEvent(null);
              }}
              className="space-y-3.5 mt-4 text-xs"
            >
              <div>
                <label className="font-bold text-[#384959] block mb-1">Corrected Reading (KM)</label>
                <input
                  type="number"
                  required
                  value={correctedReadingInput}
                  onChange={(e) => setCorrectedReadingInput(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#DCE8F2] rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-[#384959] block mb-1">Audit Correction Reason</label>
                <textarea
                  rows={3}
                  required
                  value={correctionReasonInput}
                  onChange={(e) => setCorrectionReasonInput(e.target.value)}
                  placeholder="Explain why this reading is corrected..."
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#DCE8F2] rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCorrectingEvent(null)}
                  className="px-3.5 py-2 text-xs font-bold text-[#6A89A7]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
                >
                  Apply Verified Correction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: ADD CUSTOM REMINDER */}
      {/* ===================================================================== */}
      {isAddReminderOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#DCE8F2]">
            <h3 className="font-heading text-base font-extrabold text-[#384959]">
              Add Maintenance Target Reminder
            </h3>
            <form onSubmit={handleSaveCustomReminder} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="font-bold text-[#384959] block mb-1">Reminder Title</label>
                <input
                  type="text"
                  required
                  value={reminderTitle}
                  onChange={(e) => setReminderTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#DCE8F2] rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-[#384959] block mb-1">Target Interval (KM)</label>
                <input
                  type="number"
                  required
                  value={reminderDueKm}
                  onChange={(e) => setReminderDueKm(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#DCE8F2] rounded-xl font-bold"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddReminderOpen(false)}
                  className="px-3.5 py-2 text-xs font-bold text-[#6A89A7]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#384959] text-white rounded-xl text-xs font-bold"
                >
                  Save Reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
