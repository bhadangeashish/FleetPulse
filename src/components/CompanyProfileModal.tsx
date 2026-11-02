import React, { useState } from 'react';
import {
  Building2,
  Upload,
  X,
  Check,
  Shield,
  FileImage,
  Trash2,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  FileText,
} from 'lucide-react';
import { useTMS } from '../context/TMSContext';
import { handleFormKeyDown } from '../utils/keyboardNavigation';

interface CompanyProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CompanyProfileModal: React.FC<CompanyProfileModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { companyProfile, updateCompanyProfile, role } = useTMS();

  const [companyName, setCompanyName] = useState(companyProfile.companyName || '');
  const [ownerName, setOwnerName] = useState(companyProfile.ownerName || '');
  const [mobile, setMobile] = useState(companyProfile.mobile || '');
  const [email, setEmail] = useState(companyProfile.email || '');
  const [address, setAddress] = useState(companyProfile.address || '');
  const [city, setCity] = useState(companyProfile.city || 'Pune');
  const [state, setState] = useState(companyProfile.state || 'Maharashtra');
  const [gstin, setGstin] = useState(companyProfile.gstin || '');
  const [panNumber, setPanNumber] = useState(companyProfile.panNumber || '');
  const [logoUrl, setLogoUrl] = useState(companyProfile.logoUrl || '');

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!isOpen) return null;

  // Handle Logo Upload with file type & size validation (Master Prompt Section 3)
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      setFeedback({
        type: 'error',
        message: 'Invalid file type. Please upload a PNG, JPEG, WEBP or SVG image for the company logo.',
      });
      return;
    }

    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      setFeedback({
        type: 'error',
        message: 'File size exceeds 2 MB. Please upload a smaller logo image.',
      });
      return;
    }

    // Read as Data URL
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setLogoUrl(reader.result);
        setFeedback({
          type: 'success',
          message: 'Logo loaded successfully. Click "Save Company Profile" to apply.',
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoUrl('');
    setFeedback({
      type: 'success',
      message: 'Logo removed. Click "Save Company Profile" to commit.',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (role !== 'admin') {
      setFeedback({
        type: 'error',
        message: 'Access Denied: Only Administrator accounts can edit company registration and branding.',
      });
      return;
    }

    if (!companyName.trim()) {
      setFeedback({ type: 'error', message: 'Company Name cannot be empty.' });
      return;
    }

    const result = updateCompanyProfile({
      companyName: companyName.trim(),
      ownerName: ownerName.trim(),
      mobile: mobile.trim(),
      email: email.trim(),
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      gstin: gstin.trim(),
      panNumber: panNumber.trim(),
      logoUrl: logoUrl.trim() || undefined,
    });

    if (result.success) {
      setFeedback({ type: 'success', message: result.message });
      setTimeout(() => {
        onClose();
      }, 1200);
    } else {
      setFeedback({ type: 'error', message: result.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-sky-950/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-sky-200 shadow-2xl w-full max-w-2xl overflow-hidden text-xs text-slate-800 animate-in fade-in duration-150 my-6">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-sky-800 via-sky-700 to-sky-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center text-white shrink-0">
              <Building2 className="w-5 h-5 text-sky-100" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-sm tracking-tight">
                Transport Company Registration & Branding
              </h3>
              <p className="text-[11px] text-sky-100/90 font-medium mt-0.5">
                Official entity details, logo branding, and statutory transporter credentials
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-sky-100 hover:text-white p-1.5 rounded-lg hover:bg-white/10 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body with Enter-Key field navigation */}
        <form
          onSubmit={handleSubmit}
          onKeyDown={(e) => handleFormKeyDown(e)}
          className="p-5 space-y-4 max-h-[80vh] overflow-y-auto"
        >
          {/* Important Security Notice (Master Prompt Section 3) */}
          <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl flex items-start gap-2.5 text-[11px] text-sky-900">
            <Shield className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-heading font-bold block">
                Security & Isolation Notice
              </span>
              <p className="text-slate-600 leading-relaxed font-normal">
                The Company Logo is used solely to identify and brand the registered company across headers, dashboards, and printable reports. It is <strong>NOT</strong> an authentication credential. Company account data remains strictly isolated.
              </p>
            </div>
          </div>

          {/* Feedback message banner */}
          {feedback && (
            <div
              className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-bold ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-rose-50 text-rose-800 border-rose-300'
              }`}
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Company Logo Section */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <span className="font-heading font-bold text-slate-900 uppercase text-[10px] tracking-wider block">
              Company Logo Branding
            </span>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Logo Preview Container */}
              <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-sky-300 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Company Logo Preview"
                    className="w-full h-full object-contain p-1"
                  />
                ) : (
                  <div className="text-center p-2 text-slate-400">
                    <FileImage className="w-6 h-6 mx-auto mb-1 text-sky-400" />
                    <span className="text-[9px] block">No Logo</span>
                  </div>
                )}
              </div>

              {/* Upload Controls */}
              <div className="flex-1 space-y-1.5 text-center sm:text-left">
                <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                  <label className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold text-xs cursor-pointer flex items-center gap-1.5 shadow-xs transition-all font-heading">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload New Logo</span>
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                  {logoUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 rounded-lg font-bold text-xs cursor-pointer flex items-center gap-1 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-slate-500">
                  Recommended: Square or horizontal PNG, JPEG, SVG (Max size: 2 MB). Displayed on portal header, profile, and printable LR reports.
                </p>
              </div>
            </div>
          </div>

          {/* Primary Company Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase text-sky-900 mb-1 font-heading">
                Company Name *
              </label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. MAHA-GUJ TRANSPULSE"
                className="w-full bg-white border border-sky-300 rounded-lg px-3 py-2 font-heading font-extrabold text-sky-950 text-xs focus:outline-sky-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-sky-900 mb-1 font-heading">
                Owner / Administrator Name *
              </label>
              <input
                type="text"
                required
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="e.g. Rajesh Sharma"
                className="w-full bg-white border border-sky-200 rounded-lg px-3 py-2 font-bold text-slate-800 text-xs focus:outline-sky-500"
              />
            </div>
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase text-sky-800 mb-1 font-heading">
                Registered Mobile Number *
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="+91 98220 11988"
                  className="w-full bg-white border border-sky-200 rounded-lg pl-8 pr-3 py-1.5 font-mono font-bold text-slate-900 text-xs focus:outline-sky-500"
                />
                <Phone className="w-3.5 h-3.5 text-sky-500 absolute left-2.5 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-sky-800 mb-1 font-heading">
                Registered Email Address *
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operations@transpulse.com"
                  className="w-full bg-white border border-sky-200 rounded-lg pl-8 pr-3 py-1.5 font-medium text-slate-900 text-xs focus:outline-sky-500"
                />
                <Mail className="w-3.5 h-3.5 text-sky-500 absolute left-2.5 top-2.5" />
              </div>
            </div>
          </div>

          {/* Address, City, State */}
          <div className="space-y-2">
            <div>
              <label className="block text-[10px] font-bold uppercase text-sky-800 mb-1 font-heading">
                Registered Head Office / Depot Address
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Plot 44, Pune-Nashik Highway Freight Terminal, Chakan MIDC"
                  className="w-full bg-white border border-sky-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-sky-500"
                />
                <MapPin className="w-3.5 h-3.5 text-sky-500 absolute left-2.5 top-2.5" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-sky-800 mb-1 font-heading">
                  City
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Pune / Surat"
                  className="w-full bg-white border border-sky-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-sky-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-sky-800 mb-1 font-heading">
                  State
                </label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full bg-white border border-sky-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-sky-500"
                >
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Gujarat">Gujarat</option>
                  <option value="Madhya Pradesh">Madhya Pradesh</option>
                  <option value="Karnataka">Karnataka</option>
                </select>
              </div>
            </div>
          </div>

          {/* Statutory Identifiers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100">
            <div>
              <label className="block text-[10px] font-bold uppercase text-sky-800 mb-1 font-heading">
                GSTIN (Tax Registration)
              </label>
              <input
                type="text"
                value={gstin}
                onChange={(e) => setGstin(e.target.value.toUpperCase())}
                placeholder="27AABCU9603R1ZM"
                className="w-full bg-white border border-sky-200 rounded-lg px-3 py-1.5 text-xs font-mono font-bold uppercase text-slate-900"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-sky-800 mb-1 font-heading">
                Company PAN Number
              </label>
              <input
                type="text"
                value={panNumber}
                onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                placeholder="AABCU9603R"
                className="w-full bg-white border border-sky-200 rounded-lg px-3 py-1.5 text-xs font-mono font-bold uppercase text-slate-900"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-sky-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-700 hover:to-sky-600 rounded-lg shadow-sm shadow-sky-600/25 flex items-center gap-1.5 cursor-pointer font-heading"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Company Profile & Branding</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

