import React, { useState } from 'react';
import {
  CalendarDays,
  Truck,
  Users,
  Smartphone,
  CreditCard,
  Building,
  Repeat,
  LayoutDashboard,
  FileText,
  Settings,
  Menu,
  X,
  History,
  ShieldCheck,
} from 'lucide-react';
import { useTMS } from '../context/TMSContext';

export const ModuleTabs: React.FC = () => {
  const { activeTab, setActiveTab, role, trips, vehicles, partyPayments } = useTMS();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Badge counts
  const pendingTripsCount = trips.filter((t) => t.status === 'pending_approval').length;
  const expiringDocsCount = vehicles.reduce(
    (acc, v) => acc + v.documents.filter((d) => d.status === 'expiring_soon' || d.status === 'expired').length,
    0
  );
  const pendingPaymentsCount = partyPayments.filter((p) => p.status === 'pending').length;

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'trips',
      label: 'Daily Trips',
      icon: CalendarDays,
      badge: pendingTripsCount > 0 ? `${pendingTripsCount}` : undefined,
    },
    {
      id: 'vehicles',
      label: 'Vehicles & ODO',
      icon: Truck,
      badge: expiringDocsCount > 0 ? `${expiringDocsCount}` : undefined,
    },
    {
      id: 'drivers',
      label: 'Drivers',
      icon: Users,
    },
    {
      id: 'parties',
      label: 'Parties',
      icon: Building,
    },
    {
      id: 'payments',
      label: 'Payments',
      icon: CreditCard,
      badge: pendingPaymentsCount > 0 ? `${pendingPaymentsCount}` : undefined,
    },
    {
      id: 'analytics',
      label: 'Return Load',
      icon: Repeat,
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: FileText,
    },
    {
      id: 'permissions',
      label: 'Settings',
      icon: Settings,
    },
  ];

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Top Bar with Hamburger */}
      <div className="lg:hidden bg-[#384959] text-white px-4 py-3 flex items-center justify-between border-b border-[#4A6075] shrink-0 z-30">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#6A89A7]/40 border border-[#BDDDFC]/30 flex items-center justify-center text-white">
            <Truck className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-heading font-extrabold text-sm text-white tracking-tight block leading-tight">
              FleetPulse TMS
            </span>
            <span className="text-[10px] text-[#BDDDFC]/80 font-medium block leading-tight">
              Freight & Fleet Operations
            </span>
          </div>
        </div>

        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-1.5 rounded-lg bg-[#4A6075] text-[#BDDDFC] hover:text-white"
          aria-label="Toggle Navigation"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Full-Height Stormy Navy Sidebar */}
      <aside
        className={`
          ${isMobileMenuOpen ? 'fixed inset-0 z-50 flex flex-col' : 'hidden'} lg:flex lg:flex-col
          w-64 xl:w-68
          bg-[#384959] text-white
          h-full shrink-0
          border-r border-[#2C3A47]
          relative overflow-hidden select-none
        `}
      >
        {/* Brand Header */}
        <div className="p-5 pb-4 flex items-center justify-between border-b border-[#4A6075]/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#6A89A7]/40 border border-[#BDDDFC]/30 flex items-center justify-center text-white shadow-inner">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-heading font-black text-white text-base tracking-tight leading-tight">
                FleetPulse TMS
              </h1>
              <span className="text-[11px] text-[#BDDDFC]/80 font-medium block leading-tight">
                Freight & Fleet Operations
              </span>
            </div>
          </div>

          {isMobileMenuOpen && (
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden p-1 rounded-lg text-[#BDDDFC] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Items List */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto no-scrollbar relative z-10" aria-label="Main Navigation">
          {navItems.map((item) => {
            const isActive =
              activeTab === item.id ||
              (item.id === 'parties' && activeTab === 'payments') ||
              (item.id === 'permissions' && (activeTab === 'permissions' || activeTab === 'audit'));
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer group active:scale-[0.98] ${
                  isActive
                    ? 'bg-[#6A89A7] text-white shadow-xs font-bold'
                    : 'text-[#BDDDFC]/70 hover:text-white hover:bg-white/10 hover:translate-x-0.5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-white' : 'text-[#BDDDFC]/70 group-hover:text-white'}`} />
                  <span className="font-heading">{item.label}</span>
                </div>

                {item.badge && (
                  <span className="text-[10px] font-mono font-bold bg-[#BDDDFC]/20 text-white px-2 py-0.5 rounded-full transition-transform duration-200 group-hover:scale-105">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Additional Driver Mobile Portal Link */}
          <div className="pt-3 mt-2 border-t border-[#4A6075]/40">
            <button
              onClick={() => handleTabClick('driver_portal')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer group active:scale-[0.98] ${
                activeTab === 'driver_portal'
                  ? 'bg-[#6A89A7] text-white shadow-xs font-bold'
                  : 'text-[#BDDDFC]/70 hover:text-white hover:bg-white/10 hover:translate-x-0.5'
              }`}
            >
              <div className="flex items-center gap-3">
                <Smartphone className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${activeTab === 'driver_portal' ? 'text-white' : 'text-[#BDDDFC]/70 group-hover:text-white'}`} />
                <span className="font-heading">Driver Mobile PWA</span>
              </div>
            </button>
          </div>
        </nav>

        {/* Mountain & Pine Trees Atmosphere Silhouette (Exact Match with Image 2) */}
        <div className="relative pt-6 pb-4 px-4 text-center mt-auto pointer-events-none z-0">
          <svg
            className="w-full h-16 text-[#2C3A47] opacity-60 mb-2 overflow-visible"
            viewBox="0 0 200 60"
            fill="currentColor"
            preserveAspectRatio="none"
          >
            {/* Mountain Layers */}
            <path d="M0,60 L20,38 L45,50 L75,28 L110,48 L140,22 L175,44 L200,32 L200,60 Z" opacity="0.4" />
            <path d="M0,60 L30,46 L60,36 L90,52 L125,34 L160,48 L200,38 L200,60 Z" opacity="0.6" />
            {/* Pine Trees Silhouettes */}
            <polygon points="15,48 18,40 21,48" opacity="0.9" />
            <polygon points="25,52 28,42 31,52" opacity="0.9" />
            <polygon points="35,46 38,38 41,46" opacity="0.9" />
            <polygon points="80,50 83,40 86,50" opacity="0.9" />
            <polygon points="135,48 138,38 141,48" opacity="0.9" />
            <polygon points="170,52 173,42 176,52" opacity="0.9" />
            <polygon points="180,48 183,39 186,48" opacity="0.9" />
          </svg>

          <span className="text-[11px] font-mono text-[#BDDDFC]/50 block">
            v1.0.0
          </span>
        </div>
      </aside>
    </>
  );
};
