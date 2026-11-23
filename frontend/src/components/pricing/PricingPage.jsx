import React, { useState, useEffect, useRef } from 'react';
import PricingToggle from './PricingToggle';
import PricingCard from './PricingCard';
import ProjectsShowcase from './ProjectsShowcase';
import LogoCloud from './LogoCloud';
import StickySummaryBar from './StickySummaryBar';
import StatusPill from './StatusPill';
import TestimonialChip from './TestimonialChip';
import FeatureList from './FeatureList';
import { Shield, Sparkles, ArrowRight, Check, Lock, ChevronRight, Mail, MessageSquare } from 'lucide-react';

export default function PricingPage({ onBackToApp }) {
  const [billing, setBilling] = useState('monthly');
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [activeSection, setActiveSection] = useState('plans');
  const [showDeploymentSuccessModal, setShowDeploymentSuccessModal] = useState(false);

  // Section references for IntersectionObserver
  const plansRef = useRef(null);
  const showcaseRef = useRef(null);
  const partnersRef = useRef(null);

  // Section Observer for the animated sliding nav indicator
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (entry.target === plansRef.current) setActiveSection('plans');
            else if (entry.target === showcaseRef.current) setActiveSection('showcase');
            else if (entry.target === partnersRef.current) setActiveSection('partners');
          }
        });
      },
      { threshold: 0.3 }
    );

    if (plansRef.current) observer.observe(plansRef.current);
    if (showcaseRef.current) observer.observe(showcaseRef.current);
    if (partnersRef.current) observer.observe(partnersRef.current);

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (sec) => {
    setActiveSection(sec);
    if (sec === 'plans' && plansRef.current) {
      plansRef.current.scrollIntoView({ behavior: 'smooth' });
    } else if (sec === 'showcase' && showcaseRef.current) {
      showcaseRef.current.scrollIntoView({ behavior: 'smooth' });
    } else if (sec === 'partners' && partnersRef.current) {
      partnersRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const plans = [
    {
      id: 'prover',
      planLabel: 'ZK PROVIDER NODE',
      title: 'Clinical Prover Node',
      description: 'Off-chain Circom 2.1 prover license, HL7 FHIR R4 connector, and client-side AES-GCM credential vault.',
      monthlyPrice: 1490,
      yearlyPrice: 1192,
      isDark: false,
      isHero: false,
      statusPill: { type: 'green', text: '2 Spots Available' },
      testimonial: {
        avatarUrl: null,
        initials: 'AT',
        name: 'Dr. Aris Thorne',
        role: 'CMO, St. Jude Medical',
        badge: 'Verified Health Node',
        quote: 'Parda eliminated claim denial latency without ever exposing patient vitals to the payer.'
      },
      features: [
        'Circom 2.1 Groth16 Prover',
        'Client-side AES-256 Vault',
        'HL7 FHIR R4 Ingestion',
        '10k ZK Claims / month',
        'Sepolia & Mainnet Anchor',
        '99.9% Prover SLA Uptime',
        'Restful & GraphQL API',
        'Direct Engineering Slack'
      ]
    },
    {
      id: 'escrow',
      planLabel: 'HEALTHCARE ENCLAVE',
      title: 'Insurer Mutual Escrow',
      description: 'Complete zero-knowledge claims adjudication engine with automated smart contract escrow disbursement.',
      monthlyPrice: 4850,
      yearlyPrice: 3880,
      isDark: true,
      isHero: true,
      statusPill: { type: 'red', text: 'All slots booked' },
      testimonial: {
        avatarUrl: null,
        initials: 'ER',
        name: 'Elena Rostova',
        role: 'VP Underwriting, HealthShield',
        badge: 'Top Underwriter',
        quote: 'Claims settle in under 12 seconds with cryptographic mathematical proof. Zero fraud, zero leaks.'
      },
      features: [
        'Instant Escrow Auto-Payout',
        'Nullifier Replay Shield',
        'Unlimited ZK Verifications',
        'Dedicated AWS Nitro Enclave',
        'Actuarial Solvency Dashboard',
        'Custom Merkle Tree Schemas',
        'Multi-Sig Treasury Controls',
        '24/7 Dedicated Crypto Engineer'
      ]
    }
  ];

  const widePlan = {
    id: 'consortium',
    planLabel: 'FEDERATED CONSORTIUM',
    title: 'National Health Sovereignty Grid',
    description: 'Designed for health ministries, hospital networks, and reinsurance syndicates managing multi-million claim verification volumes with private cryptographic nullifiers.',
    monthlyPrice: 12500,
    yearlyPrice: 10000,
    isDark: false,
    statusPill: { type: 'amber', text: 'Custom Infrastructure' },
    testimonial: {
      avatarUrl: null,
      initials: 'MV',
      name: 'Marcus Vance',
      role: 'Dir. Cryptographic Assurance, Global Reinsurance Alliance',
      badge: 'Enterprise Consortium',
      quote: 'The only production architecture that guarantees zero clinical data exposure across cross-border healthcare claim settlement.'
    },
    features: [
      'Private L2 Validium Rollup',
      'Cross-Border Reinsurance Coordination',
      'Multi-Party Computation (MPC)',
      'Dedicated Hardware Security Module (HSM)',
      'Custom Circuit Compiler (Circom / Halo2)',
      'Biometric Nullifier Verification',
      'Real-Time Solvency Telemetry',
      'Sovereign Cloud & On-Premises Air-Gap'
    ]
  };

  const allPlans = [...plans, widePlan];
  const selectedPlanObj = allPlans.find((p) => p.id === selectedPlanId);

  const handleSelectPlan = (id) => {
    setSelectedPlanId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="min-h-screen bg-[#EFEEEC] text-[#1F1E1A] font-sans antialiased selection:bg-[#FFD400] selection:text-[#11110E] pb-32">
      {/* Subtle Top Gradient Accent */}
      <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-[#E5E0D5]/60 to-transparent pointer-events-none" />

      {/* Floating Section Nav Pill (Sticky Indicator) */}
      <div className="sticky top-16 z-30 flex justify-center px-4 pointer-events-none mb-10 pt-1">
        <nav
          aria-label="Page navigation"
          className="pointer-events-auto p-1.5 rounded-full bg-[#FFFFFF]/90 dark:bg-[#12231C]/90 backdrop-blur-md border border-[#E5E0D5] dark:border-white/10 shadow-lg flex items-center gap-1"
        >
          <button
            type="button"
            onClick={() => scrollToSection('plans')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-tight transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD400] ${
              activeSection === 'plans'
                ? 'bg-[#1F1E1A] text-white dark:bg-[#FFD400] dark:text-[#11110E] shadow-xs'
                : 'text-[#73716A] hover:text-[#1F1E1A]'
            }`}
          >
            Pricing Bento
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('showcase')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-tight transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD400] ${
              activeSection === 'showcase'
                ? 'bg-[#1F1E1A] text-white dark:bg-[#FFD400] dark:text-[#11110E] shadow-xs'
                : 'text-[#73716A] hover:text-[#1F1E1A]'
            }`}
          >
            Live Enclaves
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('partners')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-tight transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD400] ${
              activeSection === 'partners'
                ? 'bg-[#1F1E1A] text-white dark:bg-[#FFD400] dark:text-[#11110E] shadow-xs'
                : 'text-[#73716A] hover:text-[#1F1E1A]'
            }`}
          >
            Alliances
          </button>
        </nav>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 sm:space-y-24">
        {/* SECTION 1: HEADER ROW */}
        <section ref={plansRef} className="pt-4 sm:pt-6 space-y-8 scroll-mt-28">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#E5E0D5]">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono font-bold tracking-wider bg-white border border-[#E5E0D5] text-[#243E35] shadow-xs">
                <Shield className="w-3.5 h-3.5 text-[#B99561]" />
                <span>PARDA PROTOCOL INFRASTRUCTURE</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-[-0.03em] text-[#1F1E1A] leading-[1.05]">
                Extensive Pricing Plans
                <span className="block text-2xl sm:text-3xl lg:text-4xl font-normal text-[#8E8B82] mt-1">
                  Zero-Knowledge Proofs at Institutional Scale
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-[#57544A] max-w-xl leading-relaxed pt-1">
                Deploy client-side encrypted healthcare archives, Circom 2.1 prover nodes, and automated on-chain escrow pools. All plans include immutable cryptographic audit trails and zero-knowledge claim guarantees.
              </p>
            </div>

            {/* Right: Contact line with underlined links */}
            <div className="flex flex-col items-start md:items-end gap-2 text-xs font-medium text-[#73716A] shrink-0">
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#8E8B82]">
                Need Custom Cryptography?
              </span>
              <div className="flex items-center gap-4">
                <a
                  href="mailto:enclave@parda.network"
                  className="inline-flex items-center gap-1.5 text-[#1F1E1A] underline underline-offset-4 decoration-[#B99561] hover:decoration-[#FFD400] hover:text-black transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD400]"
                >
                  <Mail className="w-3.5 h-3.5 text-[#B99561]" />
                  <span>Talk with an engineer</span>
                </a>
                <span className="text-[#D5CDBE]">•</span>
                <button
                  type="button"
                  onClick={() => onBackToApp && onBackToApp('patient')}
                  className="inline-flex items-center gap-1 text-[#1F1E1A] underline underline-offset-4 decoration-[#B99561] hover:decoration-[#FFD400] hover:text-black transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD400]"
                >
                  <span>Launch Live Demo</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Pricing Billing Toggle */}
          <PricingToggle billing={billing} onChange={setBilling} />

          {/* SECTION 2: PRICING BENTO GRID */}
          <div className="space-y-8 mt-6 sm:mt-8">
            {/* Bento Top Row: Light Card + Dark Hero Card side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-stretch">
              {plans.map((p) => (
                <PricingCard
                  key={p.id}
                  billing={billing}
                  isSelected={selectedPlanId === p.id}
                  isDimmed={selectedPlanId !== null && selectedPlanId !== p.id}
                  onSelectPlan={handleSelectPlan}
                  {...p}
                />
              ))}
            </div>

            {/* Bento Bottom Row: Wide Multi-Page Card (National Health Sovereignty Grid) */}
            <div
              onClick={() => handleSelectPlan(widePlan.id)}
              role="region"
              aria-label="Federated Consortium Plan"
              aria-selected={selectedPlanId === widePlan.id}
              className={`group relative rounded-[28px] p-6 sm:p-10 transition-all duration-300 cursor-pointer select-none overflow-hidden border ${
                selectedPlanId === widePlan.id
                  ? 'bg-white ring-2 ring-[#FFD400] shadow-[0_0_36px_rgba(255,212,0,0.25)] -translate-y-1.5'
                  : 'bg-white/95 hover:bg-white border-[#E5E0D5] hover:border-[#D5CDBE] hover:-translate-y-1.5 shadow-sm hover:shadow-xl'
              } ${
                selectedPlanId !== null && selectedPlanId !== widePlan.id
                  ? 'opacity-55 scale-[0.99] filter blur-[0.2px]'
                  : 'opacity-100 scale-100'
              }`}
            >
              {/* Subtle Ambient Shimmer on Wide Card */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-[#FFD400]/10 via-[#B99561]/5 to-transparent rounded-full pointer-events-none" />

              {/* Selection Badge */}
              <div
                className={`absolute top-6 right-6 z-20 flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold tracking-tight bg-[#FFD400] text-[#11110E] shadow-md transition-all duration-300 ${
                  selectedPlanId === widePlan.id
                    ? 'scale-100 opacity-100 translate-y-0'
                    : 'scale-75 opacity-0 -translate-y-2 pointer-events-none'
                }`}
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Selected Plan</span>
              </div>

              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left 7 Columns: Title, Description, Testimonial & Features */}
                <div className="lg:col-span-8 space-y-6">
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-mono font-bold tracking-wider text-[#73716A] uppercase">
                      {widePlan.planLabel}
                    </span>
                    <StatusPill type={widePlan.statusPill.type} text={widePlan.statusPill.text} />
                  </div>

                  <div>
                    <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1F1E1A]">
                      {widePlan.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#57544A] mt-2 max-w-2xl leading-relaxed">
                      {widePlan.description}
                    </p>
                  </div>

                  {/* Wide Testimonial */}
                  <TestimonialChip isDark={false} {...widePlan.testimonial} />

                  {/* Feature Matrix */}
                  <FeatureList features={widePlan.features} isDark={false} />
                </div>

                {/* Right 4 Columns: Pricing & Action */}
                <div className="lg:col-span-4 flex flex-col justify-between h-full pt-4 lg:pt-0 lg:pl-6 lg:border-l border-[#E5E0D5] space-y-6">
                  <div>
                    <span className="text-[11px] font-mono text-[#8E8B82] uppercase tracking-wider">
                      INSTITUTIONAL TIER
                    </span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-sm font-semibold text-[#8E8B82]">$</span>
                      <span className="text-4xl sm:text-5xl font-black tracking-tight text-[#1F1E1A] font-sans">
                        {(billing === 'yearly' ? widePlan.yearlyPrice : widePlan.monthlyPrice).toLocaleString()}
                      </span>
                      <span className="text-xs text-[#73716A]">/mo</span>
                    </div>
                    <div className="text-[11px] text-[#8E8B82] font-mono mt-1">
                      {billing === 'yearly' ? 'billed annually (save $30,000/yr)' : 'billed monthly with rolling term'}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectPlan(widePlan.id);
                      }}
                      className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl font-extrabold text-xs tracking-tight transition-all duration-200 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#FFD400] shadow-sm select-none ${
                        selectedPlanId === widePlan.id
                          ? 'bg-[#1F1E1A] text-white border border-[#FFD400]'
                          : 'bg-[#FFD400] hover:bg-[#FFE033] text-[#11110E]'
                      }`}
                    >
                      <span className="text-sm">
                        {selectedPlanId === widePlan.id ? 'Selected' : 'Deploy Consortium Enclave'}
                      </span>
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                          selectedPlanId === widePlan.id ? 'bg-[#FFD400] text-[#11110E]' : 'bg-[#11110E] text-[#FFD400]'
                        }`}
                      >
                        {selectedPlanId === widePlan.id ? (
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        ) : (
                          <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                        )}
                      </div>
                    </button>

                    <div className="text-center text-[11px] text-[#73716A]">
                      Includes dedicated security audit & custom circuit parameter generation
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: PROJECTS SHOWCASE (CROPPED DEVICE MOCKUPS) */}
        <section ref={showcaseRef} className="scroll-mt-28">
          <ProjectsShowcase />
        </section>

        {/* SECTION 4: LOGO CLOUD MARQUEE */}
        <section ref={partnersRef} className="scroll-mt-28">
          <LogoCloud />
        </section>
      </div>

      {/* STICKY BOTTOM SUMMARY DRAWER (Slides up on plan selection) */}
      <StickySummaryBar
        selectedPlan={selectedPlanObj}
        billing={billing}
        onDeselect={() => setSelectedPlanId(null)}
        onContinue={() => setShowDeploymentSuccessModal(true)}
      />

      {/* Deployment Confirmation Modal */}
      {showDeploymentSuccessModal && selectedPlanObj && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[26px] bg-[#12231C] text-[#F3EFE5] border-2 border-[#FFD400] p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-[#243E35] border border-[#FFD400]/40 flex items-center justify-center text-[#FFD400] mx-auto shadow-inner">
              <Shield className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-2xl font-black tracking-tight text-white">
                Enclave Provisioning Ready
              </h3>
              <p className="text-xs text-[#AEB8AA] leading-relaxed">
                You have selected the <strong className="text-white">{selectedPlanObj.title}</strong> tier ({billing} billing at ${(billing === 'yearly' ? selectedPlanObj.yearlyPrice : selectedPlanObj.monthlyPrice).toLocaleString()}/mo).
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 font-mono text-[11px] space-y-1.5 text-[#9CAB8F]">
              <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Sepolia Verifier Contract Linked</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#B99561]" />
                <span>Cryptographic Nullifier: 0x8f2a...91ce</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FFD400]" />
                <span>Circom Prover Node Allocation: Ready</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowDeploymentSuccessModal(false)}
                className="flex-1 py-3 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeploymentSuccessModal(false);
                  onBackToApp && onBackToApp('hospital');
                }}
                className="flex-1 py-3 rounded-xl text-xs font-bold bg-[#FFD400] hover:bg-[#FFE033] text-[#11110E] transition-colors shadow-sm"
              >
                Open Provider Node
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
