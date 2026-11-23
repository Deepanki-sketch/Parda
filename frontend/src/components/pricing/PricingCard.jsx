import React, { useState, useRef } from 'react';
import StatusPill from './StatusPill';
import TestimonialChip from './TestimonialChip';
import FeatureList from './FeatureList';
import { Check, ArrowRight, Sparkles } from 'lucide-react';

export default function PricingCard({
  id,
  planLabel = 'ZK PROVIDER NODE',
  title = 'Clinical Prover Node',
  description = 'Off-chain Circom 2.1 prover license, HL7 FHIR R4 connector, and client-side AES-GCM credential vault.',
  monthlyPrice = 1490,
  yearlyPrice = 1192,
  billing = 'monthly',
  statusPill = { type: 'green', text: '2 Spots Available' },
  testimonial = {},
  features = [],
  isDark = false,
  isSelected = false,
  isDimmed = false,
  onSelectPlan,
  isHero = false,
  className = ''
}) {
  const cardRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0, active: false });
  const [magneticOffset, setMagneticOffset] = useState({ x: 0, y: 0 });

  const activePrice = billing === 'yearly' ? yearlyPrice : monthlyPrice;

  // Mouse spotlight tracking
  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      active: true
    });
  };

  const handleMouseLeave = () => {
    setMousePos((prev) => ({ ...prev, active: false }));
    setMagneticOffset({ x: 0, y: 0 });
  };

  // Button Magnetic Hover
  const handleButtonMouseMove = (e) => {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setMagneticOffset({ x: x * 0.25, y: y * 0.25 });
  };

  const handleButtonMouseLeave = () => {
    setMagneticOffset({ x: 0, y: 0 });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={() => onSelectPlan && onSelectPlan(id)}
      role="region"
      aria-label={`${title} Plan`}
      aria-selected={isSelected}
      className={`group relative rounded-[26px] p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 cursor-pointer select-none overflow-hidden ${
        isDark
          ? 'bg-[#0B1410] text-[#F3EFE5] border border-white/10'
          : 'bg-[#FFFFFF] text-[#1F1E1A] border border-[#E5E0D5] shadow-xs'
      } ${
        isSelected
          ? 'ring-2 ring-[#FFD400] shadow-[0_0_32px_rgba(255,212,0,0.22)] -translate-y-1.5'
          : 'hover:-translate-y-1.5 hover:shadow-xl'
      } ${
        isDimmed ? 'opacity-55 scale-[0.985] filter blur-[0.2px]' : 'opacity-100 scale-100'
      } ${className}`}
    >
      {/* 1. Dynamic Cursor Spotlight Gradient */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-300"
        style={{
          opacity: mousePos.active ? 1 : 0,
          background: isDark
            ? `radial-gradient(450px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255, 212, 0, 0.08), transparent 70%)`
            : `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255, 212, 0, 0.12), transparent 70%)`
        }}
      />

      {/* 2. Dark Hero Top-Left Ambient Glow */}
      {isDark && (
        <div
          className="absolute -top-24 -left-24 w-72 h-72 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(255, 212, 0, 0.12) 0%, rgba(36, 62, 53, 0.4) 45%, transparent 70%)',
            filter: 'blur(32px)'
          }}
        />
      )}

      {/* 3. Animated Selection Badge */}
      <div
        className={`absolute top-4 right-4 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-tight bg-[#FFD400] text-[#11110E] shadow-md transition-all duration-300 ${
          isSelected
            ? 'scale-100 opacity-100 translate-y-0'
            : 'scale-75 opacity-0 -translate-y-2 pointer-events-none'
        }`}
      >
        <Check className="w-3.5 h-3.5 stroke-[3]" />
        <span>Selected Plan</span>
      </div>

      {/* Card Content Top Section */}
      <div className="relative z-10 space-y-5">
        {/* Header Row: Label & Status Pill */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {isHero && <Sparkles className="w-4 h-4 text-[#FFD400] animate-spin-slow" />}
            <span
              className={`text-[11px] font-mono font-bold tracking-wider uppercase ${
                isDark ? 'text-[#9CAB8F]' : 'text-[#73716A]'
              }`}
            >
              {planLabel}
            </span>
          </div>
          <StatusPill type={statusPill.type} text={statusPill.text} />
        </div>

        {/* Plan Title & Subtitle (Two-Tone Pattern) */}
        <div>
          <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
            {title}
          </h3>
          <p
            className={`text-xs mt-1 leading-relaxed ${
              isDark ? 'text-[#D5CDBE]' : 'text-[#73716A]'
            }`}
          >
            {description}
          </p>
        </div>

        {/* Pricing Display with Animated Price Interpolation */}
        <div className="flex items-baseline gap-1.5 pt-1">
          <span className="text-sm font-semibold tracking-tight text-[#9CAB8F]">$</span>
          <span className="text-4xl sm:text-5xl font-extrabold tracking-tight font-sans transition-all duration-300">
            {activePrice.toLocaleString()}
          </span>
          <span
            className={`text-xs font-medium tracking-tight ${
              isDark ? 'text-[#9CAB8F]' : 'text-[#73716A]'
            }`}
          >
            /mo
          </span>
          {billing === 'yearly' && (
            <span className="ml-2 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              billed annually
            </span>
          )}
        </div>

        {/* Primary CTA with Accent Yellow & Magnetic Dark Icon Chip */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelectPlan && onSelectPlan(id);
          }}
          onMouseMove={handleButtonMouseMove}
          onMouseLeave={handleButtonMouseLeave}
          style={{
            transform: `translate(${magneticOffset.x}px, ${magneticOffset.y}px)`
          }}
          className={`w-full flex items-center justify-between px-5 py-3.5 rounded-2xl font-bold text-xs tracking-tight transition-all duration-200 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#FFD400] shadow-sm select-none ${
            isSelected
              ? 'bg-[#1F1E1A] text-white border border-[#FFD400] shadow-[0_0_16px_rgba(255,212,0,0.3)]'
              : 'bg-[#FFD400] hover:bg-[#FFE033] text-[#11110E]'
          }`}
        >
          <span className="text-sm tracking-tight font-extrabold">
            {isSelected ? 'Selected' : 'Select Plan'}
          </span>
          {/* Dark Icon Chip */}
          <div
            className={`w-7 h-7 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:translate-x-0.5 ${
              isSelected ? 'bg-[#FFD400] text-[#11110E]' : 'bg-[#11110E] text-[#FFD400]'
            }`}
          >
            {isSelected ? (
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            ) : (
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
            )}
          </div>
        </button>

        {/* Testimonial Chip */}
        {testimonial && testimonial.name && (
          <TestimonialChip isDark={isDark} {...testimonial} />
        )}
      </div>

      {/* Feature List (Two-Column) */}
      <div className="relative z-10 mt-6">
        <FeatureList features={features} isDark={isDark} />
      </div>
    </div>
  );
}
