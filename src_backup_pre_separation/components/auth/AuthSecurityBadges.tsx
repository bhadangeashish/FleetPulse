import React from 'react';
import { Shield, CheckCircle2, Users } from 'lucide-react';

interface AuthSecurityBadgesProps {
  className?: string;
}

export const AuthSecurityBadges: React.FC<AuthSecurityBadgesProps> = ({ className = '' }) => {
  return (
    <div
      className={`grid grid-cols-3 gap-2 pt-3.5 border-t border-[#DCE8F2] text-center select-none ${className}`}
    >
      {/* Indicator 1: Secure Login */}
      <div className="flex flex-col items-center">
        <Shield className="w-4 h-4 text-[#6A89A7] mb-1" />
        <span className="text-[10px] font-bold text-[#384959] leading-tight">
          Secure Login
        </span>
      </div>

      {/* Indicator 2: Email Verification */}
      <div className="flex flex-col items-center border-x border-[#DCE8F2] px-1">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 mb-1" />
        <span className="text-[10px] font-bold text-[#384959] leading-tight">
          Email Verification
        </span>
      </div>

      {/* Indicator 3: Role Based Access */}
      <div className="flex flex-col items-center">
        <Users className="w-4 h-4 text-[#6A89A7] mb-1" />
        <span className="text-[10px] font-bold text-[#384959] leading-tight">
          Role Based Access
        </span>
        <span className="text-[8px] text-[#6A89A7] leading-none mt-0.5">
          (Admin / User / Driver)
        </span>
      </div>
    </div>
  );
};

