import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown } from 'lucide-react';
import { useTMS } from '../../context/TMSContext';
import { AppLanguage } from '../../types/tms';

interface LanguageSelectorProps {
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ className = '' }) => {
  const { appLanguage, setAppLanguage } = useTMS();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const languageLabels: Record<AppLanguage, string> = {
    en: 'English',
    mr: 'मराठी',
    hi: 'हिंदी',
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/95 hover:bg-white border border-[#DCE8F2] shadow-2xs text-xs font-bold text-[#384959] transition-all cursor-pointer backdrop-blur-md active:scale-95"
      >
        <Globe className="w-3.5 h-3.5 text-[#6A89A7]" />
        <span>{languageLabels[appLanguage] || 'English'}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[#6A89A7] transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-32 bg-white rounded-xl shadow-lg border border-[#DCE8F2] p-1.5 z-50 text-xs font-bold animate-in fade-in duration-150">
          {(['en', 'mr', 'hi'] as AppLanguage[]).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => {
                setAppLanguage(lang);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                appLanguage === lang
                  ? 'bg-[#BDDDFC]/50 text-[#384959]'
                  : 'hover:bg-[#F3F7FB] text-[#6A89A7]'
              }`}
            >
              {languageLabels[lang]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

