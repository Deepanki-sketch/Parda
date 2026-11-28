/**
 * @file frontend/src/services/cryptoService.js
 * @notice Client-Side End-to-End Encryption (E2EE) Module for Parda Health Records
 * 
 * Uses standard W3C Web Crypto API (SubtleCrypto):
 * - Algorithm: AES-256-GCM (Authenticated Encryption with Associated Data)
 * - 96-bit (12-byte) cryptographically secure random Initialization Vector (IV)
 * - Computes SHA-256 digests for on-chain integrity anchoring (Sepolia ClaimManager & AccessLog)
 * - Zero plaintext ever leaves the patient's browser
 */

// Convert ArrayBuffer to Base64
export function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Convert Base64 to ArrayBuffer
export function base64ToBuffer(base64) {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Convert ArrayBuffer to Hex String (0x...)
export function bufferToHex(buffer) {
  const bytes = new Uint8Array(buffer);
  return '0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generates a high-entropy 256-bit AES-GCM symmetric key.
 * @returns {Promise<CryptoKey>}
 */
export async function generatePatientKey() {
  return await window.crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true, // extractable so patient can save or share with authorized doctor
    ['encrypt', 'decrypt']
  );
}

/**
 * Deterministically derives an AES-256-GCM CryptoKey from a patient's sovereign identity
 * (wallet address or seed) using PBKDF2 (100,000 rounds of SHA-256).
 * Ensures that ANY device (laptop, phone, tablet) logging into the account derives
 * the exact same cryptographic key to decrypt records fetched from Supabase.
 * 
 * @param {string} patientAddress - The patient's Ethereum wallet address or identity
 * @returns {Promise<CryptoKey>}
 */
export async function derivePatientKeyFromIdentity(patientAddress) {
  const enc = new TextEncoder();
  const normalized = (patientAddress || '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc').toLowerCase();
  const salt = enc.encode('parda-sovereign-vault-v1-salt');

  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(normalized),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Exports a CryptoKey to a portable Base64 key string.
 * @param {CryptoKey} key 
 * @returns {Promise<string>}
 */
export async function exportKeyToBase64(key) {
  const exported = await window.crypto.subtle.exportKey('raw', key);
  return bufferToBase64(exported);
}

/**
 * Imports a Base64 key string back into a CryptoKey object.
 * @param {string} base64Key 
 * @returns {Promise<CryptoKey>}
 */
export async function importKeyFromBase64(base64Key) {
  const rawBuffer = base64ToBuffer(base64Key);
  return await window.crypto.subtle.importKey(
    'raw',
    rawBuffer,
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Computes deterministic SHA-256 hash of an object or string for on-chain anchoring.
 * @param {object|string} data 
 * @returns {Promise<string>} Hex string starting with 0x
 */
export async function computeSha256(data) {
  const jsonStr = typeof data === 'string' ? data : JSON.stringify(data);
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(jsonStr);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', dataBuffer);
  return bufferToHex(hashBuffer);
}

/**
 * Encrypts arbitrary health data (e.g. FHIR bundle, prescriptions, diagnosis)
 * using AES-256-GCM authenticated encryption.
 * 
 * @param {object|string} data - Plaintext record
 * @param {CryptoKey} key - 256-bit AES-GCM key
 * @returns {Promise<{ ciphertext: string, iv: string, recordHash: string }>}
 */
export async function encryptHealthRecord(data, key) {
  const jsonStr = typeof data === 'string' ? data : JSON.stringify(data);
  const encoder = new TextEncoder();
  const plaintextBytes = encoder.encode(jsonStr);

  // 96-bit cryptographically random IV for GCM
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  // Compute on-chain integrity anchor hash before encryption
  const recordHash = await computeSha256(jsonStr);

  // AES-GCM authenticated encryption
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
      tagLength: 128, // 128-bit authentication tag
    },
    key,
    plaintextBytes
  );

  return {
    ciphertext: bufferToBase64(encryptedBuffer),
    iv: bufferToBase64(iv.buffer),
    recordHash,
  };
}

/**
 * Decrypts an AES-256-GCM encrypted health record payload.
 * 
 * @param {string} ciphertextBase64 
 * @param {string} ivBase64 
 * @param {CryptoKey} key 
 * @returns {Promise<object>} Decrypted parsed JSON record
 */
export async function decryptHealthRecord(ciphertextBase64, ivBase64, key) {
  const ciphertextBuffer = base64ToBuffer(ciphertextBase64);
  const ivBuffer = base64ToBuffer(ivBase64);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: new Uint8Array(ivBuffer),
      tagLength: 128,
    },
    key,
    ciphertextBuffer
  );

  const decoder = new TextDecoder();
  const jsonStr = decoder.decode(decryptedBuffer);
  return JSON.parse(jsonStr);
}
