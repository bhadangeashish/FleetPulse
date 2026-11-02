import React, { useState } from 'react';
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
} from 'lucide-react';
import { useTMS } from '../context/TMSContext';
import { Vehicle } from '../types/tms';

export const VehiclesView: React.FC = () => {
  const { vehicles, updateOdometer, addMultipurposeReminder, addVehicle, role, driverDailyWorks } = useTMS();
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
  const [newPermitType, setNewPermitType] = useState<'Permit' | 'State Permit'>('Permit');
  const [newPermitExpiry, setNewPermitExpiry] = useState('2027-10-15');
  const [newRcStatus, setNewRcStatus] = useState<'Active' | 'Under Renewal'>('Active');
  const [newPucExpiry, setNewPucExpiry] = useState('2027-04-15');
  const [newFitnessExpiry, setNewFitnessExpiry] = useState('2027-08-15');
  const [newInsuranceExpiry, setNewInsuranceExpiry] = useState('2027-10-15');

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

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-sky-100/90 via-sky-50 to-white p-5 border border-sky-200 rounded-xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-heading text-lg font-extrabold text-sky-950">
              Fleet Vehicles, Statutory Documents & ODO Reminders
            </h2>
            <span className="bg-sky-200/80 text-sky-900 border border-sky-300 text-xs font-bold px-2.5 py-0.5 rounded-full">
              Permit • RC • PUC • Fitness • Insurance
            </span>
          </div>
          <p className="text-xs text-sky-800/80 mt-1 font-medium">
            Track document expiry with automated reminders, log vehicle ODO reading, and configure multipurpose maintenance reminders (Servicing 10k, Major 90k, Timing belt 90k KM).
          </p>
        </div>

        <button
          onClick={() => setIsAddVehicleOpen(true)}
          className="px-4 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-700 hover:to-sky-600 rounded-lg shadow-sm shadow-sky-600/20 flex items-center gap-2 transition-all self-start md:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Vehicle</span>
        </button>
      </div>

      {/* Main Grid: Vehicles List (Left) & Vehicle Details (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Vehicle Cards (4 Cols) */}
        <div className="lg:col-span-4 space-y-3">
          <span className="text-[11px] font-bold text-sky-800 uppercase tracking-wider block font-heading">
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
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-sky-50/90 border-sky-500 shadow-sm ring-2 ring-sky-300'
                      : 'bg-white border-sky-100 hover:border-sky-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-lg bg-sky-800 text-white font-mono font-bold text-xs flex items-center justify-center">
                        {v.stateCode}
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-black text-sky-950 text-sm block">
                            {v.number}
                          </span>
                          <span className="bg-sky-100 text-sky-800 text-[10px] font-bold px-1.5 py-0.2 rounded font-mono border border-sky-200">
                            {v.capacityMt ? `${v.capacityMt} Ton` : `${(v.capacityKg / 1000).toFixed(0)} Ton`}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 font-medium">{v.model}</span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                        v.status === 'in_transit'
                          ? 'bg-sky-100 text-sky-800 border-sky-300'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {v.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs mt-3 pt-2 border-t border-sky-100">
                    <div className="flex items-center gap-1 font-mono text-sky-800 font-bold">
                      <Gauge className="w-3.5 h-3.5 text-sky-600" />
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
            <div className="bg-white p-5 border border-sky-100 rounded-xl shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-sky-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-600 to-sky-800 text-white font-mono font-black text-lg flex items-center justify-center shadow-xs">
                    {selectedVehicle.stateCode}
                  </div>
                  <div>
                    <h3 className="font-mono text-xl font-black text-sky-950 leading-tight">
                      {selectedVehicle.number}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      {selectedVehicle.model} • {selectedVehicle.type} ({selectedVehicle.capacityMt} MT Capacity)
                    </p>
                  </div>
                </div>

                {/* Log ODO Reading Button (PRD: "Their should be Vehical ODO reading option ,Which shows Reminder") */}
                <button
                  onClick={() => handleOpenOdoModal(selectedVehicle)}
                  className="px-3.5 py-2 bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-700 hover:to-sky-600 text-white font-bold text-xs rounded-lg shadow-sm shadow-sky-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Gauge className="w-4 h-4 text-sky-200" />
                  <span>Update ODO Reading</span>
                </button>
              </div>

              {/* Status Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs">
                <div className="p-3 bg-sky-50/50 rounded-xl border border-sky-100">
                  <span className="text-[10px] font-bold text-sky-800 uppercase block font-heading">Current Odometer</span>
                  <div className="font-mono font-black text-sky-950 text-base mt-0.5">
                    {selectedVehicle.currentOdometer.toLocaleString('en-IN')} KM
                  </div>
                </div>

                <div className="p-3 bg-sky-50/50 rounded-xl border border-sky-100">
                  <span className="text-[10px] font-bold text-sky-800 uppercase block font-heading">Assigned Driver</span>
                  <div className="font-bold text-sky-950 text-sm mt-0.5 truncate">
                    {selectedVehicle.assignedDriverName || 'None'}
                  </div>
                </div>

                <div className="p-3 bg-sky-50/50 rounded-xl border border-sky-100">
                  <span className="text-[10px] font-bold text-sky-800 uppercase block font-heading">Current Location</span>
                  <div className="font-bold text-sky-950 text-xs mt-0.5 truncate">
                    {selectedVehicle.currentLocation}
                  </div>
                </div>

                <div className="p-3 bg-sky-50/50 rounded-xl border border-sky-100">
                  <span className="text-[10px] font-bold text-sky-800 uppercase block font-heading">Capacity</span>
                  <div className="font-mono font-bold text-sky-950 text-sm mt-0.5">
                    {selectedVehicle.capacityMt} MT ({selectedVehicle.capacityKg.toLocaleString('en-IN')} KG)
                  </div>
                </div>
              </div>

              {/* Master Prompt Section 4: Capacity Display Example (Max, Current Load, Remaining) */}
              <div className="mt-4 p-4 bg-gradient-to-r from-sky-50/90 to-white rounded-xl border border-sky-200 space-y-2">
                <span className="text-[10px] font-bold text-sky-900 uppercase tracking-wider block font-heading">
                  Vehicle Load & Capacity Status
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
                  <div className="p-2.5 bg-white rounded-lg border border-sky-100">
                    <span className="text-slate-500 text-[10px] block">Maximum Capacity:</span>
                    <strong className="text-sky-950 text-sm font-black">
                      {selectedVehicle.capacityKg.toLocaleString('en-IN')} KG
                    </strong>
                    <span className="text-[10px] text-slate-400 block font-normal">({selectedVehicle.capacityMt} MT)</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-sky-100">
                    <span className="text-slate-500 text-[10px] block">Current Estimated Load:</span>
                    <strong className="text-sky-800 text-sm font-black">
                      {selectedVehicle.status === 'in_transit' ? Math.round(selectedVehicle.capacityKg * 0.85).toLocaleString('en-IN') : '0'} KG
                    </strong>
                    <span className="text-[10px] text-slate-400 block font-normal">
                      {selectedVehicle.status === 'in_transit' ? 'Dispatched' : 'Unloaded / Free'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-sky-100">
                    <span className="text-slate-500 text-[10px] block">Remaining Capacity:</span>
                    <strong className="text-emerald-700 text-sm font-black">
                      {selectedVehicle.status === 'in_transit'
                        ? (selectedVehicle.capacityKg - Math.round(selectedVehicle.capacityKg * 0.85)).toLocaleString('en-IN')
                        : selectedVehicle.capacityKg.toLocaleString('en-IN')}{' '}
                      KG
                    </strong>
                    <span className="text-[10px] text-emerald-600 block font-bold">
                      {selectedVehicle.status === 'in_transit' ? '15% Available' : '100% Available'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Statutory Documents (PRD: Permit, RC Status, PUC, Fitness/Passing, Insurance Expiry + Soft copy) */}
            <div className="bg-white p-5 border border-sky-100 rounded-xl shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-sky-100">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-sky-600" />
                  <h4 className="text-xs font-bold text-sky-950 uppercase tracking-wider font-heading">
                    Vehicle Documents & Soft Copies (With Expiry Reminders)
                  </h4>
                </div>
                <span className="text-[11px] text-sky-700 font-medium">Auto Reminder when Expiring</span>
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
                          : 'bg-sky-50/40 border-sky-100 text-slate-900 hover:border-sky-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-heading font-bold text-xs text-sky-950">{doc.type}</span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase ${
                              isExpired
                                ? 'bg-rose-600 text-white'
                                : isSoon
                                ? 'bg-amber-500 text-white'
                                : 'bg-sky-600 text-white'
                            }`}
                          >
                            {isExpired ? 'EXPIRED!' : isSoon ? 'EXPIRING SOON!' : 'VALID'}
                          </span>
                        </div>

                        <div className="font-mono text-[11px] text-slate-600 mt-1">
                          Doc #: {doc.number}
                        </div>
                        {doc.rcStatus && (
                          <div className="text-[11px] text-sky-800 font-bold">
                            RC Status: {doc.rcStatus}
                          </div>
                        )}
                        <div className="text-[11px] text-slate-600 mt-0.5">
                          Expires: <strong className="font-mono text-slate-900">{doc.expiryDate}</strong>
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          alert(`Opening Soft Copy Document: ${doc.softCopyName || `${doc.type}_Copy.pdf`}`)
                        }
                        className="px-2.5 py-1 bg-white hover:bg-sky-50 border border-sky-200 rounded-md text-[11px] font-bold text-sky-700 flex items-center gap-1 shadow-2xs cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-sky-500" />
                        <span>Soft Copy</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Multipurpose ODO Reminders (PRD: Servicing for 10k km, Major servicing 90k, Timing belt 90k km, KM set by Admin!) */}
            <div className="bg-white p-5 border border-sky-100 rounded-xl shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-sky-100">
                <div className="flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-sky-600" />
                  <h4 className="text-xs font-bold text-sky-950 uppercase tracking-wider font-heading">
                    Multipurpose ODO-Based Reminders (KM Set by Admin)
                  </h4>
                </div>

                {role === 'admin' && (
                  <button
                    onClick={() => setIsAddReminderOpen(true)}
                    className="px-2.5 py-1 text-xs font-bold text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-md flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Custom KM Reminder</span>
                  </button>
                )}
              </div>

              <div className="space-y-2 text-xs">
                {selectedVehicle.maintenanceReminders.map((mr) => {
                  const targetKm = mr.lastDoneKm + mr.dueKm;
                  const remainingKm = targetKm - selectedVehicle.currentOdometer;
                  const isDueSoon = remainingKm <= 1000 && remainingKm > 0;
                  const isOverdue = remainingKm <= 0;

                  return (
                    <div
                      key={mr.id}
                      className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                        isOverdue
                          ? 'bg-rose-50 border-rose-300'
                          : isDueSoon
                          ? 'bg-amber-50 border-amber-300'
                          : 'bg-sky-50/40 border-sky-100'
                      }`}
                    >
                      <div>
                        <div className="font-heading font-bold text-slate-900 text-xs flex items-center gap-2">
                          <span>{mr.title}</span>
                          {isOverdue && (
                            <span className="bg-rose-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                              DUE NOW!
                            </span>
                          )}
                          {isDueSoon && (
                            <span className="bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                              DUE SOON
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Set for every <strong className="font-mono text-slate-900">{mr.dueKm.toLocaleString('en-IN')} KM</strong> • Next Target ODO: <strong className="font-mono text-sky-800">{targetKm.toLocaleString('en-IN')} KM</strong>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-mono font-extrabold text-sm text-sky-950">
                          {isOverdue
                            ? `${Math.abs(remainingKm).toLocaleString('en-IN')} KM Overdue`
                            : `${remainingKm.toLocaleString('en-IN')} KM Remaining`}
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">
                          Current: {selectedVehicle.currentOdometer.toLocaleString('en-IN')} KM
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Driver Daily Work & Maintenance Logs for this Vehicle (Fast Tracking) */}
            <div className="bg-white p-5 border border-sky-100 rounded-xl shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-sky-100 gap-2">
                <div className="flex items-center gap-2">
                  <PackageCheck className="w-4 h-4 text-sky-600" />
                  <h4 className="text-xs font-bold text-sky-950 uppercase tracking-wider font-heading">
                    Driver Daily Work & Maintenance Logs ({selectedVehicle.number})
                  </h4>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md font-bold">
                    {driverDailyWorks.filter((w) => w.vehicleNumber === selectedVehicle.number || w.vehicleId === selectedVehicle.id).reduce((acc, curr) => acc + curr.deliveriesCount, 0)} Total Deliveries
                  </span>
                  <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                    <Disc className="w-3 h-3" />
                    {driverDailyWorks.filter((w) => (w.vehicleNumber === selectedVehicle.number || w.vehicleId === selectedVehicle.id) && w.hadTyreChangeOrMaintenance).length} Tyre/Repairs
                  </span>
                </div>
              </div>

              {(() => {
                const vehicleLogs = driverDailyWorks.filter(
                  (w) => w.vehicleNumber === selectedVehicle.number || w.vehicleId === selectedVehicle.id
                );

                if (vehicleLogs.length === 0) {
                  return (
                    <div className="text-center py-6 border border-dashed border-sky-200 rounded-xl bg-sky-50/30">
                      <Truck className="w-8 h-8 text-sky-300 mx-auto mb-2" />
                      <p className="text-xs font-bold text-sky-900">No driver daily work submitted for {selectedVehicle.number} yet</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">When drivers log daily work in the Driver App for this vehicle, deliveries and tyre changes will display here.</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    {vehicleLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-3.5 rounded-xl border border-sky-100 bg-sky-50/20 hover:bg-sky-50/40 transition-colors space-y-2 text-xs"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sky-100 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-heading font-bold text-sky-950">{log.driverName}</span>
                            <span className="text-[10px] text-slate-500 font-medium">({log.date})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full font-bold text-[10px]">
                              {log.deliveriesCount} Deliveries Done
                            </span>
                            {log.hadTyreChangeOrMaintenance && (
                              <span className="bg-amber-500 text-white px-2 py-0.5 rounded-full font-bold text-[10px] flex items-center gap-1">
                                <Disc className="w-2.5 h-2.5" />
                                Tyre / Repair Logged
                              </span>
                            )}
                          </div>
                        </div>

                        {log.deliveryLocations && log.deliveryLocations.length > 0 && (
                          <div className="flex items-start gap-1.5 text-[11px] text-slate-700">
                            <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
                            <div className="flex flex-wrap gap-1">
                              {log.deliveryLocations.map((loc, idx) => (
                                <span key={idx} className="bg-white border border-sky-200 px-2 py-0.5 rounded text-[10px] font-medium text-slate-800">
                                  {typeof loc === 'string' ? loc : loc.placeName || loc.city || `Drop #${idx + 1}`}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-sky-100">
                          {log.workDescription}
                        </div>

                        {log.maintenanceDetails && (
                          <div className="bg-amber-50/80 border border-amber-200 rounded-lg p-2.5 text-[11px] text-amber-950 space-y-1">
                            <div className="flex items-center justify-between font-bold">
                              <span className="flex items-center gap-1">
                                <Disc className="w-3 h-3 text-amber-600" />
                                {log.maintenanceDetails.component}: {log.maintenanceDetails.actionTaken}
                              </span>
                              {log.maintenanceDetails.expenseAmount !== undefined && log.maintenanceDetails.expenseAmount > 0 && (
                                <span className="font-mono text-amber-900">
                                  ₹{log.maintenanceDetails.expenseAmount.toLocaleString('en-IN')} ({log.maintenanceDetails.paidBy})
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-amber-800">
                              Workshop: {log.maintenanceDetails.workshopName || 'Highway Garage'}
                              {log.maintenanceDetails.billInvoiceNumber && ` • Bill #: ${log.maintenanceDetails.billInvoiceNumber}`}
                            </div>
                          </div>
                        )}

                        {log.totalKmRun !== undefined && log.totalKmRun > 0 && (
                          <div className="text-[10px] text-slate-500 font-mono flex items-center justify-between pt-1">
                            <span>ODO: {log.startOdometer?.toLocaleString('en-IN')} ➔ {log.endOdometer?.toLocaleString('en-IN')} KM</span>
                            <span className="font-bold text-sky-800">Run: {log.totalKmRun} KM</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Odometer Reading History (Master Prompt Section 4: Maintain ODO history & prevent accidental decreases) */}
            <div className="bg-white p-5 border border-sky-100 rounded-xl shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-sky-100">
                <div className="flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-sky-600" />
                  <h4 className="text-xs font-bold text-sky-950 uppercase tracking-wider font-heading">
                    Odometer Log History ({selectedVehicle.number})
                  </h4>
                </div>
                <span className="text-[11px] font-mono text-slate-500 font-bold">
                  Current: {selectedVehicle.currentOdometer.toLocaleString('en-IN')} KM
                </span>
              </div>

              <div className="space-y-2">
                {selectedVehicle.odometerHistory && selectedVehicle.odometerHistory.length > 0 ? (
                  selectedVehicle.odometerHistory.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 bg-sky-50/40 rounded-lg border border-sky-100 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-mono font-bold text-sky-950 text-sm">
                          {log.reading.toLocaleString('en-IN')} KM
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {log.notes || 'Recorded odometer update'} • Logged by: {log.recordedBy}
                        </div>
                      </div>
                      <div className="text-right text-[11px] font-mono text-slate-400">
                        {new Date(log.recordedAt).toLocaleString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 bg-sky-50/40 rounded-lg border border-sky-100 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-mono font-bold text-sky-950">
                        {selectedVehicle.currentOdometer.toLocaleString('en-IN')} KM
                      </div>
                      <div className="text-[11px] text-slate-500">Initial recorded odometer reading</div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">Enrolled</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal 1: Update Odometer Reading */}
      {isOdoModalOpen && (
        <div className="fixed inset-0 z-50 bg-sky-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-sky-200 shadow-xl w-full max-w-md p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-sky-100 pb-2">
              <div className="flex items-center gap-2">
                <Gauge className="w-5 h-5 text-sky-600" />
                <h3 className="font-heading font-bold text-sm text-sky-950">
                  Update Odometer: {selectedVehicle?.number}
                </h3>
              </div>
              <button onClick={() => setIsOdoModalOpen(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleSaveOdo} className="space-y-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-sky-800 mb-1 font-heading">
                  Previous Odometer Reading
                </label>
                <div className="font-mono text-sm font-bold text-slate-700 p-2.5 bg-sky-50 rounded-lg border border-sky-100">
                  {selectedVehicle?.currentOdometer.toLocaleString('en-IN')} KM
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-sky-900 mb-1 font-heading">
                  New Odometer Reading (KM)
                </label>
                <input
                  type="number"
                  required
                  value={newOdoInput}
                  onChange={(e) => {
                    setNewOdoInput(Number(e.target.value));
                    setOdoError(null);
                  }}
                  className="w-full bg-white border border-sky-200 rounded-lg px-3 py-2 font-mono text-base font-black text-sky-950 focus:outline-sky-500"
                />
              </div>

              {odoError && (
                <div className="p-3 bg-rose-50 text-rose-800 border border-rose-300 rounded-lg text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{odoError}</span>
                </div>
              )}

              <div className="p-2.5 bg-sky-50 text-sky-900 border border-sky-200 rounded-lg text-[11px]">
                Updating the ODO reading will automatically recalculate all Servicing (10k), Major Servicing (90k), and Timing Belt (90k) reminders! Accidental decreases are strictly prevented.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-sky-100">
                <button
                  type="button"
                  onClick={() => setIsOdoModalOpen(false)}
                  className="px-4 py-2 font-bold text-sky-800 bg-sky-50 rounded-lg hover:bg-sky-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold text-white bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-700 hover:to-sky-600 rounded-lg shadow-sm shadow-sky-600/20 cursor-pointer"
                >
                  Save Odometer Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Add Multipurpose Reminder (KM Set by Admin) */}
      {isAddReminderOpen && (
        <div className="fixed inset-0 z-50 bg-sky-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-sky-200 shadow-xl w-full max-w-md p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-sky-100 pb-2">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-sky-600" />
                <h3 className="font-heading font-bold text-sm text-sky-950">
                  Add Multipurpose KM Reminder (Admin)
                </h3>
              </div>
              <button onClick={() => setIsAddReminderOpen(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleSaveCustomReminder} className="space-y-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-sky-900 mb-1 font-heading">
                  Reminder Title / Work Description
                </label>
                <input
                  type="text"
                  required
                  value={reminderTitle}
                  onChange={(e) => setReminderTitle(e.target.value)}
                  placeholder="e.g. Servicing for 10,000km, Timing belt for 90,000km"
                  className="w-full bg-white border border-sky-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-sky-500"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-sky-900 mb-1 font-heading">
                  Interval KM (Set by Admin)
                </label>
                <input
                  type="number"
                  required
                  min="500"
                  value={reminderDueKm}
                  onChange={(e) => setReminderDueKm(Number(e.target.value))}
                  className="w-full bg-white border border-sky-200 rounded-lg px-3 py-2 font-mono font-bold text-slate-900 focus:outline-sky-500"
                  placeholder="e.g. 10000, 90000"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-sky-100">
                <button
                  type="button"
                  onClick={() => setIsAddReminderOpen(false)}
                  className="px-4 py-2 font-bold text-sky-800 bg-sky-50 rounded-lg hover:bg-sky-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold text-white bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-700 hover:to-sky-600 rounded-lg shadow-sm shadow-sky-600/20 cursor-pointer"
                >
                  Save Reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Onboard New Vehicle */}
      {isAddVehicleOpen && (
        <div className="fixed inset-0 z-50 bg-sky-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-sky-200 shadow-xl w-full max-w-lg p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-sky-100 pb-2">
              <h3 className="font-heading font-bold text-sm text-sky-950">
                Add Vehicle & Statutory Documentation
              </h3>
              <button onClick={() => setIsAddVehicleOpen(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleCreateVehicle} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-sky-800 mb-1 font-heading">
                    Vehicle Number (Plate)
                  </label>
                  <input
                    type="text"
                    required
                    value={newPlate}
                    onChange={(e) => setNewPlate(e.target.value)}
                    placeholder="MH-12-RN-4892"
                    className="w-full bg-white border border-sky-200 rounded-lg px-3 py-1.5 font-mono font-bold text-slate-900 text-xs focus:outline-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-sky-800 mb-1 font-heading">
                    Starting ODO (KM)
                  </label>
                  <input
                    type="number"
                    value={newOdo}
                    onChange={(e) => setNewOdo(Number(e.target.value))}
                    className="w-full bg-white border border-sky-200 rounded-lg px-3 py-1.5 font-mono text-xs focus:outline-sky-500"
                  />
                </div>
              </div>

              {/* Vehicle Model & Load Capacity Section (PRD: "in Vehical section for Load Capacity set add option for Load Capacity(it can be 2 ton,4ton etc)") */}
              <div className="space-y-2 p-3 bg-sky-50/70 border border-sky-200 rounded-xl">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] uppercase font-bold text-sky-900 font-heading">
                    Vehicle Load Capacity (Choose or Enter Custom)
                  </label>
                  <span className="text-[11px] font-mono font-bold text-sky-800 bg-white px-2 py-0.5 rounded border border-sky-300">
                    {newCapacityMt} Ton ({Number(newCapacityMt * 1000).toLocaleString('en-IN')} KG)
                  </span>
                </div>

                {/* Quick Presets: 2 Ton, 4 Ton, 7.5 Ton, 10 Ton, 16 Ton, 24 Ton */}
                <div className="flex flex-wrap gap-1.5">
                  {[2, 4, 7.5, 10, 16, 24].map((ton) => (
                    <button
                      key={ton}
                      type="button"
                      onClick={() => {
                        setNewCapacityMt(ton);
                        setNewType(`${ton}-Ton Transport Truck`);
                      }}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                        newCapacityMt === ton
                          ? 'bg-sky-600 text-white border-sky-600 shadow-2xs'
                          : 'bg-white text-sky-800 border-sky-200 hover:bg-sky-100'
                      }`}
                    >
                      {ton} Ton
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-600 mb-0.5">
                      Exact Load Capacity (Tons)
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        step="0.5"
                        min="0.5"
                        required
                        value={newCapacityMt}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setNewCapacityMt(val);
                          setNewType(`${val}-Ton Transport Truck`);
                        }}
                        className="w-full bg-white border border-sky-300 rounded px-2.5 py-1.5 font-mono font-bold text-xs focus:outline-sky-500"
                        placeholder="e.g. 2, 4, 10"
                      />
                      <span className="text-xs font-bold text-sky-900">Ton</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-600 mb-0.5">
                      Vehicle Model
                    </label>
                    <input
                      type="text"
                      value={newModel}
                      onChange={(e) => setNewModel(e.target.value)}
                      placeholder="e.g. Tata 407 / Eicher Pro / Ashok Leyland"
                      className="w-full bg-white border border-sky-300 rounded px-2.5 py-1.5 text-xs font-medium focus:outline-sky-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-sky-800 mb-1 font-heading">
                    Vehicle Classification / Body
                  </label>
                  <input
                    type="text"
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    placeholder="e.g. 4-Ton Open Body Fruit Carrier"
                    className="w-full bg-white border border-sky-200 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:outline-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-sky-800 mb-1 font-heading">
                    Permit Type
                  </label>
                  <select
                    value={newPermitType}
                    onChange={(e) => setNewPermitType(e.target.value as any)}
                    className="w-full bg-white border border-sky-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-sky-500"
                  >
                    <option value="Permit">Permit (National / Interstate)</option>
                    <option value="State Permit">State Permit</option>
                  </select>
                </div>
              </div>

              <div className="p-3.5 bg-sky-50/60 border border-sky-100 rounded-xl space-y-2">
                <span className="text-[10px] font-bold text-sky-800 uppercase block font-heading">
                  Statutory Document Expiry Dates (With Soft Copy Upload):
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <label className="block text-slate-600 font-bold">Permit Expiry</label>
                    <input
                      type="date"
                      value={newPermitExpiry}
                      onChange={(e) => setNewPermitExpiry(e.target.value)}
                      className="w-full bg-white border border-sky-200 rounded px-2 py-1 font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold">PUC Expiry</label>
                    <input
                      type="date"
                      value={newPucExpiry}
                      onChange={(e) => setNewPucExpiry(e.target.value)}
                      className="w-full bg-white border border-sky-200 rounded px-2 py-1 font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold">Fitness / Passing Expiry</label>
                    <input
                      type="date"
                      value={newFitnessExpiry}
                      onChange={(e) => setNewFitnessExpiry(e.target.value)}
                      className="w-full bg-white border border-sky-200 rounded px-2 py-1 font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold">Insurance Expiry</label>
                    <input
                      type="date"
                      value={newInsuranceExpiry}
                      onChange={(e) => setNewInsuranceExpiry(e.target.value)}
                      className="w-full bg-white border border-sky-200 rounded px-2 py-1 font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-sky-100">
                <button
                  type="button"
                  onClick={() => setIsAddVehicleOpen(false)}
                  className="px-4 py-2 font-bold text-sky-800 bg-sky-50 rounded-lg hover:bg-sky-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold text-white bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-700 hover:to-sky-600 rounded-lg shadow-sm shadow-sky-600/20 cursor-pointer"
                >
                  Save & Onboard Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
