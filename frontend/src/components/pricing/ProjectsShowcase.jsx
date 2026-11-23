import React, { useState } from 'react';
import { Shield, Smartphone, Laptop, CheckCircle2, Lock, Cpu, Landmark, Eye, ExternalLink } from 'lucide-react';

export default function ProjectsShowcase({ className = '' }) {
  const [activeTab, setActiveTab] = useState('patient');

  const projects = [
    {
      id: 'patient',
      title: 'Sovereign Patient Vault',
      category: 'Mobile & Web Client',
      deviceType: 'mobile',
      tag: 'E2EE · AES-GCM 256',
      headline: 'Complete medical history, sealed by patient-held cryptographic keys.',
      stats: [
        { label: 'Cloud Leakage', value: '0 bytes' },
        { label: 'Access Grant Latency', value: '< 200 ms' },
        { label: 'Encryption Standard', value: 'AES-256-GCM' }
      ]
    },
    {
      id: 'hospital',
      title: 'Clinical Prover Enclave',
      category: 'Provider Node Engine',
      deviceType: 'laptop',
      tag: 'Circom 2.1 · Groth16 zk-SNARK',
      headline: 'Transforms sensitive diagnostic charts into verifiable mathematical proofs.',
      stats: [
        { label: 'Proof Generation', value: '840 ms' },
        { label: 'Circuit Constraints', value: '14,280' },
        { label: 'FHIR Compliance', value: 'HL7 R4' }
      ]
    },
    {
      id: 'insurer',
      title: 'Decentralized Mutual Escrow',
      category: 'On-Chain Smart Contract',
      deviceType: 'dashboard',
      tag: 'Solidity 0.8.20 · Sepolia EVM',
      headline: 'Instant claim payout execution with zero double-spend replays.',
      stats: [
        { label: 'Disbursement Speed', value: '12 sec' },
        { label: 'Replay Shield', value: 'Nullifier Hash' },
        { label: 'Audit Trail', value: 'Immutable' }
      ]
    }
  ];

  const currentProject = projects.find((p) => p.id === activeTab) || projects[0];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono font-bold tracking-wider text-[#9CAB8F] uppercase">
            ARCHITECTURE & IMPLEMENTATION
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1F1E1A] dark:text-[#F3EFE5] mt-1">
            Production Deployments <span className="text-[#8E8B82] font-normal">// Live Enclaves</span>
          </h2>
        </div>

        {/* Segmented Tab Filter */}
        <div className="flex items-center p-1 bg-[#E4E1DB] dark:bg-[#12231C] rounded-xl border border-[#D5CDBE] dark:border-white/10 select-none">
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => setActiveTab(p.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD400] ${
                activeTab === p.id
                  ? 'bg-white dark:bg-[#243E35] text-[#1F1E1A] dark:text-[#F3EFE5] shadow-xs'
                  : 'text-[#73716A] dark:text-[#9CAB8F] hover:text-[#1F1E1A] dark:hover:text-white'
              }`}
            >
              {p.title}
            </button>
          ))}
        </div>
      </div>

      {/* Main Cropped Device Showcase Container */}
      <div className="relative rounded-[26px] bg-[#12231C] border border-[#243E35] overflow-hidden shadow-2xl p-6 sm:p-10 text-[#F3EFE5] transition-all duration-300">
        {/* Subtle Background Radial Aura */}
        <div
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full pointer-events-none opacity-20"
          style={{
            background: 'radial-gradient(circle, #FFD400 0%, #243E35 60%, transparent 80%)',
            filter: 'blur(48px)'
          }}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Text & Spec Column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold tracking-tight bg-[#243E35] text-[#FFD400] border border-[#FFD400]/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FFD400] animate-ping" />
              <span>{currentProject.tag}</span>
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-snug">
                {currentProject.title}
              </h3>
              <p className="text-sm text-[#AEB8AA] leading-relaxed">
                {currentProject.headline}
              </p>
            </div>

            {/* Metrics Chips */}
            <div className="grid grid-cols-3 gap-2.5 pt-2">
              {currentProject.stats.map((s, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-white/[0.04] border border-white/10 hover:border-[#FFD400]/40 transition-colors"
                >
                  <div className="text-[10px] font-mono text-[#9CAB8F] tracking-tight uppercase truncate">
                    {s.label}
                  </div>
                  <div className="text-sm sm:text-base font-extrabold text-[#F3EFE5] mt-0.5 truncate">
                    {s.value}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 flex items-center gap-3 text-xs text-[#9CAB8F]">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Zero-Knowledge Proof Verified</span>
              </span>
              <span className="text-white/20">|</span>
              <span className="flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-[#B99561]" />
                <span>Cryptographic Sealing</span>
              </span>
            </div>
          </div>

          {/* Right Column: High-Fidelity Cropped Device Mockup */}
          <div className="lg:col-span-7 relative">
            <div className="relative rounded-2xl bg-[#0B1410] border border-white/15 shadow-2xl overflow-hidden transition-transform duration-300 hover:scale-[1.01]">
              {/* Window Chrome Header Bar */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-black/40 border-b border-white/10 select-none">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                </div>
                <div className="flex items-center gap-1 px-3 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-[#9CAB8F]">
                  <Lock className="w-2.5 h-2.5 text-emerald-400" />
                  <span>https://enclave.parda.network/{activeTab}</span>
                </div>
                <div className="text-[10px] font-mono text-[#AEB8AA] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>LIVE</span>
                </div>
              </div>

              {/* Mockup Screen Visuals Tailored by Active Tab */}
              <div className="p-6 bg-gradient-to-b from-[#0F1E19] to-[#070D0B] font-sans">
                {activeTab === 'patient' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <div>
                        <div className="text-xs font-mono text-[#9CAB8F]">ABHA ID: ABHA-9821-4412-8801</div>
                        <div className="text-lg font-bold text-white">Alex Doe's Sovereign Vault</div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                        AES-256 E2EE Active
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10">
                        <div className="text-[11px] text-[#AEB8AA]">Encrypted Clinical Record</div>
                        <div className="font-mono text-xs text-white mt-1">Ambulatory_Report_24hr.pdf</div>
                        <div className="text-[10px] text-[#B99561] font-mono mt-1">SHA-256: 0x9f8c...3e12</div>
                      </div>
                      <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10">
                        <div className="text-[11px] text-[#AEB8AA]">Delegated Doctor Access</div>
                        <div className="font-mono text-xs text-emerald-300 mt-1">St. Jude Medical Center</div>
                        <div className="text-[10px] text-[#AEB8AA] font-mono mt-1">TTL: 23 hrs 48 mins</div>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-[#192C23]/60 border border-[#B99561]/30 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-[#FFD400]" />
                        <span className="text-xs font-medium text-[#F3EFE5]">
                          Zero-Knowledge Witness generated client-side
                        </span>
                      </div>
                      <span className="text-xs font-mono text-[#FFD400] font-bold">100% PRIVATE</span>
                    </div>
                  </div>
                )}

                {activeTab === 'hospital' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <div>
                        <div className="text-xs font-mono text-[#9CAB8F]">ST. JUDE MEDICAL CENTER</div>
                        <div className="text-lg font-bold text-white">Groth16 Prover Node #04</div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-mono bg-[#FFD400]/10 text-[#FFD400] border border-[#FFD400]/30">
                        Circom 2.1 Ready
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-black/40 border border-white/10 font-mono text-[11px] space-y-1 text-[#AEB8AA]">
                      <div className="text-emerald-400 font-semibold">[OK] Loaded patient record ciphertext</div>
                      <div>[..] Executing circuit: claim_eligibility_verifier.r1cs</div>
                      <div>[..] R1CS constraints: 14,280 | Witness assignment: 840ms</div>
                      <div className="text-[#FFD400] font-bold">[OK] zk-SNARK proof produced without clinical plaintext exposure</div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-[#AEB8AA]">
                      <span>EVM Calldata size: 384 bytes</span>
                      <span className="text-emerald-400 font-mono font-semibold">Verified in 235k gas</span>
                    </div>
                  </div>
                )}

                {activeTab === 'insurer' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <div>
                        <div className="text-xs font-mono text-[#9CAB8F]">HEALTHSHIELD MUTUAL ESCROW</div>
                        <div className="text-lg font-bold text-white">On-Chain Settlement Enclave</div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-mono bg-purple-950 text-purple-300 border border-purple-500/30">
                        Sepolia 0x7a8...c89
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10">
                        <div className="text-[10px] font-mono text-[#AEB8AA]">TOTAL ESCROW POOL</div>
                        <div className="text-xl font-extrabold text-[#FFD400] font-mono mt-0.5">10.00 ETH</div>
                        <div className="text-[10px] text-[#AEB8AA]">₹1,00,000 Liquid Reserve</div>
                      </div>
                      <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10">
                        <div className="text-[10px] font-mono text-[#AEB8AA]">SETTLED PAYOUTS</div>
                        <div className="text-xl font-extrabold text-emerald-400 font-mono mt-0.5">2.80 ETH</div>
                        <div className="text-[10px] text-[#AEB8AA]">4 claims processed today</div>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between text-xs">
                      <span className="text-emerald-300 font-mono">Nullifier Hash Stored: 0x7c81...19f3</span>
                      <span className="text-emerald-400 font-bold">REPLAY BLOCKED</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
