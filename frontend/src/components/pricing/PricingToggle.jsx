import React from 'react';

export default function PricingToggle({ billing = 'monthly', onChange, className = '' }) {
  const isYearly = billing === 'yearly';

  return (
    <div className={`flex flex-col items-center gap-2 select-none ${className}`}>
      <div
        role="tablist"
        aria-label="Billing frequency"
        className="relative flex items-center p-1 bg-[#E4E1DB] dark:bg-[#12231C] rounded-full border border-[#D5CDBE] dark:border-white/10 shadow-inner"
      >
        {/* Animated Sliding Thumb Pill */}
        <div
          className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full bg-white dark:bg-[#243E35] shadow-xs transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none ${
            isYearly ? 'translate-x-[calc(100%+8px)]' : 'translate-x-0'
          }`}
        />

        {/* Monthly Option */}
        <button
          type="button"
          role="tab"
          aria-selected={!isYearly}
          onClick={() => onChange('monthly')}
          className={`relative z-10 px-5 py-2 text-xs font-semibold tracking-tight rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD400] ${
            !isYearly
              ? 'text-[#1F1E1A] dark:text-[#F3EFE5]'
              : 'text-[#73716A] dark:text-[#9CAB8F] hover:text-[#1F1E1A] dark:hover:text-white'
          }`}
        >
          Monthly billing
        </button>

        {/* Yearly Option */}
        <button
          type="button"
          role="tab"
          aria-selected={isYearly}
          onClick={() => onChange('yearly')}
          className={`relative z-10 flex items-center gap-1.5 px-5 py-2 text-xs font-semibold tracking-tight rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD400] ${
            isYearly
              ? 'text-[#1F1E1A] dark:text-[#F3EFE5]'
              : 'text-[#73716A] dark:text-[#9CAB8F] hover:text-[#1F1E1A] dark:hover:text-white'
          }`}
        >
          <span>Annual billing</span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-tight bg-[#FFD400] text-[#11110E] shadow-2xs animate-pulse">
            Save 20%
          </span>
        </button>
      </div>

      <span className="inline-flex items-center gap-1.5 text-[11px] text-[#73716A] dark:text-[#9CAB8F] font-mono">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span>{isYearly ? '2 months free included with annual commitment' : 'Flexible monthly commitments, cancel anytime'}</span>
      </span>
    </div>
  );
}
