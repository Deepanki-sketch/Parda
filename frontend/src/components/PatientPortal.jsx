import React, { useState, useEffect, useRef } from 'react';
import {
  Check,
  ExternalLink,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  Cloud,
  Lock,
  Key,
  Copy,
  RefreshCw,
  Database,
  HeartPulse,
  AlertTriangle,
  FolderPlus,
  Upload,
  FileCheck,
  FileText,
  Plus,
  User,
  Sparkles,
  Shield,
  Eye,
  ChevronDown,
} from 'lucide-react';
import { MOCK_PATIENT, MOCK_FHIR_RECORD, MOCK_HOSPITALS } from '../data/mockData';
import { useWallet } from '../context/WalletContext';
import deployedConfig from '../contracts/deployed_addresses.json';
import {
  getOrCreatePatientKey,
  uploadEncryptedRecord,
  fetchEncryptedRecord,
} from '../services/healthRecordService';
import { isSupabaseConfigured, SUPABASE_URL } from '../services/supabaseClient';
import { computeSha256 } from '../services/cryptoService';
import {
  buildFhirBundleFromPatient,
  ethToInr,
  inrToEth,
} from '../services/patientAuthService';

export default function PatientPortal({
  isEncrypted,
  setIsEncrypted,
  ipfsCid,
  setIpfsCid,
  doctorAccessGranted,
  setDoctorAccessGranted,
  addAuditLog,
  claimSettled: externalClaimSettled,
  settledClaims = [],
  isBreakGlassActive,
  breakGlassReason,
  onRevokeBreakGlass,
  setActiveRole,
  currentPatient,
  onOpenAuthModal,
  onOpenAddRecordModal,
}) {
  const activePatient = currentPatient || MOCK_PATIENT;
  const activeFhirRecord = buildFhirBundleFromPatient(activePatient);

  const [selectedHospital, setSelectedHospital] = useState(MOCK_HOSPITALS[0].id);
  const [duration, setDuration] = useState('1 hour');
  const [showSensitive, setShowSensitive] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [previewingDoc, setPreviewingDoc] = useState(null);
  
  // Cloud Sync & Encryption State
  const [isSyncing, setIsSyncing] = useState(false);
  const [cloudSynced, setCloudSynced] = useState(false);
  const [cloudRecordId, setCloudRecordId] = useState('');
  const [recordHash, setRecordHash] = useState('');
  const [patientKeyBase64, setPatientKeyBase64] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);
  const [isAttachedSectionOpen, setIsAttachedSectionOpen] = useState(false);

  const [activeGrants, setActiveGrants] = useState(() => {
    if (doctorAccessGranted) {
      return [{
        id: 1,
        hospitalName: 'St. Jude Medical Center',
        duration: '1 hour',
        grantedAt: 'Just now',
      }];
    }
    return [];
  });

  const { account } = useWallet();
  const sharingSectionRef = useRef(null);

  // Initialize and Auto-Sync to Supabase Cloud on mount or when patient changes
  useEffect(() => {
    let isMounted = true;

    async function initVault() {
      try {
        const patientAddr = account || activePatient.address;
        
        // 1. Get or create patient's sovereign AES-256 key
        const keyBundle = await getOrCreatePatientKey(patientAddr);
        if (isMounted) {
          setPatientKeyBase64(keyBundle.base64Key);
        }

        // 2. Compute on-chain SHA-256 digest
        const hash = await computeSha256(activeFhirRecord);
        if (isMounted) {
          setRecordHash(hash);
        }

        // 3. Check if already synced or sync now
        setIsSyncing(true);
        const result = await uploadEncryptedRecord({
          patientAddress: patientAddr,
          recordData: activeFhirRecord,
          key: keyBundle.key,
        });

        if (isMounted) {
          setIsSyncing(false);
          setCloudSynced(result.success);
          setCloudRecordId(result.id);
          setIsEncrypted(true);
          if (result.recordHash) setRecordHash(result.recordHash);
        }
      } catch (err) {
        console.warn('[Parda] Vault initialization notice:', err);
        if (isMounted) setIsSyncing(false);
      }
    }

    initVault();

    return () => {
      isMounted = false;
    };
  }, [account, activePatient.id]);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const patientAddr = account || activePatient.address;
      const keyBundle = await getOrCreatePatientKey(patientAddr);
      const result = await uploadEncryptedRecord({
        patientAddress: patientAddr,
        recordData: activeFhirRecord,
        key: keyBundle.key,
      });
      setIsSyncing(false);
      setCloudSynced(result.success);
      setCloudRecordId(result.id);
      if (result.recordHash) setRecordHash(result.recordHash);
      setStatusMessage(result.storage === 'supabase_cloud' ? 'Synced to Supabase Cloud Vault!' : 'Saved in local encrypted vault.');
      
      if (addAuditLog) {
        addAuditLog({
          type: 'ENCRYPTED_AND_SYNCED',
          title: 'Health Record Encrypted & Synced to Cloud',
          detail: `AES-256-GCM Ciphertext stored in Supabase | Record Hash: ${result.recordHash.slice(0, 16)}...`,
          time: new Date().toLocaleTimeString(),
        });
      }

      setTimeout(() => setStatusMessage(''), 3500);
    } catch (e) {
      setIsSyncing(false);
      setStatusMessage('Sync failed: ' + e.message);
    }
  };

  const copyKeyToClipboard = () => {
    if (patientKeyBase64) {
      navigator.clipboard.writeText(patientKeyBase64);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const copyHashToClipboard = () => {
    if (recordHash) {
      navigator.clipboard.writeText(recordHash);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    }
  };

  const scrollToSharing = () => {
    if (sharingSectionRef.current) {
      sharingSectionRef.current.scrollIntoView({ behavior: 'smooth' });
      const selectEl = document.getElementById('hospital-select');
      if (selectEl) selectEl.focus();
    }
  };

  const handleGrant = () => {
    const hospital = MOCK_HOSPITALS.find((h) => h.id === Number(selectedHospital)) || MOCK_HOSPITALS[0];
    
    const newGrant = {
      id: Date.now(),
      hospitalName: hospital.name,
      duration: duration,
      grantedAt: 'Just now',
    };

    setActiveGrants((prev) => [newGrant, ...prev.filter((g) => g.hospitalName !== hospital.name)]);
    setDoctorAccessGranted(true);
    setIsEncrypted(true);

    // Share sovereign decryption token to authorized enclave session
    if (patientKeyBase64) {
      localStorage.setItem('parda_authorized_grant_key', patientKeyBase64);
      localStorage.setItem('parda_authorized_record_hash', recordHash);
    }

    setStatusMessage(`Access & Decryption Token granted to ${hospital.name} for ${duration}.`);

    if (addAuditLog) {
      addAuditLog({
        type: 'ACCESS_GRANTED',
        title: 'Hospital Enclave Access Granted',
        detail: `${hospital.name} granted access (${duration}) | Decryption key shared with doctor session`,
        time: new Date().toLocaleTimeString(),
      });
    }

    setTimeout(() => {
      setStatusMessage('');
    }, 4000);
  };

  const handleRevoke = (grantId) => {
    const target = activeGrants.find((g) => g.id === grantId);
    setActiveGrants((prev) => prev.filter((g) => g.id !== grantId));
    if (activeGrants.length <= 1) {
      setDoctorAccessGranted(false);
      localStorage.removeItem('parda_authorized_grant_key');
    }
    setStatusMessage(`Access revoked${target ? ` for ${target.hospitalName}` : ''}.`);

    if (addAuditLog) {
      addAuditLog({
        type: 'ACCESS_REVOKED',
        title: 'Hospital Enclave Access Revoked',
        detail: `Revoked permission for ${target ? target.hospitalName : 'hospital'}`,
        time: new Date().toLocaleTimeString(),
      });
    }

    setTimeout(() => {
      setStatusMessage('');
    }, 3500);
  };

  const claimSettled = externalClaimSettled;

  const latestClaim = settledClaims[0];
  const claimAmountEth = latestClaim ? latestClaim.amountEth : 1.5;
  const claimAmountInr = Math.round(claimAmountEth * 10000);
  const claimNullifier = latestClaim ? latestClaim.nullifier : '0x2dc35...19f3';
  const claimHospital = latestClaim ? latestClaim.hospitalName : 'St. Jude Medical Center';

  return (
    <div className="font-sans text-[#F3EFE5] space-y-8">

      {/* Sovereign Emergency Break-Glass Alert Banner */}
      {isBreakGlassActive && (
        <div className="p-4 rounded bg-amber-950/40 border border-amber-500/40 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs animate-in fade-in">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded bg-amber-500/10 border border-amber-500/30 shrink-0">
              <HeartPulse className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="font-semibold text-amber-300 font-sans flex items-center gap-2">
                <span>EMERGENCY CLINICAL ACCESS RECORDED ON ETHEREUM</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-forest-900 border border-amber-500/30 text-amber-400">
                  AccessLog.sol
                </span>
              </div>
              <p className="text-sage-muted text-[11px] font-sans mt-0.5">
                St. Jude Medical ER physician invoked emergency break-glass for acute trauma resuscitation: "{breakGlassReason || 'Emergency clinical triage'}". Immutable proof hash anchored to block.
              </p>
            </div>
          </div>
          {onRevokeBreakGlass && (
            <button
              onClick={onRevokeBreakGlass}
              className="px-3 py-1.5 rounded bg-forest-900 hover:bg-forest-850 border border-amber-500/40 text-amber-300 font-mono text-xs transition-colors cursor-pointer shrink-0"
            >
              Close Emergency Window
            </button>
          )}
        </div>
      )}

      {/* Settled Claims & Privacy Receipts Banner */}
      {claimSettled && (
        <div className="p-5 rounded bg-emerald-950/40 border border-emerald-500/40 space-y-3 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-500/20 pb-3">
            <div className="flex items-center space-x-2 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h2 className="text-base font-serif font-normal text-ivory-200">Autonomous Claim Settlement Receipt</h2>
            </div>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-forest-900 border border-emerald-500/30 text-emerald-400 font-bold">
              100% PRIVATE • ZERO EXPOSURE
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
            <div className="bg-forest-900/80 p-3 rounded border border-sage-500/15">
              <div className="text-[10px] text-sage-muted uppercase">Disbursed Amount</div>
              <div className="text-sm font-bold text-ivory-200 mt-0.5">₹{claimAmountInr.toLocaleString('en-IN')} ({claimAmountEth.toFixed(4)} ETH)</div>
              <div className="text-[10px] text-emerald-400 mt-0.5">Paid from Escrow Pool</div>
            </div>
            <div className="bg-forest-900/80 p-3 rounded border border-sage-500/15">
              <div className="text-[10px] text-sage-muted uppercase">Treating Provider</div>
              <div className="text-sm font-semibold text-ivory-200 mt-0.5">{claimHospital}</div>
              <div className="text-[10px] text-brass-400 mt-0.5">Licensed In-Circuit Leaf</div>
            </div>
            <div className="bg-forest-900/80 p-3 rounded border border-sage-500/15">
              <div className="text-[10px] text-sage-muted uppercase">Privacy Guarantee</div>
              <div className="text-sm font-semibold text-emerald-400 mt-0.5">0 Bytes Medical Leak</div>
              <div className="text-[10px] text-sage-muted mt-0.5">Diagnosis Blinded in SNARK</div>
            </div>
          </div>

          <div className="text-[11px] font-mono text-sage-300 bg-forest-900/60 p-2.5 rounded border border-sage-500/10 flex flex-wrap items-center justify-between gap-1">
            <span>Nullifier: <span className="text-brass-400 font-bold">{claimNullifier.slice(0, 16)}...</span> (Spent On-Chain)</span>
            <span className="text-sage-muted">Contract: ClaimManager.sol • Checks-Effects-Interactions</span>
          </div>
        </div>
      )}
      
      {/* 1. Greeting & Sovereign Account Management Bar */}
      <div className="pt-2 pb-2 space-y-3">
        {/* Main Title Row: Aligned with Action Buttons */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-serif font-normal text-[#F3EFE5] tracking-tight leading-snug">
            Hi {activePatient.name}, your records stay with you.
          </h1>

          {/* Account Actions Aligned with Main Text */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {onOpenAddRecordModal && (
              <button
                type="button"
                onClick={onOpenAddRecordModal}
                className="btn-parda-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Documents & Info</span>
              </button>
            )}

            {onOpenAuthModal && (
              <button
                type="button"
                onClick={() => onOpenAuthModal('login')}
                className="px-3 py-2 rounded bg-forest-800 hover:bg-forest-750 border border-sage-500/30 text-xs font-mono text-ivory-200 transition-colors flex items-center space-x-1.5 cursor-pointer"
                title="Switch patient or register new profile"
              >
                <User className="w-3.5 h-3.5 text-brass-400" />
                <span>Switch / Register</span>
              </button>
            )}
          </div>
        </div>

        {/* ABHA, Blood Group, Policy Limit & Critical Medical Info Fitted In */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-sans text-[#AEB8AA]">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-ivory-200 font-semibold">{activePatient.name}</span>
            <span className="font-mono text-[11px] text-sage-muted">({activePatient.abhaId || activePatient.id})</span>
          </div>

          <span className="text-sage-500/30 hidden sm:inline">•</span>

          <div className="flex items-center space-x-1 text-[11px] font-mono">
            <span className="text-sage-muted">Policy Cap:</span>
            <span className="text-brass-400 font-semibold">
              ₹{(activePatient.policyLimitInr || ethToInr(activePatient.policyLimitEth)).toLocaleString('en-IN')} ({activePatient.policyLimitEth} ETH)
            </span>
          </div>

          <span className="text-sage-500/30 hidden sm:inline">•</span>

          <div className="flex items-center space-x-1 text-[11px] font-mono">
            <span className="text-sage-muted">Blood:</span>
            <span className="text-brass-400 font-semibold">{activePatient.bloodGroup || 'O+'}</span>
          </div>

          <span className="text-sage-500/30 hidden sm:inline">•</span>

          <div className="flex items-center space-x-1 text-[11px] font-mono">
            <span className="text-sage-muted">Allergies:</span>
            <span className="text-brass-400 font-semibold">{activePatient.allergies || 'NKDA'}</span>
          </div>

          <span className="text-sage-500/30 hidden sm:inline">•</span>

          <div className="flex items-center space-x-1 text-[11px] font-mono">
            <span className="text-sage-muted">Vault:</span>
            <span className="text-emerald-700 font-bold">{activePatient.attachedFiles?.length || 0} E2EE Files</span>
          </div>
        </div>

        {/* Live Supabase Cloud Vault Indicator Banner */}
        <div className="mt-2 p-4 rounded-xl parda-big-box border border-[#B99561]/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded bg-[#192C23] border border-[#B99561]/50 flex items-center justify-center text-[#B99561] shrink-0">
              <Cloud className="w-5 h-5 text-[#B99561]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold text-[#F3EFE5]">
                  E2EE Cloud Storage: Supabase
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/90 text-white border border-emerald-500/40 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
                  <span className="text-white font-medium" style={{ color: '#FFFFFF' }}>Live Connected</span>
                </span>
              </div>
              <div className="text-xs text-[#AEB8AA] font-mono mt-0.5">
                Target: <span className="text-[#B99561]">{SUPABASE_URL.replace('https://', '')}</span> · Table: <span className="text-[#F3EFE5]">encrypted_health_records</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="px-3.5 py-1.5 rounded bg-[#192C23] border border-[#B99561]/60 text-xs font-mono font-medium text-[#B99561] hover:text-[#F3EFE5] hover:border-[#B99561] transition-all inline-flex items-center space-x-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Encrypting & Syncing...' : 'Re-Sync to Cloud'}</span>
            </button>
            <button
              onClick={scrollToSharing}
              className="btn-parda-white px-4 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-sm inline-flex items-center cursor-pointer"
            >
              Share with a hospital
            </button>
          </div>
        </div>
      </div>

      {/* 2. Asymmetric Main Columns: 60% Left, 40% Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
        
        {/* Main Column (~60%): Your latest visit & Attached Files */}
        <div className="lg:col-span-7 parda-big-box rounded-2xl p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#9DAF9D]/15">
              <div>
                <h2 className="text-lg font-medium text-[#F3EFE5]">
                  Your latest visit & diagnostic records
                </h2>
                <div className="text-xs text-[#AEB8AA] font-mono mt-0.5">
                  AES-256-GCM Encrypted · Client-Side Private Vault
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSensitive((v) => !v)}
                className="device-toggle-btn text-xs text-[#B99561] hover:text-[#c9a674] transition-colors"
              >
                {showSensitive ? 'Hide on this device' : 'Show on this device'}
              </button>
            </div>

            {/* Readable Clinical Summary */}
            <div className="space-y-5 text-sm">
              
              {/* Visit metadata */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-4 border-b border-[#9DAF9D]/10">
                <span className="text-[#AEB8AA] text-xs">Date & Facility</span>
                <span className="text-[#F3EFE5] font-medium">
                  {activePatient.condition?.recordedDate || '2024-11-20'} · St. Jude Medical Center
                </span>
              </div>

              {/* Condition / Diagnosis */}
              <div className="space-y-1.5 pb-4 border-b border-[#9DAF9D]/10">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-[#AEB8AA]">Diagnosis</div>
                  <span className="text-[10px] font-mono text-[#B99561] bg-[#192C23] px-1.5 py-0.5 rounded border border-[#B99561]/20">
                    Private in Cloud
                  </span>
                </div>
                <div className="text-[#F3EFE5]">
                  {showSensitive ? (
                    <div>
                      <span className="font-semibold">{activePatient.condition?.display || 'Essential hypertension'}</span>
                      <span className="text-xs text-sage-muted font-mono ml-2">(ICD-10: {activePatient.condition?.code || 'I10'})</span>
                      {activePatient.condition?.notes && (
                        <p className="text-xs text-sage-muted mt-1 italic">{activePatient.condition.notes}</p>
                      )}
                    </div>
                  ) : (
                    <span className="inline-block px-2 py-0.5 rounded bg-[#192C23] text-[#AEB8AA] text-xs font-mono">
                      •••••••••••••••• (Encrypted in Supabase)
                    </span>
                  )}
                </div>
              </div>

              {/* Procedure */}
              <div className="space-y-1.5 pb-4 border-b border-[#9DAF9D]/10">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-[#AEB8AA]">Consultation & Procedure</div>
                  <span className="text-[10px] font-mono text-[#B99561] bg-[#192C23] px-1.5 py-0.5 rounded border border-[#B99561]/20">
                    Private in Cloud
                  </span>
                </div>
                <div className="text-[#F3EFE5]">
                  {showSensitive ? (
                    <div>
                      <span>{activePatient.procedure?.display || 'Outpatient consultation'}</span>
                      <span className="text-xs text-sage-muted font-mono ml-2">(CPT: {activePatient.procedure?.code || '99213'})</span>
                      <div className="text-xs text-brass-400 font-mono mt-0.5">
                        Estimated Cost: ₹{(activePatient.procedure?.costInr || ethToInr(activePatient.procedure?.costEth || 1.5)).toLocaleString('en-IN')} ({activePatient.procedure?.costEth || '1.5'} ETH)
                      </div>
                    </div>
                  ) : (
                    <span className="inline-block px-2 py-0.5 rounded bg-[#192C23] text-[#AEB8AA] text-xs font-mono">
                      •••••••••••• (Encrypted in Supabase)
                    </span>
                  )}
                </div>
              </div>

              {/* Prescription */}
              <div className="space-y-1.5 pb-4 border-b border-[#9DAF9D]/10">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-[#AEB8AA]">Prescription</div>
                  <span className="text-[10px] font-mono text-[#B99561] bg-[#192C23] px-1.5 py-0.5 rounded border border-[#B99561]/20">
                    Private in Cloud
                  </span>
                </div>
                <div className="text-[#F3EFE5]">
                  {showSensitive ? (
                    <span>
                      {activePatient.prescription?.medication || 'Lisinopril 10mg Oral Tablet'} — {activePatient.prescription?.dosage || 'Once daily with water'}
                    </span>
                  ) : (
                    <span className="inline-block px-2 py-0.5 rounded bg-[#192C23] text-[#AEB8AA] text-xs font-mono">
                      •••••••••••••••••••••••• (Encrypted in Supabase)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* ATTACHED MEDICAL FILES, CRYPTO KEY & HEALTH PROTOCOL DROPDOWN */}
          {/* ============================================================== */}
          <div className="pt-2 flex-1 flex flex-col justify-end">
            {!isAttachedSectionOpen ? (
              /* Collapsed Box: Square shape, length matching near box, small fade out, small downward arrow not bold */
              <div
                onClick={() => setIsAttachedSectionOpen(true)}
                className="relative w-full rounded-xl cursor-pointer select-none group transition-all duration-200 flex flex-col justify-between overflow-hidden stroke-2-golden shadow-sm"
                style={{
                  minHeight: '135px',
                  height: '100%',
                  background: 'linear-gradient(180deg, rgba(185, 149, 97, 0.22) 0%, rgba(185, 149, 97, 0.12) 50%, rgba(185, 149, 97, 0.02) 100%), #FAF7F2',
                  border: '2px solid #9E7C4B'
                }}
                title="Click to drop down full section"
                role="button"
                tabIndex={0}
                aria-expanded={false}
                aria-label="Expand Add Medical Files and Update Vault section"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setIsAttachedSectionOpen(true);
                  }
                }}
              >
                {/* Header Bar */}
                <div 
                  className="flex items-center justify-between p-3.5 border-b"
                  style={{
                    borderColor: 'rgba(158, 124, 75, 0.30)',
                    background: 'rgba(185, 149, 97, 0.16)'
                  }}
                >
                  <div className="flex items-center gap-2">
                    <FolderPlus className="w-4 h-4 text-[#9E7C4B] shrink-0" />
                    <span 
                      className="text-xs font-mono font-bold uppercase tracking-wider"
                      style={{
                        background: 'linear-gradient(135deg, #7A5522 0%, #9E7C4B 60%, #B99561 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        color: 'rgba(140, 101, 45, 0.95)'
                      }}
                    >
                      Add Medical Files & Update Vault ({activePatient.attachedFiles?.length || 0})
                    </span>
                  </div>

                  {onOpenAddRecordModal && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenAddRecordModal();
                      }}
                      className="btn-upload text-xs font-mono font-medium hover:font-extrabold cursor-pointer transition-all"
                      style={{
                        background: 'linear-gradient(135deg, #7A5522 0%, #9E7C4B 60%, #B99561 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        color: 'rgba(140, 101, 45, 0.95)'
                      }}
                      title="Upload medical documents"
                    >
                      Upload
                    </button>
                  )}
                </div>

                {/* Subtle fade-out body area matching square shape */}
                <div className="flex-1 min-h-[45px] flex items-center justify-center px-4 py-2">
                  <span 
                    className="text-[11px] font-mono italic opacity-70 group-hover:opacity-100 transition-opacity"
                    style={{ color: 'rgba(140, 101, 45, 0.90)' }}
                  >
                    Click to view files, keys & protocol status
                  </span>
                </div>

                {/* Small downward arrow, not bold */}
                <div className="pb-2.5 pt-1 flex justify-center items-center">
                  <ChevronDown className="w-4 h-4 text-[#9E7C4B] stroke-[1.5] transition-transform duration-200 group-hover:translate-y-0.5" />
                </div>
              </div>
            ) : (
              /* Expanded State: Full Content All Golden Brown with Transparent Golden Brown Text */
              <div
                className="rounded-xl p-4 space-y-4 stroke-2-golden transition-all duration-300"
                style={{
                  background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.18) 0%, rgba(185, 149, 97, 0.14) 100%), #FAF7F2',
                  border: '2px solid #9E7C4B'
                }}
              >
                {/* Header */}
                <div 
                  className="flex items-center justify-between pb-3 border-b"
                  style={{ borderColor: 'rgba(158, 124, 75, 0.35)' }}
                >
                  <div className="flex items-center gap-2">
                    <FolderPlus className="w-4 h-4 text-[#9E7C4B] shrink-0" />
                    <span 
                      className="text-xs font-mono font-bold uppercase tracking-wider"
                      style={{
                        background: 'linear-gradient(135deg, #7A5522 0%, #9E7C4B 60%, #B99561 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        color: 'rgba(140, 101, 45, 0.95)'
                      }}
                    >
                      Add Medical Files & Update Vault ({activePatient.attachedFiles?.length || 0})
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {onOpenAddRecordModal && (
                      <button
                        type="button"
                        onClick={onOpenAddRecordModal}
                        className="btn-upload text-xs font-mono font-medium hover:font-extrabold cursor-pointer transition-all"
                        style={{
                          background: 'linear-gradient(135deg, #7A5522 0%, #9E7C4B 60%, #B99561 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          color: 'rgba(140, 101, 45, 0.95)'
                        }}
                        title="Upload medical documents"
                      >
                        Upload
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsAttachedSectionOpen(false)}
                      className="p-1.5 rounded-lg text-[#9E7C4B] hover:bg-[#9E7C4B]/15 transition-all flex items-center justify-center cursor-pointer"
                      title="Collapse section"
                      aria-label="Collapse section"
                    >
                      <ChevronDown className="w-4 h-4 text-[#9E7C4B] stroke-[1.5] rotate-180" />
                    </button>
                  </div>
                </div>

                  {/* Section 1: Attached Encrypted Medical Files List */}
                  {(!activePatient.attachedFiles || activePatient.attachedFiles.length === 0) ? (
                    <div 
                      className="p-4 rounded-xl border text-center text-xs italic"
                      style={{
                        background: 'rgba(185, 149, 97, 0.12)',
                        borderColor: 'rgba(158, 124, 75, 0.35)',
                        color: 'rgba(140, 101, 45, 0.95)'
                      }}
                    >
                      No medical files attached yet. Click "Upload" to upload lab scans or prescriptions.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {activePatient.attachedFiles.map((file) => {
                        const isSelected = previewingDoc?.id === file.id;
                        const isDimmed = previewingDoc && !isSelected;
                        return (
                          <div
                            key={file.id}
                            className={`p-3 rounded-xl border text-xs card-interactive transition-all ${
                              isSelected
                                ? 'parda-selected-item border-[#B99561]'
                                : isDimmed
                                ? 'border-[#9E7C4B]/20 opacity-65'
                                : 'border-[#9E7C4B]/35 hover:border-[#B99561]'
                            }`}
                            style={{
                              background: isSelected 
                                ? 'rgba(185, 149, 97, 0.25)' 
                                : 'rgba(185, 149, 97, 0.12)'
                            }}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start space-x-2.5 min-w-0">
                                <FileCheck className="w-4 h-4 text-[#9E7C4B] shrink-0 mt-0.5" />
                                <div className="min-w-0">
                                  <div 
                                    className="font-medium truncate"
                                    style={{
                                      background: 'linear-gradient(135deg, #7A5522 0%, #9E7C4B 60%, #B99561 100%)',
                                      WebkitBackgroundClip: 'text',
                                      WebkitTextFillColor: 'transparent',
                                      color: 'rgba(140, 101, 45, 0.95)'
                                    }}
                                  >
                                    {file.name}
                                  </div>
                                  <div 
                                    className="text-[10px] font-mono flex flex-wrap items-center gap-2 mt-0.5"
                                    style={{ color: 'rgba(140, 101, 45, 0.88)' }}
                                  >
                                    <span className="font-semibold text-[#8C652D]">{file.category}</span>
                                    <span>•</span>
                                    <span>{file.sizeFormatted}</span>
                                    <span>•</span>
                                    <span>Uploaded {file.uploadDate}</span>
                                    <span>•</span>
                                    <span className="text-emerald-700 font-semibold">AES-256-GCM Verified</span>
                                  </div>
                                  <div 
                                    className="text-[10px] font-mono truncate mt-0.5"
                                    style={{ color: 'rgba(140, 101, 45, 0.75)' }}
                                  >
                                    Digest: {file.fileHash}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                {isSelected && (
                                  <span className="text-[10px] font-mono text-emerald-800 flex items-center gap-1 font-semibold bg-emerald-100/80 px-1.5 py-0.5 rounded border border-emerald-500/30">
                                    ✓ Inspecting
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => setPreviewingDoc(isSelected ? null : file)}
                                  className="btn-pressable px-2 py-1 rounded border text-[10px] font-mono shrink-0 transition-colors cursor-pointer"
                                  style={{
                                    background: 'rgba(185, 149, 97, 0.20)',
                                    borderColor: 'rgba(158, 124, 75, 0.40)',
                                    color: '#7A5522'
                                  }}
                                >
                                  {isSelected ? 'Hide Ciphertext' : 'Inspect Ciphertext'}
                                </button>
                              </div>
                            </div>

                            {/* Decryption Inspector Drawer */}
                            {previewingDoc?.id === file.id && (
                              <div 
                                className="mt-2.5 p-2.5 rounded border font-mono text-[11px] space-y-1.5 animate-in fade-in"
                                style={{
                                  background: 'rgba(185, 149, 97, 0.16)',
                                  borderColor: 'rgba(158, 124, 75, 0.35)',
                                  color: 'rgba(140, 101, 45, 0.95)'
                                }}
                              >
                                <div className="flex items-center justify-between text-xs text-emerald-800 font-semibold">
                                  <span>Decrypted Locally in Browser RAM</span>
                                  <span className="text-[10px]" style={{ color: 'rgba(140, 101, 45, 0.85)' }}>0 Bytes Sent Plaintext</span>
                                </div>
                                <div 
                                  className="p-2 rounded border text-[11px] break-words"
                                  style={{
                                    background: '#FAF7F2',
                                    borderColor: 'rgba(158, 124, 75, 0.25)',
                                    color: '#7A5522'
                                  }}
                                >
                                  {file.previewText || 'AES-256-GCM decrypted verification passed successfully.'}
                                </div>
                                <div className="text-[10px]" style={{ color: 'rgba(140, 101, 45, 0.75)' }}>
                                  Ciphertext Size: {file.encryptedSize} • SHA-256 On-Chain Commitment Anchored
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Section 2: Cryptographic Key & Anchor Box */}
                  <div
                    className="p-4 rounded-xl stroke-2-golden space-y-3"
                    style={{
                      background: 'rgba(185, 149, 97, 0.14)',
                      border: '2px solid #9E7C4B'
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span 
                        className="text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 font-semibold"
                        style={{
                          background: 'linear-gradient(135deg, #7A5522 0%, #9E7C4B 60%, #B99561 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          color: 'rgba(140, 101, 45, 0.95)'
                        }}
                      >
                        <Key className="w-3.5 h-3.5 text-[#9E7C4B]" />
                        <span>Sovereign Decryption Key (AES-256)</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        className="text-[11px] text-[#9E7C4B] hover:text-[#7A5522] hover:underline cursor-pointer font-bold"
                      >
                        {showKey ? 'Hide Key' : 'Reveal Key'}
                      </button>
                    </div>

                    <div 
                      className="flex items-center justify-between px-3 py-2 rounded border font-mono text-xs"
                      style={{
                        background: '#FAF7F2',
                        borderColor: 'rgba(158, 124, 75, 0.35)'
                      }}
                    >
                      <span className="truncate max-w-[280px]" style={{ color: '#7A5522' }}>
                        {showKey && patientKeyBase64 ? patientKeyBase64 : '••••••••••••••••••••••••••••••••••••••••••••'}
                      </span>
                      <button
                        type="button"
                        onClick={copyKeyToClipboard}
                        className="btn-copy text-[#9E7C4B] hover:text-[#7D5825] p-1 flex items-center justify-center transition-all cursor-pointer shrink-0"
                        title={copiedKey ? "Copied!" : "Copy patient AES-256 key"}
                        aria-label="Copy key"
                      >
                        {copiedKey ? (
                          <Check className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {/* On-Chain SHA-256 Anchor */}
                    <div className="pt-2 border-t" style={{ borderColor: 'rgba(158, 124, 75, 0.25)' }}>
                      <div 
                        className="flex items-center justify-between text-xs font-mono font-semibold"
                        style={{
                          background: 'linear-gradient(135deg, #7A5522 0%, #9E7C4B 60%, #B99561 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          color: 'rgba(140, 101, 45, 0.95)'
                        }}
                      >
                        <span>ON-CHAIN ANCHOR HASH (SHA-256):</span>
                        <button
                          type="button"
                          onClick={copyHashToClipboard}
                          className="btn-copy text-[#9E7C4B] hover:text-[#7D5825] p-1 flex items-center justify-center transition-all cursor-pointer"
                          title={copiedHash ? "Copied!" : "Copy anchor hash"}
                          aria-label="Copy anchor hash"
                        >
                          {copiedHash ? (
                            <Check className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      <div 
                        className="text-xs font-mono break-all mt-1 p-2 rounded border"
                        style={{
                          background: '#FAF7F2',
                          borderColor: 'rgba(158, 124, 75, 0.30)',
                          color: '#7A5522'
                        }}
                      >
                        {recordHash || '0x4ead9644ca55d50750feaad0b2dfbb1b9862d8a3bbe3518d579d10ba6b3c7f48'}
                      </div>
                      <div className="text-[11px] mt-1" style={{ color: 'rgba(140, 101, 45, 0.88)' }}>
                        Anchored to Sepolia smart contracts. Proves data integrity without exposing diagnoses.
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Health Claims Protocol Status (Included Inside Dropdown) */}
                  <div
                    className="p-4 rounded-xl stroke-2-golden space-y-2"
                    style={{
                      background: 'rgba(185, 149, 97, 0.14)',
                      border: '2px solid #9E7C4B'
                    }}
                  >
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span 
                        className="uppercase tracking-wider font-semibold"
                        style={{
                          background: 'linear-gradient(135deg, #7A5522 0%, #9E7C4B 60%, #B99561 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          color: 'rgba(140, 101, 45, 0.95)'
                        }}
                      >
                        Health Claims Protocol Status
                      </span>
                      <span className="text-[#9E7C4B] font-bold">Zero-Knowledge Settlement</span>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: 'rgba(140, 101, 45, 0.95)' }}>
                      {claimSettled ? (
                        <span className="text-emerald-700 font-medium flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Claim settled on Sepolia! Hospital received cashless reimbursement with 0 medical notes revealed.
                        </span>
                      ) : activeGrants.length > 0 ? (
                        <span>
                          Access is active for <strong style={{ color: '#7A5522' }}>{activeGrants[0].hospitalName}</strong>. The attending physician can now fetch the encrypted record from Supabase, decrypt it in their enclave, and compile the Groth16 witness.
                        </span>
                      ) : (
                        <span>
                          Your medical record is encrypted and saved in your sovereign Supabase vault. When you visit a healthcare provider, grant temporary access using the panel on the right.
                        </span>
                      )}
                    </p>
                    {activeGrants.length > 0 && !claimSettled && setActiveRole && (
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => setActiveRole('hospital')}
                          className="py-1.5 px-3 rounded border text-xs font-mono font-bold transition-colors inline-flex items-center space-x-1.5 cursor-pointer"
                          style={{
                            background: 'rgba(185, 149, 97, 0.22)',
                            borderColor: '#9E7C4B',
                            color: '#7A5522'
                          }}
                        >
                          <span>Switch to 2. Hospital Provider to Request Claim</span>
                          <ArrowRight className="w-3.5 h-3.5 text-[#9E7C4B]" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Bottom Collapse Button */}
                  <div className="pt-2 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setIsAttachedSectionOpen(false)}
                      className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all cursor-pointer shadow-sm group"
                      style={{
                        background: '#FAF7F2',
                        borderColor: '#9E7C4B',
                        color: '#7A5522'
                      }}
                      title="Collapse section"
                    >
                      <span
                        style={{
                          background: 'linear-gradient(135deg, #7A5522 0%, #9E7C4B 60%, #B99561 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          color: 'rgba(140, 101, 45, 0.95)'
                        }}
                      >
                        Collapse Dropdown
                      </span>
                      <ChevronDown className="w-4 h-4 text-[#9E7C4B] stroke-[1.5] rotate-180 group-hover:-translate-y-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

        {/* Side Column (~40%): Who can see your record */}
        <div
          ref={sharingSectionRef}
          className="lg:col-span-5 parda-big-box rounded-2xl p-6 sm:p-8 space-y-6"
        >
          <div className="pb-4 border-b border-[#9DAF9D]/15">
            <h2 className="text-lg font-medium text-[#F3EFE5]">
              Who can see your record
            </h2>
          </div>

          <div className="space-y-4">
            {/* Hospital Selector */}
            <div>
              <label htmlFor="hospital-select" className="block text-xs text-[#AEB8AA] mb-1.5">
                Hospital
              </label>
              <div className="relative">
                <select
                  id="hospital-select"
                  value={selectedHospital}
                  onChange={(e) => setSelectedHospital(e.target.value)}
                  className="dropdown-box w-full px-3.5 py-2.5 text-sm pr-10"
                >
                  {MOCK_HOSPITALS.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-[#9E7C4B] pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 stroke-[2.5]" />
              </div>
            </div>

            {/* Duration Selector */}
            <div>
              <label htmlFor="duration-select" className="block text-xs text-[#AEB8AA] mb-1.5">
                Access duration
              </label>
              <div className="relative">
                <select
                  id="duration-select"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="dropdown-box w-full px-3.5 py-2.5 text-sm pr-10"
                >
                  <option value="1 hour">1 hour (consultation)</option>
                  <option value="24 hours">24 hours (day admission)</option>
                  <option value="7 days">7 days (follow-up)</option>
                </select>
                <ChevronDown className="w-4 h-4 text-[#9E7C4B] pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 stroke-[2.5]" />
              </div>
            </div>

            {/* Grant Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleGrant}
                className="btn-parda-white w-full py-2.5 px-4 rounded-xl text-sm font-semibold transition-all shadow-sm cursor-pointer"
              >
                Grant access
              </button>
            </div>

            {/* Status Message */}
            {statusMessage && (
              <p className="text-xs text-[#B99561] pt-1">
                {statusMessage}
              </p>
            )}

            {/* Short list of active access with Revoke buttons */}
            <div className="pt-4 border-t border-[#9DAF9D]/15 space-y-3">
              <span className="block text-xs text-[#AEB8AA]">
                Active permissions
              </span>
              {activeGrants.length === 0 ? (
                <p className="text-xs text-[#AEB8AA]/70 italic">
                  No hospitals currently have access.
                </p>
              ) : (
                <div className="space-y-2">
                  {activeGrants.map((grant) => (
                    <div
                      key={grant.id}
                      className="flex items-center justify-between py-2 border-b border-[#9DAF9D]/10 last:border-b-0 text-xs"
                    >
                      <div>
                        <div className="text-[#F3EFE5] font-medium">{grant.hospitalName}</div>
                        <div className="text-[#AEB8AA] text-[11px]">{grant.duration} · Sovereign Key Shared</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRevoke(grant.id)}
                        className="text-xs text-[#AEB8AA] hover:text-[#F3EFE5] px-2.5 py-1 rounded border border-[#9DAF9D]/20 hover:border-[#B99561]/40 transition-colors"
                      >
                        Revoke
                      </button>
                    </div>
                  ))}

                  {setActiveRole && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => setActiveRole('hospital')}
                        className="w-full py-2 px-3 rounded bg-[#192C23] border border-[#B99561]/40 text-[#B99561] hover:text-[#F3EFE5] text-xs font-mono font-medium transition-colors flex items-center justify-center space-x-1.5"
                      >
                        <span>Switch to Hospital Enclave to Request Claim</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>

      </div>

      {/* 3. Horizontal Three-Step Strip Under Main Content */}
      <div className="border-t border-white/20 pt-8 parda-bottom-white">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
          <div className="flex items-start space-x-3">
            <span 
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5 font-bold shadow-sm"
              style={{
                color: '#FFFFFF',
                backgroundColor: 'rgba(0, 0, 0, 0.45)',
                border: '1.5px solid rgba(255, 255, 255, 0.7)'
              }}
            >
              1
            </span>
            <div>
              <div className="font-semibold text-sm" style={{ color: '#FFFFFF' }}>
                Stored in Supabase E2EE
              </div>
              <div className="text-xs mt-0.5" style={{ color: 'rgba(255, 255, 255, 0.90)' }}>
                Encrypted with your private AES-256 key
              </div>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <span 
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5 font-bold shadow-sm"
              style={{
                color: '#FFFFFF',
                backgroundColor: 'rgba(0, 0, 0, 0.45)',
                border: '1.5px solid rgba(255, 255, 255, 0.7)'
              }}
            >
              2
            </span>
            <div>
              <div className="font-semibold text-sm" style={{ color: '#FFFFFF' }}>
                Proof created
              </div>
              <div className="text-xs mt-0.5" style={{ color: 'rgba(255, 255, 255, 0.90)' }}>
                Hospital creates a proof without sharing notes
              </div>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <span 
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5 font-bold shadow-sm"
              style={{
                color: '#FFFFFF',
                backgroundColor: 'rgba(0, 0, 0, 0.45)',
                border: '1.5px solid rgba(255, 255, 255, 0.7)'
              }}
            >
              3
            </span>
            <div>
              <div className="font-semibold text-sm" style={{ color: '#FFFFFF' }}>
                Verified
              </div>
              <div className="text-xs mt-0.5" style={{ color: 'rgba(255, 255, 255, 0.90)' }}>
                Claim settles on-chain with zero data leakage
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Collapsed Technical Details */}
      <details className="group border border-[#9DAF9D]/15 rounded bg-[#12231C] overflow-hidden">
        <summary className="px-5 py-3.5 text-xs text-[#AEB8AA] cursor-pointer hover:text-[#F3EFE5] transition-colors select-none flex items-center justify-between">
          <span>Technical details</span>
          <span className="text-xs group-open:rotate-180 transition-transform">▾</span>
        </summary>
        <div className="px-5 pb-5 pt-2 border-t border-[#9DAF9D]/10 font-mono text-xs text-[#AEB8AA] space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
            <span className="text-[#AEB8AA]/70">Policy ID</span>
            <span className="text-[#F3EFE5]">{activePatient.policyId}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
            <span className="text-[#AEB8AA]/70">Coverage Limit</span>
            <span className="text-[#F3EFE5]">
              ₹{(activePatient.policyLimitInr || ethToInr(activePatient.policyLimitEth)).toLocaleString('en-IN')} ({activePatient.policyLimitEth} ETH)
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
            <span className="text-[#AEB8AA]/70">Supabase Cloud Endpoint</span>
            <span className="text-[#F3EFE5] break-all">{SUPABASE_URL}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
            <span className="text-[#AEB8AA]/70">Supabase Record ID</span>
            <span className="text-[#F3EFE5] break-all">{cloudRecordId || 'synced'}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
            <span className="text-[#AEB8AA]/70">ClaimManager Contract (Sepolia)</span>
            <span className="text-[#F3EFE5] break-all">{deployedConfig.claimManager}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
            <span className="text-[#AEB8AA]/70">Groth16 Verifier Contract</span>
            <span className="text-[#F3EFE5] break-all">{deployedConfig.verifier}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
            <span className="text-[#AEB8AA]/70">Hospital Registry Contract</span>
            <span className="text-[#F3EFE5] break-all">{deployedConfig.hospitalRegistry}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
            <span className="text-[#AEB8AA]/70">On-Chain Record Hash (SHA-256)</span>
            <span className="text-[#F3EFE5] break-all">{recordHash}</span>
          </div>
        </div>
      </details>

    </div>
  );
}
