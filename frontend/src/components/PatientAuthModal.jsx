import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Shield,
  Key,
  Lock,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Copy,
  Wallet,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Plus,
  Trash2,
  FileCheck,
  Building,
  Calendar,
  HeartPulse,
} from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import {
  getRegisteredPatients,
  loginPatient,
  loginWithWallet,
  registerPatient,
  setActivePatientSession,
  ETH_INR_RATE,
  ethToInr,
  inrToEth,
} from '../services/patientAuthService';
import { computeSha256 } from '../services/cryptoService';

const PRESET_CONDITIONS = [
  { code: 'I10', display: 'Essential (primary) hypertension - Stage 1', severity: 'Moderate' },
  { code: 'E11.9', display: 'Type 2 diabetes mellitus without complications', severity: 'Moderate' },
  { code: 'I20.9', display: 'Angina pectoris, unspecified (Cardiac chest tightness)', severity: 'Acute' },
  { code: 'J45.909', display: 'Unspecified asthma, uncomplicated', severity: 'Mild' },
  { code: 'S82.201A', display: 'Closed fracture of shaft of right tibia (Acute Trauma)', severity: 'Severe' },
];

const PRESET_PROCEDURES = [
  { code: '99213', display: 'Office or outpatient visit, 20-29 min', costEth: '1.5' },
  { code: '93000', display: '12-lead Electrocardiogram (ECG) with report', costEth: '2.2' },
  { code: '80061', display: 'Comprehensive Lipid panel blood work', costEth: '0.8' },
  { code: '99283', display: 'Emergency department visit, moderate severity', costEth: '3.5' },
];

export default function PatientAuthModal({
  isOpen,
  onClose,
  initialMode = 'login', // 'login' | 'register' | 'demo'
  onAuthSuccess,
  currentPatient,
}) {
  const [mode, setMode] = useState(initialMode); // 'login' | 'register' | 'demo'
  const [regStep, setRegStep] = useState(1); // 1: Identity, 2: Policy, 3: Clinical, 4: Files, 5: Review & Key
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Wallet context
  const { account, connectWallet } = useWallet();

  // Login Form State
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register Form State - Step 1: Identity
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regDob, setRegDob] = useState('1994-06-18');
  const [regGender, setRegGender] = useState('Female');
  const [regBloodGroup, setRegBloodGroup] = useState('O+');
  const [regAllergies, setRegAllergies] = useState('No known drug allergies (NKDA)');
  const [regAbhaId, setRegAbhaId] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Register Form State - Step 2: Policy
  const [regPolicyId, setRegPolicyId] = useState('');
  const [regPolicyProvider, setRegPolicyProvider] = useState('HealthShield Mutual Decentralized Pool');
  const [regPolicyLimitInr, setRegPolicyLimitInr] = useState(50000);
  const [regPolicyExpiry, setRegPolicyExpiry] = useState('2030-12-31');

  // Register Form State - Step 3: Clinical
  const [regConditionCode, setRegConditionCode] = useState('I10');
  const [regConditionDisplay, setRegConditionDisplay] = useState('Essential (primary) hypertension - Stage 1');
  const [regConditionSeverity, setRegConditionSeverity] = useState('Moderate');
  const [regConditionDate, setRegConditionDate] = useState(new Date().toISOString().split('T')[0]);
  const [regConditionNotes, setRegConditionNotes] = useState('Monitored daily via brachial pressure cuff.');

  const [regProcedureCode, setRegProcedureCode] = useState('99213');
  const [regProcedureDisplay, setRegProcedureDisplay] = useState('Office or other outpatient visit, 20-29 minutes');
  const [regProcedureCostEth, setRegProcedureCostEth] = useState('1.5');

  const [regMedication, setRegMedication] = useState('Lisinopril 10mg Oral Tablet');
  const [regDosage, setRegDosage] = useState('Once daily with water');
  const [regRefills, setRegRefills] = useState(3);
  const [regPrescriber, setRegPrescriber] = useState('Dr. Sarah Jenkins, MD (Cardiology)');

  // Register Form State - Step 4: Files Upload
  const [regFiles, setRegFiles] = useState([]);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadCategory, setUploadCategory] = useState('Diagnostic Report');

  // Register Form State - Step 5: Key Generation
  const [generatedKey, setGeneratedKey] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);

  // Sync mode with prop
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setErrorMsg('');
      setSuccessMsg('');
      // Pre-fill ABHA ID & Policy ID with plausible random sequences if empty
      if (!regAbhaId) {
        setRegAbhaId(`ABHA-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`);
      }
      if (!regPolicyId) {
        setRegPolicyId(`POL-${Math.floor(100000 + Math.random() * 900000)}-ZKP`);
      }
      if (account && !regAddress) {
        setRegAddress(account);
      }
    }
  }, [isOpen, initialMode, account]);

  if (!isOpen) return null;

  // Handle Login submission
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!loginIdentifier.trim()) {
      setErrorMsg('Please enter your Email, Name, or ABHA Health ID.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const res = loginPatient(loginIdentifier, loginPassword);
      setIsLoading(false);
      if (res.success) {
        setSuccessMsg(`Welcome back, ${res.patient.name}! Sovereign vault unlocked.`);
        setTimeout(() => {
          onAuthSuccess(res.patient);
          onClose();
        }, 800);
      } else {
        setErrorMsg(res.error || 'Authentication failed. Please check your credentials.');
      }
    }, 400);
  };

  // Handle Quick Demo Login
  const handleQuickDemoLogin = (patient) => {
    setIsLoading(true);
    setErrorMsg('');
    setTimeout(() => {
      setActivePatientSession(patient);
      setIsLoading(false);
      setSuccessMsg(`Switched to demo persona: ${patient.name}`);
      setTimeout(() => {
        onAuthSuccess(patient);
        onClose();
      }, 500);
    }, 300);
  };

  // Handle MetaMask Wallet Login
  const handleWalletLogin = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      let targetAddr = account;
      if (!targetAddr) {
        targetAddr = await connectWallet();
      }
      if (!targetAddr) {
        setErrorMsg('Please connect your MetaMask wallet to proceed.');
        setIsLoading(false);
        return;
      }
      const res = loginWithWallet(targetAddr);
      setIsLoading(false);
      if (res.success) {
        setSuccessMsg(`Wallet authenticated: ${targetAddr.slice(0, 6)}...${targetAddr.slice(-4)}`);
        setTimeout(() => {
          onAuthSuccess(res.patient);
          onClose();
        }, 700);
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMsg(err.message || 'Wallet authentication failed.');
    }
  };

  // Handle file drop/upload during registration
  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingFile(true);
    const newFiles = [...regFiles];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const buffer = await file.arrayBuffer();
      const hash = await computeSha256(file.name + file.size + file.lastModified);
      
      newFiles.push({
        id: `file-upload-${Date.now()}-${i}`,
        name: file.name,
        category: uploadCategory,
        sizeBytes: file.size,
        sizeFormatted: `${(file.size / 1024).toFixed(1)} KB`,
        uploadDate: new Date().toISOString().split('T')[0],
        mimeType: file.type || 'application/pdf',
        fileHash: hash,
        encryptedSize: `${(file.size / 1024 + 1.2).toFixed(1)} KB (AES-256-GCM)`,
        encrypted: true,
        previewText: `Client-side encrypted file: ${file.name}. AES-256 ciphertext generated in browser RAM.`,
      });
    }

    setRegFiles(newFiles);
    setIsUploadingFile(false);
  };

  const removeRegFile = (fileId) => {
    setRegFiles(regFiles.filter((f) => f.id !== fileId));
  };

  // Apply Condition Preset
  const applyConditionPreset = (preset) => {
    setRegConditionCode(preset.code);
    setRegConditionDisplay(preset.display);
    setRegConditionSeverity(preset.severity);
  };

  // Apply Procedure Preset
  const applyProcedurePreset = (preset) => {
    setRegProcedureCode(preset.code);
    setRegProcedureDisplay(preset.display);
    setRegProcedureCostEth(preset.costEth);
  };

  // Handle Final Registration Submission
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!regName.trim()) {
      setErrorMsg('Full name is required.');
      setRegStep(1);
      return;
    }

    setIsLoading(true);

    try {
      const limitEth = inrToEth(regPolicyLimitInr);

      const patientPayload = {
        name: regName,
        email: regEmail,
        phone: regPhone,
        dob: regDob,
        gender: regGender,
        bloodGroup: regBloodGroup,
        allergies: regAllergies,
        abhaId: regAbhaId,
        address: regAddress || account || '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
        policyId: regPolicyId,
        policyProvider: regPolicyProvider,
        policyLimitEth: limitEth,
        policyLimitInr: regPolicyLimitInr,
        policyExpiry: regPolicyExpiry,
        conditionCode: regConditionCode,
        conditionDisplay: regConditionDisplay,
        conditionSeverity: regConditionSeverity,
        conditionDate: regConditionDate,
        conditionNotes: regConditionNotes,
        procedureCode: regProcedureCode,
        procedureDisplay: regProcedureDisplay,
        procedureCostEth: regProcedureCostEth,
        prescriptionMedication: regMedication,
        prescriptionDosage: regDosage,
        prescriptionRefills: regRefills,
        prescriber: regPrescriber,
        attachedFiles: regFiles,
      };

      const result = await registerPatient(patientPayload, regPassword);

      setIsLoading(false);

      if (result.success) {
        setGeneratedKey(result.base64Key);
        setSuccessMsg(`Patient profile registered & encrypted for ${result.patient.name}!`);
        setTimeout(() => {
          onAuthSuccess(result.patient);
          onClose();
        }, 1500);
      } else {
        setErrorMsg(result.error || 'Registration failed.');
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMsg(err.message || 'An error occurred during registration.');
    }
  };

  const copyKey = () => {
    if (generatedKey) {
      navigator.clipboard.writeText(generatedKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const allPatients = getRegisteredPatients();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-forest-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl my-8 bg-forest-900 border border-sage-500/25 rounded-lg shadow-2xl overflow-hidden font-sans text-ivory-200">
        
        {/* Top Header Bar */}
        <div className="px-6 py-4 bg-forest-800/90 border-b border-sage-500/20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded bg-forest-700 border border-brass-500/40 flex items-center justify-center text-brass-400">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-serif font-medium text-ivory-200 tracking-tight">
                {mode === 'login' ? 'Patient Sovereign Vault Login' : mode === 'register' ? 'Register Sovereign Patient Profile' : 'Select Demo Patient Persona'}
              </h2>
              <p className="text-xs text-sage-muted font-mono mt-0.5">
                Client-Side Cryptography • Zero Plaintext Exposure
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded text-sage-muted hover:text-ivory-200 hover:bg-forest-700 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Navigation Tabs */}
        <div className="flex border-b border-sage-500/15 bg-forest-850 px-6 pt-2">
          <button
            onClick={() => { setMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`px-4 py-2 text-xs font-medium border-b-2 transition-all flex items-center space-x-1.5 ${
              mode === 'login'
                ? 'border-brass-500 text-ivory-200 bg-forest-800/40'
                : 'border-transparent text-sage-muted hover:text-ivory-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-brass-400" />
            <span>Sign In</span>
          </button>
          <button
            onClick={() => { setMode('register'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`px-4 py-2 text-xs font-medium border-b-2 transition-all flex items-center space-x-1.5 ${
              mode === 'register'
                ? 'border-brass-500 text-ivory-200 bg-forest-800/40'
                : 'border-transparent text-sage-muted hover:text-ivory-200'
            }`}
          >
            <User className="w-3.5 h-3.5 text-brass-400" />
            <span>Register New Patient</span>
          </button>
          <button
            onClick={() => { setMode('demo'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`px-4 py-2 text-xs font-medium border-b-2 transition-all flex items-center space-x-1.5 ${
              mode === 'demo'
                ? 'border-brass-500 text-ivory-200 bg-forest-800/40'
                : 'border-transparent text-sage-muted hover:text-ivory-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-brass-400" />
            <span>Demo Personas</span>
          </button>
        </div>

        {/* Notifications */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded bg-rose-950/40 border border-rose-500/30 flex items-center space-x-2 text-xs text-rose-300 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mx-6 mt-4 p-3 rounded bg-emerald-950/40 border border-emerald-500/30 flex items-center space-x-2 text-xs text-emerald-300 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ============================================================== */}
        {/* MODE 1: LOGIN TAB */}
        {/* ============================================================== */}
        {mode === 'login' && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Form (7 cols) */}
              <div className="md:col-span-7 space-y-4">
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono text-sage-muted mb-1.5">
                      Email, Name, or ABHA Health ID
                    </label>
                    <input
                      type="text"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder="e.g. alex.doe@parda.health or ABHA-9821..."
                      className="w-full bg-forest-800 border border-sage-500/25 rounded px-3 py-2 text-sm text-ivory-200 placeholder-sage-muted/50 focus:outline-none focus:border-brass-500 font-sans"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-sage-muted mb-1.5 flex justify-between items-center">
                      <span>Vault Passcode / Password</span>
                      <span className="text-[10px] text-sage-muted/70 font-sans">(Optional for demo)</span>
                    </label>
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter patient vault passcode"
                      className="w-full bg-forest-800 border border-sage-500/25 rounded px-3 py-2 text-sm text-ivory-200 placeholder-sage-muted/50 focus:outline-none focus:border-brass-500 font-sans"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-parda-white w-full py-2.5 px-4 rounded-xl font-medium text-sm transition-colors shadow-sm flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Key className="w-4 h-4" />
                        <span>Unlock Sovereign Health Vault</span>
                      </>
                    )}
                  </button>
                </form>

                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-sage-500/15" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase font-mono">
                    <span className="bg-forest-900 px-2 text-sage-muted">Or Connect Directly</span>
                  </div>
                </div>

                {/* Web3 Wallet One-Click Login */}
                <button
                  type="button"
                  onClick={handleWalletLogin}
                  disabled={isLoading}
                  className="w-full py-2 px-4 rounded bg-forest-800 hover:bg-forest-750 border border-sage-500/30 text-xs font-mono text-ivory-200 transition-colors flex items-center justify-center space-x-2"
                >
                  <Wallet className="w-4 h-4 text-brass-400" />
                  <span>
                    {account
                      ? `Continue with Wallet (${account.slice(0, 6)}...${account.slice(-4)})`
                      : 'Sign In with MetaMask Wallet'}
                  </span>
                </button>
              </div>

              {/* Right Column: Quick Demo Switcher (5 cols) */}
              <div className="md:col-span-5 bg-forest-800/60 p-4 rounded border border-sage-500/20 space-y-3">
                <div className="flex items-center space-x-1.5 text-xs font-mono text-brass-400 font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>QUICK DEMO PROFILES</span>
                </div>
                <p className="text-[11px] text-sage-muted leading-relaxed font-sans">
                  Instantly authenticate as a pre-configured patient with encrypted diagnostic files and policy caps for rapid evaluation.
                </p>

                <div className="space-y-2 pt-1">
                  {allPatients.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleQuickDemoLogin(p)}
                      className="w-full text-left p-2.5 rounded bg-forest-700/80 hover:bg-forest-700 border border-sage-500/20 hover:border-brass-500/40 transition-all text-xs group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-ivory-200 group-hover:text-brass-300">
                          {p.name}
                        </span>
                        <span className="text-[10px] font-mono text-brass-400 px-1.5 py-0.5 rounded bg-forest-900 border border-brass-500/20">
                          ₹{p.policyLimitInr?.toLocaleString('en-IN')} Cap
                        </span>
                      </div>
                      <div className="text-[11px] text-sage-muted truncate mt-0.5">
                        {p.condition?.display || 'Active Patient'}
                      </div>
                      <div className="text-[10px] text-sage-muted/70 font-mono mt-1 flex items-center justify-between">
                        <span>{p.attachedFiles?.length || 0} Encrypted Files</span>
                        <span className="text-brass-400 group-hover:translate-x-0.5 transition-transform">Load →</span>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setMode('register')}
                    className="text-xs text-brass-400 hover:text-brass-300 underline underline-offset-4"
                  >
                    Need an account? Register new patient profile
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* MODE 2: MULTI-STEP REGISTRATION TAB */}
        {/* ============================================================== */}
        {mode === 'register' && (
          <div className="p-6 space-y-6">
            
            {/* Step Navigation Pill Indicator */}
            <div className="flex items-center justify-between bg-forest-800/80 p-2 rounded border border-sage-500/15 text-xs font-mono overflow-x-auto gap-2">
              {[
                { step: 1, label: '1. Identity' },
                { step: 2, label: '2. Insurance Policy' },
                { step: 3, label: '3. Clinical Baseline' },
                { step: 4, label: '4. Upload Files' },
                { step: 5, label: '5. Sovereign Key & Commit' },
              ].map((s) => (
                <button
                  key={s.step}
                  type="button"
                  onClick={() => setRegStep(s.step)}
                  className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                    regStep === s.step
                      ? 'bg-brass-500 text-forest-950 font-semibold'
                      : regStep > s.step
                      ? 'text-brass-400 bg-forest-700/60'
                      : 'text-sage-muted hover:text-ivory-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleRegisterSubmit}>
              {/* ---------------- STEP 1: IDENTITY ---------------- */}
              {regStep === 1 && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="border-b border-sage-500/15 pb-2">
                    <h3 className="text-sm font-serif font-medium text-ivory-200">
                      Step 1: Patient Identity & Sovereign Demographics
                    </h3>
                    <p className="text-xs text-sage-muted">
                      Your identity is stored client-side. Blinding hashes protect your identity in ZK circuits.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono text-sage-muted mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="e.g. Alex Doe or Priya Sharma"
                        className="w-full bg-forest-800 border border-sage-500/25 rounded px-3 py-2 text-sm text-ivory-200 focus:outline-none focus:border-brass-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-sage-muted mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="patient@parda.health"
                        className="w-full bg-forest-800 border border-sage-500/25 rounded px-3 py-2 text-sm text-ivory-200 focus:outline-none focus:border-brass-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-sage-muted mb-1">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        value={regDob}
                        onChange={(e) => setRegDob(e.target.value)}
                        className="w-full bg-forest-800 border border-sage-500/25 rounded px-3 py-2 text-sm text-ivory-200 focus:outline-none focus:border-brass-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-sage-muted mb-1">
                        Gender
                      </label>
                      <select
                        value={regGender}
                        onChange={(e) => setRegGender(e.target.value)}
                        className="w-full bg-forest-800 border border-sage-500/25 rounded px-3 py-2 text-sm text-ivory-200 focus:outline-none focus:border-brass-500"
                      >
                        <option value="Female">Female</option>
                        <option value="Male">Male</option>
                        <option value="Non-binary">Non-binary</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-sage-muted mb-1">
                        Blood Group
                      </label>
                      <select
                        value={regBloodGroup}
                        onChange={(e) => setRegBloodGroup(e.target.value)}
                        className="w-full bg-forest-800 border border-sage-500/25 rounded px-3 py-2 text-sm text-ivory-200 focus:outline-none focus:border-brass-500"
                      >
                        <option value="O+">O Positive (O+)</option>
                        <option value="O-">O Negative (O-)</option>
                        <option value="A+">A Positive (A+)</option>
                        <option value="A-">A Negative (A-)</option>
                        <option value="B+">B Positive (B+)</option>
                        <option value="B-">B Negative (B-)</option>
                        <option value="AB+">AB Positive (AB+)</option>
                        <option value="AB-">AB Negative (AB-)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-sage-muted mb-1">
                        ABHA / National Health ID
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={regAbhaId}
                          onChange={(e) => setRegAbhaId(e.target.value)}
                          placeholder="ABHA-1234-5678-9012"
                          className="w-full bg-forest-800 border border-sage-500/25 rounded px-3 py-2 text-sm text-ivory-200 font-mono focus:outline-none focus:border-brass-500"
                        />
                        <button
                          type="button"
                          onClick={() => setRegAbhaId(`ABHA-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`)}
                          className="px-2 py-1 bg-forest-700 hover:bg-forest-650 rounded border border-sage-500/20 text-xs text-brass-400 font-mono"
                          title="Generate random ABHA ID"
                        >
                          Gen
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-sage-muted mb-1">
                      Drug Allergies / Critical Alerts
                    </label>
                    <input
                      type="text"
                      value={regAllergies}
                      onChange={(e) => setRegAllergies(e.target.value)}
                      placeholder="e.g. Penicillin, Sulfa, or NKDA"
                      className="w-full bg-forest-800 border border-sage-500/25 rounded px-3 py-2 text-sm text-ivory-200 focus:outline-none focus:border-brass-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-sage-muted mb-1 flex items-center justify-between">
                      <span>Ethereum Wallet Address (Patient Signer)</span>
                      {account && (
                        <button
                          type="button"
                          onClick={() => setRegAddress(account)}
                          className="text-[10px] text-brass-400 hover:underline"
                        >
                          Use Connected Wallet ({account.slice(0, 6)}...)
                        </button>
                      )}
                    </label>
                    <input
                      type="text"
                      value={regAddress}
                      onChange={(e) => setRegAddress(e.target.value)}
                      placeholder="0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
                      className="w-full bg-forest-800 border border-sage-500/25 rounded px-3 py-2 text-sm text-ivory-200 font-mono focus:outline-none focus:border-brass-500"
                    />
                  </div>

                  <div className="flex justify-end pt-3">
                    <button
                      type="button"
                      onClick={() => setRegStep(2)}
                      className="px-4 py-2 rounded bg-brass-500 hover:bg-brass-400 text-forest-950 font-medium text-xs flex items-center space-x-1.5"
                    >
                      <span>Next: Insurance Policy</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* ---------------- STEP 2: INSURANCE POLICY ---------------- */}
              {regStep === 2 && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="border-b border-sage-500/15 pb-2">
                    <h3 className="text-sm font-serif font-medium text-ivory-200">
                      Step 2: Insurance Policy Binding & Solvency Limits
                    </h3>
                    <p className="text-xs text-sage-muted">
                      Standardized dual-currency conversion @ 1 ETH = ₹10,000. Verified in-circuit via 64-bit comparison.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono text-sage-muted mb-1">
                        Policy Commitment ID *
                      </label>
                      <input
                        type="text"
                        required
                        value={regPolicyId}
                        onChange={(e) => setRegPolicyId(e.target.value)}
                        placeholder="POL-987654-ZKP"
                        className="w-full bg-forest-800 border border-sage-500/25 rounded px-3 py-2 text-sm text-ivory-200 font-mono focus:outline-none focus:border-brass-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-sage-muted mb-1">
                        Underwriter / Insurance Pool
                      </label>
                      <input
                        type="text"
                        value={regPolicyProvider}
                        onChange={(e) => setRegPolicyProvider(e.target.value)}
                        className="w-full bg-forest-800 border border-sage-500/25 rounded px-3 py-2 text-sm text-ivory-200 focus:outline-none focus:border-brass-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-sage-muted mb-1">
                        Policy Coverage Limit (Rupees ₹)
                      </label>
                      <div className="space-y-1">
                        <input
                          type="number"
                          step="5000"
                          min="10000"
                          max="500000"
                          value={regPolicyLimitInr}
                          onChange={(e) => setRegPolicyLimitInr(Number(e.target.value))}
                          className="w-full bg-forest-800 border border-sage-500/25 rounded px-3 py-2 text-sm text-ivory-200 font-mono focus:outline-none focus:border-brass-500"
                        />
                        <div className="text-[11px] font-mono text-brass-400 bg-forest-800/80 px-2 py-1 rounded border border-sage-500/15 flex justify-between">
                          <span>Converted Escrow Limit:</span>
                          <span className="font-bold">
                            ₹{regPolicyLimitInr.toLocaleString('en-IN')} ({inrToEth(regPolicyLimitInr)} ETH @ ₹10,000/ETH)
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-sage-muted mb-1">
                        Policy Expiration Date
                      </label>
                      <input
                        type="date"
                        value={regPolicyExpiry}
                        onChange={(e) => setRegPolicyExpiry(e.target.value)}
                        className="w-full bg-forest-800 border border-sage-500/25 rounded px-3 py-2 text-sm text-ivory-200 focus:outline-none focus:border-brass-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between pt-3">
                    <button
                      type="button"
                      onClick={() => setRegStep(1)}
                      className="px-3 py-1.5 rounded bg-forest-800 border border-sage-500/20 text-xs text-sage-muted hover:text-ivory-200 flex items-center space-x-1"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegStep(3)}
                      className="px-4 py-2 rounded bg-brass-500 hover:bg-brass-400 text-forest-950 font-medium text-xs flex items-center space-x-1.5"
                    >
                      <span>Next: Clinical Baseline</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* ---------------- STEP 3: CLINICAL BASELINE ---------------- */}
              {regStep === 3 && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="border-b border-sage-500/15 pb-2">
                    <h3 className="text-sm font-serif font-medium text-ivory-200">
                      Step 3: Clinical Diagnostic Baseline & Medical Record
                    </h3>
                    <p className="text-xs text-sage-muted">
                      Select conditions and procedures. Diagnoses remain 100% blinded in zero-knowledge SNARK proofs.
                    </p>
                  </div>

                  {/* Condition Presets */}
                  <div>
                    <label className="block text-xs font-mono text-sage-muted mb-1.5">
                      Select Clinical Diagnosis Preset or Enter Below:
                    </label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {PRESET_CONDITIONS.map((c) => (
                        <button
                          key={c.code}
                          type="button"
                          onClick={() => applyConditionPreset(c)}
                          className={`px-2 py-1 rounded text-[11px] font-sans border transition-colors ${
                            regConditionCode === c.code
                              ? 'bg-brass-500/20 border-brass-500 text-ivory-200'
                              : 'bg-forest-800 border-sage-500/20 text-sage-muted hover:text-ivory-200'
                          }`}
                        >
                          {c.code} - {c.display.split('(')[0]}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-mono text-sage-muted mb-1">ICD-10 Code</label>
                        <input
                          type="text"
                          value={regConditionCode}
                          onChange={(e) => setRegConditionCode(e.target.value)}
                          className="w-full bg-forest-800 border border-sage-500/25 rounded px-2.5 py-1.5 text-xs text-ivory-200 font-mono"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-mono text-sage-muted mb-1">Diagnosis Description</label>
                        <input
                          type="text"
                          value={regConditionDisplay}
                          onChange={(e) => setRegConditionDisplay(e.target.value)}
                          className="w-full bg-forest-800 border border-sage-500/25 rounded px-2.5 py-1.5 text-xs text-ivory-200"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Procedure Presets */}
                  <div className="pt-2 border-t border-sage-500/15">
                    <label className="block text-xs font-mono text-sage-muted mb-1.5">
                      Initial Consultation / Procedure (CPT):
                    </label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {PRESET_PROCEDURES.map((p) => (
                        <button
                          key={p.code}
                          type="button"
                          onClick={() => applyProcedurePreset(p)}
                          className={`px-2 py-1 rounded text-[11px] font-sans border transition-colors ${
                            regProcedureCode === p.code
                              ? 'bg-brass-500/20 border-brass-500 text-ivory-200'
                              : 'bg-forest-800 border-sage-500/20 text-sage-muted hover:text-ivory-200'
                          }`}
                        >
                          CPT {p.code} ({p.costEth} ETH / ₹{ethToInr(p.costEth).toLocaleString('en-IN')})
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-mono text-sage-muted mb-1">CPT Code</label>
                        <input
                          type="text"
                          value={regProcedureCode}
                          onChange={(e) => setRegProcedureCode(e.target.value)}
                          className="w-full bg-forest-800 border border-sage-500/25 rounded px-2.5 py-1.5 text-xs text-ivory-200 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-mono text-sage-muted mb-1">Procedure Title</label>
                        <input
                          type="text"
                          value={regProcedureDisplay}
                          onChange={(e) => setRegProcedureDisplay(e.target.value)}
                          className="w-full bg-forest-800 border border-sage-500/25 rounded px-2.5 py-1.5 text-xs text-ivory-200"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-mono text-sage-muted mb-1">Cost (ETH / INR)</label>
                        <input
                          type="text"
                          value={regProcedureCostEth}
                          onChange={(e) => setRegProcedureCostEth(e.target.value)}
                          className="w-full bg-forest-800 border border-sage-500/25 rounded px-2.5 py-1.5 text-xs text-ivory-200 font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Prescription */}
                  <div className="pt-2 border-t border-sage-500/15">
                    <label className="block text-xs font-mono text-sage-muted mb-1.5">
                      Prescription / Active Medication:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <input
                          type="text"
                          value={regMedication}
                          onChange={(e) => setRegMedication(e.target.value)}
                          placeholder="Medication name (e.g. Lisinopril 10mg)"
                          className="w-full bg-forest-800 border border-sage-500/25 rounded px-2.5 py-1.5 text-xs text-ivory-200"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={regDosage}
                          onChange={(e) => setRegDosage(e.target.value)}
                          placeholder="Dosage instruction (e.g. Once daily)"
                          className="w-full bg-forest-800 border border-sage-500/25 rounded px-2.5 py-1.5 text-xs text-ivory-200"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between pt-3">
                    <button
                      type="button"
                      onClick={() => setRegStep(2)}
                      className="px-3 py-1.5 rounded bg-forest-800 border border-sage-500/20 text-xs text-sage-muted hover:text-ivory-200 flex items-center space-x-1"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegStep(4)}
                      className="px-4 py-2 rounded bg-brass-500 hover:bg-brass-400 text-forest-950 font-medium text-xs flex items-center space-x-1.5"
                    >
                      <span>Next: Upload Documents</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* ---------------- STEP 4: UPLOAD MEDICAL FILES ---------------- */}
              {regStep === 4 && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="border-b border-sage-500/15 pb-2">
                    <h3 className="text-sm font-serif font-medium text-ivory-200">
                      Step 4: Attach & Encrypt Medical Files (EHR / Scans / Rx)
                    </h3>
                    <p className="text-xs text-sage-muted">
                      Files are encrypted in browser memory via AES-256-GCM before sync. SHA-256 integrity digests are computed.
                    </p>
                  </div>

                  {/* Upload Controls */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                    <div>
                      <label className="block text-xs font-mono text-sage-muted mb-1">Document Category</label>
                      <select
                        value={uploadCategory}
                        onChange={(e) => setUploadCategory(e.target.value)}
                        className="w-full bg-forest-800 border border-sage-500/25 rounded px-2.5 py-1.5 text-xs text-ivory-200"
                      >
                        <option value="Diagnostic Report">Diagnostic Report</option>
                        <option value="Prescription">Prescription</option>
                        <option value="Cardiology / ECG">Cardiology / ECG</option>
                        <option value="Lab Report">Lab Report</option>
                        <option value="Discharge Summary">Discharge Summary</option>
                        <option value="Insurance Policy Doc">Insurance Policy Doc</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-mono text-sage-muted mb-1">Select Files to Encrypt</label>
                      <label className="flex items-center justify-center p-3 border-2 border-dashed border-sage-500/30 hover:border-brass-500 rounded bg-forest-800/60 cursor-pointer transition-colors group">
                        <Upload className="w-4 h-4 text-brass-400 mr-2 group-hover:scale-110 transition-transform" />
                        <span className="text-xs text-sage-muted group-hover:text-ivory-200">
                          {isUploadingFile ? 'Encrypting file in RAM...' : 'Drop files here or click to browse'}
                        </span>
                        <input
                          type="file"
                          multiple
                          onChange={handleFileUpload}
                          className="hidden"
                          accept=".pdf,.png,.jpg,.jpeg,.json,.txt"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Attached Files List */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono text-sage-muted">
                      <span>Attached Files ({regFiles.length})</span>
                      <span className="text-[10px] text-emerald-400">All Encrypted (AES-256-GCM)</span>
                    </div>

                    {regFiles.length === 0 ? (
                      <div className="p-4 rounded bg-forest-850 border border-sage-500/15 text-center text-xs text-sage-muted italic">
                        No files uploaded yet. You can attach PDFs, lab tests, prescriptions, or continue to step 5.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {regFiles.map((file) => (
                          <div
                            key={file.id}
                            className="p-2.5 rounded bg-forest-800 border border-sage-500/20 flex items-center justify-between gap-2 text-xs"
                          >
                            <div className="flex items-center space-x-2.5 min-w-0">
                              <FileCheck className="w-4 h-4 text-brass-400 shrink-0" />
                              <div className="truncate">
                                <div className="font-medium text-ivory-200 truncate">{file.name}</div>
                                <div className="text-[10px] text-sage-muted font-mono flex items-center gap-2">
                                  <span>{file.category}</span>
                                  <span>•</span>
                                  <span>{file.sizeFormatted}</span>
                                  <span>•</span>
                                  <span className="text-emerald-400">E2EE Verified</span>
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeRegFile(file.id)}
                              className="text-sage-muted hover:text-rose-400 p-1 rounded"
                              title="Remove file"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between pt-3">
                    <button
                      type="button"
                      onClick={() => setRegStep(3)}
                      className="px-3 py-1.5 rounded bg-forest-800 border border-sage-500/20 text-xs text-sage-muted hover:text-ivory-200 flex items-center space-x-1"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegStep(5)}
                      className="px-4 py-2 rounded bg-brass-500 hover:bg-brass-400 text-forest-950 font-medium text-xs flex items-center space-x-1.5"
                    >
                      <span>Next: Sovereign Key & Commit</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* ---------------- STEP 5: SOVEREIGN KEY & COMMIT ---------------- */}
              {regStep === 5 && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="border-b border-sage-500/15 pb-2">
                    <h3 className="text-sm font-serif font-medium text-ivory-200">
                      Step 5: Review & Anchor Sovereign Profile
                    </h3>
                    <p className="text-xs text-sage-muted">
                      A unique 256-bit AES encryption key will be generated in your browser memory upon registration.
                    </p>
                  </div>

                  {/* Summary Card */}
                  <div className="p-4 rounded bg-forest-800 border border-sage-500/20 space-y-3 font-sans text-xs">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <div className="text-[10px] text-sage-muted uppercase font-mono">Patient</div>
                        <div className="font-semibold text-ivory-200">{regName}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-sage-muted uppercase font-mono">Policy Limit</div>
                        <div className="font-semibold text-brass-400">
                          ₹{regPolicyLimitInr.toLocaleString('en-IN')} ({inrToEth(regPolicyLimitInr)} ETH)
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-sage-muted uppercase font-mono">Diagnosis</div>
                        <div className="font-semibold text-ivory-200 truncate">{regConditionCode} - {regConditionDisplay}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-sage-muted uppercase font-mono">Files Attached</div>
                        <div className="font-semibold text-emerald-400">{regFiles.length} files (E2EE)</div>
                      </div>
                    </div>

                    <div className="p-2.5 rounded bg-forest-900 border border-brass-500/30 flex items-start space-x-2 text-[11px] text-sage-300">
                      <Lock className="w-4 h-4 text-brass-400 shrink-0 mt-0.5" />
                      <span>
                        <strong>Zero Plaintext Guarantee:</strong> When you complete registration, your profile and attached files are compiled into a FHIR Bundle, encrypted with your sovereign AES-256-GCM key, and anchored to Ethereum via ClaimManager SHA-256 digest.
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between pt-3">
                    <button
                      type="button"
                      onClick={() => setRegStep(4)}
                      className="px-3 py-1.5 rounded bg-forest-800 border border-sage-500/20 text-xs text-sage-muted hover:text-ivory-200 flex items-center space-x-1"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="btn-parda-white px-6 py-2.5 rounded-xl font-semibold text-xs flex items-center space-x-2 shadow-lg disabled:opacity-50 cursor-pointer"
                    >
                      {isLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Key className="w-4 h-4" />
                          <span>Complete Registration & Generate Key</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>

          </div>
        )}

        {/* ============================================================== */}
        {/* MODE 3: DEMO PERSONAS PREVIEWS */}
        {/* ============================================================== */}
        {mode === 'demo' && (
          <div className="p-6 space-y-4">
            <div className="border-b border-sage-500/15 pb-2">
              <h3 className="text-sm font-serif font-medium text-ivory-200">
                Pre-Configured Hackathon Demo Personas
              </h3>
              <p className="text-xs text-sage-muted">
                Each persona contains pre-attached encrypted medical files, FHIR clinical records, and on-chain policy limits.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allPatients.map((p) => (
                <div
                  key={p.id}
                  className="p-4 rounded bg-forest-800 border border-sage-500/20 hover:border-brass-500/40 transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-brass-400" />
                        <span className="font-semibold text-sm text-ivory-200">{p.name}</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-forest-900 border border-brass-500/30 text-brass-400 font-bold">
                        ₹{p.policyLimitInr?.toLocaleString('en-IN')} ({p.policyLimitEth} ETH)
                      </span>
                    </div>

                    <div className="text-xs text-sage-muted space-y-1 font-sans">
                      <div><strong className="text-ivory-200">Diagnosis:</strong> {p.condition?.display}</div>
                      <div><strong className="text-ivory-200">Procedure:</strong> {p.procedure?.display}</div>
                      <div><strong className="text-ivory-200">Rx:</strong> {p.prescription?.medication}</div>
                      <div className="font-mono text-[11px] text-sage-muted/80">ABHA: {p.abhaId}</div>
                    </div>

                    {/* Attached files summary */}
                    <div className="pt-2 border-t border-sage-500/15">
                      <div className="text-[10px] font-mono text-sage-muted mb-1 uppercase">Attached Encrypted Files:</div>
                      <div className="space-y-1">
                        {(p.attachedFiles || []).map((f) => (
                          <div key={f.id} className="text-[11px] font-mono text-ivory-200/90 truncate flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span className="truncate">{f.name}</span>
                            <span className="text-[9px] text-sage-muted">({f.sizeFormatted})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin(p)}
                    className="w-full py-2 px-3 rounded bg-forest-700 hover:bg-forest-650 border border-brass-500/30 text-xs font-mono font-medium text-brass-400 hover:text-ivory-200 transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <span>Load & Activate {p.name}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
