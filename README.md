# PARDA — Privacy-Preserving Health Records & ZKP Insurance Claims
**Live Demo:** [https://parda-snowy.vercel.app/](https://parda-snowy.vercel.app/)

---

## 1. Project Overview

**Parda** is an end-to-end decentralized architecture that allows patients to maintain full sovereign ownership over their medical records while enabling hospitals to submit zero-knowledge insurance claims that settle autonomously on Ethereum without revealing sensitive diagnoses, procedure details, or prescriptions.

### The Problem
Traditional health insurance workflows require patients and hospitals to transmit unencrypted diagnostic codes, itemized medical procedures, and prescription histories to third-party insurance underwriters. This results in mass data exposure, centralized leaks, and slow manual claim approvals.

### The Parda Solution
1. **Patient-Held Keys:** Patients encrypt their HL7 FHIR records client-side in the browser using AES-256-GCM. Decryption keys are held strictly by the patient and shared via ephemeral ECDH P-256 key wrapping with doctors.
2. **In-Circuit Zero-Knowledge Proofs:** A hospital-side prover generates a Groth16 zero-knowledge proof proving:
   - The treating hospital holds an active licensed status in the regulator's Merkle tree (depth 8).
   - The hospital signed the claim with an EdDSA Baby Jubjub key verified **inside the circuit**.
   - The medical procedure exists within the policy's approved covered set Merkle tree (depth 6).
   - The claim amount is within the policy coverage cap and the service date precedes policy expiration.
3. **Autonomous On-Chain Settlement:** The insurer's `ClaimManager.sol` smart contract verifies the proof, checks against duplicate nullifiers, and automatically releases payouts from an escrow pool directly to the hospital.

---

## 2. Contrast with Prior Art

| Capability | ClaimShield (Chainlink CRE) | MedZK | **Parda (Our Design)** |
| :--- | :--- | :--- | :--- |
| **Eligibility Verification** | Hardware TEE Enclave (Chainlink CRE) | Browser Noir proof | **Pure Zero-Knowledge SNARK (`circomlib` Groth16)** |
| **Trust Model** | Trusts third-party enclave hardware and cloud provider | Lab signs claim bundle | **Hospital signature verified INSIDE the circuit + 2-of-3 Regulator Multi-Sig Merkle tree** |
| **Medical Privacy** | Enclave sees plaintext medical data | Plaintext decrypted off-chain | **Zero plaintext exposure to server, insurer, or blockchain** |
| **Key Ownership** | Custodial / Enclave managed | Browser key | **Client-side WebCrypto (ECDH + ECDSA) + Ephemeral Key Wrapping** |
| **Anti-Replay Defense** | Database uniqueness checks | Basic nullifier | **Mathematical Nullifier: $\text{Poseidon}(\text{policySalt}, \text{recordId})$ + Checks-Effects-Interactions** |

*Note: While ClaimShield trusts a hardware enclave (TEE) to process live FHIR records, Parda proves eligibility cryptographically inside a Zero-Knowledge circuit, ensuring no third party ever inspects plaintext records.*

---

## 3. Quick Start & Execution

### 1. Run the Full Automated End-to-End Demo
Executes the full cryptographic lifecycle, smart contract deployment, escrow funding, ZKP preflight verification, on-chain settlement, and all 4 Red-Team attack vectors:
```powershell
# From the Parda directory:
npm run demo
```

### 2. Run the Interactive Web Portal
Launch the 3-role portal (Patient, Hospital, Insurer) with the **Privacy X-Ray** and **Red-Team Attack Simulator**:
```powershell
cd frontend
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Run Test Suites
```powershell
# Run Client-Side Cryptography tests (WebCrypto, DEK wrap, AES-GCM)
npm run test:crypto

# Run Zero-Knowledge Circuit & Preflight tests (8 vectors)
npm run test:zk

# Run Smart Contract unit tests (ClaimManager, HospitalRegistry, AccessLog)
npm run test:contracts
```

---

## 4. Key Limitations & Disclaimers

1. **Dev-Only Trusted Setup:** For the purposes of this hackathon demo, the Groth16 setup uses a local development ceremony. Production deployments must participate in a multi-party Powers-of-Tau ceremony (e.g. Perpetual Powers of Tau).
2. **Key Loss:** Patient private keys are stored in client-side IndexedDB and can be exported as keyfiles. In accordance with zero-knowledge sovereignty, key loss results in data loss.
3. **Simulated Escrow:** Contract payouts use testnet ETH / native tokens with a configurable `payoutWeiPerRupee` exchange constant.
4. **FHIR Compliance:** Record structures are inspired by HL7 FHIR R4 standard bundles for hackathon demonstration and are not formally certified ABDM/NHCX endpoints.
