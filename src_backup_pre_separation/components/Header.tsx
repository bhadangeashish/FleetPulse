import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  Building2,
  Pencil,
  Lock,
  Check,
  X,
  User,
  ChevronDown,
  ShieldCheck,
  Smartphone,
  LogOut,
  Building,
  Wifi,
  WifiOff,
  RefreshCw,
  MapPin,
  Calendar,
} from 'lucide-react';
import { useTMS } from '../context/TMSContext';
import { CompanyProfileModal } from './CompanyProfileModal';
import { UserAccountsModal } from './UserAccountsModal';
import { SyncCenterModal } from './common/SyncCenterModal';
import { ModalPortal } from './common/ModalPortal';

export const Header: React.FC = () => {
  const {
    role,
    setRole,
    setActiveTab,
    notifications,
    companyName,
    companyProfile,
    updateCompanyName,
    syncState,
    triggerManualSync,
    currentUser,
    logout,
  } = useTMS();
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [isUserAccountsModalOpen, setIsUserAccountsModalOpen] = useState(false);
  const [isAdminDropdownOpen, setIsAdminDropdownOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState('Maharashtra to Gujarat Operations');
  const [isRouteDropdownOpen, setIsRouteDropdownOpen] = useState(false);
  const [companyInput, setCompanyInput] = useState(companyName);
  const [companyFeedback, setCompanyFeedback] = useState<string | null>(null);
  const [isSyncingNow, setIsSyncingNow] = useState(false);
  const [isSyncCenterModalOpen, setIsSyncCenterModalOpen] = useState(false);

  const handleManualSyncClick = async () => {
    setIsSyncingNow(true);
    try {
      await triggerManualSync();
    } finally {
      setTimeout(() => setIsSyncingNow(false), 800);
    }
  };

  const dropdownRef = useRef<HTMLDivElement>(null);
  const routeDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsAdminDropdownOpen(false);
      }
      if (routeDropdownRef.current && !routeDropdownRef.current.contains(event.target as Node)) {
        setIsRouteDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.length || 3;

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

  const gstinDisplay = companyProfile?.gstin || '27AABCM0123K1Z5';

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-[#DCE8F2] sticky top-0 z-30 px-4 py-2.5 md:px-6 select-none shadow-xs">
      <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-3">
        {/* Left: Operational Route Selector Dropdown matching Showcase Screen 1 */}
        <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
          <div className="relative" ref={routeDropdownRef}>
            <button
              type="button"
              onClick={() => setIsRouteDropdownOpen(!isRouteDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-[#DCE8F2] text-[#384959] hover:bg-[#F0F4F8] transition-all shadow-2xs cursor-pointer text-xs font-heading font-extrabold"
            >
              <div className="w-5 h-5 rounded-lg bg-[#E8F2FA] text-[#384959] flex items-center justify-center shrink-0">
                <MapPin className="w-3.5 h-3.5 text-[#384959]" />
              </div>
              <span className="truncate max-w-[220px] sm:max-w-[320px]">{selectedRoute}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#6A89A7]" />
            </button>

            {isRouteDropdownOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-72 bg-white rounded-xl shadow-xl border border-[#DCE8F2] p-1.5 z-50 text-xs">
                <div className="px-2.5 py-1.5 text-[10px] font-bold text-[#6A89A7] uppercase font-heading">
                  Active Corridor Operations
                </div>
                {[
                  'Maharashtra to Gujarat Operations',
                  'Pune APMC ⇄ Surat / Vapi Corridor',
                  'Nashik ⇄ Ahmedabad Direct Freight',
                  'Mumbai Wadala ⇄ Vadodara Express',
                ].map((route) => (
                  <button
                    key={route}
                    type="button"
                    onClick={() => {
                      setSelectedRoute(route);
                      setIsRouteDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left cursor-pointer transition-colors ${
                      selectedRoute === route
                        ? 'bg-[#E8F2FA] text-[#384959] font-bold'
                        : 'text-slate-600 hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <span>{route}</span>
                    {selectedRoute === route && <Check className="w-3.5 h-3.5 text-[#384959]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div
            onClick={() => role === 'admin' && setIsCompanyModalOpen(true)}
            className={`hidden md:flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-[#F0F4F8] border border-[#DCE8F2] text-slate-800 transition-colors ${
              role === 'admin' ? 'cursor-pointer hover:bg-[#E4EEF8]' : ''
            }`}
            title="Transport Company profile & settings"
          >
            <div className="w-5 h-5 rounded-lg bg-[#BDDDFC] text-[#384959] flex items-center justify-center shrink-0">
              {companyProfile?.logoUrl ? (
                <img
                  src={companyProfile.logoUrl}
                  alt={companyName}
                  className="w-full h-full object-contain p-0.5 rounded-lg"
                />
              ) : (
                <Building2 className="w-3 h-3" />
              )}
            </div>
            <span className="font-heading font-extrabold text-[11px] text-[#384959] truncate max-w-[180px]">
              {companyName}
            </span>
          </div>
        </div>

        {/* Right: Date Widget + Sync Status + Notification Bell + User Profile Avatar Pill matching Showcase Screen 1 */}
        <div className="flex items-center gap-2.5 shrink-0 relative" ref={dropdownRef}>
          {/* Exact Date Widget Pill matching Showcase: "Fri, 06 Nov 2026" */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-[#DCE8F2] text-[#384959] shadow-2xs font-heading font-bold text-xs">
            <Calendar className="w-3.5 h-3.5 text-[#6A89A7]" />
            <span>
              {new Date().toLocaleDateString('en-GB', {
                weekday: 'short',
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>

          {/* Master Offline / Online Sync Status Pill */}
          <button
            type="button"
            onClick={() => setIsSyncCenterModalOpen(true)}
            title="Open FleetPulse Offline & Synchronization Center"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95 ${
              syncState.isOnline
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100 animate-pulse'
            }`}
          >
            {isSyncingNow ? (
              <RefreshCw className="w-3.5 h-3.5 text-[#384959] animate-spin" />
            ) : syncState.isOnline ? (
              <Wifi className="w-3.5 h-3.5 text-emerald-700" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-amber-700" />
            )}
            <span className="hidden md:inline">
              {isSyncingNow
                ? 'Syncing...'
                : syncState.isOnline
                ? syncState.pendingCount > 0
                  ? `${syncState.pendingCount} Queued`
                  : 'Cloud Synced'
                : `Offline (${syncState.pendingCount})`}
            </span>
          </button>

          {/* Notification Bell with red counter badge matching Showcase: "3" */}
          <div className="relative">
            <button
              className="p-2 rounded-xl bg-white hover:bg-[#F0F4F8] text-slate-600 border border-[#DCE8F2] transition-all cursor-pointer relative shadow-2xs group active:scale-95"
              title={`${unreadCount} notifications`}
            >
              <Bell className="w-4 h-4 text-slate-600 transition-transform duration-200 group-hover:scale-110" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-mono font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* User Profile Avatar Circle matching Showcase: "AS" in Deep Slate */}
          <button
            type="button"
            onClick={() => setIsAdminDropdownOpen(!isAdminDropdownOpen)}
            className="flex items-center gap-2 p-0.5 rounded-full bg-white hover:bg-[#F0F4F8] border border-[#DCE8F2] transition-all shadow-2xs cursor-pointer focus:outline-hidden active:scale-[0.98]"
            title="User Account & Role Menu"
          >
            <div className="w-8 h-8 rounded-full bg-[#384959] text-white flex items-center justify-center font-heading font-extrabold text-xs shadow-xs">
              {currentUser?.fullName
                ? currentUser.fullName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()
                : 'AS'}
            </div>
            <ChevronDown className="w-3 h-3 text-slate-400 mr-1" />
          </button>

          {/* Admin Profile Dropdown Menu */}
          {isAdminDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-[#DCE8F2] p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-xs">
              <div className="px-3 py-2.5 border-b border-slate-100 mb-1">
                <span className="font-heading font-extrabold text-[#384959] block">
                  {currentUser?.fullName || 'Ashish Bhadange'}
                </span>
                <span className="text-[11px] text-[#6A89A7] font-medium block">
                  {currentUser?.email || 'admin@mahagujtranspulse.com'}
                </span>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                    {role === 'admin' ? 'Super Admin' : 'Staff'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#BDDDFC]/50 text-[#384959] text-[10px] font-bold">
                    Full Access
                  </span>
                </div>
              </div>

              <div className="space-y-0.5">
                <button
                  onClick={() => {
                    setIsCompanyModalOpen(true);
                    setIsAdminDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-[#F0F4F8] transition-colors cursor-pointer text-left"
                >
                  <Building2 className="w-4 h-4 text-[#6A89A7]" />
                  <span className="font-medium">Company Profile & Logo</span>
                </button>

                <button
                  onClick={() => {
                    setIsUserAccountsModalOpen(true);
                    setIsAdminDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-[#F0F4F8] transition-colors cursor-pointer text-left"
                >
                  <ShieldCheck className="w-4 h-4 text-[#6A89A7]" />
                  <span className="font-medium">Staff Accounts & KYC</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('driver_portal');
                    setIsAdminDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-[#F0F4F8] transition-colors cursor-pointer text-left"
                >
                  <Smartphone className="w-4 h-4 text-[#6A89A7]" />
                  <span className="font-medium">Open Driver Mobile PWA</span>
                </button>
              </div>

              <div className="pt-1 mt-1 border-t border-slate-100 space-y-0.5">
                <button
                  onClick={() => {
                    setRole(role === 'admin' ? 'operator' : 'admin');
                    setIsAdminDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer text-left text-[11px]"
                >
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Switch Role: Active ({role.toUpperCase()})</span>
                </button>

                <button
                  onClick={() => {
                    setIsAdminDropdownOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-left text-xs font-bold"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-500" />
                  <span>Sign Out of FleetPulse</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Edit Company Name Modal */}
      <ModalPortal isOpen={isEditingCompany} onClose={() => setIsEditingCompany(false)}>
        <div className="bg-white rounded-2xl border border-[#DCE8F2] shadow-2xl w-full max-w-md p-5 space-y-4 text-xs my-auto">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="font-heading font-bold text-sm text-[#384959]">
              Rename Transport Company
            </h3>
            <button
              onClick={() => setIsEditingCompany(false)}
              className="text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {companyFeedback && (
            <div className="p-2.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-medium">
              {companyFeedback}
            </div>
          )}

          <form onSubmit={handleSaveCompany} className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-700 mb-1 font-heading">
                Company Name
              </label>
              <input
                type="text"
                required
                value={companyInput}
                onChange={(e) => setCompanyInput(e.target.value)}
                className="w-full bg-[#F0F4F8] border border-[#DCE8F2] rounded-lg px-3 py-2 text-xs font-bold text-[#384959] focus:outline-[#88BDF2]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditingCompany(false)}
                className="px-3.5 py-1.5 font-bold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 font-bold text-white bg-[#384959] hover:bg-[#2C3A47] rounded-lg shadow-sm cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Name</span>
              </button>
            </div>
          </form>
        </div>
      </ModalPortal>

      {/* Transport Company Registration & Logo Branding Modal */}
      <CompanyProfileModal
        isOpen={isCompanyModalOpen}
        onClose={() => setIsCompanyModalOpen(false)}
      />

      {/* User Accounts & Document Verification Modal */}
      <UserAccountsModal
        isOpen={isUserAccountsModalOpen}
        onClose={() => setIsUserAccountsModalOpen(false)}
      />

      {/* Unified FleetPulse Sync & Offline Center Modal */}
      <SyncCenterModal
        isOpen={isSyncCenterModalOpen}
        onClose={() => setIsSyncCenterModalOpen(false)}
      />
    </header>
  );
};
