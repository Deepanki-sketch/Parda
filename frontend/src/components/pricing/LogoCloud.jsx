import React, { useState } from 'react';

export default function LogoCloud({ className = '' }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const brands = [
    {
      name: 'St. Jude Medical',
      role: 'Clinical Pilot',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm6 12H6v-1c0-2 4-3.1 6-3.1s6 1.1 6 3.1v1z" />
        </svg>
      )
    },
    {
      name: 'HealthShield Mutual',
      role: 'Underwriting Escrow',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
        </svg>
      )
    },
    {
      name: 'Ethereum Foundation',
      role: 'ZK Grants & EVM',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 784 1277" fill="currentColor">
          <path d="M392.07 0L383.5 29.11V873.74L392.07 882.29L784.13 650.54L392.07 0Z" />
          <path d="M392.07 0L0 650.54L392.07 882.29V472.33V0Z" />
          <path d="M392.07 956.17L387.24 962.06V1268.46L392.07 1276.99L784.37 724.89L392.07 956.17Z" />
          <path d="M392.07 1276.99V956.17L0 724.89L392.07 1276.99Z" />
        </svg>
      )
    },
    {
      name: 'Circom / iden3',
      role: 'zk-SNARK Engine',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      )
    },
    {
      name: 'HL7 International',
      role: 'FHIR R4 Protocol',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
        </svg>
      )
    },
    {
      name: 'Supabase Security',
      role: 'Encrypted Persistence',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21.362 9.354H12V.396a.396.396 0 0 0-.716-.233L.32 14.07a.8.8 0 0 0 .618 1.296H12v8.958a.396.396 0 0 0 .716.233l10.964-13.907a.8.8 0 0 0-.618-1.296h-1.7z" />
        </svg>
      )
    }
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="text-center">
        <span className="text-[11px] font-mono font-bold tracking-wider text-[#73716A] dark:text-[#9CAB8F] uppercase">
          TRUSTED BY HEALTHCARE INSTITUTIONS & CRYPTOGRAPHIC ALLIANCES
        </span>
      </div>

      <div className="rounded-2xl p-6 sm:p-8 bg-white/70 dark:bg-[#12231C]/60 border border-[#E5E0D5] dark:border-white/10 backdrop-blur-md">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 sm:gap-8 items-center justify-items-center">
          {brands.map((b, idx) => {
            const isHovered = hoveredIdx === idx;
            const isAnyHovered = hoveredIdx !== null;
            const isDimmed = isAnyHovered && !isHovered;

            return (
              <div
                key={idx}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-300 cursor-pointer select-none group ${
                  isHovered
                    ? 'scale-105 opacity-100 text-[#11110E] dark:text-[#FFD400]'
                    : isDimmed
                    ? 'opacity-30 filter grayscale text-[#73716A]'
                    : 'opacity-70 filter grayscale hover:grayscale-0 text-[#57544A] dark:text-[#C7B99F]'
                }`}
              >
                <div className="transition-transform duration-300 group-hover:-translate-y-0.5">
                  {b.icon}
                </div>
                <div className="text-center">
                  <div className="text-xs font-bold tracking-tight leading-tight">
                    {b.name}
                  </div>
                  <div className="text-[10px] font-mono text-[#8E8B82] dark:text-[#9CAB8F] leading-tight mt-0.5">
                    {b.role}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
