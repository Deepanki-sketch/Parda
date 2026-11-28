import React, { useState } from 'react';
import {
  Shield,
  User,
  Building2,
  Landmark,
  Key,
  Lock,
  ArrowRight,
  Eye,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  FileText,
  Activity,
  Layers,
  Coins,
  Cpu,
  LogIn,
  UserPlus
} from 'lucide-react';
import { DEMO_USERS, ROLES } from '../services/authService';

export default function RoleGateway({
  onSelectRole,
  onOpenPatientAuthModal,
  onViewXRay,
  onViewRedTeam,
  onViewPricing,
  pendingClaimsCount = 0,
}) {
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'patient' | 'hospital' | 'insurer'
  
  // Custom hospital login form state
  const [customHospitalLicense, setCustomHospitalLicense] = useState('LIC-NY-2024-8849');
  const [customHospitalName, setCustomHospitalName] = useState('St. Jude Medical Center');
  const [customHospitalDept, setCustomHospitalDept] = useState('Cardiology & Inpatient');

  // Custom insurer login form state
  const [customInsurerPool, setCustomInsurerPool] = useState('INS-ETH-POOL-01');
  const [customInsurerName, setCustomInsurerName] = useState('HealthShield Mutual');

  // Handlers for 1-click quick demo logins
  const handleQuickPatient = () => {
    onSelectRole('patient', DEMO_USERS.patient);
  };

  const handleQuickHospital = (variant = 'hospital') => {
    onSelectRole('hospital', DEMO_USERS[variant]);
  };

  const handleQuickInsurer = (variant = 'insurer') => {
    onSelectRole('insurer', DEMO_USERS[variant]);
  };

  const handleCustomHospitalLogin = (e) => {
    e.preventDefault();
    onSelectRole('hospital', {
      role: 'hospital',
      id: `hosp-${Date.now().toString().slice(-4)}`,
      name: customHospitalName || 'Registered Hospital Provider',
      licenseNo: customHospitalLicense || 'LIC-VERIFIED-2024',
      department: customHospitalDept,
      address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      merkleRootVerified: true,
    });
  };

  const handleCustomInsurerLogin = (e) => {
    e.preventDefault();
    onSelectRole('insurer', {
      role: 'insurer',
      id: `ins-${Date.now().toString().slice(-4)}`,
      name: customInsurerName || 'Licensed Insurance Underwriter',
      poolId: customInsurerPool || 'INS-ETH-POOL-01',
      address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      merkleRoot: '0x08581786b454cf726808eca1e5bddfbb948f741cd5ae3d89b6c65f3aeda1da7b',
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12 space-y-10">
      
      {/* Hero / System Overview */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#12231C] border border-[#B99561]/40 text-[#B99561] text-xs font-mono">
          <Shield className="w-3.5 h-3.5" />
          <span>Sovereign Identity & Role Segregation</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-serif font-bold text-[#1F1E1A] tracking-tight">
          Select Your Portal Identity
        </h1>
        <p className="text-sm sm:text-base text-[#4A4843] leading-relaxed">
          PARDA eliminates data exposure by strictly separating Patient, Hospital, and Insurer execution contexts. 
          Each participant accesses their dedicated workflow with isolated cryptographic keys and permissions.
        </p>
      </div>

      {/* 3 Core Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* 1. PATIENT PORTAL CARD */}
        <div className="bg-[#0B1713] text-[#F3EFE5] rounded-2xl border-2 border-[#B99561]/50 p-6 flex flex-col justify-between shadow-xl relative overflow-hidden transition-all hover:border-[#B99561] hover:shadow-[0_0_24px_rgba(185,149,97,0.2)]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#B99561]/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-[#12231C] border border-[#B99561]/40 flex items-center justify-center text-[#B99561]">
                <User className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-[#192C23] text-[#B99561] border border-[#B99561]/30">
                1. Patient Vault
              </span>
            </div>

            <div>
              <h2 className="text-lg font-serif font-bold text-[#F3EFE5]">Patient Sovereign Vault</h2>
              <p className="text-xs text-[#AEB8AA] mt-1 leading-relaxed">
                Client-side encrypted health records. You hold your own AES-256-GCM keys and selectively grant access to licensed doctors.
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="space-y-2 pt-2 text-xs border-t border-[#9DAF9D]/15 font-sans">
              <div className="flex items-center space-x-2 text-[#AEB8AA]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Zero plaintext uploaded to server</span>
              </div>
              <div className="flex items-center space-x-2 text-[#AEB8AA]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>ECDH ephemeral key wrapping</span>
              </div>
              <div className="flex items-center space-x-2 text-[#AEB8AA]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>On-chain ciphertext hash anchoring</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-6 space-y-2.5">
            <button
              type="button"
              onClick={handleQuickPatient}
              className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-[#B99561] hover:bg-[#c9a674] text-[#0B1713] text-xs font-semibold font-mono tracking-wide transition-all shadow-md cursor-pointer"
            >
              <span>1-Click Login: Alex Doe (Demo)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => onOpenPatientAuthModal('login')}
              className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-xl bg-[#12231C] hover:bg-[#192C23] border border-[#B99561]/40 text-[#F3EFE5] text-xs font-medium transition-colors cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5 text-[#B99561]" />
              <span>Patient Sign In / Register</span>
            </button>
          </div>
        </div>

        {/* 2. HOSPITAL PORTAL CARD */}
        <div className="bg-[#0B1713] text-[#F3EFE5] rounded-2xl border-2 border-[#B99561]/50 p-6 flex flex-col justify-between shadow-xl relative overflow-hidden transition-all hover:border-[#B99561] hover:shadow-[0_0_24px_rgba(185,149,97,0.2)]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#B99561]/5 rounded-full blur-2xl pointer-events-none" />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-[#12231C] border border-[#B99561]/40 flex items-center justify-center text-[#B99561]">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-[#192C23] text-[#B99561] border border-[#B99561]/30">
                2. Hospital Provider
              </span>
            </div>

            <div>
              <h2 className="text-lg font-serif font-bold text-[#F3EFE5]">Hospital Clinical Portal</h2>
              <p className="text-xs text-[#AEB8AA] mt-1 leading-relaxed">
                Unwrap delegated patient DEKs, verify diagnosis, and generate Circom Groth16 ZK proofs to submit insurance claims.
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="space-y-2 pt-2 text-xs border-t border-[#9DAF9D]/15 font-sans">
              <div className="flex items-center space-x-2 text-[#AEB8AA]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Regulator Merkle tree license verification</span>
              </div>
              <div className="flex items-center space-x-2 text-[#AEB8AA]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>In-circuit EdDSA Baby Jubjub signature</span>
              </div>
              <div className="flex items-center space-x-2 text-[#AEB8AA]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Instant transmission to insurer settlement queue</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-6 space-y-2.5">
            <button
              type="button"
              onClick={() => handleQuickHospital('hospital')}
              className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-[#B99561] hover:bg-[#c9a674] text-[#0B1713] text-xs font-semibold font-mono tracking-wide transition-all shadow-md cursor-pointer"
            >
              <span>1-Click Login: St. Jude Medical</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => handleQuickHospital('hospital_alt')}
              className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-xl bg-[#12231C] hover:bg-[#192C23] border border-[#B99561]/40 text-[#F3EFE5] text-xs font-medium transition-colors cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5 text-[#B99561]" />
              <span>Login: Metropolitan General</span>
            </button>
          </div>
        </div>

        {/* 3. INSURER PORTAL CARD */}
        <div className="bg-[#0B1713] text-[#F3EFE5] rounded-2xl border-2 border-[#B99561]/50 p-6 flex flex-col justify-between shadow-xl relative overflow-hidden transition-all hover:border-[#B99561] hover:shadow-[0_0_24px_rgba(185,149,97,0.2)]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#B99561]/5 rounded-full blur-2xl pointer-events-none" />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-[#12231C] border border-[#B99561]/40 flex items-center justify-center text-[#B99561]">
                <Landmark className="w-5 h-5" />
              </div>
              <div className="flex items-center space-x-1.5">
                {pendingClaimsCount > 0 && (
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-amber-500 text-black animate-pulse">
                    {pendingClaimsCount} Pending
                  </span>
                )}
                <span className="text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-[#192C23] text-[#B99561] border border-[#B99561]/30">
                  3. Insurer Underwriter
                </span>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-serif font-bold text-[#F3EFE5]">Insurer Settlement Portal</h2>
              <p className="text-xs text-[#AEB8AA] mt-1 leading-relaxed">
                Review verified Groth16 claims, manage escrow liquidity, and execute autonomous payouts to hospitals via MetaMask on Sepolia.
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="space-y-2 pt-2 text-xs border-t border-[#9DAF9D]/15 font-sans">
              <div className="flex items-center space-x-2 text-[#AEB8AA]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Zero-knowledge diagnosis privacy preserved</span>
              </div>
              <div className="flex items-center space-x-2 text-[#AEB8AA]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Anti-replay Poseidon nullifier enforcement</span>
              </div>
              <div className="flex items-center space-x-2 text-[#AEB8AA]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>MetaMask settlement popup & on-chain escrow</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-6 space-y-2.5">
            <button
              type="button"
              onClick={() => handleQuickInsurer('insurer')}
              className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-[#B99561] hover:bg-[#c9a674] text-[#0B1713] text-xs font-semibold font-mono tracking-wide transition-all shadow-md cursor-pointer"
            >
              <span>1-Click Login: HealthShield Mutual</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => handleQuickInsurer('insurer_alt')}
              className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-xl bg-[#12231C] hover:bg-[#192C23] border border-[#B99561]/40 text-[#F3EFE5] text-xs font-medium transition-colors cursor-pointer"
            >
              <Landmark className="w-3.5 h-3.5 text-[#B99561]" />
              <span>Login: Star Health Underwriter</span>
            </button>
          </div>
        </div>

      </div>

      {/* Protocol Architecture & Judge Verification Bar */}
      <div className="bg-[#12231C] border border-[#9DAF9D]/20 rounded-2xl p-5 sm:p-6 text-[#F3EFE5] space-y-4 font-sans">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#9DAF9D]/15 pb-4">
          <div className="space-y-0.5">
            <div className="text-xs font-mono uppercase tracking-wider text-[#B99561] font-semibold">
              Verification & Transparency Tools
            </div>
            <div className="text-sm text-[#AEB8AA]">
              Audit the cryptographic boundary and stress-test the protocol against 7 adversarial vectors.
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onViewXRay}
              className="btn-pressable flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-purple-950/70 hover:bg-purple-900/80 text-purple-200 border border-purple-500/40 text-xs font-medium transition-all cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-purple-400" />
              <span>Privacy X-Ray</span>
            </button>

            <button
              type="button"
              onClick={onViewRedTeam}
              className="btn-pressable flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-950/70 hover:bg-rose-900/80 text-rose-200 border border-rose-500/40 text-xs font-medium transition-all cursor-pointer"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>Red-Team Simulator</span>
            </button>

            <button
              type="button"
              onClick={onViewPricing}
              className="btn-pressable flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#192C23] hover:bg-[#1f372c] text-[#B99561] border border-[#B99561]/40 text-xs font-medium transition-all cursor-pointer"
            >
              <Coins className="w-3.5 h-3.5" />
              <span>Pricing</span>
            </button>
          </div>
        </div>

        {/* Step-by-Step Hackathon Workflow Demonstration Guide */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-[#AEB8AA] font-mono pt-1">
          <div className="p-3 rounded-lg bg-[#0B1713] border border-[#9DAF9D]/10 space-y-1">
            <div className="text-[#F3EFE5] font-semibold flex items-center space-x-1.5">
              <span className="w-4 h-4 rounded-full bg-[#192C23] text-[#B99561] text-[10px] flex items-center justify-center font-bold">1</span>
              <span>Patient Delegation</span>
            </div>
            <p className="text-[11px] text-[#AEB8AA]">
              Log in as Patient, unwrap records, and click "Grant Access & Wrap DEK" to delegate to St. Jude Medical Center.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-[#0B1713] border border-[#9DAF9D]/10 space-y-1">
            <div className="text-[#F3EFE5] font-semibold flex items-center space-x-1.5">
              <span className="w-4 h-4 rounded-full bg-[#192C23] text-[#B99561] text-[10px] flex items-center justify-center font-bold">2</span>
              <span>Hospital ZKP Prover</span>
            </div>
            <p className="text-[11px] text-[#AEB8AA]">
              Log in as Hospital, unwrap the record, generate the 7-constraint Groth16 proof, and click "Submit Claim to Insurer".
            </p>
          </div>

          <div className="p-3 rounded-lg bg-[#0B1713] border border-[#9DAF9D]/10 space-y-1">
            <div className="text-[#F3EFE5] font-semibold flex items-center space-x-1.5">
              <span className="w-4 h-4 rounded-full bg-[#192C23] text-[#B99561] text-[10px] flex items-center justify-center font-bold">3</span>
              <span>Insurer MetaMask Settle</span>
            </div>
            <p className="text-[11px] text-[#AEB8AA]">
              Log in as Insurer, inspect incoming claim queue, and click "Accept & Settle" to trigger MetaMask payout to Hospital.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
