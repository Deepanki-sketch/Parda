import React from 'react';

export default function TestimonialChip({
  avatarUrl,
  initials = 'AT',
  name = 'Dr. Aris Thorne',
  role = 'CMO, St. Jude Medical',
  badge = 'Verified Partner',
  quote = 'Parda eliminated claim denial latency without ever exposing patient vitals.',
  isDark = false
}) {
  return (
    <div
      className={`group relative rounded-2xl p-3.5 transition-all duration-300 border ${
        isDark
          ? 'bg-white/[0.04] hover:bg-white/[0.07] border-white/10 hover:border-white/20 backdrop-blur-md text-[#F3EFE5]'
          : 'bg-[#F9F8F6] hover:bg-white border-[#E5E0D5] hover:border-[#D5CDBE] text-[#1F1E1A] shadow-xs hover:shadow-sm'
      }`}
    >
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2.5 min-w-0">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={name}
              className="w-8 h-8 rounded-full object-cover border border-black/10 shrink-0"
              loading="lazy"
            />
          ) : (
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 select-none ${
                isDark ? 'bg-[#243E35] text-[#9CAB8F] border border-[#9CAB8F]/30' : 'bg-[#EFEEEC] text-[#243E35] border border-[#D5CDBE]'
              }`}
            >
              {initials}
            </div>
          )}
          <div className="truncate">
            <div className="text-xs font-semibold tracking-tight truncate leading-tight">
              {name}
            </div>
            <div className={`text-[11px] truncate leading-tight ${isDark ? 'text-[#9CAB8F]' : 'text-[#73716A]'}`}>
              {role}
            </div>
          </div>
        </div>

        {/* Partner / Google verified badge */}
        <div
          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium tracking-tight shrink-0 select-none ${
            isDark ? 'bg-white/10 text-[#F3EFE5] border border-white/15' : 'bg-white text-[#43413C] border border-[#E5E0D5] shadow-2xs'
          }`}
        >
          {/* Subtle Google 'G' icon */}
          <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.4 7.33 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.6 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span>{badge}</span>
        </div>
      </div>

      <p className={`text-[12px] italic leading-snug line-clamp-2 ${isDark ? 'text-[#D5CDBE]' : 'text-[#57544A]'}`}>
        "{quote}"
      </p>
    </div>
  );
}
