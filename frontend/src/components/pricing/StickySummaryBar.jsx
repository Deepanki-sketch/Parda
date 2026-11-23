import React, { useState } from 'react';
import { ArrowRight, Check, X, Shield, Sparkles } from 'lucide-react';

export default function StickySummaryBar({
  selectedPlan,
  billing = 'monthly',
  onDeselect,
  onContinue
}) {
  const [magneticOffset, setMagneticOffset] = useState({ x: 0, y: 0 });

  if (!selectedPlan) {
    return null;
  }

  const price = billing === 'yearly' ? selectedPlan.yearlyPrice : selectedPlan.monthlyPrice;

  const handleMouseMove = (e) => {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setMagneticOffset({ x: x * 0.25, y: y * 0.25 });
  };

  const handleMouseLeave = () => {
    setMagneticOffset({ x: 0, y: 0 });
  };

  return (
    <aside
      aria-label="Selected plan summary"
      className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-4xl transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
    >
      <div className="relative rounded-2xl p-4 sm:p-5 bg-[#0B1410]/95 text-[#F3EFE5] border-2 border-[#FFD400] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7),0_0_24px_rgba(255,212,0,0.25)] backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left: Plan Summary Details */}
        <div className="flex items-center gap-3.5 w-full sm:w-auto">
          <div className="w-10 h-10 rounded-xl bg-[#243E35] border border-[#FFD400]/40 flex items-center justify-center text-[#FFD400] shrink-0 shadow-inner">
            <Shield className="w-5 h-5" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold tracking-wider text-[#FFD400] uppercase">
                {selectedPlan.planLabel}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                Active Selection
              </span>
            </div>
            <div className="text-base sm:text-lg font-extrabold tracking-tight truncate text-white">
              {selectedPlan.title}
            </div>
          </div>
        </div>

        {/* Right: Pricing & Continue CTA */}
        <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-white/10">
          <div className="text-left sm:text-right">
            <div className="text-[11px] font-mono text-[#9CAB8F] leading-none">
              {billing === 'yearly' ? 'Annual commitment' : 'Monthly subscription'}
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl sm:text-2xl font-black text-white font-sans">
                ${price.toLocaleString()}
              </span>
              <span className="text-xs text-[#9CAB8F]">/mo</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onContinue}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              style={{
                transform: `translate(${magneticOffset.x}px, ${magneticOffset.y}px)`
              }}
              className="flex items-center gap-2.5 px-5 py-3 rounded-xl font-extrabold text-xs tracking-tight bg-[#FFD400] hover:bg-[#FFE033] text-[#11110E] transition-all duration-200 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#FFD400] shadow-md select-none shrink-0"
            >
              <span>Continue to Enclave Deployment</span>
              <div className="w-5 h-5 rounded-lg bg-[#11110E] text-[#FFD400] flex items-center justify-center">
                <ArrowRight className="w-3 h-3 stroke-[2.5]" />
              </div>
            </button>

            {/* Clear Selection Button */}
            <button
              type="button"
              onClick={onDeselect}
              aria-label="Clear selected plan"
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-[#AEB8AA] hover:text-white flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
