import React from 'react';
import { TMSProvider, useTMS } from './context/TMSContext';
import { Header } from './components/Header';
import { ModuleTabs } from './components/ModuleTabs';
import { AdminDashboardView } from './components/AdminDashboardView';
import { TripsPipelineView } from './components/TripsPipelineView';
import { VehiclesView } from './components/VehiclesView';
import { DriversView } from './components/DriversView';
import { FinancialReportsView } from './components/FinancialReportsView';
import { AdvancedReportsView } from './components/AdvancedReportsView';
import { TenantRBACView } from './components/TenantRBACView';
import { DriverPWAView } from './components/DriverPWAView';
import { ReturnLoadAnalyticsView } from './components/ReturnLoadAnalyticsView';
import { AuditLogView } from './components/AuditLogView';

const AppContent: React.FC = () => {
  const { activeTab, companyName } = useTMS();

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AdminDashboardView />;
      case 'trips':
        return <TripsPipelineView />;
      case 'vehicles':
        return <VehiclesView />;
      case 'drivers':
        return <DriversView />;
      case 'payments':
        return <FinancialReportsView />;
      case 'reports':
        return <AdvancedReportsView />;
      case 'analytics':
        return <ReturnLoadAnalyticsView />;
      case 'permissions':
        return <TenantRBACView />;
      case 'audit':
        return <AuditLogView />;
      case 'driver_portal':
        return <DriverPWAView />;
      default:
        return <AdminDashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50/70 via-sky-50/40 to-slate-50 flex flex-col font-body text-slate-800">
      {/* Top Application Sky Blue Header */}
      <Header />

      {/* 2-Column Responsive Body: Left Sidebar Headings + Right Main Content Canvas */}
      <div className="flex-1 flex flex-col lg:flex-row min-w-0">
        {/* Left Side Navigation (All Headings shifted to Left) */}
        <ModuleTabs />

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-6 min-w-0 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {renderActiveView()}
          </div>
        </main>
      </div>

      {/* Simple Professional Light Blue Footer */}
      <footer className="bg-white/80 backdrop-blur-xs border-t border-sky-100 py-3.5 px-4 text-center text-xs text-sky-800/80">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-heading font-medium">
            <strong className="text-sky-900 font-extrabold">{companyName}</strong> • Daily Fruit & Return Goods Management System
          </span>
          <span className="font-mono text-[11px] text-sky-700 font-semibold bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
            Transport & Logistics Operations
          </span>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <TMSProvider>
      <AppContent />
    </TMSProvider>
  );
}
