import React, { useState } from 'react';
import {
  CalendarDays,
  Truck,
  Users,
  ShieldCheck,
  Smartphone,
  CreditCard,
  ChevronRight,
  Menu,
  X,
  MapPin,
  Shield,
  Layers,
  Check,
  Building,
  TrendingUp,
  LayoutDashboard,
  FileText,
  History,
  Sparkles,
} from 'lucide-react';
import { useTMS } from '../context/TMSContext';

export const ModuleTabs: React.FC = () => {
  const { activeTab, setActiveTab, role, trips, vehicles, partyPayments, userPermissions } = useTMS();
  // Hamburger drawer state: defaults to false on mobile, but once opened stays open while selecting tabs!
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPinnedOpen, setIsPinnedOpen] = useState(false);

  // Badge counts
  const pendingTripsCount = trips.filter((t) => t.status === 'pending_approval').length;
  const expiringDocsCount = vehicles.reduce(
    (acc, v) => acc + v.documents.filter((d) => d.status === 'expiring_soon' || d.status === 'expired').length,
    0
  );
  const pendingPaymentsCount = partyPayments.filter((p) => p.status === 'pending').length;

  // Navigation Items
  const canSeeFinancials = role === 'admin' || userPermissions.canViewFinancials;

  const navItems = [
    {
      id: 'dashboard',
      label: 'Operations Dashboard',
      sublabel: 'Live Fleet Pulse & KPIs',
      icon: LayoutDashboard,
    },
    {
      id: 'trips',
      label: 'Daily Trips',
      sublabel: 'Fruits & Return Loads',
      icon: CalendarDays,
      badge: pendingTripsCount > 0 ? `${pendingTripsCount} Pending` : undefined,
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    },
    {
      id: 'vehicles',
      label: 'Vehicles & ODO Reminders',
      sublabel: 'Docs, Permits & Capacity',
      icon: Truck,
      badge: expiringDocsCount > 0 ? `${expiringDocsCount} Expiring` : undefined,
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
    },
    {
      id: 'drivers',
      label: 'Drivers & WhatsApp Link',
      sublabel: 'Licence, Aadhaar, PAN KYC',
      icon: Users,
    },
    ...(canSeeFinancials
      ? [
          {
            id: 'payments',
            label: 'Parties, Docs & Payments',
            sublabel: 'Party Option, Aadhaar, PAN & LR',
            icon: Building,
            badge: pendingPaymentsCount > 0 ? `${pendingPaymentsCount} Due` : undefined,
            badgeColor: 'bg-sky-100 text-sky-800 border-sky-300',
          },
          {
            id: 'reports',
            label: 'Dedicated Reports Hub',
            sublabel: '9 Reports & Multi-City Filters',
            icon: FileText,
          },
          {
            id: 'analytics',
            label: 'Return Load Analytics',
            sublabel: 'Monthly, Half-Year & Yearly',
            icon: TrendingUp,
          },
        ]
      : []),
    ...(role === 'admin'
      ? [
          {
            id: 'permissions',
            label: 'User Rights & Permissions',
            sublabel: 'Admin RBAC Control',
            icon: ShieldCheck,
          },
          {
            id: 'audit',
            label: 'System Audit Logs',
            sublabel: 'Action & Security Trail',
            icon: History,
          },
        ]
      : []),
    {
      id: 'driver_portal',
      label: 'Driver Mobile Portal',
      sublabel: 'IndexedDB Offline Trips & Loads',
      icon: Smartphone,
    },
  ];

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    // User requirement: Do NOT close the hamburger menu or tabs when selecting another tab!
    // The menu stays open so users can smoothly navigate and switch between tabs.
  };

  return (
    <>
      {/* 
        Mobile Always-Visible Sticky Bar:
        1. Quick Horizontal Tab Ribbon: Tabs ALWAYS appear on mobile/tablet.
        2. Hamburger Menu Button: Expands the full detailed drawer.
      */}
      <div className="lg:hidden sticky top-[60px] z-30 bg-white/95 backdrop-blur-md border-b border-sky-200 shadow-xs">
        {/* Top summary row with hamburger & active tab preview */}
        <div className="px-3 py-2 flex items-center justify-between gap-2 border-b border-sky-100/80">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`p-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isMobileMenuOpen
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200'
              }`}
              title={isMobileMenuOpen ? 'Hide Full Menu Drawer' : 'Show Full Navigation Menu'}
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              <span className="font-heading">{isMobileMenuOpen ? 'Close Menu' : 'All Tabs'}</span>
            </button>

            <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
              <span>Active:</span>
              <span className="font-heading font-extrabold text-sky-950">
                {navItems.find((n) => n.id === activeTab)?.label}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200 uppercase font-mono">
              {role}
            </span>
          </div>
        </div>

        {/* ALWAYS APPEAR: Scrollable Horizontal Tabs Ribbon for Mobile / Tablet */}
        <div className="flex items-center gap-1.5 px-2 py-2 overflow-x-auto no-scrollbar scroll-smooth">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-heading font-bold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-sky-600 to-sky-500 text-white shadow-xs shadow-sky-600/30'
                    : 'bg-slate-50 hover:bg-sky-50 text-slate-700 hover:text-sky-900 border border-slate-200 hover:border-sky-200'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-sky-600'}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-white/25 text-white' : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {item.badge.split(' ')[0]}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 
        Left Navigation Sidebar:
        - Desktop: Always pinned on the left side (w-64 xl:w-72)
        - Mobile/Tablet: Displays when isMobileMenuOpen is true or isPinnedOpen is true.
        - CRITICAL REQUIREMENT: Selecting any tab does NOT close this panel!
      */}
      <aside
        className={`
          ${isMobileMenuOpen || isPinnedOpen ? 'block' : 'hidden'} lg:block
          w-full lg:w-64 xl:w-72
          bg-white/95 backdrop-blur-md
          border-b lg:border-b-0 lg:border-r border-sky-200
          lg:sticky lg:top-[60px] lg:self-start lg:h-[calc(100vh-60px)]
          p-4 overflow-y-auto z-20 shrink-0 shadow-xs
        `}
      >
        {/* Navigation Section Header with Pin & User-Friendly Status */}
        <div className="pb-3 mb-3 border-b border-sky-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-sky-100 text-sky-700 flex items-center justify-center">
                <Layers className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-black uppercase text-sky-950 tracking-wider font-heading">
                Management Modules
              </span>
            </div>

            {/* Mobile Close Button for explicit dismissal */}
            <div className="lg:hidden flex items-center gap-1">
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                title="Dismiss Menu Panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <p className="text-[11px] text-slate-500 font-medium leading-tight">
              Switch modules freely; navigation stays open continuously.
            </p>
          </div>
        </div>

        {/* Headings List (Persistent & user-friendly) */}
        <nav className="space-y-1.5" aria-label="Sidebar Navigation">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`w-full text-left p-3 rounded-xl font-bold transition-all flex items-center justify-between group cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-sky-600 to-sky-500 text-white shadow-sm shadow-sky-600/30'
                    : 'text-slate-700 hover:text-sky-950 hover:bg-sky-50/80 border border-transparent hover:border-sky-100'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      isActive ? 'bg-white/20 text-white' : 'bg-sky-50 text-sky-700 group-hover:bg-sky-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-heading text-xs font-bold block truncate leading-tight flex items-center gap-1.5">
                      {item.label}
                      {isActive && (
                        <span className="inline-flex items-center text-[10px] bg-white/20 text-white font-mono px-1.5 py-0.2 rounded">
                          Active
                        </span>
                      )}
                    </span>
                    <span
                      className={`text-[10px] font-normal block truncate mt-0.5 ${
                        isActive ? 'text-sky-100' : 'text-slate-500'
                      }`}
                    >
                      {item.sublabel}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 ml-2">
                  {item.badge && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border font-mono ${
                        isActive ? 'bg-white/25 text-white border-white/30' : item.badgeColor
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {isActive ? (
                    <Check className="w-4 h-4 text-white shrink-0" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-700 transition-transform group-hover:translate-x-0.5" />
                  )}
                </div>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer Details Card */}
        <div className="mt-6 pt-4 border-t border-sky-100 space-y-3">
          <div className="p-3 bg-gradient-to-br from-sky-50 to-sky-100/50 rounded-xl border border-sky-200/70 text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 text-sky-950 font-heading font-bold text-[11px]">
              <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0" />
              <span>Primary Transport Corridor</span>
            </div>
            <div className="text-[11px] text-sky-900 font-mono font-semibold">
              MH ⇄ GJ Daily Corridor
            </div>
            <div className="text-[10px] text-slate-500 leading-relaxed">
              Interstate Freight & Fleet Operations
            </div>
          </div>

          <div className="px-3 py-2 bg-slate-50 rounded-lg border border-slate-200/70 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-medium">Logged Role:</span>
            <span className="font-heading font-extrabold text-sky-900 capitalize flex items-center gap-1">
              <Shield className="w-3 h-3 text-sky-600" />
              {role === 'admin' ? 'Admin' : role === 'operator' ? 'User' : 'Driver'}
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
