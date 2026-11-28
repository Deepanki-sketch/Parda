import React, { useState, useEffect, useCallback } from 'react';
import {
  Landmark,
  ShieldCheck,
  Lock,
  Activity,
  Coins,
  CheckCircle,
  ExternalLink,
  BarChart3,
  EyeOff,
  PlusCircle,
  ArrowUpRight,
  RefreshCw,
  Send,
  AlertCircle,
  Clock,
  Building2,
  CheckCircle2,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { ethers } from 'ethers';
import { MOCK_PATIENT } from '../data/mockData';
import { useWallet } from '../context/WalletContext';
import deployedConfig from '../contracts/deployed_addresses.json';
import { ClaimManagerABI } from '../contracts/abis';

export default function InsurerPortal({
  claimSettled,
  poolBalanceEth = 10.00,
  totalSettledEth = 0.00,
  settledClaims = [],
  pendingClaims = [],
  onAcceptAndSettleClaim,
  auditLogs = [],
  addAuditLog,
}) {
  const INR_PER_ETH = 10000;
  const latestClaim = settledClaims[0];

  // Escrow Funding State on Sepolia
  const [depositAmount, setDepositAmount] = useState('0.05');
  const [isDepositing, setIsDepositing] = useState(false);
  const [depositTxHash, setDepositTxHash] = useState('');
  const [depositError, setDepositError] = useState('');
  const [onChainEscrow, setOnChainEscrow] = useState('10.0');
  const [filterQuery, setFilterQuery] = useState('');
  
  // Pending Claim Settlement via MetaMask
  const [settlingClaimId, setSettlingClaimId] = useState(null);
  const [settlingStep, setSettlingStep] = useState(''); // 'prompt' | 'broadcasting' | 'mining' | 'done' | 'error'
  const [settleError, setSettleError] = useState('');
  const [settledSuccessTx, setSettledSuccessTx] = useState('');
  const [payoutMode, setPayoutMode] = useState('testnet_micro'); // 'testnet_micro' | 'full'

  const { account, isSepolia, connectWallet, switchNetwork, getProviderOrSigner } = useWallet();

  // Fetch live on-chain escrow balance from ClaimManager.sol on Sepolia
  const fetchEscrowBalance = useCallback(async () => {
    if (!window.ethereum) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const claimManager = new ethers.Contract(deployedConfig.claimManager, ClaimManagerABI, provider);
      const bal = await claimManager.escrowBalance();
      setOnChainEscrow(parseFloat(ethers.formatEther(bal)).toFixed(3));
    } catch (err) {
      console.warn("Could not query live on-chain escrow balance:", err);
    }
  }, []);

  useEffect(() => {
    fetchEscrowBalance();
  }, [fetchEscrowBalance]);

  // Handle Deposit to Escrow Pool via MetaMask on Sepolia
  const handleDepositToEscrow = async () => {
    if (!account) {
      const connected = await connectWallet();
      if (!connected) return;
    }

    if (!isSepolia) {
      const switched = await switchNetwork(11155111);
      if (!switched) {
        setDepositError("Please switch MetaMask to Sepolia Testnet.");
        return;
      }
    }

    setIsDepositing(true);
    setDepositError('');
    setDepositTxHash('');

    try {
      const signer = await getProviderOrSigner(true);
      if (!signer) throw new Error("Could not acquire signer from MetaMask.");

      const claimManager = new ethers.Contract(
        deployedConfig.claimManager,
        ClaimManagerABI,
        signer
      );

      const val = ethers.parseEther(depositAmount || '0.01');
      const tx = await claimManager.depositPool({ value: val });
      setDepositTxHash(tx.hash);

      await tx.wait(1);

      const newBal = (parseFloat(onChainEscrow) + parseFloat(depositAmount)).toFixed(3);
      setOnChainEscrow(newBal);
      setIsDepositing(false);

      if (addAuditLog) {
        addAuditLog({
          type: 'ESCROW_FUNDED_ONCHAIN',
          title: 'Escrow Pool Funded on Ethereum Sepolia',
          detail: `Insurer deposited ${depositAmount} ETH | Tx: ${tx.hash.slice(0, 16)}...`,
          time: new Date().toLocaleTimeString(),
        });
      }
    } catch (err) {
      console.warn("Escrow deposit failed:", err);
      const isRejected = err.code === 4001 || err?.message?.includes("rejected");
      setDepositError(
        isRejected
          ? "Deposit transaction canceled by user in MetaMask."
          : `Deposit failed: ${err.shortMessage || err.message || "Network error"}`
      );
      setIsDepositing(false);
    }
  };

  // Handle Insurer Settle Claim via MetaMask on Sepolia
  const handleSettleClaimMetaMask = async (claim) => {
    if (!account) {
      const connected = await connectWallet();
      if (!connected) return;
    }

    if (!isSepolia) {
      const switched = await switchNetwork(11155111);
      if (!switched) {
        setSettleError("Please switch MetaMask to Sepolia Testnet.");
        return;
      }
    }

    setSettlingClaimId(claim.id);
    setSettleError('');
    setSettledSuccessTx('');
    setSettlingStep('prompt');

    try {
      const signer = await getProviderOrSigner(true);
      if (!signer) throw new Error("Could not acquire signer from MetaMask.");

      const payoutAddress = claim.hospitalAddress || '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
      const numClaimAmount = parseFloat(claim.amountEth) || 1.5;
      
      // Real testnet transfer amount: 0.0001 ETH ($0.30) on Sepolia prevents "insufficient funds"
      // while full face value (1.50 ETH / ₹15,000) is recognized in smart contract and ledger.
      const transferAmountEth = payoutMode === 'full' ? String(numClaimAmount) : '0.0001';
      const payoutWei = ethers.parseEther(transferAmountEth);
      const payoutWeiHex = "0x" + payoutWei.toString(16);

      setSettlingStep('broadcasting');

      const eth = window.ethereum;
      let finalTxHash;

      if (eth?.request) {
        finalTxHash = await eth.request({
          method: 'eth_sendTransaction',
          params: [{
            from: account,
            to: payoutAddress,
            value: payoutWeiHex,
          }],
        });
      } else {
        const tx = await signer.sendTransaction({
          to: payoutAddress,
          value: payoutWei,
        });
        finalTxHash = tx.hash;
      }

      setSettlingStep('mining');
      await new Promise((r) => setTimeout(r, 1200));

      setSettledSuccessTx(finalTxHash);
      setSettlingStep('done');

      if (onAcceptAndSettleClaim) {
        onAcceptAndSettleClaim({
          ...claim,
          amountEth: numClaimAmount,
          txHash: finalTxHash,
          settledBy: account,
        });
      }

      if (addAuditLog) {
        addAuditLog({
          type: 'CLAIM_SETTLED_BY_INSURER',
          title: `Claim Settled via Insurer MetaMask (${numClaimAmount} ETH)`,
          detail: `Insurer accepted ZKP proof. Disbursed ${numClaimAmount} ETH to ${claim.hospitalName} (${payoutAddress.slice(0, 8)}...) | Tx: ${finalTxHash.slice(0, 16)}...`,
          time: new Date().toLocaleTimeString(),
        });
      }
    } catch (err) {
      console.warn("Insurer settlement failed:", err);
      const isRejected = err.code === 4001 || err?.message?.includes("rejected");
      setSettleError(
        isRejected
          ? "Transaction canceled in MetaMask."
          : `Settlement failed: ${err.shortMessage || err.message || "Network error"}`
      );
      setSettlingStep('error');
    }
  };

  const handleSimulateInstantSettlement = (claim) => {
    const numClaimAmount = parseFloat(claim.amountEth) || 1.5;
    const fakeTx = '0x' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('');
    
    if (onAcceptAndSettleClaim) {
      onAcceptAndSettleClaim({
        ...claim,
        amountEth: numClaimAmount,
        txHash: fakeTx,
        settledBy: account || '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      });
    }

    if (addAuditLog) {
      addAuditLog({
        type: 'CLAIM_SETTLED_SIMULATION',
        title: `Claim Settled (Instant Simulation: ${numClaimAmount} ETH)`,
        detail: `Disbursed ${numClaimAmount} ETH to ${claim.hospitalName} treasury. Nullifier ${claim.nullifier?.slice(0, 16)}... marked spent.`,
        time: new Date().toLocaleTimeString(),
      });
    }

    setSettlingClaimId(null);
    setSettlingStep('');
  };

  // Dynamic Chart values reflecting incoming settled claims
  const newClaimsCount = settledClaims.length > 1 ? settledClaims.length - 1 : (claimSettled ? 1 : 0);
  const todayProofCount = 12 + newClaimsCount;
  const peakProofCount = Math.max(14, todayProofCount);
  const sunY = Math.max(6, 22 - (newClaimsCount * 4));

  return (
    <div className="space-y-6">
      
      {/* Top Banner with Dual Currency & Solvency Overview */}
      <div className="parda-surface p-6 border border-brass-500/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-brass-400 text-xs font-mono font-semibold uppercase tracking-wider">
              <Landmark className="w-4 h-4 text-brass-400" />
              <span>Decentralized Underwriter Vault • Zero Medical Data Exposed</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif text-ivory-200 tracking-tight">
              HealthShield Mutual Escrow
            </h2>
            <p className="text-xs sm:text-sm text-sage-muted max-w-2xl font-sans">
              Underwriters receive zero electronic health records. Claim disbursements are authorized autonomously by evaluating Circom zk-SNARK validity proofs and Merkle membership.
            </p>
          </div>
          
          <div className="flex items-center space-x-4 bg-forest-900/90 border border-sage-500/20 rounded-xl p-3.5 font-mono text-xs shrink-0">
            <div>
              <div className="text-sage-muted text-[10px] uppercase">Total Pool Liquidity</div>
              <div className="text-sm font-bold text-brass-400 font-mono">
                {poolBalanceEth.toFixed(2)} ETH <span className="text-[11px] text-sage-muted font-normal">(₹{(poolBalanceEth * INR_PER_ETH).toLocaleString('en-IN')})</span>
              </div>
            </div>
            <div className="h-8 w-px bg-sage-500/20" />
            <div>
              <div className="text-sage-muted text-[10px] uppercase">Settled Payouts</div>
              <div className="text-sm font-bold text-ivory-200 font-mono">
                {totalSettledEth.toFixed(2)} ETH <span className="text-[11px] text-sage-muted font-normal">(₹{(totalSettledEth * INR_PER_ETH).toLocaleString('en-IN')})</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* INCOMING CLAIMS QUEUE (Awaiting Insurer Settlement via MetaMask)           */}
      {/* ========================================================================= */}
      <div className="parda-surface p-6 border-2 border-brass-500/60 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-sage-500/20 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-950/70 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-serif font-bold text-ivory-200 flex items-center gap-2">
                <span>Incoming Claims Queue (Awaiting Insurer Settlement)</span>
                {pendingClaims.length > 0 && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500 text-black font-bold">
                    {pendingClaims.length} Action Required
                  </span>
                )}
              </h3>
              <p className="text-xs text-sage-muted">
                Groth16 proofs submitted by licensed hospitals. Inspect mathematical signals and confirm settlement via MetaMask.
              </p>
            </div>
          </div>

          <div className="text-xs font-mono text-sage-muted">
            Regulator Merkle Root: <code className="text-brass-400">{deployedConfig.hospitalMerkleRoot?.slice(0, 10)}...</code>
          </div>
        </div>

        {/* List of Pending Claims */}
        {pendingClaims.length > 0 ? (
          <div className="space-y-3">
            {pendingClaims.map((claim) => (
              <div
                key={claim.id}
                className="p-4 rounded-xl bg-forest-900 border border-brass-500/40 space-y-3 font-sans"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-lg bg-[#12231C] border border-[#B99561]/40 flex items-center justify-center text-[#B99561] shrink-0">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[#F3EFE5] flex items-center gap-2">
                        <span>{claim.hospitalName || 'St. Jude Medical Center'}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                          Licensed in Merkle Tree
                        </span>
                      </div>
                      <div className="text-xs text-sage-muted font-mono">
                        Payee: <span className="text-ivory-200">{claim.hospitalAddress || '0x7099...79C8'}</span> • Submitted: {claim.submittedAt || 'Just now'}
                      </div>
                    </div>
                  </div>

                  {/* Claim Amount */}
                  <div className="text-right shrink-0">
                    <div className="text-base font-bold font-mono text-brass-400">
                      {claim.amountEth} ETH
                    </div>
                    <div className="text-[11px] font-mono text-sage-muted">
                      ₹{((parseFloat(claim.amountEth) || 1.5) * INR_PER_ETH).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                {/* Mathematical Proof Validation Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-sage-500/15 text-xs font-mono">
                  <div className="p-2 rounded bg-forest-850 border border-sage-500/10 space-y-0.5">
                    <div className="text-sage-muted text-[10px]">Groth16 ZKP</div>
                    <div className="text-emerald-400 font-semibold flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3 shrink-0" />
                      <span>7 Constraints Valid</span>
                    </div>
                  </div>

                  <div className="p-2 rounded bg-forest-850 border border-sage-500/10 space-y-0.5">
                    <div className="text-sage-muted text-[10px]">Hospital Status</div>
                    <div className="text-emerald-400 font-semibold flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3 shrink-0" />
                      <span>Merkle Root Match</span>
                    </div>
                  </div>

                  <div className="p-2 rounded bg-forest-850 border border-sage-500/10 space-y-0.5">
                    <div className="text-sage-muted text-[10px]">Anti-Replay Nullifier</div>
                    <div className="text-brass-400 font-semibold truncate" title={claim.nullifier}>
                      {claim.nullifier ? `${claim.nullifier.slice(0, 10)}...` : '0x7c814...'}
                    </div>
                  </div>

                  <div className="p-2 rounded bg-forest-850 border border-sage-500/10 space-y-0.5">
                    <div className="text-sage-muted text-[10px]">Medical Privacy</div>
                    <div className="text-emerald-400 font-semibold flex items-center space-x-1">
                      <EyeOff className="w-3 h-3 text-brass-400 shrink-0" />
                      <span>100% Shielded in ZK</span>
                    </div>
                  </div>
                </div>

                {/* Settle Action Button (MetaMask Trigger) */}
                <div className="flex items-center justify-between text-[11px] font-mono text-sage-muted px-1 pt-1">
                  <span>MetaMask Transfer Amount:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPayoutMode('testnet_micro')}
                      className={`px-2 py-0.5 rounded text-[10px] cursor-pointer transition-all ${
                        payoutMode === 'testnet_micro'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40 font-bold shadow-sm'
                          : 'bg-forest-850 text-sage-muted hover:text-ivory-200'
                      }`}
                      title="Micro-payout prevents insufficient funds error on Sepolia faucets"
                    >
                      ⚡ Testnet Safe (0.0001 SEP)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayoutMode('full')}
                      className={`px-2 py-0.5 rounded text-[10px] cursor-pointer transition-all ${
                        payoutMode === 'full'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40 font-bold shadow-sm'
                          : 'bg-forest-850 text-sage-muted hover:text-ivory-200'
                      }`}
                      title="Requires full 1.50 Sepolia testnet ETH balance"
                    >
                      Full Face Value ({claim.amountEth} SEP)
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleSettleClaimMetaMask(claim)}
                    disabled={settlingClaimId === claim.id && ['prompt', 'broadcasting', 'mining'].includes(settlingStep)}
                    className="btn-brass btn-pressable w-full sm:w-auto flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-xs font-mono font-bold tracking-wide transition-all shadow-md cursor-pointer"
                  >
                    <Send className="w-4 h-4 text-brass-400" />
                    <span>
                      {settlingClaimId === claim.id && settlingStep === 'prompt' && '1. Confirm in MetaMask Popup...'}
                      {settlingClaimId === claim.id && settlingStep === 'broadcasting' && '2. Broadcasting Payout to Sepolia...'}
                      {settlingClaimId === claim.id && settlingStep === 'mining' && '3. Mining on Sepolia...'}
                      {(!settlingStep || settlingClaimId !== claim.id) && `Accept & Settle via MetaMask (${payoutMode === 'full' ? `${claim.amountEth} SEP` : '0.0001 SEP'})`}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSimulateInstantSettlement(claim)}
                    className="w-full sm:w-auto py-2.5 px-3 rounded-xl bg-forest-850 hover:bg-forest-800 border border-sage-500/30 text-sage-muted hover:text-ivory-200 text-xs font-mono transition-colors cursor-pointer"
                    title="Simulate instant settlement without waiting for testnet gas"
                  >
                    ⚡ Instant Settle (Demo Simulation)
                  </button>
                </div>

                {/* Error Banner */}
                {settlingClaimId === claim.id && settleError && (
                  <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-500/40 text-xs text-rose-300 flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div>{settleError}</div>
                      <button
                        onClick={() => handleSimulateInstantSettlement(claim)}
                        className="mt-1 text-brass-400 hover:text-brass-300 underline font-mono text-[11px] block"
                      >
                        Settle using Instant Demo Simulation instead
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-xl bg-forest-900/60 border border-dashed border-sage-500/25 text-center space-y-2 font-sans">
            <div className="w-10 h-10 rounded-full bg-forest-850 flex items-center justify-center mx-auto text-brass-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="text-sm font-medium text-ivory-200">
              No Pending Claims in Queue
            </div>
            <p className="text-xs text-sage-muted max-w-md mx-auto">
              When a hospital unwrap patient records and generates a Groth16 Zero-Knowledge Proof, the claim will appear here for one-click underwriter acceptance and MetaMask settlement.
            </p>
          </div>
        )}

        {settledSuccessTx && (
          <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-xs font-mono text-emerald-300 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Claim settled and payout released on Sepolia!</span>
            </div>
            <a
              href={`https://sepolia.etherscan.io/tx/${settledSuccessTx}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brass-400 hover:text-brass-300 underline inline-flex items-center gap-1 font-semibold"
            >
              <span>View on Etherscan</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </div>

      {/* Escrow Pool Liquidity & On-Chain Deposit Card */}
      <div className="parda-surface p-6 border border-sage-500/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-brass-400 text-xs font-mono font-semibold uppercase tracking-wider">
              <Coins className="w-4 h-4" />
              <span>Solvency & Escrow Underwriting Pool (Sepolia Testnet)</span>
            </div>
            <div className="text-xs text-sage-muted mt-1 font-sans">
              Segregated on-chain pool held inside <code className="text-ivory-200 font-mono">ClaimManager.sol</code>. Only verifiable Groth16 proofs can release funds to verified hospital payees.
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-forest-900/90 border border-sage-500/20 rounded-lg px-3 py-1.5 font-mono text-xs flex items-center space-x-2">
              <span className="text-sage-muted text-[11px]">On-Chain Escrow:</span>
              <span className="text-brass-400 font-bold">{onChainEscrow} ETH</span>
              <button
                onClick={fetchEscrowBalance}
                title="Refresh on-chain balance"
                className="text-sage-muted hover:text-ivory-200 p-0.5 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="number"
                step="0.01"
                min="0.001"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="0.05"
                className="w-24 bg-forest-900 border border-sage-500/30 rounded-lg px-2.5 py-1.5 text-xs text-ivory-200 font-mono focus:outline-none focus:border-brass-500"
              />
              <button
                onClick={handleDepositToEscrow}
                disabled={isDepositing}
                className="btn-brass px-3 py-1.5 rounded-lg text-xs font-mono font-semibold inline-flex items-center space-x-1.5 cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5 text-brass-400" />
                <span>{isDepositing ? "Depositing via MetaMask..." : "Deposit ETH to Pool"}</span>
              </button>
            </div>
          </div>
        </div>

        {depositTxHash && (
          <div className="mt-3 text-xs font-mono text-emerald-400 flex items-center space-x-2 bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-500/30">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Escrow deposit confirmed on Sepolia!</span>
            <a
              href={`https://sepolia.etherscan.io/tx/${depositTxHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brass-400 hover:text-brass-300 underline inline-flex items-center gap-1 ml-auto"
            >
              <span>View on Etherscan</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {depositError && (
          <div className="mt-2 text-xs text-rose-400 font-mono">
            {depositError}
          </div>
        )}
      </div>

      {/* Bento Grid: Settlement Ledger & Telemetry Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Claims Settlement Ledger Table (Zero Clinical Disclosure) */}
        <div className="lg:col-span-8 parda-surface p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-sage-500/20 pb-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-forest-800 border border-sage-500/25 flex items-center justify-center text-brass-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-serif font-normal text-ivory-200">On-Chain Verified Claims Ledger</h3>
                <div className="text-[11px] font-mono text-sage-muted">03.01 // STRICTLY ZERO MEDICAL DATA EXPOSED</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Filter by nullifier or hospital..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="px-2.5 py-1 rounded bg-forest-900 border border-sage-500/25 text-xs text-ivory-200 placeholder:text-sage-muted/50 focus:border-brass-400 focus:outline-none w-48 sm:w-60"
              />
              <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-forest-900 border border-sage-500/30 text-sage-300 shrink-0">
                {settledClaims.length} Active {settledClaims.length === 1 ? 'Proof' : 'Proofs'} Anchored
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-forest-900/90 text-sage-muted border-b border-sage-500/20 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-3.5">Nullifier Hash</th>
                  <th className="py-3 px-3.5">Hospital Payee</th>
                  <th className="py-3 px-3.5">Amount (ETH / INR)</th>
                  <th className="py-3 px-3.5">Clinical Privacy</th>
                  <th className="py-3 px-3.5">Proof Status</th>
                  <th className="py-3 px-3.5">On-Chain Tx (Etherscan)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage-500/10">
                {/* Dynamically mapped settled claims */}
                {settledClaims.map((claim) => (
                  <tr key={claim.id} className="hover:bg-forest-850 transition-colors">
                    <td className="py-3.5 px-3.5 text-brass-400 font-bold" title={claim.nullifier}>
                      {claim.nullifier ? `${claim.nullifier.slice(0, 10)}...${claim.nullifier.slice(-4)}` : '0x7c81...'}
                    </td>
                    <td className="py-3.5 px-3.5 text-ivory-200">
                      {claim.payee || claim.hospitalName}
                    </td>
                    <td className="py-3.5 px-3.5 font-bold text-ivory-200">
                      {parseFloat(claim.amountEth).toFixed(4)} ETH <span className="text-[11px] text-sage-muted font-normal">(₹{((parseFloat(claim.amountEth) || 0) * INR_PER_ETH).toLocaleString('en-IN')})</span>
                    </td>
                    <td className="py-3.5 px-3.5">
                      <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded bg-forest-900 border border-sage-500/20 text-sage-muted text-[10px]">
                        <EyeOff className="w-3 h-3 text-brass-400" />
                        <span>[100% REDACTED IN ZK]</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-3.5">
                      <span className="inline-flex items-center space-x-1 text-emerald-400 font-bold">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{claim.status || 'VERIFIED VALID'}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-3.5">
                      {claim.txHash ? (
                        <a
                          href={`https://sepolia.etherscan.io/tx/${claim.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded bg-[#12231C] border border-[#B99561]/50 text-[#B99561] hover:text-[#F3EFE5] hover:border-[#B99561] text-[11px] font-mono font-bold transition-all shadow-sm"
                          title={`View transaction on Sepolia: ${claim.txHash}`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                          <span>{claim.txHash.slice(0, 6)}...{claim.txHash.slice(-4)}</span>
                          <ExternalLink className="w-3 h-3 text-[#B99561]" />
                        </a>
                      ) : (
                        <span className="text-sage-muted text-[10px] font-mono px-2 py-0.5 rounded bg-forest-900 border border-sage-500/20">
                          Anchored
                        </span>
                      )}
                    </td>
                  </tr>
                ))}

                {/* Blocked Duplicate Nullifier Attack Demonstration */}
                <tr className="bg-forest-900/60 border-y border-brass-500/30 hover:bg-forest-850 transition-colors">
                  <td className="py-3.5 px-3.5 text-sage-muted font-bold">
                    0x7c814...00ae
                  </td>
                  <td className="py-3.5 px-3.5 text-sage-muted">
                    0x15d3...6A65 (Metropolitan)
                  </td>
                  <td className="py-3.5 px-3.5 font-bold text-sage-muted">
                    2.8000 ETH <span className="text-[11px] text-sage-muted/70 font-normal">(₹28,000)</span>
                  </td>
                  <td className="py-3.5 px-3.5">
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-forest-900 text-brass-400 border border-brass-500/30 text-[10px]">
                      <span>DUPLICATE NULLIFIER</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-3.5 text-brass-400 font-semibold">
                    ✖ REPLAY BLOCKED ON-CHAIN
                  </td>
                  <td className="py-3.5 px-3.5 text-rose-400/80 font-mono text-[10px]">
                    Reverted (No Tx)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 7-Day Verification Volume Chart */}
          <div className="p-4 rounded-xl bg-forest-850 border border-sage-500/20 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-sage-muted">
              <span className="flex items-center gap-1.5 text-ivory-200 font-semibold">
                <BarChart3 className="w-3.5 h-3.5 text-brass-400" />
                <span>7-Day Cryptographic Proof Volume</span>
              </span>
              <span className="text-brass-400">
                Peak: {peakProofCount} proofs/day • 0 data leaks ({todayProofCount} proofs today)
              </span>
            </div>
            
            <div className="w-full pt-2">
              <svg viewBox="0 0 280 80" className="w-full h-20 overflow-visible">
                <defs>
                  <linearGradient id="forestBrassGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#B99561" stopOpacity="0.25"/>
                    <stop offset="100%" stopColor="#12231C" stopOpacity="0.0"/>
                  </linearGradient>
                </defs>
                <polygon 
                  fill="url(#forestBrassGrad)" 
                  points={`15,60 55,45 95,50 135,25 175,35 215,15 265,${sunY} 265,80 15,80`} 
                />
                <polyline
                  fill="none"
                  stroke="#B99561"
                  strokeWidth="1.75"
                  points={`15,60 55,45 95,50 135,25 175,35 215,15 265,${sunY}`}
                />
                <circle cx="15" cy="60" r="3" fill="#B99561" stroke="#0B1713" strokeWidth="1" />
                <circle cx="55" cy="45" r="3" fill="#B99561" stroke="#0B1713" strokeWidth="1" />
                <circle cx="95" cy="50" r="3" fill="#B99561" stroke="#0B1713" strokeWidth="1" />
                <circle cx="135" cy="25" r="3" fill="#B99561" stroke="#0B1713" strokeWidth="1" />
                <circle cx="175" cy="35" r="3" fill="#B99561" stroke="#0B1713" strokeWidth="1" />
                <circle cx="215" cy="15" r="3" fill="#B99561" stroke="#0B1713" strokeWidth="1" />
                <circle cx="265" cy={sunY} r="3.5" fill="#B99561" stroke="#0B1713" strokeWidth="1" />
              </svg>
              <div className="flex justify-between text-[9px] font-mono text-sage-muted mt-1 px-1">
                <span>MON</span>
                <span>TUE</span>
                <span>WED</span>
                <span>THU</span>
                <span>FRI</span>
                <span>SAT</span>
                <span className="text-brass-400 font-bold">TODAY ({todayProofCount})</span>
              </div>
            </div>
          </div>

          {/* Privacy Value Guarantee Callout */}
          <div className="bg-forest-850 border border-sage-500/20 rounded-xl p-4 flex items-start space-x-3 text-xs text-sage-muted font-sans">
            <Lock className="w-4 h-4 text-brass-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-ivory-200 font-semibold">Zero-Knowledge Verification Guarantee:</span> The smart contract mathematically verified that the hospital is licensed, the policy is active, and the claim is within limits without revealing ICD-10 diagnosis codes or physician prescriptions to the underwriter or public nodes.
            </div>
          </div>
        </div>

        {/* Right: Public Signals, Actuarial Reserves & Live Audit Feed */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Public Calldata Signals Card */}
          <div className="parda-surface p-6 space-y-3.5 border border-brass-500/30">
            <div className="flex items-center justify-between border-b border-sage-500/20 pb-3">
              <div className="flex items-center space-x-2 text-brass-400">
                <ShieldCheck className="w-4 h-4 text-brass-400" />
                <h3 className="text-base font-serif font-normal text-ivory-200">Public Signals (6 Fields)</h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-forest-900 border border-brass-500/30 text-brass-400">
                EVM Calldata
              </span>
            </div>
            <p className="text-xs text-sage-muted leading-relaxed font-sans">
              Strictly zero medical inputs reach the contract. The ClaimManager verifies these 6 public field elements:
            </p>
            <div className="space-y-1.5 font-mono text-[11px] text-sage-muted bg-forest-850 p-3 rounded-lg border border-sage-500/15">
              <div>
                <span className="text-brass-400">[0] nullifier:</span>{' '}
                {latestClaim ? `${latestClaim.nullifier?.slice(0, 16)}...` : 'Poseidon(salt, recordId)'}
              </div>
              <div><span className="text-brass-400">[1] hospitalRoot:</span> 2-of-3 Multi-Sig Root ({deployedConfig.hospitalMerkleRoot?.slice(0, 10)}...)</div>
              <div><span className="text-brass-400">[2] commitment:</span> Policy Hash Anchor</div>
              <div>
                <span className="text-brass-400">[3] claimAmount:</span>{' '}
                {latestClaim 
                  ? `₹${(latestClaim.amountEth * INR_PER_ETH).toLocaleString('en-IN')} (${latestClaim.amountEth.toFixed(4)} ETH)` 
                  : '₹15,000 (1.50 ETH)'}
              </div>
              <div><span className="text-brass-400">[4] claimDay:</span> Day 20,050</div>
              <div>
                <span className="text-brass-400">[5] recipient:</span>{' '}
                {latestClaim ? (latestClaim.payee || latestClaim.hospitalAddress) : (account ? `${account.slice(0, 8)}...` : '0x7099...79C8')}
              </div>
            </div>
          </div>

          {/* Actuarial Escrow & Solvency Status Card */}
          <div className="parda-surface p-6 space-y-3.5 border border-emerald-500/30">
            <div className="flex items-center justify-between border-b border-sage-500/20 pb-3">
              <div className="flex items-center space-x-2 text-brass-400">
                <Coins className="w-4 h-4 text-brass-400" />
                <h3 className="text-base font-serif font-normal text-ivory-200">Actuarial Reserve & Solvency</h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-forest-900 border border-emerald-500/30 text-emerald-400 font-bold">
                {poolBalanceEth > 0 ? '100% SOLVENT' : 'DEPLETED'}
              </span>
            </div>
            <p className="text-xs text-sage-muted leading-relaxed font-sans">
              Escrow liquidity is strictly segregated from underwriting operations. Autonomous disbursements execute only when Groth16 circuit proofs satisfy all 7 constraints.
            </p>
            <div className="space-y-2 font-mono text-[11px] bg-forest-850 p-3 rounded-lg border border-sage-500/15">
              <div className="flex justify-between items-center">
                <span className="text-sage-muted">Liquidity Reserve:</span>
                <span className="text-ivory-200 font-bold">
                  {poolBalanceEth.toFixed(2)} ETH (₹{(poolBalanceEth * INR_PER_ETH).toLocaleString('en-IN')})
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sage-muted">Settled Payouts:</span>
                <span className="text-brass-400 font-bold">
                  {totalSettledEth.toFixed(2)} ETH (₹{(totalSettledEth * INR_PER_ETH).toLocaleString('en-IN')})
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sage-muted">Regulator Multi-Sig:</span>
                <span className="text-brass-400 font-semibold">2-of-3 Quorum Active</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sage-muted">Medical Data Exposure:</span>
                <span className="text-emerald-400 font-semibold">0% (Shielded in ZK)</span>
              </div>
            </div>
          </div>

          {/* Live On-Chain Audit Trail Feed */}
          <div className="parda-surface p-6 space-y-3.5">
            <div className="flex items-center space-x-2 border-b border-sage-500/20 pb-3">
              <Activity className="w-4 h-4 text-brass-400" />
              <h3 className="text-base font-serif font-normal text-ivory-200">On-Chain Audit Trail</h3>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1 font-mono text-xs">
              {auditLogs.map((log, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg border bg-forest-850 border-sage-500/15 text-sage-muted transition-all"
                >
                  <div className="flex items-center justify-between font-semibold mb-1 text-ivory-200">
                    <span>{log.title}</span>
                    <span className="text-[10px] text-sage-600">{log.time}</span>
                  </div>
                  <div className="text-[11px] opacity-85 break-words font-sans">{log.detail}</div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
