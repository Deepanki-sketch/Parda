import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import PardaOpeningSequence from './components/PardaOpeningSequence';
import PatientPortal from './components/PatientPortal';
import HospitalPortal from './components/HospitalPortal';
import InsurerPortal from './components/InsurerPortal';
import PrivacyXRay from './components/PrivacyXRay';
import RedTeamPanel from './components/RedTeamPanel';
import PricingPage from './components/pricing/PricingPage';
import PatientAuthModal from './components/PatientAuthModal';
import AddHealthRecordModal from './components/AddHealthRecordModal';
import InteractiveScrollWave from './components/InteractiveScrollWave';
import { MOCK_ACCOUNTS, MOCK_PATIENT } from './data/mockData';
import { getActivePatientSession, setActivePatientSession } from './services/patientAuthService';

const ALLOWED_ROLES = ['patient', 'hospital', 'insurer', 'xray', 'redteam', 'pricing'];

export default function App() {
  // 1. Read Role from URI Query String (?role=patient | hospital | insurer | xray | redteam)
  const [activeRole, setActiveRoleState] = useState(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('role');
      if (ALLOWED_ROLES.includes(p)) return p;
    }
    return 'patient';
  });

  // 2. Synchronize Role changes to the Browser URI (?role=...)
  const handleRoleChange = (role) => {
    if (ALLOWED_ROLES.includes(role)) {
      setActiveRoleState(role);
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.set('role', role);
        window.history.replaceState({ role }, '', url.toString());
      }
    }
  };

  // 3. Listen to browser back/forward buttons (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const p = new URLSearchParams(window.location.search).get('role');
      if (ALLOWED_ROLES.includes(p)) {
        setActiveRoleState(p);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // 4. Keyboard Shortcuts: Keys 1..5 switch roles, Esc dismisses intro
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName)) return;
      if (e.key === '1') handleRoleChange('patient');
      else if (e.key === '2') handleRoleChange('hospital');
      else if (e.key === '3') handleRoleChange('insurer');
      else if (e.key === '4') handleRoleChange('xray');
      else if (e.key === '5') handleRoleChange('redteam');
      else if (e.key === '6' || e.key === 'p' || e.key === 'P') handleRoleChange('pricing');
      else if (e.key === 'Escape') setShowIntro(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Dedicated full-screen interactive Parda intro control (?intro=1)
  const [showIntro, setShowIntro] = useState(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('intro');
      if (p === '1') return true;
      if (p === '0') return false;
      return !sessionStorage.getItem('parda_intro_seen_v4');
    }
    return false;
  });

  const handleIntroComplete = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('parda_intro_seen_v4', 'true');
    }
    setShowIntro(false);
  };
  
  // Shared Workflow State
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [ipfsCid, setIpfsCid] = useState('bafybeic23ae33cd09cec6723c0b92cb16438072');
  const [doctorAccessGranted, setDoctorAccessGranted] = useState(false);
  const [claimSettled, setClaimSettled] = useState(false);
  
  // Dynamic Balances and Escrow Pools (Standard rate: 1 ETH = 10,000 INR)
  const [hospitalBalanceEth, setHospitalBalanceEth] = useState(14.20);
  const [poolBalanceEth, setPoolBalanceEth] = useState(10.00);

  // Dynamic Claims Ledger
  const [settledClaims, setSettledClaims] = useState([
    {
      id: 'tx-hist-001',
      nullifier: '0x7c81412089400ae9812739482019482019482019f3',
      hospitalName: 'Metropolitan General Hospital',
      payee: '0x15d3...6A65 (Metropolitan)',
      amountEth: 2.80,
      amountInr: 28000,
      status: 'VERIFIED VALID',
      timestamp: '11:30:00 AM',
      isReplayBlocked: false,
    }
  ]);

  const totalSettledEth = settledClaims.reduce(
    (acc, c) => acc + (c.isReplayBlocked ? 0 : c.amountEth),
    0
  );

  // Sovereign Emergency Break-Glass (Persistent across tab navigation)
  const [isBreakGlassActive, setIsBreakGlassActive] = useState(false);
  const [breakGlassReason, setBreakGlassReason] = useState(
    "Patient unconscious after severe acute trauma - emergency allergy and blood type check"
  );

  const handleTriggerBreakGlass = (reason) => {
    setIsBreakGlassActive(true);
    if (reason) setBreakGlassReason(reason);
    addAuditLog({
      type: 'EMERGENCY_BREAK_GLASS',
      title: 'EMERGENCY TRAUMA BREAK-GLASS INVOKED',
      detail: `St. Jude ER Physician invoked emergency clinical override for ${MOCK_PATIENT.name}. Reason: "${reason || breakGlassReason}" | Hashed to AccessLog.sol`,
      time: new Date().toLocaleTimeString(),
    });
  };

  const handleRevokeBreakGlass = () => {
    setIsBreakGlassActive(false);
    addAuditLog({
      type: 'ACCESS_REVOKED',
      title: 'Emergency Break-Glass Window Closed',
      detail: `Emergency access window closed for ${MOCK_PATIENT.name}. Reverting to sovereign patient custody.`,
      time: new Date().toLocaleTimeString(),
    });
  };

  // Autonomous Smart Contract Settlement Engine
  const handleSettleClaim = ({ amountEth, nullifier, hospitalName, payee, txHash }) => {
    const numAmount = parseFloat(amountEth) || 1.5;
    const inrAmount = Math.round(numAmount * 10000);
    
    setHospitalBalanceEth(prev => parseFloat((prev + numAmount).toFixed(4)));
    setPoolBalanceEth(prev => parseFloat((Math.max(0, prev - numAmount)).toFixed(4)));
    
    const newClaim = {
      id: `claim-${Date.now()}`,
      nullifier: nullifier || ('0x' + Array.from({length: 40}, () => Math.floor(Math.random()*16).toString(16)).join('')),
      hospitalName: hospitalName || 'St. Jude Medical Center',
      payee: payee || '0x7099...79C8 (St. Jude)',
      amountEth: numAmount,
      amountInr: inrAmount,
      status: 'VERIFIED VALID',
      timestamp: new Date().toLocaleTimeString(),
      isReplayBlocked: false,
      txHash: txHash || '',
    };
    
    setSettledClaims(prev => [newClaim, ...prev]);
    setClaimSettled(true);
    return newClaim;
  };

  // Audit Log State
  const [auditLogs, setAuditLogs] = useState([
    {
      type: 'INIT',
      title: 'Insurance Pool Initialized',
      detail: 'Liquidity funded with 10.0 ETH | Approved Hospital Merkle Root Set',
      time: '04:00:00 AM',
    },
    {
      type: 'RECORD_PINNED',
      title: 'Patient Encrypted Record Anchored',
      detail: 'CID: bafybeic23ae33cd09cec... | SHA-256 On-Chain Ciphertext Commitment',
      time: '04:02:15 AM',
    }
  ]);

  const addAuditLog = (log) => {
    setAuditLogs((prev) => [log, ...prev]);
  };

  // Sovereign Patient Session State
  const [currentPatient, setCurrentPatient] = useState(() => getActivePatientSession());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');
  const [isAddRecordModalOpen, setIsAddRecordModalOpen] = useState(false);

  const handleOpenAuthModal = (mode = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = (patient) => {
    setCurrentPatient(patient);
    setActivePatientSession(patient);
    addAuditLog({
      type: 'PATIENT_AUTHENTICATED',
      title: `Patient Session: ${patient.name}`,
      detail: `Authenticated sovereign vault for ${patient.name} (${patient.abhaId || patient.id}) | Key active in memory`,
      time: new Date().toLocaleTimeString(),
    });
  };

  const handleRecordUpdated = (updatedPatient) => {
    setCurrentPatient(updatedPatient);
  };

  const baseAccount = MOCK_ACCOUNTS[activeRole] || MOCK_ACCOUNTS['patient'];
  const currentAccount = {
    ...baseAccount,
    balance: activeRole === 'hospital'
      ? `${hospitalBalanceEth.toFixed(2)} ETH`
      : activeRole === 'insurer'
      ? `${poolBalanceEth.toFixed(2)} ETH`
      : baseAccount.balance
  };

  return (
    <div className="min-h-screen bg-[#F5F2EB] text-[#1F1E1A] flex flex-col justify-between selection:bg-[#9E7C4B]/20 selection:text-[#1F1E1A] font-sans relative overflow-x-hidden">
      
      {/* Interactive Background Scroll Wave (Behind all cards/boxes) */}
      <InteractiveScrollWave />
      
      {/* ===================================================================== */}
      {/* 1. DEDICATED FULL-SCREEN PARDA INTERACTIVE INTRO (ON CLEAN LOAD / REPLAY) */}
      {/* ===================================================================== */}
      {showIntro && (
        <PardaOpeningSequence onComplete={handleIntroComplete} />
      )}

      {/* Top Header Navigation with URI-Linked Tabs */}
      <Header
        activeRole={activeRole}
        setActiveRole={handleRoleChange}
        currentAccount={currentAccount}
        onReplayIntro={() => setShowIntro(true)}
        currentPatient={currentPatient}
        onOpenAuthModal={handleOpenAuthModal}
      />

      {/* ===================================================================== */}
      {/* 2. THE WORKING DAPP DASHBOARD */}
      {/* ===================================================================== */}
      {activeRole === 'pricing' ? (
        <PricingPage onBackToApp={(role) => handleRoleChange(role || 'patient')} />
      ) : (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Active Role or Verification Panel */}
        <section>
          {activeRole === 'patient' && (
            <PatientPortal
              isEncrypted={isEncrypted}
              setIsEncrypted={setIsEncrypted}
              ipfsCid={ipfsCid}
              setIpfsCid={setIpfsCid}
              doctorAccessGranted={doctorAccessGranted}
              setDoctorAccessGranted={setDoctorAccessGranted}
              claimSettled={claimSettled}
              settledClaims={settledClaims}
              isBreakGlassActive={isBreakGlassActive}
              breakGlassReason={breakGlassReason}
              onRevokeBreakGlass={handleRevokeBreakGlass}
              addAuditLog={addAuditLog}
              setActiveRole={handleRoleChange}
              currentPatient={currentPatient}
              onOpenAuthModal={handleOpenAuthModal}
              onOpenAddRecordModal={() => setIsAddRecordModalOpen(true)}
            />
          )}

          {activeRole === 'hospital' && (
            <HospitalPortal
              doctorAccessGranted={doctorAccessGranted}
              claimSettled={claimSettled}
              hospitalBalanceEth={hospitalBalanceEth}
              onSettleClaim={handleSettleClaim}
              isBreakGlassActive={isBreakGlassActive}
              breakGlassReason={breakGlassReason}
              onTriggerBreakGlass={handleTriggerBreakGlass}
              onRevokeBreakGlass={handleRevokeBreakGlass}
              addAuditLog={addAuditLog}
              setActiveRole={handleRoleChange}
              currentPatient={currentPatient}
            />
          )}

          {activeRole === 'insurer' && (
            <InsurerPortal
              claimSettled={claimSettled}
              poolBalanceEth={poolBalanceEth}
              totalSettledEth={totalSettledEth}
              settledClaims={settledClaims}
              auditLogs={auditLogs}
              addAuditLog={addAuditLog}
            />
          )}

          {activeRole === 'xray' && (
            <PrivacyXRay
              claimSettled={claimSettled}
              settledClaims={settledClaims}
              latestClaim={settledClaims[0]}
              isBreakGlassActive={isBreakGlassActive}
            />
          )}

          {activeRole === 'redteam' && (
            <RedTeamPanel
              addAuditLog={addAuditLog}
            />
          )}
        </section>

      </main>
      )}

      {/* Sovereign Patient Login & Registration Modal */}
      <PatientAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
        currentPatient={currentPatient}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Medical Document Uploader & Clinical Manager Modal */}
      <AddHealthRecordModal
        isOpen={isAddRecordModalOpen}
        onClose={() => setIsAddRecordModalOpen(false)}
        currentPatient={currentPatient}
        onRecordUpdated={handleRecordUpdated}
        addAuditLog={addAuditLog}
      />

      {/* Footer */}
      <footer className="border-t border-white/20 bg-transparent py-6 text-xs font-mono relative z-10 parda-bottom-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-bold tracking-wide font-serif text-sm" style={{ color: '#FFFFFF' }}>PARDA PROTOCOL</span>
            <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>•</span>
            <span style={{ color: 'rgba(255, 255, 255, 0.92)' }}>BUILT FOR HACK-A-SOL 5.0 (W3-01)</span>
          </div>
          <span style={{ color: 'rgba(255, 255, 255, 0.88)' }}>
            Circom 2.1 + Groth16 zk-SNARKs + Solidity 0.8.20 + HL7 FHIR R4
          </span>
        </div>
      </footer>

    </div>
  );
}
