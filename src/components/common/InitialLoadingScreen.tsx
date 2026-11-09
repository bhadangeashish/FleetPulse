import React from 'react';
import { LottieAnimation } from './LottieAnimation';
import { Truck } from 'lucide-react';

export const InitialLoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-50 bg-[#F3F7FB] flex flex-col items-center justify-center p-6 text-center select-none animate-in fade-in duration-300">
      <div className="space-y-4 max-w-sm flex flex-col items-center">
        <LottieAnimation
          animationPath="/assets/animations/truck-loading.json"
          className="w-36 h-28"
          fallbackIcon={<Truck className="w-16 h-16 text-[#384959] animate-pulse" />}
          ariaLabel="FleetPulse Loading"
        />
        <div className="space-y-1.5">
          <h2 className="font-heading font-black text-lg text-[#384959] tracking-tight">
            FleetPulse TMS
          </h2>
          <p className="text-xs text-[#6A89A7] font-medium">
            Syncing interstate fleet telemetry & dispatch corridors...
          </p>
        </div>
      </div>
    </div>
  );
};

