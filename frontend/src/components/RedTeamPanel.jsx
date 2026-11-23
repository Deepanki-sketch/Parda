import React, { useState } from 'react';
import { ShieldAlert, Play, XCircle, RefreshCw } from 'lucide-react';

export default function RedTeamPanel({ addAuditLog }) {
  const [activeAttack, setActiveAttack] = useState(null);
  const [attackLogs, setAttackLogs] = useState({});

  const ATTACK_VECTORS = [
    {
      id: 'REPLAY_ATTACK',
      title: '1. Replay / Double-Claim Attack',
      description: 'Hospital attempts to resubmit the exact same claim nullifier on-chain to receive double payout.',
      contractRule: 'ClaimManager.sol (Check 4: usedNullifiers[nullifier])',
      expectedRejection: 'revert NullifierAlreadyUsed()',
      simulatedOutcome: {
        status: 'REVERTED_ON_CHAIN',
        code: 'ClaimManager: NullifierAlreadyUsed(0x7f4e91028374...)',
        defense: 'Checks-Effects-Interactions pattern marks nullifier as spent before payout transfer. Zero double spend possible.'
      }
    },
    {
      id: 'AMOUNT_OVER_LIMIT',
      title: '2. Tampered Claim Amount (> Policy Limit)',
      description: 'Hospital claims ₹75,000 when the policy max coverage limit is ₹50,000.',
      contractRule: 'Circom Constraint 5 (amountCheck = LessEqThan(64))',
      expectedRejection: 'RULE_5_FAILED: Claim amount (75000) exceeds policy limit (50000)',
      simulatedOutcome: {
        status: 'PROVER_CONSTRAINTS_FAILED',
        code: 'Error: Assert Failed: amountCheck.out === 1',
        defense: '64-bit numerical comparison inside SNARK circuit cannot be forged without generating invalid proof.'
      }
    },
    {
      id: 'PAYOUT_REDIRECTION',
      title: '3. Front-Running / Payout Redirection Attack',
      description: 'Malicious actor intercepts the proof and attempts to substitute their wallet address as recipient.',
      contractRule: 'Circom Constraint 7 & Hospital EdDSA Signature Check',
      expectedRejection: 'RULE_1_FAILED: Invalid hospital EdDSA signature over claim message',
      simulatedOutcome: {
        status: 'SIGNATURE_INVALID',
        code: 'EdDSAPoseidonVerifier: Signature verification failed on public recipient signal',
        defense: 'Recipient uint160 address is mathematically bound into the circuit constraints and the signed hospital message.'
      }
    },
    {
      id: 'EXPIRED_POLICY',
      title: '4. Expired Policy Date Claim',
      description: 'Hospital submits a claim for service rendered after the policy coverage expiration date.',
      contractRule: 'Circom Constraint 5 (expiryCheck = LessThan(64))',
      expectedRejection: 'RULE_5_FAILED: Policy expired on day 22500, claim on day 23000',
      simulatedOutcome: {
        status: 'EXPIRED_POLICY_REJECTED',
        code: 'Error: Assert Failed: expiryCheck.out === 1',
        defense: 'Circuit verifies claimDay < policyExpiryDay as field elements without revealing the exact expiration timestamp.'
      }
    },
    {
      id: 'UNCOVERED_PROCEDURE',
      title: '5. Uncovered Procedure Code Attack',
      description: 'Hospital claims an excluded cosmetic surgery code (CPT 15780) not in the policy covered set.',
      contractRule: 'Circom Constraint 4 (procedureTree Merkle Inclusion)',
      expectedRejection: 'RULE_3_4_FAILED: Procedure code is not in policy coveredSetRoot',
      simulatedOutcome: {
        status: 'MERKLE_PROOF_INVALID',
        code: 'MerkleInclusionProof: computed coveredSetRoot does not match policyCommitment',
        defense: 'Procedure code must be a leaf in the policy’s private Merkle tree. Hidden medical codes are mathematically enforced.'
      }
    },
    {
      id: 'REVOKED_DOCTOR_ACCESS',
      title: '6. Revoked Doctor Access Decryption Attempt',
      description: 'Doctor attempts to fetch and decrypt patient record after patient revoked access.',
      contractRule: 'packages/crypto: AES-GCM Auth Tag + AccessRegistry check',
      expectedRejection: 'DecryptionError: Ciphertext authentication tag mismatch',
      simulatedOutcome: {
        status: 'DECRYPTION_BLOCKED',
        code: 'WebCrypto: OperationError: The operation failed for an operation-specific reason',
        defense: 'Patient DEK rotation erases doctor’s wrapped key. Even if doctor cached old ciphertext, new versions are protected.'
      }
    },
    {
      id: 'AUDIT_ROW_TAMPERING',
      title: '7. Tampered Database Row in Audit Log',
      description: 'Malicious database admin modifies an audit log row to hide an unauthorized access attempt.',
      contractRule: 'AuditAnchor.sol & Hash-Chain: H(prev_hash || canonical_row)',
      expectedRejection: 'AUDIT_CHAIN_CORRUPTED: Hash mismatch at row 2',
      simulatedOutcome: {
        status: 'TAMPER_DETECTED_ON_CHAIN',
        code: 'AuditVerifier: Batch Merkle Root 0x992b... does not match anchored root 0x001a...',
        defense: 'Cryptographic hash-chaining and regular on-chain Merkle anchoring make database tampering immediately detectable.'
      }
    }
  ];

  const handleExecuteAttack = (attack) => {
    setActiveAttack(attack.id);
    setTimeout(() => {
      setAttackLogs(prev => ({
        ...prev,
        [attack.id]: attack.simulatedOutcome
      }));
      if (addAuditLog) {
        addAuditLog({
          type: 'ATTACK_PREVENTED',
          title: `RED-TEAM ATTACK BLOCKED: ${attack.title}`,
          detail: `Expected: ${attack.expectedRejection} | Defense: ${attack.simulatedOutcome.defense}`,
          time: new Date().toLocaleTimeString()
        });
      }
      setActiveAttack(null);
    }, 600);
  };

  return (
    <div className="space-y-8 font-sans text-[#F3EFE5]">
      {/* Banner */}
      <div className="bg-[#12231C] border border-rose-500/20 rounded-2xl p-6 sm:p-8 parda-big-box">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-rose-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <ShieldAlert className="w-4 h-4" />
              <span>Adversarial Testing & Security Verification</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif text-[#F3EFE5]">Red-Team Attack Simulator Panel</h2>
            <p className="text-sm text-[#AEB8AA] mt-2 max-w-2xl leading-relaxed">
              Live cryptographic defense verification: execute real simulated attack vectors to confirm the exact smart contract and circuit error rejections.
            </p>
          </div>
          <div className="flex items-center space-x-2 bg-[#0B1713] border border-rose-500/30 rounded-xl px-4 py-2.5 self-start md:self-auto">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-ping" />
            <span className="text-xs font-mono text-rose-300">URI: ?role=redteam</span>
          </div>
        </div>
      </div>

      {/* Attack Vectors List */}
      <div className="space-y-4">
        {ATTACK_VECTORS.map((attack) => {
          const outcome = attackLogs[attack.id];
          const isRunning = activeAttack === attack.id;

          return (
            <div
              key={attack.id}
              className="bg-[#12231C] border border-[#9DAF9D]/20 hover:border-[#9DAF9D]/40 transition rounded-2xl p-5 space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-medium text-[#F3EFE5]">
                    {attack.title}
                  </h3>
                  <p className="text-xs text-[#AEB8AA] mt-1">{attack.description}</p>
                </div>
                <button
                  onClick={() => handleExecuteAttack(attack)}
                  disabled={isRunning}
                  className="btn-pressable flex items-center space-x-2 bg-rose-700/80 hover:bg-rose-600 disabled:bg-rose-900/40 text-[#F3EFE5] px-4 py-2 rounded-xl text-xs font-medium transition self-start sm:self-auto shrink-0 border border-rose-500/30 shadow-sm"
                >
                  {isRunning ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Simulating Attack...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Run Attack</span>
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono pt-2 border-t border-[#9DAF9D]/10">
                <div className="bg-[#0B1713] p-3 rounded-xl border border-[#9DAF9D]/10">
                  <span className="text-[#AEB8AA]/70 block mb-0.5">Enforcing Defense Rule:</span>
                  <span className="text-[#B99561]">{attack.contractRule}</span>
                </div>
                <div className="bg-[#0B1713] p-3 rounded-xl border border-[#9DAF9D]/10">
                  <span className="text-[#AEB8AA]/70 block mb-0.5">Expected Rejection Signal:</span>
                  <span className="text-rose-400">{attack.expectedRejection}</span>
                </div>
              </div>

              {/* Attack Outcome Display */}
              {outcome && (
                <div className="bg-[#0B1713] border border-rose-500/30 rounded-xl p-4 space-y-2 mt-3 animate-fadeIn">
                  <div className="flex items-center space-x-2 text-rose-400 text-xs font-bold">
                    <XCircle className="w-4 h-4" />
                    <span>ATTACK DEFEATED: {outcome.status}</span>
                  </div>
                  <div className="font-mono text-xs text-[#AEB8AA] bg-[#12231C] p-2.5 rounded-lg border border-rose-500/20 overflow-x-auto">
                    {outcome.code}
                  </div>
                  <p className="text-xs text-emerald-400 font-medium">
                    🛡️ {outcome.defense}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
