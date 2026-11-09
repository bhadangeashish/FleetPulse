import React, { useState } from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  Truck,
  Users,
  Package,
  Fuel,
  Wrench,
  CreditCard,
  BarChart3,
  FileText,
  Settings,
  ChevronRight,
  Menu,
  X,
  Smartphone,
} from 'lucide-react';
import { useTMS } from '../context/TMSContext';

export const ModuleTabs: React.FC = () => {
  const { activeTab, setActiveTab, role, trips, vehicles, partyPayments } = useTMS();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Dynamic badge counts
  const pendingTripsCount = trips.filter((t) => t.status === 'pending_approval').length;
  const expiringDocsCount = vehicles.reduce(
    (acc, v) => acc + v.documents.filter((d) => d.status === 'expiring_soon' || d.status === 'expired').length,
    0
  );
  const pendingPaymentsCount = partyPayments.filter((p) => p.status === 'pending').length;

  // Exact 11 Sidebar Items matching FleetPulse TMS Showcase Reference
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
      label: 'Vehicles',
      icon: Truck,
      badge: expiringDocsCount > 0 ? `${expiringDocsCount}` : undefined,
    },
    {
      id: 'drivers',
      label: 'Drivers',
      icon: Users,
    },
    {
      id: 'deliveries',
      label: 'Deliveries',
      icon: Package,
    },
    {
      id: 'fuel',
      label: 'Fuel & Expenses',
      icon: Fuel,
    },
    {
      id: 'service',
      label: 'Service & Repair',
      icon: Wrench,
    },
    {
      id: 'payments',
      label: 'Payments',
      icon: CreditCard,
      badge: pendingPaymentsCount > 0 ? `${pendingPaymentsCount}` : undefined,
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: BarChart3,
    },
    {
      id: 'documents',
      label: 'Documents',
      icon: FileText,
    },
    {
      id: 'permissions',
      label: 'Masters & Settings',
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
      <div className="lg:hidden bg-[#384959] text-white px-4 py-3 flex items-center justify-between border-b border-[#2C3A47] shrink-0 z-30">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#6A89A7]/40 border border-[#BDDDFC]/40 flex items-center justify-center text-white shadow-xs">
            <Truck className="w-4 h-4 text-[#BDDDFC]" />
          </div>
          <div>
            <span className="font-heading font-extrabold text-sm text-white tracking-tight block leading-tight">
              FleetPulse TMS
            </span>
            <span className="text-[10px] text-[#BDDDFC] font-medium block leading-tight">
              Transport Management System
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

      {/* Full-Height Deep Slate Sidebar matching Showcase Screen 1 */}
      <aside
        className={`
          ${isMobileMenuOpen ? 'fixed inset-0 z-50 flex flex-col' : 'hidden'} lg:flex lg:flex-col
          w-60 xl:w-64
          bg-[#384959] text-white
          h-full shrink-0
          border-r border-[#2C3A47]
          relative overflow-hidden select-none
        `}
      >
        {/* Brand Header */}
        <div className="p-4 pb-3 flex items-center justify-between border-b border-[#2C3A47]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#6A89A7]/40 border border-[#BDDDFC]/30 flex items-center justify-center text-white shadow-inner shrink-0">
              <Truck className="w-4 h-4 text-[#BDDDFC]" />
            </div>
            <div>
              <h1 className="font-heading font-black text-white text-sm tracking-tight leading-tight">
                FleetPulse TMS
              </h1>
              <span className="text-[10px] text-[#BDDDFC] font-medium block leading-tight">
                Transport Management System
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

        {/* Navigation Items List (Exact 11 Items with ChevronRight) */}
        <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto no-scrollbar relative z-10" aria-label="Main Navigation">
          {navItems.map((item) => {
            const isActive =
              activeTab === item.id ||
              (item.id === 'deliveries' && activeTab === 'trips') ||
              (item.id === 'fuel' && activeTab === 'vehicles') ||
              (item.id === 'service' && activeTab === 'vehicles') ||
              (item.id === 'documents' && activeTab === 'vehicles') ||
              (item.id === 'permissions' && (activeTab === 'permissions' || activeTab === 'audit'));
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer group active:scale-[0.98] ${
                  isActive
                    ? 'bg-[#2C3A47] text-white shadow-xs font-bold border border-[#BDDDFC]/20'
                    : 'text-[#BDDDFC]/75 hover:text-white hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 transition-transform duration-150 group-hover:scale-105 ${isActive ? 'text-[#BDDDFC]' : 'text-[#BDDDFC]/75 group-hover:text-white'}`} />
                  <span className="font-heading text-xs tracking-tight">{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {item.badge && (
                    <span className="text-[9px] font-mono font-bold bg-[#BDDDFC]/20 text-white px-1.5 py-0.2 rounded-full">
                      {item.badge}
                    </span>
                  )}
                  <ChevronRight className={`w-3 h-3 text-[#BDDDFC]/40 group-hover:text-white transition-colors ${isActive ? 'text-white' : ''}`} />
                </div>
              </button>
            );
          })}

          {/* Quick Access to Driver Mobile Portal View */}
          <div className="pt-2 mt-2 border-t border-[#2C3A47]">
            <button
              onClick={() => handleTabClick('driver_portal')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer group active:scale-[0.98] ${
                activeTab === 'driver_portal'
                  ? 'bg-[#2C3A47] text-white shadow-xs font-bold border border-[#BDDDFC]/20'
                  : 'text-[#BDDDFC]/75 hover:text-white hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Smartphone className={`w-4 h-4 ${activeTab === 'driver_portal' ? 'text-[#BDDDFC]' : 'text-[#BDDDFC]/75 group-hover:text-white'}`} />
                <span className="font-heading text-xs tracking-tight">Driver Portal (PWA)</span>
              </div>
              <ChevronRight className="w-3 h-3 text-[#BDDDFC]/40 group-hover:text-white" />
            </button>
          </div>
        </nav>

        {/* Subtle Footer branding */}
        <div className="p-3 border-t border-[#2C3A47] flex items-center justify-between text-[10px] text-[#BDDDFC]/60 font-mono">
          <span>FleetPulse TMS</span>
          <span>v2.4 Online</span>
        </div>
      </aside>
    </>
  );
};
