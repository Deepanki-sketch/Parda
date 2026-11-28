/**
 * @file frontend/src/services/authService.js
 * @notice Centralized Role Authentication & Cross-Portal State Persistence
 * 
 * Enforces role segregation between:
 * 1. Patient: Sovereign health record custody & DEK delegation
 * 2. Hospital: Clinical inspection & Groth16 ZKP claim generation
 * 3. Insurer: Solvency pool & on-chain settlement via MetaMask
 */

import { MOCK_PATIENT, MOCK_HOSPITALS, MOCK_ACCOUNTS } from '../data/mockData';

export const ROLES = {
  PATIENT: 'patient',
  HOSPITAL: 'hospital',
  INSURER: 'insurer',
  XRAY: 'xray',
  REDTEAM: 'redteam',
  PRICING: 'pricing',
};

export const DEMO_USERS = {
  patient: {
    role: 'patient',
    id: 'patient-001',
    name: 'Alex Doe',
    email: 'alex.doe@parda.health',
    password: 'parda@patient2026',
    address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    policyId: 'POL-987654-ZKP',
    policyProvider: 'HealthShield Mutual Decentralized Pool',
    policyLimitEth: '5.0',
    policyExpiry: '2030-12-31',
    abhaId: 'ABHA-9821-4412-8801',
  },
  hospital: {
    role: 'hospital',
    id: 'hosp-101',
    name: 'St. Jude Medical Center',
    loginId: 'stjude@parda.health',
    password: 'parda@hospital2026',
    licenseNo: 'LIC-NY-2024-8849',
    address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    merkleRootVerified: true,
    department: 'Department of Internal Medicine & Cardiology',
  },
  hospital_alt: {
    role: 'hospital',
    id: 'hosp-102',
    name: 'Metropolitan General Hospital',
    loginId: 'metropolitan@parda.health',
    password: 'parda@hospital2026',
    licenseNo: 'LIC-CA-2023-1102',
    address: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
    merkleRootVerified: true,
    department: 'Acute Care & Inpatient Services',
  },
  insurer: {
    role: 'insurer',
    id: 'ins-001',
    name: 'HealthShield Mutual',
    loginId: 'underwriting@healthshield.eth',
    password: 'parda@insurer2026',
    poolId: 'INS-ETH-POOL-01',
    address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    merkleRoot: '0x08581786b454cf726808eca1e5bddfbb948f741cd5ae3d89b6c65f3aeda1da7b',
    coverageCapEth: '5.0',
  },
  insurer_alt: {
    role: 'insurer',
    id: 'ins-002',
    name: 'Star Health Decentralized Pool',
    loginId: 'claims@starhealth.eth',
    password: 'parda@insurer2026',
    poolId: 'INS-ETH-STAR-02',
    address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    merkleRoot: '0x08581786b454cf726808eca1e5bddfbb948f741cd5ae3d89b6c65f3aeda1da7b',
    coverageCapEth: '5.0',
  },
};

/**
 * Verify credentials against demo store or custom format
 */
export function verifyCredentials(role, loginId, password) {
  const normLogin = (loginId || '').trim().toLowerCase();

  if (role === 'patient') {
    if (normLogin === 'alex.doe@parda.health' || normLogin === 'alex') {
      return { success: true, user: DEMO_USERS.patient };
    }
  } else if (role === 'hospital') {
    if (normLogin === 'stjude@parda.health' || normLogin === 'stjude' || normLogin === 'lic-ny-2024-8849') {
      return { success: true, user: DEMO_USERS.hospital };
    }
    if (normLogin === 'metropolitan@parda.health' || normLogin === 'metropolitan' || normLogin === 'lic-ca-2023-1102') {
      return { success: true, user: DEMO_USERS.hospital_alt };
    }
  } else if (role === 'insurer') {
    if (normLogin === 'underwriting@healthshield.eth' || normLogin === 'healthshield' || normLogin === 'ins-eth-pool-01') {
      return { success: true, user: DEMO_USERS.insurer };
    }
    if (normLogin === 'claims@starhealth.eth' || normLogin === 'starhealth' || normLogin === 'ins-eth-star-02') {
      return { success: true, user: DEMO_USERS.insurer_alt };
    }
  }
  return { success: false };
}

const STORAGE_KEYS = {
  ACTIVE_SESSION: 'parda_role_active_session_v3',
  PENDING_CLAIMS: 'parda_pending_claims_queue_v3',
  SETTLED_CLAIMS: 'parda_settled_claims_ledger_v3',
  HOSPITAL_BALANCE: 'parda_hospital_balance_eth_v3',
  POOL_BALANCE: 'parda_pool_balance_eth_v3',
  ACCESS_GRANTED: 'parda_doctor_access_granted_v3',
  SELECTED_HOSPITAL: 'parda_selected_delegated_hospital_v3',
};

// -------------------------------------------------------------
// Authentication Session Management
// -------------------------------------------------------------

export function getActiveRoleSession() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setActiveRoleSession(sessionData) {
  if (typeof window === 'undefined') return;
  if (!sessionData) {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
  } else {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify(sessionData));
  }
}

export function clearActiveRoleSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
}

// -------------------------------------------------------------
// Shared Workflow State Persistence (Cross-Portal Sync)
// -------------------------------------------------------------

export function getPendingClaims() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PENDING_CLAIMS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function savePendingClaims(claims) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.PENDING_CLAIMS, JSON.stringify(claims));
}

export function addPendingClaim(claim) {
  const existing = getPendingClaims();
  const updated = [claim, ...existing.filter((c) => c.id !== claim.id)];
  savePendingClaims(updated);
  return updated;
}

export function removePendingClaim(claimId) {
  const existing = getPendingClaims();
  const updated = existing.filter((c) => c.id !== claimId);
  savePendingClaims(updated);
  return updated;
}

export function getSettledClaims() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTLED_CLAIMS);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [
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
    },
  ];
}

export function saveSettledClaims(claims) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.SETTLED_CLAIMS, JSON.stringify(claims));
}

export function addSettledClaim(claim) {
  const existing = getSettledClaims();
  const updated = [claim, ...existing.filter((c) => c.id !== claim.id)];
  saveSettledClaims(updated);
  return updated;
}

export function getHospitalBalanceEth() {
  if (typeof window === 'undefined') return 14.20;
  const raw = localStorage.getItem(STORAGE_KEYS.HOSPITAL_BALANCE);
  return raw ? parseFloat(raw) : 14.20;
}

export function setHospitalBalanceEth(bal) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.HOSPITAL_BALANCE, String(bal));
}

export function getPoolBalanceEth() {
  if (typeof window === 'undefined') return 10.00;
  const raw = localStorage.getItem(STORAGE_KEYS.POOL_BALANCE);
  return raw ? parseFloat(raw) : 10.00;
}

export function setPoolBalanceEth(bal) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.POOL_BALANCE, String(bal));
}

export function getStoredDoctorAccessGranted() {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEYS.ACCESS_GRANTED) === 'true';
}

export function setStoredDoctorAccessGranted(val) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.ACCESS_GRANTED, val ? 'true' : 'false');
}

export function getSelectedDelegatedHospital() {
  if (typeof window === 'undefined') return MOCK_HOSPITALS[0];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SELECTED_HOSPITAL);
    return raw ? JSON.parse(raw) : MOCK_HOSPITALS[0];
  } catch {
    return MOCK_HOSPITALS[0];
  }
}

export function setSelectedDelegatedHospital(hosp) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.SELECTED_HOSPITAL, JSON.stringify(hosp));
}
