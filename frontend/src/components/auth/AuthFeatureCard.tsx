import React from 'react';

interface AuthFeatureCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  className?: string;
}

export const AuthFeatureCard: React.FC<AuthFeatureCardProps> = ({
  icon,
  title,
  subtitle,
  className = '',
}) => {
  return (
    <div
      className={`bg-white/90 hover:bg-white backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-[#DCE8F2] shadow-xs hover:shadow-md hover:border-[#88BDF2] transition-all duration-200 flex flex-col items-center text-center gap-2 group select-none hover:-translate-y-0.5 cursor-default ${className}`}
    >
      {/* Soft Blue Icon Container */}
      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#BDDDFC]/50 text-[#384959] flex items-center justify-center transition-colors duration-200 group-hover:bg-[#88BDF2] group-hover:text-white shadow-2xs shrink-0">
        {icon}
      </div>

      {/* 2-Line Bold Heading */}
      <div className="flex flex-col items-center leading-tight">
        <span className="text-xs sm:text-[13px] font-heading font-extrabold text-[#384959]">
          {title}
        </span>
        <span className="text-xs sm:text-[13px] font-heading font-extrabold text-[#384959]">
          {subtitle}
        </span>
      </div>
    </div>
  );
};

