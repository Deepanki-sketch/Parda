import React, { useState } from 'react';

export default function FeatureList({ features = [], isDark = false, className = '' }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-2 pt-4 border-t ${isDark ? 'border-white/10' : 'border-[#E5E0D5]'} ${className}`}>
      {features.map((feat, idx) => {
        const isHovered = hoveredIdx === idx;
        return (
          <div
            key={idx}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
            className={`relative flex items-center gap-2.5 py-1.5 px-2 rounded-lg transition-all duration-200 cursor-default select-none group ${
              isHovered
                ? isDark
                  ? 'bg-white/[0.07]'
                  : 'bg-black/[0.04]'
                : 'bg-transparent'
            }`}
          >
            {/* Sliding subtle background pill indicator */}
            <div
              className={`absolute inset-0 rounded-lg transition-opacity duration-200 pointer-events-none ${
                isHovered ? 'opacity-100' : 'opacity-0'
              } ${isDark ? 'bg-gradient-to-r from-[#FFD400]/10 to-transparent' : 'bg-gradient-to-r from-[#FFD400]/15 to-transparent'}`}
            />

            {/* Small dot bullet */}
            <div
              className={`w-1.5 h-1.5 rounded-full shrink-0 transition-all duration-200 ${
                isHovered
                  ? 'bg-[#FFD400] scale-125 shadow-[0_0_8px_#FFD400]'
                  : isDark
                  ? 'bg-[#9CAB8F]/60'
                  : 'bg-[#9CAB8F]'
              }`}
              aria-hidden="true"
            />

            {/* Feature Text */}
            <span
              className={`text-[12px] font-medium tracking-tight transition-colors duration-200 truncate ${
                isHovered
                  ? isDark
                    ? 'text-[#FFFFFF]'
                    : 'text-[#11110E]'
                  : isDark
                  ? 'text-[#C7B99F]'
                  : 'text-[#57544A]'
              }`}
            >
              {feat}
            </span>
          </div>
        );
      })}
    </div>
  );
}
