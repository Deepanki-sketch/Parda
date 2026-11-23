/**
 * @file frontend/src/contracts/abis.js
 * Minimal ABI interfaces for ClaimManager, HospitalRegistry, and Groth16Verifier
 */

export const ClaimManagerABI = [
  "function submitClaim(uint256[2] a, uint256[2][2] b, uint256[2] c, uint256[6] pubSignals) external returns (bytes32)",
  "function fund() external payable",
  "function depositPool() external payable",
  "function escrowBalance() external view returns (uint256)",
  "function payoutWeiPerRupee() external view returns (uint256)",
  "function registeredPolicies(bytes32 commitment) external view returns (bool)",
  "function policyLimit(bytes32 commitment) external view returns (uint256)",
  "function policySpent(bytes32 commitment) external view returns (uint256)",
  "function registerPolicy(bytes32 commitment, uint256 limit) external",
  "event PolicyRegistered(bytes32 indexed commitment, uint256 registeredAt)",
  "event EscrowFunded(address indexed insurer, uint256 amount, uint256 newBalance)",
  "event ClaimVerified(bytes32 indexed nullifier, bytes32 indexed policyCommitment, uint256 claimAmount, address indexed recipient, uint256 payoutWei, uint256 remainingPolicyBalance)"
];

export const HospitalRegistryABI = [
  "function isValidRoot(bytes32 root) external view returns (bool)",
  "function activeHospitalRoot() external view returns (bytes32)"
];

export const VerifierABI = [
  "function verifyProof(uint256[2] a, uint256[2][2] b, uint256[2] c, uint256[6] input) external view returns (bool)"
];
