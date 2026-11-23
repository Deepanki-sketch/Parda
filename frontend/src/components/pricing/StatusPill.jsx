import React from 'react';

export default function StatusPill({ type = 'green', text = '2 Spots Available', className = '' }) {
  const isRed = type === 'red' || text.toLowerCase().includes('booked') || text.toLowerCase().includes('sold');
  const isAmber = type === 'amber' || text.toLowerCase().includes('custom') || text.toLowerCase().includes('enterprise');

  let bgClasses = 'bg-[#EBF7EE] text-[#1E6B37] border-[#B7E4C7]/70';
  let dotColor = 'bg-[#22C55E]';

  if (isRed) {
    bgClasses = 'bg-[#FDF2F2] text-[#9E2A2B] border-[#F8B4B4]/70';
    dotColor = 'bg-[#EF4444]';
  } else if (isAmber) {
    bgClasses = 'bg-[#FEF9EE] text-[#8C600B] border-[#FBE3A4]/70';
    dotColor = 'bg-[#F59E0B]';
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium tracking-tight border shadow-xs transition-transform duration-200 hover:scale-105 select-none ${bgClasses} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor} animate-pulse`} aria-hidden="true" />
      <span>{text}</span>
    </span>
  );
}
