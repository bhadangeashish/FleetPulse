import React from 'react';
import { Truck } from 'lucide-react';
import { useTMS } from '../../context/TMSContext';

interface FleetPulseLogoProps {
  variant?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const FleetPulseLogo: React.FC<FleetPulseLogoProps> = ({
  variant = 'horizontal',
  size = 'md',
  className = '',
}) => {
  const { companyProfile, companyName } = useTMS();

  const isVertical = variant === 'vertical';

  const iconSizes = {
    sm: 'w-8 h-8 rounded-xl',
    md: 'w-11 h-11 rounded-2xl',
    lg: 'w-14 h-14 rounded-2xl',
  };

  const truckSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const titleSizes = {
    sm: 'text-base',
    md: 'text-xl sm:text-2xl',
    lg: 'text-2xl sm:text-3xl',
  };

  const subtitleSizes = {
    sm: 'text-[10px]',
    md: 'text-xs sm:text-sm',
    lg: 'text-sm',
  };

  return (
    <div
      className={`flex ${
        isVertical ? 'flex-col items-center text-center' : 'items-center text-left'
      } gap-3 select-none ${className}`}
    >
      {/* Brand Icon Squircle */}
      <div
        className={`${iconSizes[size]} bg-[#6A89A7] text-white flex items-center justify-center shadow-md shrink-0 border border-[#BDDDFC]/40`}
      >
        {companyProfile?.logoUrl ? (
          <img
            src={companyProfile.logoUrl}
            alt={companyName || 'FleetPulse TMS'}
            className="w-full h-full object-contain p-1 rounded-xl"
          />
        ) : (
          <Truck className={`${truckSizes[size]} text-white`} />
        )}
      </div>

      {/* Brand Typography */}
      <div>
        <h1
          className={`font-heading font-black ${titleSizes[size]} text-[#384959] tracking-tight leading-tight`}
        >
          FleetPulse TMS
        </h1>
        <p className={`font-semibold ${subtitleSizes[size]} text-[#6A89A7] tracking-normal`}>
          Freight & Fleet Operations
        </p>
      </div>
    </div>
  );
};

