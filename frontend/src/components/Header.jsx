import React, { useState } from 'react';
import { Shield, User, Building2, Landmark, CheckCircle2, Copy, RotateCcw, Eye, ShieldAlert, Wallet, ExternalLink, Power } from 'lucide-react';
import { useWallet } from '../context/WalletContext';

export default function Header({
  activeRole,
  setActiveRole,
  currentAccount,
  onReplayIntro,
  currentPatient,
  onOpenAuthModal,
}) {
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const { account, balance, isConnecting, isSepolia, connectWallet, disconnectWallet, switchNetwork } = useWallet();

  const copyAddress = (addr) => {
    if (addr) {
      navigator.clipboard.writeText(addr);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <header className="sticky top-0 z-40 px-3 sm:px-6 lg:px-8 w-full bg-[#0B1713]/90 backdrop-blur-md border-b border-[#9DAF9D]/15 font-sans">
      <div className="max-w-7xl mx-auto py-2.5 flex flex-wrap items-center justify-between gap-2.5">
        
        {/* Brand */}
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded bg-[#12231C] border border-[#B99561]/40 flex items-center justify-center text-[#B99561]">
            <Shield className="w-3 h-3" />
          </div>
          <span className="text-sm sm:text-base font-medium tracking-tight text-[#F3EFE5]">
            Parda
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#12231C] text-[#B99561] border border-[#B99561]/30 hidden sm:inline-block">
            ZKP Web3
          </span>
        </div>

        {/* Center: The Role & Verification Control */}
        <div className="flex flex-wrap items-center bg-[#12231C] p-0.5 sm:p-1 rounded border border-[#9DAF9D]/20 order-3 sm:order-2 w-full sm:w-auto justify-center gap-1" aria-label="Role switcher">
          <button
            onClick={() => setActiveRole('patient')}
            className={`flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded text-[11px] sm:text-xs transition-colors ${
              activeRole === 'patient'
                ? 'bg-[#192C23] text-[#F3EFE5] font-medium border border-[#B99561]/40 shadow-sm'
                : 'text-[#AEB8AA] hover:text-[#F3EFE5]'
            }`}
          >
            <User className="w-3 h-3 text-[#B99561]" />
            <span>1. Patient</span>
          </button>

          <button
            onClick={() => setActiveRole('hospital')}
            className={`flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded text-[11px] sm:text-xs transition-colors ${
              activeRole === 'hospital'
                ? 'bg-[#192C23] text-[#F3EFE5] font-medium border border-[#B99561]/40 shadow-sm'
                : 'text-[#AEB8AA] hover:text-[#F3EFE5]'
            }`}
          >
            <Building2 className="w-3 h-3 text-[#B99561]" />
            <span>2. Hospital</span>
          </button>

          <button
            onClick={() => setActiveRole('insurer')}
            className={`flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded text-[11px] sm:text-xs transition-colors ${
              activeRole === 'insurer'
                ? 'bg-[#192C23] text-[#F3EFE5] font-medium border border-[#B99561]/40 shadow-sm'
                : 'text-[#AEB8AA] hover:text-[#F3EFE5]'
            }`}
          >
            <Landmark className="w-3 h-3 text-[#B99561]" />
            <span>3. Insurer</span>
          </button>

          <div className="h-4 w-px bg-[#9DAF9D]/20 mx-0.5 hidden md:block" />

          <button
            onClick={() => setActiveRole('xray')}
            className={`flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded text-[11px] sm:text-xs transition-colors ${
              activeRole === 'xray'
                ? 'bg-purple-950/60 text-purple-200 font-medium border border-purple-500/40 shadow-sm'
                : 'text-purple-400 hover:text-purple-200'
            }`}
          >
            <Eye className="w-3 h-3 text-purple-400" />
            <span>Privacy X-Ray</span>
          </button>

          <button
            onClick={() => setActiveRole('redteam')}
            className={`flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded text-[11px] sm:text-xs transition-colors ${
              activeRole === 'redteam'
                ? 'bg-rose-950/60 text-rose-200 font-medium border border-rose-500/40 shadow-sm'
                : 'text-rose-400 hover:text-rose-200'
            }`}
          >
            <ShieldAlert className="w-3 h-3 text-rose-400" />
            <span>Red-Team</span>
          </button>
        </div>

        {/* Right: Replay Intro & MetaMask / Wallet Control */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 text-xs order-2 sm:order-3 relative">
          
          {/* Patient Sovereign Session Quick Switcher */}
          {currentPatient && onOpenAuthModal ? (
            <div className="flex items-center space-x-1.5 bg-[#12231C] px-2 py-1 rounded border border-[#B99561]/40 text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <button
                type="button"
                onClick={() => onOpenAuthModal('login')}
                className="text-[#F3EFE5] font-medium hover:text-[#B99561] transition-colors truncate max-w-[100px] sm:max-w-[130px]"
                title={`Logged in as ${currentPatient.name}. Click to switch or register.`}
              >
                {currentPatient.name}
              </button>
              <button
                type="button"
                onClick={() => onOpenAuthModal('register')}
                className="text-[10px] text-[#B99561] hover:text-[#F3EFE5] px-1 py-0.5 rounded bg-[#192C23] border border-[#B99561]/30 hidden md:inline-block"
                title="Register new patient"
              >
                +New
              </button>
            </div>
          ) : onOpenAuthModal ? (
            <button
              type="button"
              onClick={() => onOpenAuthModal('login')}
              className="flex items-center space-x-1 px-2.5 py-1 rounded bg-[#192C23] border border-[#B99561]/50 text-[#B99561] hover:text-[#F3EFE5] text-xs font-medium transition-colors"
            >
              <User className="w-3.5 h-3.5" />
              <span>Login / Register</span>
            </button>
          ) : null}

          <button
            onClick={onReplayIntro}
            aria-label="Replay intro"
            title="Replay intro"
            className="p-1.5 sm:p-2 rounded bg-[#12231C] hover:bg-[#192C23] border border-[#9DAF9D]/20 text-[#AEB8AA] hover:text-[#F3EFE5] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Real MetaMask Sepolia Integration */}
          {account ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center space-x-2 px-2.5 py-1.5 rounded bg-[#12231C] border border-[#B99561]/50 text-[#F3EFE5] hover:border-[#B99561] transition-all text-xs"
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
                      <button onClick={() => copyAddress(account)} className="text-[#B99561] hover:text-[#c9a674]">
                        {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
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
                      className="w-full py-1.5 rounded bg-amber-950 text-amber-300 border border-amber-500/40 text-xs text-center font-medium"
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
                    className="w-full flex items-center justify-center space-x-1.5 py-1.5 rounded bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 text-xs font-medium transition-colors"
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
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-[#12231C] hover:bg-[#192C23] border border-[#B99561]/60 text-[#B99561] hover:text-[#c9a674] transition-all text-xs font-medium shadow-sm hover:shadow-[0_0_12px_rgba(185,149,97,0.25)]"
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
