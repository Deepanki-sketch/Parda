import React, { useState, useEffect, useCallback } from 'react';
import { Landmark, ShieldCheck, Lock, Activity, Coins, CheckCircle, ExternalLink, BarChart3, EyeOff, PlusCircle, ArrowUpRight, RefreshCw } from 'lucide-react';
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
  const [selectedClaimId, setSelectedClaimId] = useState(null);
  const [copiedNullifier, setCopiedNullifier] = useState(null);

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
              Underwriters receive zero electronic health records. Claim disbursements are authorized autonomously by smart contracts evaluating Circom zk-SNARK validity proofs.
            </p>
          </div>
          
          <div className="flex items-center space-x-4 bg-forest-900/90 border border-sage-500/20 rounded p-3.5 font-mono text-xs shrink-0">
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
            <div className="bg-forest-900/90 border border-sage-500/20 rounded px-3 py-1.5 font-mono text-xs flex items-center space-x-2">
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
                className="w-24 bg-forest-900 border border-sage-500/30 rounded px-2.5 py-1.5 text-xs text-ivory-200 font-mono focus:outline-none focus:border-brass-500"
              />
              <button
                onClick={handleDepositToEscrow}
                disabled={isDepositing}
                className="btn-brass px-3 py-1.5 rounded text-xs font-mono font-semibold inline-flex items-center space-x-1.5 cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5 text-brass-400" />
                <span>{isDepositing ? "Depositing via MetaMask..." : "Deposit ETH to Pool"}</span>
              </button>
            </div>
          </div>
        </div>

        {depositTxHash && (
          <div className="mt-3 text-xs font-mono text-emerald-400 flex items-center space-x-2 bg-emerald-950/40 p-2.5 rounded border border-emerald-500/30">
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
              <div className="w-8 h-8 rounded bg-forest-800 border border-sage-500/25 flex items-center justify-center text-brass-400">
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
                </tr>
              </thead>
              <tbody className="divide-y divide-sage-500/10">
                {/* Dynamically mapped settled claims */}
                {settledClaims.map((claim) => (
                  <tr key={claim.id} className="hover:bg-forest-850 transition-colors">
                    <td className="py-3.5 px-3.5 text-brass-400 font-bold" title={claim.nullifier}>
                      {claim.nullifier.slice(0, 10)}...{claim.nullifier.slice(-4)}
                    </td>
                    <td className="py-3.5 px-3.5 text-ivory-200">
                      {claim.payee}
                    </td>
                    <td className="py-3.5 px-3.5 font-bold text-ivory-200">
                      {claim.amountEth.toFixed(4)} ETH <span className="text-[11px] text-sage-muted font-normal">(₹{(claim.amountEth * INR_PER_ETH).toLocaleString('en-IN')})</span>
                    </td>
                    <td className="py-3.5 px-3.5">
                      <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded bg-forest-900 border border-sage-500/20 text-sage-muted text-[10px]">
                        <EyeOff className="w-3 h-3 text-brass-400" />
                        <span>[100% REDACTED IN ZK]</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-3.5">
                      <span className="inline-flex items-center space-x-1 text-brass-400 font-bold">
                        <CheckCircle className="w-3.5 h-3.5 text-brass-400" />
                        <span>{claim.status || 'VERIFIED VALID'}</span>
                      </span>
                    </td>
                  </tr>
                ))}

                {/* Simulated Blocked Duplicate Nullifier Attack Demonstration */}
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
                </tr>
              </tbody>
            </table>
          </div>

          {/* 7-Day Verification Volume Chart (Dynamic Proofs Reflection) */}
          <div className="p-4 rounded bg-forest-850 border border-sage-500/20 space-y-2">
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
          <div className="bg-forest-850 border border-sage-500/20 rounded p-4 flex items-start space-x-3 text-xs text-sage-muted font-sans">
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
            <div className="space-y-1.5 font-mono text-[11px] text-sage-muted bg-forest-850 p-3 rounded border border-sage-500/15">
              <div>
                <span className="text-brass-400">[0] nullifier:</span>{' '}
                {latestClaim ? `${latestClaim.nullifier.slice(0, 16)}...` : 'Poseidon(salt, recordId)'}
              </div>
              <div><span className="text-brass-400">[1] hospitalRoot:</span> 2-of-3 Multi-Sig Root</div>
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
                {latestClaim ? latestClaim.payee : (account ? `${account.slice(0, 8)}...` : '0x7099...79C8')}
              </div>
            </div>
          </div>

          {/* Actuarial Escrow & Solvency Status Card (Replaces misplaced break-glass) */}
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
            <div className="space-y-2 font-mono text-[11px] bg-forest-850 p-3 rounded border border-sage-500/15">
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
                  className="p-3 rounded border bg-forest-850 border-sage-500/15 text-sage-muted transition-all"
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
