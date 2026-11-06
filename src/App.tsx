import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TMSProvider, useTMS } from './context/TMSContext';
import { LoginView } from './components/auth/LoginView';
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
import { InitialLoadingScreen } from './components/common/InitialLoadingScreen';

const AppContent: React.FC = () => {
  const { activeTab, isAuthenticated, role } = useTMS();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Brief initial telemetry and corridor sync splash
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  // When not authenticated, render the high-fidelity login page
  if (!isAuthenticated) {
    return (
      <>
        <AnimatePresence>
          {isLoading && <InitialLoadingScreen key="initial-loader" />}
        </AnimatePresence>
        <LoginView />
      </>
    );
  }

  // When authenticated as Driver, launch the dedicated Driver Mobile PWA view directly
  if (role === 'driver') {
    return (
      <div className="h-screen w-screen overflow-y-auto bg-morning-canvas flex justify-center">
        <DriverPWAView />
      </div>
    );
  }

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
    <>
      <AnimatePresence>
        {isLoading && <InitialLoadingScreen key="initial-loader" />}
      </AnimatePresence>

      <div className="h-screen w-screen overflow-hidden flex flex-col lg:flex-row bg-[#F0F4F8] font-body text-slate-800">
        {/* Full-Height Left Stormy Navy Sidebar */}
        <ModuleTabs />

        {/* Main Content Area Canvas */}
        <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-morning-canvas">
          {/* Top Header inside Canvas */}
          <Header />

          {/* Scrollable Main Content View with Smooth Page Transition */}
          <main className="flex-1 overflow-y-auto px-4 py-3 md:px-6 md:py-4">
            <div className="max-w-[1440px] mx-auto pb-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                >
                  {renderActiveView()}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default function App() {
  return (
    <TMSProvider>
      <AppContent />
    </TMSProvider>
  );
}
