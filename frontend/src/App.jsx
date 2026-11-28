import React, { useState, useEffect, useRef, useCallback } from 'react';
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
} from './services/authService';
import {
  getSyncRoomId,
  getLocalCachedWorkflowState,
  fetchSyncedWorkflowState,
  broadcastWorkflowStateImmediate,
  applyMergedCloudMutation,
  syncGrantUpsert,
  syncGrantRevoke,
  syncClaimUpsert,
  resetSharedWorkflowState,
  subscribeToWorkflowSync,
  findActiveGrantForHospital,
  isGrantActive,
} from './services/syncService';

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

    addLocalAuditLog({
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

    addLocalAuditLog({
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
  const syncRoomId = getSyncRoomId();
  const [syncStatus, setSyncStatus] = useState('connecting');
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [ipfsCid, setIpfsCid] = useState('bafybeic23ae33cd09cec6723c0b92cb16438072');

  const [workflowState, setWorkflowState] = useState(() => getLocalCachedWorkflowState());
  const [localSessionLogs, setLocalSessionLogs] = useState([]);
  const workflowRef = useRef(workflowState);
  const syncHandleRef = useRef(null);

  const addLocalAuditLog = useCallback((log) => {
    setLocalSessionLogs((prev) => [log, ...prev].slice(0, 15));
  }, []);

  const commitWorkflowState = useCallback((updater, cloudWriter = null, eventTag = 'state_update') => {
    const prev = workflowRef.current;
    const draft = typeof updater === 'function' ? updater(prev) : updater;
    const nextSeq = (Number(prev.seq) || Number(prev.rev) || 0) + 1;
    const nextState = {
      ...prev,
      ...draft,
      seq: nextSeq,
      rev: nextSeq,
      updatedAt: new Date().toISOString(),
    };
    workflowRef.current = nextState;
    setWorkflowState(nextState);
    syncHandleRef.current?.markLocalRevision?.(nextState);

    const channel = syncHandleRef.current?.channel || null;
    // Push sub-second WebSocket broadcast immediately before awaiting REST persistence
    broadcastWorkflowStateImmediate(nextState, syncRoomId, channel, eventTag);

    const promise = cloudWriter
      ? cloudWriter(nextState, syncRoomId, channel)
      : applyMergedCloudMutation(nextState, updater, syncRoomId, channel, eventTag);

    Promise.resolve(promise)
      .then((merged) => {
        if (merged && (Number(merged.seq) || 0) >= (Number(workflowRef.current?.seq) || 0)) {
          workflowRef.current = merged;
          setWorkflowState(merged);
          syncHandleRef.current?.markLocalRevision?.(merged);
        }
      })
      .catch(() => {});

    return nextState;
  }, [syncRoomId]);

  useEffect(() => {
    let mounted = true;
    const handle = subscribeToWorkflowSync({
      roomId: syncRoomId,
      onStatusChange: (status) => {
        if (mounted) setSyncStatus(status);
      },
      onRemoteState: (remoteState) => {
        if (!mounted || !remoteState) return;
        workflowRef.current = remoteState;
        setWorkflowState(remoteState);
      },
    });
    syncHandleRef.current = handle;

    async function hydrateFromCloud() {
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        if (url.searchParams.get('reset') === '1') {
          const clean = await resetSharedWorkflowState(syncRoomId, handle.channel);
          if (mounted) {
            workflowRef.current = clean;
            setWorkflowState(clean);
            handle.markLocalRevision(clean);
          }
          url.searchParams.delete('reset');
          window.history.replaceState({}, '', url.toString());
          return;
        }
      }

      const remote = await fetchSyncedWorkflowState(syncRoomId);
      if (mounted && remote) {
        workflowRef.current = remote;
        setWorkflowState(remote);
        handle.markLocalRevision(remote);
      }
    }

    hydrateFromCloud();

    return () => {
      mounted = false;
      handle.cleanup();
      syncHandleRef.current = null;
    };
  }, [syncRoomId]);

  const activeGrants = (workflowState.activeGrants || []).filter(isGrantActive);
  const doctorAccessGranted = activeGrants.length > 0;
  const activeHospitalGrant = findActiveGrantForHospital(
    activeGrants,
    activeRoleSession?.role === 'hospital' ? activeRoleSession.user : null
  );

  const pendingClaims = workflowState.pendingClaims || [];
  const settledClaims = workflowState.settledClaims || [];
  const hospitalBalanceEth = Number(workflowState.hospitalBalanceEth ?? 14.2);
  const poolBalanceEth = Number(workflowState.poolBalanceEth ?? 10.0);
  const claimSettled = Boolean(workflowState.claimSettled);
  const isBreakGlassActive = Boolean(workflowState.isBreakGlassActive);
  const breakGlassReason =
    workflowState.breakGlassReason ||
    'Patient unconscious after severe acute trauma - emergency allergy and blood type check';
  const auditLogs = [...localSessionLogs, ...(workflowState.auditLogs || [])].slice(0, 50);

  const addAuditLog = useCallback((log) => {
    commitWorkflowState(
      (prev) => ({
        auditLogs: [log, ...(prev.auditLogs || [])].slice(0, 50),
      }),
      null,
      'audit_log'
    );
  }, [commitWorkflowState]);

  const handleSetDoctorAccessGranted = useCallback((val) => {
    if (!val) {
      commitWorkflowState((prev) => ({ activeGrants: [] }));
    }
  }, [commitWorkflowState]);

  const handleGrantHospitalAccess = useCallback((grant, auditLog = null) => {
    commitWorkflowState(
      (prev) => {
        const filtered = (prev.activeGrants || []).filter(
          (g) =>
            g.hospitalId !== grant.hospitalId &&
            g.hospitalName !== grant.hospitalName
        );
        return {
          activeGrants: [{ ...grant, isRevoked: false }, ...filtered],
          auditLogs: auditLog
            ? [auditLog, ...(prev.auditLogs || [])].slice(0, 50)
            : prev.auditLogs,
        };
      },
      (nextState, room, channel) => syncGrantUpsert(grant, nextState, room, channel)
    );
  }, [commitWorkflowState]);

  const handleRevokeHospitalAccess = useCallback((grantId, auditLog = null) => {
    commitWorkflowState(
      (prev) => ({
        activeGrants: (prev.activeGrants || []).filter((g) => g.id !== grantId),
        auditLogs: auditLog
          ? [auditLog, ...(prev.auditLogs || [])].slice(0, 50)
          : prev.auditLogs,
      }),
      (nextState, room, channel) => syncGrantRevoke(grantId, nextState, room, channel)
    );
  }, [commitWorkflowState]);

  const handlePatientRecordSynced = useCallback((patientMeta, updatedGrantIfAny = null) => {
    commitWorkflowState(
      (prev) => {
        let nextGrants = prev.activeGrants || [];
        if (updatedGrantIfAny) {
          nextGrants = nextGrants.map((g) =>
            g.id === updatedGrantIfAny.id || g.hospitalId === updatedGrantIfAny.hospitalId
              ? { ...g, ...updatedGrantIfAny, isRevoked: false }
              : g
          );
        }
        return {
          activePatientMeta: patientMeta,
          activeGrants: nextGrants,
        };
      },
      updatedGrantIfAny
        ? (nextState, room, channel) => syncGrantUpsert(updatedGrantIfAny, nextState, room, channel)
        : null,
      'patient_meta_updated'
    );
  }, [commitWorkflowState]);

  const totalSettledEth = settledClaims.reduce(
    (acc, c) => acc + (c.isReplayBlocked ? 0 : (parseFloat(c.amountEth) || 0)),
    0
  );

  // Hospital Submits ZKP Claim to Insurer Queue
  const handleSubmitClaimToInsurer = useCallback((claim) => {
    const { auditLog, ...claimFields } = claim || {};
    commitWorkflowState(
      (prev) => ({
        pendingClaims: [claimFields, ...(prev.pendingClaims || []).filter((c) => c.id !== claimFields.id)],
        auditLogs: auditLog
          ? [auditLog, ...(prev.auditLogs || [])].slice(0, 50)
          : prev.auditLogs,
      }),
      (nextState, room, channel) => syncClaimUpsert(claimFields, nextState, room, channel),
      'claim_submitted'
    );
  }, [commitWorkflowState]);

  // Insurer Accepts and Settles Claim via MetaMask
  const handleAcceptAndSettleClaim = useCallback((settledData) => {
    const numAmount = parseFloat(settledData.amountEth) || 1.5;
    const inrAmount = Math.round(numAmount * 10000);
    const { auditLog } = settledData || {};

    const newClaim = {
      id: settledData.id || `claim-${Date.now()}`,
      nullifier:
        settledData.nullifier ||
        '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      hospitalName: settledData.hospitalName || 'St. Jude Medical Center',
      hospitalAddress: settledData.hospitalAddress || settledData.payee || '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      payee: settledData.hospitalAddress || settledData.payee || '0x7099...79C8 (St. Jude)',
      amountEth: numAmount,
      amountInr: inrAmount,
      status: 'VERIFIED VALID',
      timestamp: new Date().toLocaleTimeString(),
      isReplayBlocked: false,
      txHash: settledData.txHash || '',
      settledBy: settledData.settledBy || '',
    };

    commitWorkflowState(
      (prev) => {
        const curHosp = Number(prev.hospitalBalanceEth ?? 14.2);
        const curPool = Number(prev.poolBalanceEth ?? 10.0);
        return {
          hospitalBalanceEth: parseFloat((curHosp + numAmount).toFixed(4)),
          poolBalanceEth: parseFloat(Math.max(0, curPool - numAmount).toFixed(4)),
          pendingClaims: (prev.pendingClaims || []).filter((c) => c.id !== settledData.id),
          settledClaims: [newClaim, ...(prev.settledClaims || []).filter((c) => c.id !== newClaim.id)],
          claimSettled: true,
          auditLogs: auditLog
            ? [auditLog, ...(prev.auditLogs || [])].slice(0, 50)
            : prev.auditLogs,
        };
      },
      (nextState, room, channel) => syncClaimUpsert(newClaim, nextState, room, channel),
      'claim_settled'
    );

    return newClaim;
  }, [commitWorkflowState]);

  // Sovereign Emergency Trauma Break-Glass
  const handleTriggerBreakGlass = useCallback((reason) => {
    const finalReason = reason || workflowRef.current.breakGlassReason;
    commitWorkflowState((prev) => ({
      isBreakGlassActive: true,
      breakGlassReason: finalReason,
      auditLogs: [
        {
          type: 'EMERGENCY_BREAK_GLASS',
          title: 'EMERGENCY TRAUMA BREAK-GLASS INVOKED',
          detail: `St. Jude ER Physician invoked emergency clinical override for ${(prev.activePatientMeta?.name || MOCK_PATIENT.name)}. Reason: "${finalReason}" | Hashed to AccessLog.sol`,
          time: new Date().toLocaleTimeString(),
        },
        ...(prev.auditLogs || []),
      ].slice(0, 50),
    }));
  }, [commitWorkflowState]);

  const handleRevokeBreakGlass = useCallback(() => {
    commitWorkflowState((prev) => ({
      isBreakGlassActive: false,
      auditLogs: [
        {
          type: 'ACCESS_REVOKED',
          title: 'Emergency Break-Glass Window Closed',
          detail: `Emergency access window closed for ${(prev.activePatientMeta?.name || MOCK_PATIENT.name)}. Reverting to sovereign patient custody.`,
          time: new Date().toLocaleTimeString(),
        },
        ...(prev.auditLogs || []),
      ].slice(0, 50),
    }));
  }, [commitWorkflowState]);

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
            activeGrants={activeGrants}
            onGrantHospitalAccess={handleGrantHospitalAccess}
            onRevokeHospitalAccess={handleRevokeHospitalAccess}
            onPatientRecordSynced={handlePatientRecordSynced}
            syncStatus={syncStatus}
            syncRoomId={syncRoomId}
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
            doctorAccessGranted={Boolean(activeHospitalGrant)}
            activeHospitalGrant={activeHospitalGrant}
            syncedPatientMeta={workflowState.activePatientMeta}
            syncStatus={syncStatus}
            syncRoomId={syncRoomId}
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
            syncStatus={syncStatus}
            syncRoomId={syncRoomId}
          />
        )}

        {/* 5. PRIVACY X-RAY: Zero-Knowledge 3-Column Transparency Inspector */}
        {activeRole === 'xray' && (
          <PrivacyXRay
            claimSettled={claimSettled}
            settledClaims={settledClaims}
            latestClaim={settledClaims[0]}
            isBreakGlassActive={isBreakGlassActive}
            currentPatient={currentPatient}
            syncedPatientMeta={workflowState.activePatientMeta}
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
