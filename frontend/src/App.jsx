import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import RoleGateway from './components/RoleGateway';
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
import { MOCK_ACCOUNTS, MOCK_PATIENT, MOCK_HOSPITALS } from './data/mockData';
import { getActivePatientSession, setActivePatientSession } from './services/patientAuthService';
import {
  getActiveRoleSession,
  setActiveRoleSession,
  clearActiveRoleSession,
  DEMO_USERS,
  getPendingClaims,
  addPendingClaim,
  removePendingClaim,
  getSettledClaims,
  addSettledClaim,
  getHospitalBalanceEth,
  setHospitalBalanceEth,
  getPoolBalanceEth,
  setPoolBalanceEth,
  getStoredDoctorAccessGranted,
  setStoredDoctorAccessGranted,
  getSelectedDelegatedHospital,
  setSelectedDelegatedHospital,
} from './services/authService';

const ALLOWED_ROLES = ['gateway', 'patient', 'hospital', 'insurer', 'xray', 'redteam', 'pricing'];

export default function App() {
  // 1. Sovereign Session State (Role + User Identity)
  const [activeRoleSession, setActiveRoleSessionState] = useState(() => getActiveRoleSession());

  // 2. Read Role from URI Query String (?role=gateway | patient | hospital | insurer | xray | redteam | pricing)
  const [activeRole, setActiveRoleState] = useState(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('role');
      if (['xray', 'redteam', 'pricing'].includes(p)) return p;
      if (['patient', 'hospital', 'insurer'].includes(p)) return p;
    }
    const saved = getActiveRoleSession();
    if (saved?.role) return saved.role;
    return 'gateway';
  });

  // 3. Synchronize Role changes to Browser URI (?role=...)
  const handleRoleChange = (role) => {
    if (ALLOWED_ROLES.includes(role)) {
      setActiveRoleState(role);

      // Auto-ensure session exists for target role
      if (['patient', 'hospital', 'insurer'].includes(role)) {
        if (!activeRoleSession || activeRoleSession.role !== role) {
          const userObj = DEMO_USERS[role] || DEMO_USERS.hospital;
          const newSession = {
            role,
            user: userObj,
            authenticatedAt: new Date().toISOString(),
          };
          setActiveRoleSessionState(newSession);
          setActiveRoleSession(newSession);
        }
      }

      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.set('role', role);
        window.history.replaceState({ role }, '', url.toString());
      }
    }
  };

  // 4. Role Selection from Gateway or 1-Click Persona Logins
  const handleSelectRole = (role, userObject) => {
    const session = {
      role,
      user: userObject,
      authenticatedAt: new Date().toISOString(),
    };
    setActiveRoleSessionState(session);
    setActiveRoleSession(session);
    handleRoleChange(role);

    addAuditLog({
      type: 'ROLE_AUTHENTICATED',
      title: `Authenticated as ${role.toUpperCase()}: ${userObject.name || userObject.id}`,
      detail: `Scoped execution environment loaded. Address: ${userObject.address || 'N/A'} | Cryptographic isolation active`,
      time: new Date().toLocaleTimeString(),
    });
  };

  // 5. Explicit Logout / Switch Persona
  const handleLogout = () => {
    clearActiveRoleSession();
    setActiveRoleSessionState(null);
    handleRoleChange('gateway');

    addAuditLog({
      type: 'LOGOUT',
      title: 'Active Session Terminated',
      detail: 'Sovereign keys and unencrypted credentials flushed from memory. Returned to Portal Gateway.',
      time: new Date().toLocaleTimeString(),
    });
  };

  // 6. Listen to browser popstate (back/forward)
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

  // Ensure activeRoleSession matches activeRole when visiting directly via URL
  useEffect(() => {
    if (['patient', 'hospital', 'insurer'].includes(activeRole)) {
      if (!activeRoleSession || activeRoleSession.role !== activeRole) {
        const userObj = DEMO_USERS[activeRole] || DEMO_USERS.hospital;
        const newSession = {
          role: activeRole,
          user: userObj,
          authenticatedAt: new Date().toISOString(),
        };
        setActiveRoleSessionState(newSession);
        setActiveRoleSession(newSession);
      }
    }
  }, [activeRole]);

  // 7. Full-screen interactive intro sequence (?intro=1)
  const [showIntro, setShowIntro] = useState(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('intro');
      if (p === '1') return true;
      if (p === '0') return false;
      return !sessionStorage.getItem('parda_intro_seen_v5');
    }
    return false;
  });

  const handleIntroComplete = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('parda_intro_seen_v5', 'true');
    }
    setShowIntro(false);
  };
  
  // =========================================================================
  // Persistent Workflow State (Synced across Patient, Hospital, and Insurer)
  // =========================================================================
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [ipfsCid, setIpfsCid] = useState('bafybeic23ae33cd09cec6723c0b92cb16438072');
  
  // Sovereign Patient DEK Access Grant
  const [doctorAccessGranted, setDoctorAccessGrantedState] = useState(() => getStoredDoctorAccessGranted());
  const handleSetDoctorAccessGranted = (val) => {
    setDoctorAccessGrantedState(val);
    setStoredDoctorAccessGranted(val);
  };

  const [claimSettled, setClaimSettled] = useState(false);
  
  // Dynamic Balances (1 ETH = 10,000 INR)
  const [hospitalBalanceEth, setHospitalBalanceEthState] = useState(() => getHospitalBalanceEth());
  const [poolBalanceEth, setPoolBalanceEthState] = useState(() => getPoolBalanceEth());

  // Claims Management (Pending Queue & Settled Ledger)
  const [pendingClaims, setPendingClaims] = useState(() => getPendingClaims());
  const [settledClaims, setSettledClaims] = useState(() => getSettledClaims());

  const totalSettledEth = settledClaims.reduce(
    (acc, c) => acc + (c.isReplayBlocked ? 0 : (parseFloat(c.amountEth) || 0)),
    0
  );

  // Hospital Submits ZKP Claim to Insurer Queue
  const handleSubmitClaimToInsurer = (claim) => {
    const updated = addPendingClaim(claim);
    setPendingClaims(updated);
  };

  // Insurer Accepts and Settles Claim via MetaMask
  const handleAcceptAndSettleClaim = (settledData) => {
    const numAmount = parseFloat(settledData.amountEth) || 1.5;
    const inrAmount = Math.round(numAmount * 10000);
    
    // 1. Update balances
    const newHospBal = parseFloat((hospitalBalanceEth + numAmount).toFixed(4));
    const newPoolBal = parseFloat((Math.max(0, poolBalanceEth - numAmount)).toFixed(4));
    setHospitalBalanceEthState(newHospBal);
    setHospitalBalanceEth(newHospBal);
    setPoolBalanceEthState(newPoolBal);
    setPoolBalanceEth(newPoolBal);
    
    // 2. Remove from pending queue
    const updatedPending = removePendingClaim(settledData.id);
    setPendingClaims(updatedPending);

    // 3. Record in settled ledger
    const newClaim = {
      id: settledData.id || `claim-${Date.now()}`,
      nullifier: settledData.nullifier || ('0x' + Array.from({length: 40}, () => Math.floor(Math.random()*16).toString(16)).join('')),
      hospitalName: settledData.hospitalName || 'St. Jude Medical Center',
      payee: settledData.hospitalAddress || settledData.payee || '0x7099...79C8 (St. Jude)',
      amountEth: numAmount,
      amountInr: inrAmount,
      status: 'VERIFIED VALID',
      timestamp: new Date().toLocaleTimeString(),
      isReplayBlocked: false,
      txHash: settledData.txHash || '',
    };
    
    const updatedSettled = addSettledClaim(newClaim);
    setSettledClaims(updatedSettled);
    setClaimSettled(true);
    return newClaim;
  };

  // Sovereign Emergency Trauma Break-Glass
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

  // Live Audit Log Trail
  const [auditLogs, setAuditLogs] = useState([
    {
      type: 'INIT',
      title: 'HealthShield Underwriting Escrow Solvency Anchored',
      detail: 'Liquidity funded with 10.0 ETH | Approved Hospital Merkle Root Set (0x0858...da7b)',
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

  // Patient Modal Controls
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
    handleSelectRole('patient', patient);
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
      
      {/* Interactive Background Scroll Wave */}
      <InteractiveScrollWave />
      
      {/* Full-Screen Interactive Parda Intro (on first load or replay) */}
      {showIntro && (
        <PardaOpeningSequence onComplete={handleIntroComplete} />
      )}

      {/* Top Header with Role Identity Badge & MetaMask Sepolia Control */}
      <Header
        activeRole={activeRole}
        setActiveRole={handleRoleChange}
        activeRoleSession={activeRoleSession}
        onLogout={handleLogout}
        onReplayIntro={() => setShowIntro(true)}
        currentPatient={currentPatient}
        onOpenAuthModal={handleOpenAuthModal}
        pendingClaimsCount={pendingClaims.length}
      />

      {/* ===================================================================== */}
      {/* MAIN VIEWPORT: GATEWAY OR DEDICATED ROLE PORTAL                       */}
      {/* ===================================================================== */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        
        {/* 1. PORTAL GATEWAY: If user hasn't selected a role or logged out */}
        {(activeRole === 'gateway' || !activeRoleSession) && !['xray', 'redteam', 'pricing'].includes(activeRole) && (
          <RoleGateway
            onSelectRole={handleSelectRole}
            onOpenPatientAuthModal={handleOpenAuthModal}
            onViewXRay={() => handleRoleChange('xray')}
            onViewRedTeam={() => handleRoleChange('redteam')}
            onViewPricing={() => handleRoleChange('pricing')}
            pendingClaimsCount={pendingClaims.length}
          />
        )}

        {/* 2. DEDICATED PATIENT PORTAL */}
        {activeRole === 'patient' && (
          <PatientPortal
            isEncrypted={isEncrypted}
            setIsEncrypted={setIsEncrypted}
            ipfsCid={ipfsCid}
            setIpfsCid={setIpfsCid}
            doctorAccessGranted={doctorAccessGranted}
            setDoctorAccessGranted={handleSetDoctorAccessGranted}
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

        {/* 3. DEDICATED HOSPITAL PORTAL */}
        {activeRole === 'hospital' && (
          <HospitalPortal
            doctorAccessGranted={doctorAccessGranted}
            claimSettled={claimSettled}
            hospitalBalanceEth={hospitalBalanceEth}
            onSettleClaim={handleAcceptAndSettleClaim}
            onSubmitClaimToInsurer={handleSubmitClaimToInsurer}
            pendingClaims={pendingClaims}
            settledClaims={settledClaims}
            activeHospitalSession={activeRoleSession?.user || DEMO_USERS.hospital}
            isBreakGlassActive={isBreakGlassActive}
            breakGlassReason={breakGlassReason}
            onTriggerBreakGlass={handleTriggerBreakGlass}
            onRevokeBreakGlass={handleRevokeBreakGlass}
            addAuditLog={addAuditLog}
            setActiveRole={handleRoleChange}
            currentPatient={currentPatient}
          />
        )}

        {/* 4. DEDICATED INSURER PORTAL */}
        {activeRole === 'insurer' && (
          <InsurerPortal
            claimSettled={claimSettled}
            poolBalanceEth={poolBalanceEth}
            totalSettledEth={totalSettledEth}
            settledClaims={settledClaims}
            pendingClaims={pendingClaims}
            onAcceptAndSettleClaim={handleAcceptAndSettleClaim}
            auditLogs={auditLogs}
            addAuditLog={addAuditLog}
            activeInsurerSession={activeRoleSession?.user || DEMO_USERS.insurer}
          />
        )}

        {/* 5. PRIVACY X-RAY: Zero-Knowledge 3-Column Transparency Inspector */}
        {activeRole === 'xray' && (
          <PrivacyXRay
            claimSettled={claimSettled}
            settledClaims={settledClaims}
            latestClaim={settledClaims[0]}
            isBreakGlassActive={isBreakGlassActive}
          />
        )}

        {/* 6. RED-TEAM ADVERSARIAL SIMULATOR: 7 Attack Vectors */}
        {activeRole === 'redteam' && (
          <RedTeamPanel
            addAuditLog={addAuditLog}
          />
        )}

        {/* 7. PRICING & TIERS */}
        {activeRole === 'pricing' && (
          <PricingPage onBackToApp={(role) => handleRoleChange(role || (activeRoleSession ? activeRoleSession.role : 'gateway'))} />
        )}

      </main>

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
            <span style={{ color: 'rgba(255, 255, 255, 0.92)' }}>ZKP HEALTH RECORDS & AUTONOMOUS SETTLEMENT</span>
          </div>
          <span style={{ color: 'rgba(255, 255, 255, 0.88)' }}>
            Circom 2.1 Groth16 + Solidity 0.8.20 + HL7 FHIR R4
          </span>
        </div>
      </footer>

    </div>
  );
}
