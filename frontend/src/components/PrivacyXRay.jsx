import React from 'react';
import { Eye, Shield, Lock, CheckCircle2, FileText, Database } from 'lucide-react';
import { MOCK_FHIR_RECORD } from '../data/mockData';

export default function PrivacyXRay({ claimSettled, settledClaims = [], latestClaim, isBreakGlassActive }) {
  const currentClaim = latestClaim || settledClaims[0];
  const claimEth = currentClaim ? currentClaim.amountEth : 1.5;
  const claimInr = Math.round(claimEth * 10000);
  const nullifier = currentClaim ? currentClaim.nullifier : '0x2dc35a81e9f4b0028c794029482019482019482019f3';
  const payee = currentClaim ? currentClaim.payee : '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';

  return (
    <div className="space-y-8 font-sans text-[#F3EFE5]">
      {/* Header Banner */}
      <div className="bg-[#12231C] border border-[#9DAF9D]/20 rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-[#B99561] text-xs font-semibold uppercase tracking-wider mb-2">
              <Eye className="w-4 h-4" />
              <span>Real-Time Privacy Boundary Inspector</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif text-[#F3EFE5]">Privacy X-Ray (3-Column Transparency View)</h2>
            <p className="text-sm text-[#AEB8AA] mt-2 max-w-2xl leading-relaxed">
              Cryptographic boundary verification: comparing what is visible in plaintext to the Hospital Enclave versus the Insurer Underwriter versus the Ethereum Blockchain.
            </p>
          </div>
          <div className="flex items-center space-x-2 bg-[#0B1713] border border-[#B99561]/30 rounded-xl px-4 py-2.5 self-start md:self-auto">
            <span className="w-2.5 h-2.5 rounded-full bg-[#B99561] animate-pulse" />
            <span className="text-xs font-mono text-[#F3EFE5]">URI: ?role=xray</span>
          </div>
        </div>
      </div>

      {/* 3-Column Comparison Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Column 1: Hospital View */}
        <div className="bg-[#12231C] border border-[#9DAF9D]/20 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#9DAF9D]/15">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-[#B99561]" />
              <h3 className="font-medium text-[#F3EFE5]">1. Hospital Enclave</h3>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded bg-[#192C23] text-[#B99561] border border-[#B99561]/30">
              Plaintext Access
            </span>
          </div>
          <p className="text-xs text-[#AEB8AA] leading-relaxed">
            Doctor holds temporary DEK grant from patient. Billing user prepares proof locally.
          </p>

          <div className="space-y-3 font-mono text-xs">
            <div className="p-3 rounded-xl bg-[#0B1713] border border-[#9DAF9D]/10">
              <span className="text-[#AEB8AA]/70 block mb-1">Patient Identity:</span>
              <span className="text-[#F3EFE5] font-semibold">Alex Doe (DOB: 1992-05-14)</span>
            </div>

            <div className="p-3 rounded-xl bg-[#0B1713] border border-[#9DAF9D]/10">
              <span className="text-[#AEB8AA]/70 block mb-1">Diagnosis (ICD-10):</span>
              <span className="text-amber-400 font-semibold">{MOCK_FHIR_RECORD.condition.display} ({MOCK_FHIR_RECORD.condition.code})</span>
            </div>

            <div className="p-3 rounded-xl bg-[#0B1713] border border-[#9DAF9D]/10">
              <span className="text-[#AEB8AA]/70 block mb-1">Procedure (CPT):</span>
              <span className="text-[#B99561] font-semibold">{MOCK_FHIR_RECORD.procedure.display} (Code: {MOCK_FHIR_RECORD.procedure.code})</span>
            </div>

            <div className="p-3 rounded-xl bg-[#0B1713] border border-[#9DAF9D]/10">
              <span className="text-[#AEB8AA]/70 block mb-1">Prescription:</span>
              <span className="text-[#F3EFE5] font-semibold">{MOCK_FHIR_RECORD.prescription.medication} ({MOCK_FHIR_RECORD.prescription.dosage})</span>
            </div>

            <div className="p-3 rounded-xl bg-[#0B1713] border border-[#9DAF9D]/10">
              <span className="text-[#AEB8AA]/70 block mb-1">Access Protocol:</span>
              <span className="text-emerald-400 font-semibold text-[11px]">
                {isBreakGlassActive ? 'EMERGENCY TRAUMA OVERRIDE (AccessLog.sol)' : 'STANDARD PATIENT-WRAPPED KEY (DEK)'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#0B1713] border border-[#9DAF9D]/10">
              <span className="text-[#AEB8AA]/70 block mb-1">Claim Reimbursement:</span>
              <span className="text-[#B99561] font-bold">₹{claimInr.toLocaleString('en-IN')} ({claimEth.toFixed(4)} ETH testnet equivalent)</span>
            </div>
          </div>
        </div>

        {/* Column 2: Insurer View */}
        <div className="bg-[#12231C] border border-[#B99561]/30 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#9DAF9D]/15">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-[#B99561]" />
              <h3 className="font-medium text-[#F3EFE5]">2. Insurer Underwriter</h3>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded bg-[#192C23] text-emerald-400 border border-emerald-500/30">
              Zero Medical Details
            </span>
          </div>
          <p className="text-xs text-[#AEB8AA] leading-relaxed">
            Insurer sees only public settlement fields. No diagnosis or procedure code is ever revealed.
          </p>

          <div className="space-y-3 font-mono text-xs">
            <div className="p-3 rounded-xl bg-[#0B1713] border border-[#9DAF9D]/10">
              <span className="text-[#AEB8AA]/70 block mb-1">Diagnosis / Condition:</span>
              <span className="text-emerald-400 flex items-center space-x-1.5">
                <Lock className="w-3.5 h-3.5" />
                <span>100% BLINDED (Hidden in ZK witness)</span>
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#0B1713] border border-[#9DAF9D]/10">
              <span className="text-[#AEB8AA]/70 block mb-1">Procedure / Treatment:</span>
              <span className="text-emerald-400 flex items-center space-x-1.5">
                <Lock className="w-3.5 h-3.5" />
                <span>100% BLINDED (Proved in covered set root)</span>
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#0B1713] border border-[#9DAF9D]/10">
              <span className="text-[#AEB8AA]/70 block mb-1">Prescriptions:</span>
              <span className="text-emerald-400 flex items-center space-x-1.5">
                <Lock className="w-3.5 h-3.5" />
                <span>100% BLINDED (Never transmitted)</span>
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#0B1713] border border-[#9DAF9D]/10">
              <span className="text-[#AEB8AA]/70 block mb-1">Policy Commitment:</span>
              <span className="text-[#F3EFE5] truncate block">0x498a1c8f92e1047201948291048...</span>
            </div>

            <div className="p-3 rounded-xl bg-[#0B1713] border border-[#9DAF9D]/10">
              <span className="text-[#AEB8AA]/70 block mb-1">Claim Status & Verification:</span>
              <span className="text-emerald-400 font-bold flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{claimSettled ? "VERIFIED & SETTLED" : "READY FOR VERIFICATION"}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Column 3: On-Chain View */}
        <div className="bg-[#12231C] border border-[#9DAF9D]/20 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#9DAF9D]/15">
            <div className="flex items-center space-x-2">
              <Database className="w-4 h-4 text-[#B99561]" />
              <h3 className="font-medium text-[#F3EFE5]">3. Public Blockchain</h3>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded bg-[#192C23] text-purple-300 border border-purple-500/30">
              EVM Calldata Only
            </span>
          </div>
          <p className="text-xs text-[#AEB8AA] leading-relaxed">
            What any public node or explorer sees in the <code>submitClaim</code> transaction calldata on Sepolia.
          </p>

          <div className="space-y-3 font-mono text-xs">
            <div className="p-3 rounded-xl bg-[#0B1713] border border-[#9DAF9D]/10">
              <span className="text-[#AEB8AA]/70 block mb-1">pubSignals[0] (Nullifier):</span>
              <span className="text-purple-300 truncate block">{nullifier.slice(0, 20)}... (Poseidon)</span>
            </div>

            <div className="p-3 rounded-xl bg-[#0B1713] border border-[#9DAF9D]/10">
              <span className="text-[#AEB8AA]/70 block mb-1">pubSignals[1] (Hospital Root):</span>
              <span className="text-purple-300 truncate block">0x2b810482910482019482...</span>
            </div>

            <div className="p-3 rounded-xl bg-[#0B1713] border border-[#9DAF9D]/10">
              <span className="text-[#AEB8AA]/70 block mb-1">pubSignals[2] (Policy Commitment):</span>
              <span className="text-purple-300 truncate block">0x498a1c8f92e104720194...</span>
            </div>

            <div className="p-3 rounded-xl bg-[#0B1713] border border-[#9DAF9D]/10">
              <span className="text-[#AEB8AA]/70 block mb-1">pubSignals[3] (Claim Amount):</span>
              <span className="text-emerald-400 font-bold">₹{claimInr.toLocaleString('en-IN')} ({claimEth.toFixed(4)} ETH)</span>
            </div>

            <div className="p-3 rounded-xl bg-[#0B1713] border border-[#9DAF9D]/10">
              <span className="text-[#AEB8AA]/70 block mb-1">pubSignals[5] (Recipient):</span>
              <span className="text-[#F3EFE5] truncate block">{payee.slice(0, 22)}...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
