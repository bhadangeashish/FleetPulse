import React from 'react';
import { LottieAnimation } from './LottieAnimation';
import { PackageOpen } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div className={`p-8 text-center flex flex-col items-center justify-center space-y-3 bg-white/60 border border-[#DCE8F2] rounded-2xl ${className}`}>
      <LottieAnimation
        animationPath="/assets/animations/empty-logistics.json"
        className="w-28 h-24"
        fallbackIcon={<PackageOpen className="w-12 h-12 text-[#6A89A7]" />}
        ariaLabel="No records found"
      />
      <div className="max-w-sm space-y-1">
        <h4 className="font-heading font-black text-sm text-[#1E293B]">{title}</h4>
        <p className="text-xs text-[#6A89A7] font-medium leading-relaxed">{description}</p>
      </div>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-2 px-4 py-2 bg-[#384959] hover:bg-[#2C3A47] text-white font-heading font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

