import React, { useState } from 'react';
import {
  Shield,
  User,
  Building2,
  Landmark,
  CheckCircle2,
  Copy,
  RotateCcw,
  Eye,
  ShieldAlert,
  Sparkles,
  Wallet,
  ExternalLink,
  Power,
  LogOut,
  ArrowLeft,
  ChevronDown,
  Layers
} from 'lucide-react';
import { useWallet } from '../context/WalletContext';

export default function Header({
  activeRole,
  setActiveRole,
  activeRoleSession,
  onLogout,
  onReplayIntro,
  currentPatient,
  onOpenAuthModal,
  pendingClaimsCount = 0,
}) {
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);

  const { account, balance, isConnecting, isSepolia, connectWallet, disconnectWallet, switchNetwork } = useWallet();

  const copyAddress = (addr) => {
    if (addr) {
      navigator.clipboard.writeText(addr);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isAuxiliaryView = ['xray', 'redteam', 'pricing'].includes(activeRole);
  const isGateway = activeRole === 'gateway' || !activeRoleSession;

  return (
    <header className="sticky top-0 z-40 px-3 sm:px-6 lg:px-8 w-full bg-[#0B1713]/95 backdrop-blur-md border-b border-[#9DAF9D]/15 font-sans">
      <div className="max-w-7xl mx-auto py-2.5 flex flex-wrap items-center justify-between gap-2.5">
        
        {/* Brand & Home Navigation */}
        <div 
          onClick={() => setActiveRole(activeRoleSession ? activeRoleSession.role : 'gateway')}
          className="flex items-center space-x-2 cursor-pointer group"
          title="Return to Portal Home"
        >
          <div className="w-7 h-7 rounded bg-[#12231C] border border-[#B99561]/40 flex items-center justify-center text-[#B99561] group-hover:border-[#B99561] transition-all">
            <Shield className="w-3.5 h-3.5" />
          </div>
          <span className="text-sm sm:text-base font-serif font-bold tracking-tight text-[#F3EFE5]">
            PARDA
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#12231C] text-[#B99561] border border-[#B99561]/30 hidden sm:inline-block">
            ZKP Healthcare
          </span>
        </div>

        {/* Center: Active Persona Badge & Tools (NO open role switcher!) */}
        <div className="flex flex-wrap items-center order-3 sm:order-2 w-full sm:w-auto justify-center gap-2">
          
          {/* Case A: User is inside an auxiliary view (X-Ray, Red-Team, Pricing) */}
          {isAuxiliaryView ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveRole(activeRoleSession ? activeRoleSession.role : 'gateway')}
                className="btn-pressable flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#12231C] hover:bg-[#192C23] border border-[#B99561]/40 text-[#F3EFE5] text-xs font-mono font-medium transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-[#B99561]" />
                <span>Return to {activeRoleSession ? `${activeRoleSession.role.toUpperCase()} PORTAL` : 'GATEWAY'}</span>
              </button>
            </div>
          ) : !isGateway && activeRoleSession ? (
            /* Case B: User is authenticated in a dedicated role (Patient, Hospital, or Insurer) */
            <div className="flex items-center gap-2">
              
              {/* Dedicated Persona Pill */}
              <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-[#12231C] border border-[#B99561]/40 text-xs font-mono text-[#F3EFE5] shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                
                {activeRoleSession.role === 'patient' && (
                  <div className="flex items-center space-x-1.5 text-[#F3EFE5]">
                    <User className="w-3.5 h-3.5 text-[#B99561]" />
                    <span className="text-[#AEB8AA] font-normal">Patient:</span>
                    <span className="font-semibold text-[#F3EFE5]">{activeRoleSession.user?.name || 'Alex Doe'}</span>
                  </div>
                )}

                {activeRoleSession.role === 'hospital' && (
                  <div className="flex items-center space-x-1.5 text-[#F3EFE5]">
                    <Building2 className="w-3.5 h-3.5 text-[#B99561]" />
                    <span className="text-[#AEB8AA] font-normal">Hospital:</span>
                    <span className="font-semibold text-[#F3EFE5]">{activeRoleSession.user?.name || 'St. Jude Medical'}</span>
                  </div>
                )}

                {activeRoleSession.role === 'insurer' && (
                  <div className="flex items-center space-x-1.5 text-[#F3EFE5]">
                    <Landmark className="w-3.5 h-3.5 text-[#B99561]" />
                    <span className="text-[#AEB8AA] font-normal">Insurer:</span>
                    <span className="font-semibold text-[#F3EFE5]">{activeRoleSession.user?.name || 'HealthShield Mutual'}</span>
                    {pendingClaimsCount > 0 && (
                      <span className="ml-1 text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-500 text-black">
                        {pendingClaimsCount}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Security & Verification Dropdown Link */}
              <button
                type="button"
                onClick={() => setActiveRole('xray')}
                className="btn-pressable hidden md:flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-purple-950/50 hover:bg-purple-900/60 border border-purple-500/30 text-purple-200 text-xs transition-colors cursor-pointer"
                title="Open Zero-Knowledge Privacy X-Ray Inspector"
              >
                <Eye className="w-3.5 h-3.5 text-purple-400" />
                <span>Privacy X-Ray</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveRole('redteam')}
                className="btn-pressable hidden md:flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900/60 border border-rose-500/30 text-rose-200 text-xs transition-colors cursor-pointer"
                title="Open Red-Team Adversarial Test Suite"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                <span>Red-Team</span>
              </button>

              {/* Dedicated Log Out / Switch Persona Button */}
              <button
                type="button"
                onClick={onLogout}
                className="btn-pressable flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/40 text-rose-200 text-xs font-mono font-medium transition-colors cursor-pointer"
                title="Log out of this role and return to portal selection"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                <span>Switch Role</span>
              </button>

            </div>
          ) : (
            /* Case C: User is on the Gateway (selecting a role) */
            <div className="flex items-center space-x-2 text-xs font-mono text-[#AEB8AA]">
              <span className="px-3 py-1 rounded-full bg-[#12231C] border border-[#9DAF9D]/20 text-[#B99561]">
                🔒 Cryptographically Isolated Execution
              </span>
            </div>
          )}

        </div>

        {/* Right: Intro Replay & MetaMask / Wallet Control */}
        <div className="flex items-center space-x-2 text-xs order-2 sm:order-3 relative">
          
          <button
            onClick={onReplayIntro}
            aria-label="Replay intro"
            title="Replay intro sequence"
            className="p-1.5 sm:p-2 rounded-lg bg-[#12231C] hover:bg-[#192C23] border border-[#9DAF9D]/20 text-[#AEB8AA] hover:text-[#F3EFE5] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Real MetaMask Sepolia Integration */}
          {account ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center space-x-2 px-2.5 py-1.5 rounded-lg bg-[#12231C] border border-[#B99561]/50 text-[#F3EFE5] hover:border-[#B99561] transition-all text-xs cursor-pointer"
              >
                {/* Sepolia Green Badge */}
                <span className="flex items-center space-x-1 px-1.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/30 text-[10px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{isSepolia ? 'Sepolia' : 'Switch Net'}</span>
                </span>
                
                <span className="font-mono text-[11px] text-[#B99561] font-semibold hidden md:inline">
                  {balance} SEP
                </span>

                <span className="font-mono text-[11px]">
                  {account.slice(0, 6)}...{account.slice(-4)}
                </span>
              </button>

              {/* Dropdown Menu for Disconnect & Network */}
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-[#12231C] border border-[#9DAF9D]/20 rounded-xl shadow-2xl p-3 z-50 space-y-2.5 font-sans">
                  <div className="text-[11px] text-[#AEB8AA] pb-2 border-b border-[#9DAF9D]/15 flex justify-between items-center">
                    <span>Connected via MetaMask</span>
                    <span className="text-[10px] text-emerald-400">● Live</span>
                  </div>

                  <div className="text-xs space-y-1">
                    <div className="text-[#AEB8AA] text-[11px]">Wallet Address</div>
                    <div className="font-mono text-[11px] text-[#F3EFE5] break-all bg-[#0B1713] p-1.5 rounded border border-[#9DAF9D]/15 flex items-center justify-between">
                      <span>{account.slice(0, 10)}...{account.slice(-6)}</span>
                      <button
                        type="button"
                        onClick={() => copyAddress(account)}
                        className="btn-copy text-[#9E7C4B] hover:text-[#7D5825] p-1 flex items-center justify-center transition-all cursor-pointer"
                        title={copied ? "Copied!" : "Copy address"}
                      >
                        {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="text-xs space-y-1">
                    <div className="text-[#AEB8AA] text-[11px]">Sepolia Balance</div>
                    <div className="font-mono text-sm text-[#B99561] font-bold">{balance} ETH</div>
                  </div>

                  {!isSepolia && (
                    <button
                      onClick={() => switchNetwork(11155111)}
                      className="w-full py-1.5 rounded bg-amber-950 text-amber-300 border border-amber-500/40 text-xs text-center font-medium cursor-pointer"
                    >
                      Switch to Sepolia Network
                    </button>
                  )}

                  <a
                    href={`https://sepolia.etherscan.io/address/${account}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between text-xs text-[#AEB8AA] hover:text-[#F3EFE5] py-1 border-t border-[#9DAF9D]/15"
                  >
                    <span>View on Etherscan</span>
                    <ExternalLink className="w-3 h-3 text-[#B99561]" />
                  </a>

                  <button
                    onClick={() => {
                      disconnectWallet();
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center space-x-1.5 py-1.5 rounded bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 text-xs font-medium transition-colors cursor-pointer"
                  >
                    <Power className="w-3 h-3" />
                    <span>Disconnect</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={connectWallet}
              disabled={isConnecting}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#12231C] hover:bg-[#192C23] border border-[#B99561]/60 text-[#B99561] hover:text-[#c9a674] transition-all text-xs font-medium shadow-sm hover:shadow-[0_0_12px_rgba(185,149,97,0.25)] cursor-pointer"
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>{isConnecting ? 'Connecting...' : 'Connect MetaMask'}</span>
            </button>
          )}

        </div>

      </div>
    </header>
  );
}
