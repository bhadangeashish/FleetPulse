import React, { useState } from 'react';
import {
  Truck,
  Shield,
  User,
  Smartphone,
  Bell,
  ArrowRightLeft,
  Sparkles,
  Pencil,
  Lock,
  Check,
  X,
  Building2,
  Users,
} from 'lucide-react';
import { useTMS } from '../context/TMSContext';
import { CompanyProfileModal } from './CompanyProfileModal';
import { UserAccountsModal } from './UserAccountsModal';

export const Header: React.FC = () => {
  const {
    role,
    setRole,
    notifications,
    setActiveTab,
    activeTab,
    companyName,
    companyProfile,
    updateCompanyName,
  } = useTMS();
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [isUserAccountsModalOpen, setIsUserAccountsModalOpen] = useState(false);
  const [companyInput, setCompanyInput] = useState(companyName);
  const [companyFeedback, setCompanyFeedback] = useState<string | null>(null);

  const unreadCount = notifications.length;

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    const result = updateCompanyName(companyInput);
    if (result.success) {
      setIsEditingCompany(false);
      setCompanyFeedback(null);
    } else {
      setCompanyFeedback(result.message);
    }
  };

  return (
    <header className="bg-gradient-to-r from-sky-800 via-sky-700 to-sky-600 text-white border-b border-sky-500/30 sticky top-0 z-40 px-4 py-3 select-none shadow-md shadow-sky-900/10">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Brand & Route Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center text-white shadow-inner shrink-0 overflow-hidden">
            {companyProfile?.logoUrl ? (
              <img
                src={companyProfile.logoUrl}
                alt={companyName}
                className="w-full h-full object-contain p-0.5 bg-white/20"
              />
            ) : (
              <Truck className="w-5 h-5 text-sky-100" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-heading font-extrabold text-lg tracking-tight text-white flex items-center gap-1.5">
                {companyName}
              </span>

              {/* Admin Company Registration & Logo Button */}
              {role === 'admin' ? (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setIsCompanyModalOpen(true)}
                    className="bg-white/15 hover:bg-white/25 text-sky-100 hover:text-white px-2 py-0.5 rounded-md text-[11px] font-bold flex items-center gap-1 transition-all border border-white/20 cursor-pointer"
                    title="Transport Company Registration & Logo Branding"
                  >
                    <Building2 className="w-3 h-3 text-sky-200" />
                    <span>Company & Logo</span>
                  </button>
                  <button
                    onClick={() => {
                      setCompanyInput(companyName);
                      setIsEditingCompany(true);
                    }}
                    className="bg-black/20 hover:bg-black/30 text-sky-200 hover:text-white px-1.5 py-0.5 rounded-md text-[10px] font-medium flex items-center gap-0.5 transition-all border border-white/10 cursor-pointer"
                    title="Quick rename"
                  >
                    <Pencil className="w-2.5 h-2.5 text-sky-300" />
                  </button>
                </div>
              ) : (
                <span
                  className="text-sky-200/70 text-[10px] flex items-center gap-1 bg-black/15 px-2 py-0.5 rounded border border-white/10"
                  title="Company Name can only be changed by Admin"
                >
                  <Lock className="w-2.5 h-2.5" />
                  <span>Admin Locked</span>
                </span>
              )}

              <span className="bg-sky-400/25 text-sky-100 border border-sky-300/40 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
                MH ⇄ Interstate
              </span>
            </div>
            <p className="text-xs text-sky-100/85 font-medium">
              Maharashtra to Gujarat & Interstate Fruit Transport & Backhaul Return Goods System
            </p>
          </div>
        </div>

        {/* Center/Right: 3 Portal Switcher (Admin / User / Driver) */}
        <div className="flex items-center gap-2">
          <div className="bg-sky-900/50 backdrop-blur-md p-1 rounded-xl border border-sky-500/40 flex items-center gap-1 text-xs">
            {/* Admin Portal Button */}
            <button
              onClick={() => {
                setRole('admin');
                if (activeTab === 'driver_portal') setActiveTab('dashboard');
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                role === 'admin'
                  ? 'bg-white text-sky-900 shadow-sm'
                  : 'text-sky-100 hover:text-white hover:bg-white/10'
              }`}
            >
              <Shield className={`w-3.5 h-3.5 ${role === 'admin' ? 'text-sky-600' : 'text-sky-200'}`} />
              <span>Admin Portal</span>
            </button>

            {/* User Portal Button */}
            <button
              onClick={() => {
                setRole('operator');
                if (activeTab === 'driver_portal' || activeTab === 'permissions' || activeTab === 'audit') {
                  setActiveTab('trips');
                }
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                role === 'operator'
                  ? 'bg-white text-sky-900 shadow-sm'
                  : 'text-sky-100 hover:text-white hover:bg-white/10'
              }`}
            >
              <User className={`w-3.5 h-3.5 ${role === 'operator' ? 'text-sky-600' : 'text-sky-200'}`} />
              <span>User Portal</span>
            </button>

            {/* Driver Portal Button */}
            <button
              onClick={() => {
                setRole('driver');
                setActiveTab('driver_portal');
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                role === 'driver'
                  ? 'bg-sky-400 text-sky-950 shadow-sm'
                  : 'text-sky-100 hover:text-white hover:bg-white/10'
              }`}
            >
              <Smartphone className={`w-3.5 h-3.5 ${role === 'driver' ? 'text-sky-950' : 'text-sky-200'}`} />
              <span>Driver Portal</span>
            </button>
          </div>

          {/* User KYC Hub (Admin Only) */}
          {role === 'admin' && (
            <button
              onClick={() => setIsUserAccountsModalOpen(true)}
              className="p-2 bg-sky-900/50 hover:bg-sky-900/80 border border-sky-500/40 rounded-xl text-sky-100 hover:text-white relative transition-colors cursor-pointer"
              title="User Accounts & KYC Verification Hub (Master Prompt Section 4)"
            >
              <Users className="w-4 h-4 text-sky-200" />
            </button>
          )}

          {/* Quick Notification Pill */}
          <button
            onClick={() => {
              if (notifications.length > 0) {
                alert(
                  notifications
                    .map((n, i) => `${i + 1}. [${n.title}] ${n.message}`)
                    .join('\n\n')
                );
              } else {
                alert('All vehicle documents, ODO reminders, and party payments are up to date!');
              }
            }}
            className="p-2 bg-sky-900/50 hover:bg-sky-900/80 border border-sky-500/40 rounded-xl text-sky-100 hover:text-white relative transition-colors cursor-pointer"
            title="View Reminders & Alerts"
          >
            <Bell className="w-4 h-4 text-sky-200" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-900 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-sky-800 shadow-xs">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Transport Company Registration & Logo Branding Modal (Section 3) */}
      <CompanyProfileModal
        isOpen={isCompanyModalOpen}
        onClose={() => setIsCompanyModalOpen(false)}
      />

      {/* User Accounts & Document Verification Modal (Section 4) */}
      <UserAccountsModal
        isOpen={isUserAccountsModalOpen}
        onClose={() => setIsUserAccountsModalOpen(false)}
      />

      {/* Quick Company Name Edit Modal */}
      {isEditingCompany && role === 'admin' && (
        <div className="fixed inset-0 z-50 bg-sky-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-sky-200 shadow-2xl w-full max-w-md p-5 space-y-4 text-xs text-slate-800">
            <div className="flex items-center justify-between border-b border-sky-100 pb-2">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-sky-600" />
                <h3 className="font-heading font-extrabold text-sm text-sky-950">
                  Edit Company Name (Admin Exclusive)
                </h3>
              </div>
              <button
                onClick={() => setIsEditingCompany(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCompany} className="space-y-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-sky-900 mb-1 font-heading">
                  Company / Transporter Brand Name
                </label>
                <input
                  type="text"
                  required
                  value={companyInput}
                  onChange={(e) => setCompanyInput(e.target.value)}
                  placeholder="e.g. MAHA-GUJ TRANSPULSE or MAHALAXMI FREIGHT CARRIERS"
                  className="w-full bg-white border border-sky-300 rounded-lg px-3 py-2 font-heading font-bold text-sky-950 text-sm focus:outline-sky-500"
                />
              </div>

              {companyFeedback && (
                <div className="p-2 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs">
                  {companyFeedback}
                </div>
              )}

              <p className="text-[11px] text-slate-500">
                This updated name will reflect across the entire portal, LR delivery slips, and printable invoices. Only accounts with Admin privileges can modify this.
              </p>

              <div className="flex justify-end gap-2 pt-2 border-t border-sky-100">
                <button
                  type="button"
                  onClick={() => setIsEditingCompany(false)}
                  className="px-4 py-2 font-bold text-sky-800 bg-sky-50 rounded-lg hover:bg-sky-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold text-white bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-700 hover:to-sky-600 rounded-lg shadow-sm shadow-sky-600/20 cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Update Company Name</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
