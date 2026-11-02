import React, { useState } from 'react';
import {
  Users,
  Plus,
  Phone,
  ShieldCheck,
  Truck,
  MessageSquare,
  FileText,
  CheckCircle2,
  Share2,
  Eye,
  Check,
  XCircle,
  AlertCircle,
  Upload,
  RefreshCw,
  X,
} from 'lucide-react';
import { useTMS } from '../context/TMSContext';
import { Driver, VerificationStatus } from '../types/tms';
import { handleFormKeyDown } from '../utils/keyboardNavigation';

export const DriversView: React.FC = () => {
  const {
    drivers,
    vehicles,
    addDriver,
    updateDriver,
    updateDriverVerification,
    toggleDriverStatus,
    sendWhatsAppLink,
    role,
  } = useTMS();
  const [isAddDriverOpen, setIsAddDriverOpen] = useState(false);

  // New Driver Form Fields
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('+91 ');
  const [address, setAddress] = useState('Pune Market Yard Staff Quarters, Maharashtra');
  const [licenseNumber, setLicenseNumber] = useState('MH-12-');
  const [licenseExpiry, setLicenseExpiry] = useState('2028-10-15');
  const [licenseSoftCopy, setLicenseSoftCopy] = useState('DL_Heavy_Commercial.pdf');
  const [licenseSoftCopyUrl, setLicenseSoftCopyUrl] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('XXXX-XXXX-9912');
  const [aadhaarSoftCopy, setAadhaarSoftCopy] = useState('Aadhaar_Card_Copy.pdf');
  const [aadhaarSoftCopyUrl, setAadhaarSoftCopyUrl] = useState('');
  const [panNumber, setPanNumber] = useState('ABCDE1234F');
  const [panSoftCopy, setPanSoftCopy] = useState('PAN_Card_Copy.pdf');
  const [panSoftCopyUrl, setPanSoftCopyUrl] = useState('');
  const [assignedVehicleId, setAssignedVehicleId] = useState(vehicles[0]?.id || '');

  // Review & Verification Modal State
  const [selectedDriverForReview, setSelectedDriverForReview] = useState<Driver | null>(null);
  const [reviewRejectionReason, setReviewRejectionReason] = useState('');
  const [replaceDocDriver, setReplaceDocDriver] = useState<{ driver: Driver; docType: 'dl' | 'aadhaar' | 'pan' } | null>(null);
  const [replacedFileName, setReplacedFileName] = useState('');

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setterName: (name: string) => void,
    setterUrl: (url: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('File exceeds 5 MB limit. Please choose a smaller document.');
      return;
    }
    setterName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setterUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreateDriver = (e: React.FormEvent) => {
    e.preventDefault();
    const veh = vehicles.find((v) => v.id === assignedVehicleId);

    const { driver: createdDriver } = addDriver({
      fullName,
      mobile,
      address,
      licenseNumber,
      licenseExpiry,
      licenseSoftCopy,
      licenseSoftCopyUrl,
      aadhaarNumber,
      aadhaarSoftCopy,
      aadhaarSoftCopyUrl,
      panNumber,
      panSoftCopy,
      panSoftCopyUrl,
      assignedVehicleId,
      assignedVehicleNumber: veh?.number,
      verificationStatus: 'pending',
      dlVerificationStatus: 'pending',
      aadhaarVerificationStatus: 'pending',
      panVerificationStatus: 'pending',
    });

    setIsAddDriverOpen(false);

    if (
      confirm(
        `Driver ${createdDriver.fullName} registered with pending KYC verification! Do you want to prepare the Application Portal access link to ${createdDriver.mobile} on WhatsApp now?`
      )
    ) {
      sendWhatsAppLink(createdDriver);
    }
  };

  const handleVerifyDriver = (driverId: string, status: VerificationStatus) => {
    if (status === 'rejected' && !reviewRejectionReason.trim()) {
      alert('Please provide a rejection reason so the driver can correct and re-upload the document.');
      return;
    }
    updateDriverVerification(driverId, status, reviewRejectionReason.trim() || undefined);
    setSelectedDriverForReview(null);
    setReviewRejectionReason('');
  };

  const handleReplaceDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replaceDocDriver || !replacedFileName) return;

    const updates: Partial<Driver> = {};
    if (replaceDocDriver.docType === 'dl') {
      updates.licenseSoftCopy = replacedFileName;
      updates.dlVerificationStatus = 'pending';
    } else if (replaceDocDriver.docType === 'aadhaar') {
      updates.aadhaarSoftCopy = replacedFileName;
      updates.aadhaarVerificationStatus = 'pending';
    } else if (replaceDocDriver.docType === 'pan') {
      updates.panSoftCopy = replacedFileName;
      updates.panVerificationStatus = 'pending';
    }
    updates.verificationStatus = 'pending';

    updateDriver(replaceDocDriver.driver.id, updates);
    alert(`Replaced ${replaceDocDriver.docType.toUpperCase()} document for ${replaceDocDriver.driver.fullName}. Resubmitted for Admin verification.`);
    setReplaceDocDriver(null);
    setReplacedFileName('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-sky-100/90 via-sky-50 to-white p-5 border border-sky-200 rounded-xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-heading text-lg font-extrabold text-sky-950">
              Driver Roster & Statutory KYC Compliance
            </h2>
            <span className="bg-sky-200/80 text-sky-900 border border-sky-300 text-xs font-bold px-2.5 py-0.5 rounded-full">
              Licence • Aadhaar • PAN Soft Copies • WhatsApp Link
            </span>
          </div>
          <p className="text-xs text-sky-800/80 mt-1 font-medium">
            Store driver KYC soft copies, verify documents, assign fleet trucks, and dispatch personal portal links directly to drivers via WhatsApp.
          </p>
        </div>

        <button
          onClick={() => setIsAddDriverOpen(true)}
          className="px-4 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-700 hover:to-sky-600 rounded-lg shadow-sm shadow-sky-600/20 flex items-center gap-2 transition-all self-start md:self-auto cursor-pointer font-heading"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Driver & Upload KYC</span>
        </button>
      </div>

      {/* Drivers List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {drivers.map((driver) => {
          const isVerified = driver.verificationStatus === 'verified';
          const isRejected = driver.verificationStatus === 'rejected';

          return (
            <div
              key={driver.id}
              className="bg-white border border-sky-100 rounded-xl p-5 shadow-xs space-y-4 hover:border-sky-300 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-600 to-sky-800 text-white font-heading font-black text-sm flex items-center justify-center shadow-xs">
                      {driver.fullName[0]}
                    </div>
                    <div>
                      <h3 className="font-heading font-extrabold text-sm text-sky-950">
                        {driver.fullName}
                      </h3>
                      <div className="flex items-center gap-1.5 font-mono text-xs text-slate-500">
                        <Phone className="w-3 h-3 text-sky-500" />
                        <span>{driver.mobile}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                        driver.status === 'on_trip'
                          ? 'bg-amber-50 text-amber-800 border-amber-300'
                          : driver.status === 'active'
                          ? 'bg-sky-100 text-sky-800 border-sky-300'
                          : 'bg-slate-100 text-slate-700 border-slate-300'
                      }`}
                    >
                      {driver.status.replace('_', ' ')}
                    </span>

                    {/* Verification Status Badge (Section 5) */}
                    <span
                      className={`text-[9px] font-bold px-2 py-0.2 rounded-full uppercase border font-mono ${
                        isVerified
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : isRejected
                          ? 'bg-rose-50 text-rose-800 border-rose-300'
                          : 'bg-amber-50 text-amber-800 border-amber-300'
                      }`}
                    >
                      {driver.verificationStatus || 'Pending Verification'}
                    </span>
                  </div>
                </div>

                {/* Truck Assigned */}
                <div className="p-2.5 bg-sky-50/50 rounded-lg border border-sky-100 text-xs flex items-center justify-between">
                  <span className="text-sky-800 font-medium font-heading">Assigned Rig:</span>
                  <span className="font-mono font-bold text-sky-950">
                    {driver.assignedVehicleNumber || 'Standby Driver'}
                  </span>
                </div>

                {/* Statutory Soft Copies Checklist (PRD Requirement) */}
                <div className="space-y-2 pt-1 border-t border-sky-100 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-sky-800 uppercase block font-heading">
                      Statutory KYC Soft Copies:
                    </span>
                    {role === 'admin' && (
                      <button
                        onClick={() => setSelectedDriverForReview(driver)}
                        className="text-[10px] text-sky-700 hover:text-sky-900 font-bold hover:underline cursor-pointer"
                      >
                        Verify / Review
                      </button>
                    )}
                  </div>

                  {/* 1. Driving Licence */}
                  <div className="flex items-center justify-between bg-sky-50/30 p-2.5 rounded-lg border border-sky-100">
                    <div>
                      <span className="font-heading font-bold text-sky-950 block text-[11px]">
                        1. Driving Licence
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {driver.licenseNumber} (Exp: {driver.licenseExpiry})
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() =>
                          alert(
                            `Viewing Driving Licence soft copy: ${driver.licenseSoftCopy || 'Attached'}`
                          )
                        }
                        className="px-2 py-1 bg-white border border-sky-200 rounded text-[10px] font-bold text-sky-700 hover:bg-sky-50 flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3 h-3 text-sky-500" />
                        <span>View</span>
                      </button>
                      {driver.dlVerificationStatus === 'rejected' && (
                        <button
                          onClick={() => setReplaceDocDriver({ driver, docType: 'dl' })}
                          className="px-1.5 py-1 bg-rose-100 text-rose-800 rounded text-[9px] font-bold cursor-pointer"
                          title="Replace rejected DL"
                        >
                          Replace
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 2. Aadhaar */}
                  <div className="flex items-center justify-between bg-sky-50/30 p-2.5 rounded-lg border border-sky-100">
                    <div>
                      <span className="font-heading font-bold text-sky-950 block text-[11px]">
                        2. Aadhaar Card
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {driver.aadhaarNumber}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() =>
                          alert(
                            `Viewing Aadhaar Card soft copy: ${driver.aadhaarSoftCopy || 'Attached'}`
                          )
                        }
                        className="px-2 py-1 bg-white border border-sky-200 rounded text-[10px] font-bold text-sky-700 hover:bg-sky-50 flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3 h-3 text-sky-500" />
                        <span>View</span>
                      </button>
                      {driver.aadhaarVerificationStatus === 'rejected' && (
                        <button
                          onClick={() => setReplaceDocDriver({ driver, docType: 'aadhaar' })}
                          className="px-1.5 py-1 bg-rose-100 text-rose-800 rounded text-[9px] font-bold cursor-pointer"
                          title="Replace rejected Aadhaar"
                        >
                          Replace
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 3. PAN */}
                  <div className="flex items-center justify-between bg-sky-50/30 p-2.5 rounded-lg border border-sky-100">
                    <div>
                      <span className="font-heading font-bold text-sky-950 block text-[11px]">
                        3. PAN Card
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {driver.panNumber}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() =>
                          alert(`Viewing PAN Card soft copy: ${driver.panSoftCopy || 'Attached'}`)
                        }
                        className="px-2 py-1 bg-white border border-sky-200 rounded text-[10px] font-bold text-sky-700 hover:bg-sky-50 flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3 h-3 text-sky-500" />
                        <span>View</span>
                      </button>
                      {driver.panVerificationStatus === 'rejected' && (
                        <button
                          onClick={() => setReplaceDocDriver({ driver, docType: 'pan' })}
                          className="px-1.5 py-1 bg-rose-100 text-rose-800 rounded text-[9px] font-bold cursor-pointer"
                          title="Replace rejected PAN"
                        >
                          Replace
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {driver.rejectionReason && (
                  <div className="p-2 bg-rose-50 border border-rose-200 rounded text-rose-800 text-[10px]">
                    <strong>KYC Rejection Note:</strong> {driver.rejectionReason}
                  </div>
                )}
              </div>

              {/* WhatsApp Access Link Action & Status Toggle */}
              <div className="pt-3 border-t border-sky-100 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleDriverStatus(driver.id)}
                  className={`px-3 py-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                    driver.status === 'active' || driver.status === 'on_trip'
                      ? 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                  }`}
                >
                  {driver.status === 'active' || driver.status === 'on_trip' ? 'Deactivate' : 'Activate'}
                </button>

                <button
                  onClick={() => sendWhatsAppLink(driver)}
                  className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer font-heading"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Send WhatsApp</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Driver Modal with Enter Key Navigation */}
      {isAddDriverOpen && (
        <div className="fixed inset-0 z-50 bg-sky-950/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-sky-200 shadow-2xl w-full max-w-lg p-5 space-y-4 text-xs my-6">
            <div className="flex items-center justify-between border-b border-sky-100 pb-2">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-sky-600" />
                <h3 className="font-heading font-extrabold text-sm text-sky-950">
                  Add Driver & Upload KYC Soft Copies
                </h3>
              </div>
              <button onClick={() => setIsAddDriverOpen(false)} className="text-slate-400 hover:text-slate-700 p-1">
                ✕
              </button>
            </div>

            <form
              onSubmit={handleCreateDriver}
              onKeyDown={(e) => handleFormKeyDown(e)}
              className="space-y-3"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-sky-800 mb-1 font-heading">
                    Driver Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Ramesh Tawade"
                    className="w-full bg-white border border-sky-200 rounded-lg px-3 py-1.5 font-bold text-slate-900 text-xs focus:outline-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-sky-800 mb-1 font-heading">
                    Mobile Number (WhatsApp) *
                  </label>
                  <input
                    type="text"
                    required
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="+91 98220 44192"
                    className="w-full bg-white border border-sky-200 rounded-lg px-3 py-1.5 font-mono font-bold text-xs focus:outline-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-sky-800 mb-1 font-heading">
                  Residential Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Pune Market Yard Staff Quarters, Maharashtra"
                  className="w-full bg-white border border-sky-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-sky-500"
                />
              </div>

              {/* 1. Driving Licence */}
              <div className="p-3 bg-sky-50/50 border border-sky-100 rounded-xl space-y-2">
                <span className="font-heading font-bold text-sky-950 text-[11px] block">
                  1. Driving Licence Details & Soft Copy Upload
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="DL Number (e.g. MH-12-2015-009)"
                    className="w-full bg-white border border-sky-200 rounded px-2.5 py-1 text-xs font-mono"
                  />
                  <input
                    type="date"
                    required
                    value={licenseExpiry}
                    onChange={(e) => setLicenseExpiry(e.target.value)}
                    className="w-full bg-white border border-sky-200 rounded px-2 py-1 text-xs font-mono"
                  />
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <label className="px-2.5 py-1 bg-white border border-sky-200 text-sky-800 rounded font-bold text-[10px] cursor-pointer flex items-center gap-1 shadow-2xs">
                    <Upload className="w-3 h-3 text-sky-600" />
                    <span>Upload DL File</span>
                    <input
                      type="file"
                      accept="application/pdf,image/png,image/jpeg"
                      onChange={(e) => handleFileUpload(e, setLicenseSoftCopy, setLicenseSoftCopyUrl)}
                      className="hidden"
                    />
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono truncate">{licenseSoftCopy}</span>
                </div>
              </div>

              {/* 2. Aadhaar */}
              <div className="p-3 bg-sky-50/50 border border-sky-100 rounded-xl space-y-2">
                <span className="font-heading font-bold text-sky-950 text-[11px] block">
                  2. Aadhaar Card Details & Soft Copy Upload
                </span>
                <input
                  type="text"
                  required
                  value={aadhaarNumber}
                  onChange={(e) => setAadhaarNumber(e.target.value)}
                  placeholder="Aadhaar 12-Digit Number"
                  className="w-full bg-white border border-sky-200 rounded px-2.5 py-1 text-xs font-mono"
                />
                <div className="flex items-center gap-2 pt-1">
                  <label className="px-2.5 py-1 bg-white border border-sky-200 text-sky-800 rounded font-bold text-[10px] cursor-pointer flex items-center gap-1 shadow-2xs">
                    <Upload className="w-3 h-3 text-sky-600" />
                    <span>Upload Aadhaar File</span>
                    <input
                      type="file"
                      accept="application/pdf,image/png,image/jpeg"
                      onChange={(e) => handleFileUpload(e, setAadhaarSoftCopy, setAadhaarSoftCopyUrl)}
                      className="hidden"
                    />
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono truncate">{aadhaarSoftCopy}</span>
                </div>
              </div>

              {/* 3. PAN */}
              <div className="p-3 bg-sky-50/50 border border-sky-100 rounded-xl space-y-2">
                <span className="font-heading font-bold text-sky-950 text-[11px] block">
                  3. PAN Card Details & Soft Copy Upload
                </span>
                <input
                  type="text"
                  required
                  value={panNumber}
                  onChange={(e) => setPanNumber(e.target.value)}
                  placeholder="PAN Card Number (e.g. ABCDE1234F)"
                  className="w-full bg-white border border-sky-200 rounded px-2.5 py-1 text-xs font-mono uppercase"
                />
                <div className="flex items-center gap-2 pt-1">
                  <label className="px-2.5 py-1 bg-white border border-sky-200 text-sky-800 rounded font-bold text-[10px] cursor-pointer flex items-center gap-1 shadow-2xs">
                    <Upload className="w-3 h-3 text-sky-600" />
                    <span>Upload PAN File</span>
                    <input
                      type="file"
                      accept="application/pdf,image/png,image/jpeg"
                      onChange={(e) => handleFileUpload(e, setPanSoftCopy, setPanSoftCopyUrl)}
                      className="hidden"
                    />
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono truncate">{panSoftCopy}</span>
                </div>
              </div>

              {/* Assigned Vehicle */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-sky-800 mb-1 font-heading">
                  Assign Fleet Truck
                </label>
                <select
                  value={assignedVehicleId}
                  onChange={(e) => setAssignedVehicleId(e.target.value)}
                  className="w-full bg-white border border-sky-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-sky-500"
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.number} ({v.type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-sky-100">
                <button
                  type="button"
                  onClick={() => setIsAddDriverOpen(false)}
                  className="px-4 py-2 font-bold text-sky-800 bg-sky-50 rounded-lg hover:bg-sky-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-700 hover:to-sky-600 rounded-lg shadow-sm shadow-sky-600/20 cursor-pointer font-heading"
                >
                  Save & Trigger WhatsApp Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review KYC Modal for Admin */}
      {selectedDriverForReview && (
        <div className="fixed inset-0 z-60 bg-sky-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-sky-200 shadow-2xl w-full max-w-lg p-5 space-y-4 text-xs animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-sky-100 pb-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-sky-600" />
                <h4 className="font-heading font-extrabold text-sm text-sky-950">
                  Review Driver KYC: {selectedDriverForReview.fullName}
                </h4>
              </div>
              <button onClick={() => setSelectedDriverForReview(null)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 space-y-2">
                <span className="text-[10px] font-bold uppercase text-sky-900 block font-heading">
                  Driver KYC Documents
                </span>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between bg-white p-2 rounded border border-sky-100">
                    <span>1. Driving Licence: {selectedDriverForReview.licenseNumber}</span>
                    <button
                      type="button"
                      onClick={() => alert(`Opening soft copy: ${selectedDriverForReview.licenseSoftCopy}`)}
                      className="text-sky-600 font-bold hover:underline"
                    >
                      View Soft Copy
                    </button>
                  </div>
                  <div className="flex items-center justify-between bg-white p-2 rounded border border-sky-100">
                    <span>2. Aadhaar Card: {selectedDriverForReview.aadhaarNumber}</span>
                    <button
                      type="button"
                      onClick={() => alert(`Opening soft copy: ${selectedDriverForReview.aadhaarSoftCopy}`)}
                      className="text-sky-600 font-bold hover:underline"
                    >
                      View Soft Copy
                    </button>
                  </div>
                  <div className="flex items-center justify-between bg-white p-2 rounded border border-sky-100">
                    <span>3. PAN Card: {selectedDriverForReview.panNumber}</span>
                    <button
                      type="button"
                      onClick={() => alert(`Opening soft copy: ${selectedDriverForReview.panSoftCopy}`)}
                      className="text-sky-600 font-bold hover:underline"
                    >
                      View Soft Copy
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-sky-900 mb-1 font-heading">
                  Rejection Reason (If rejecting any document)
                </label>
                <input
                  type="text"
                  value={reviewRejectionReason}
                  onChange={(e) => setReviewRejectionReason(e.target.value)}
                  placeholder="e.g. DL photo is expired or illegible"
                  className="w-full bg-white border border-sky-200 rounded-lg px-3 py-2 text-xs focus:outline-sky-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-sky-100">
              <button
                type="button"
                onClick={() => handleVerifyDriver(selectedDriverForReview.id, 'rejected')}
                className="px-3.5 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg font-bold text-xs cursor-pointer flex items-center gap-1.5"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Reject KYC</span>
              </button>
              <button
                type="button"
                onClick={() => handleVerifyDriver(selectedDriverForReview.id, 'verified')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs cursor-pointer flex items-center gap-1.5 shadow-2xs font-heading"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verify & Approve Driver</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Driver Document Replacement Modal */}
      {replaceDocDriver && (
        <div className="fixed inset-0 z-60 bg-sky-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleReplaceDocument}
            className="bg-white rounded-2xl border border-sky-200 shadow-2xl w-full max-w-md p-5 space-y-4 text-xs animate-in zoom-in-95"
          >
            <div className="flex items-center justify-between border-b border-sky-100 pb-2">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-sky-600" />
                <h4 className="font-heading font-extrabold text-sm text-sky-950">
                  Replace Rejected {replaceDocDriver.docType.toUpperCase()} Document
                </h4>
              </div>
              <button type="button" onClick={() => setReplaceDocDriver(null)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-slate-600 text-xs">
                Upload a fresh, clear copy of the {replaceDocDriver.docType.toUpperCase()} for driver{' '}
                <strong>{replaceDocDriver.driver.fullName}</strong>.
              </p>

              <div>
                <label className="block text-[10px] font-bold uppercase text-sky-800 mb-1 font-heading">
                  Choose New Document File
                </label>
                <input
                  type="file"
                  accept="application/pdf,image/png,image/jpeg"
                  required
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setReplacedFileName(file.name);
                  }}
                  className="w-full bg-sky-50 border border-sky-200 rounded p-1.5 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-sky-100">
              <button
                type="button"
                onClick={() => setReplaceDocDriver(null)}
                className="px-3.5 py-1.5 text-slate-600 bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg cursor-pointer shadow-xs font-heading"
              >
                Upload & Resubmit
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
