import React, { useState, useEffect } from 'react';
import { ShieldCheck, FilePlus2, Search, GalleryVerticalEnd, Sparkles, Wallet, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { connectWallet, getConnectedAddress } from '../lib/chain.js';

export default function Navbar({ onNav, walletAddress, setWalletAddress }) {
  const [activeTab, setActiveTab] = useState('home');
  const [connecting, setConnecting] = useState(false);

  // Auto-detect if wallet already connected on mount
  useEffect(() => {
    getConnectedAddress().then(addr => { if (addr) setWalletAddress(addr); });

    // Listen for account changes
    if (window.ethereum) {
      const handler = (accounts) => setWalletAddress(accounts[0] || null);
      window.ethereum.on('accountsChanged', handler);
      return () => window.ethereum.removeListener('accountsChanged', handler);
    }
  }, []);

  const handleNav = (page) => { setActiveTab(page); onNav(page); };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const addr = await connectWallet();
      setWalletAddress(addr);
    } catch (e) {
      alert(e.message);
    } finally {
      setConnecting(false);
    }
  };

  const navItems = [
    { id: 'home', label: 'Home', icon: null },
    { id: 'create', label: 'Create', icon: FilePlus2 },
    { id: 'verify', label: 'Verify', icon: Search },
    { id: 'my', label: 'My Certificates', icon: GalleryVerticalEnd },
  ];

  const shortAddr = (addr) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="sticky top-0 z-50 glass border-b border-white/10"
    >
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => handleNav('home')}
          >
            <div className="relative">
              <ShieldCheck className="h-8 w-8 text-brand-400" />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="absolute -top-1 -right-1"
              >
                <Sparkles className="h-4 w-4 text-purple-400" />
              </motion.div>
            </div>
            <div>
              <h1 className="gradient-text font-bold text-xl">VeriChain</h1>
              <p className="text-xs text-slate-400 -mt-1">Certificate Generator</p>
            </div>
          </motion.div>

          {/* Nav + Wallet */}
          <div className="flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <motion.button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className={`relative px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 flex items-center gap-2 ${isActive
                      ? 'bg-gradient-to-r from-brand-500/20 to-purple-500/20 text-brand-300 border border-brand-400/30'
                      : 'text-slate-300 hover:text-white glass-hover'
                    }`}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  <span>{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-gradient-to-r from-brand-500/10 to-purple-500/10 rounded-xl border border-brand-400/20"
                      initial={false}
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </motion.button>
              );
            })}

            {/* Wallet Button */}
            {walletAddress ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-500/10 border border-green-400/30 text-green-300 text-sm font-medium"
              >
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="font-mono">{shortAddr(walletAddress)}</span>
              </motion.div>
            ) : (
              <motion.button
                onClick={handleConnect}
                disabled={connecting}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-purple-600 hover:from-brand-400 hover:to-purple-500 text-white text-sm font-semibold transition-all disabled:opacity-50"
              >
                <Wallet className="h-4 w-4" />
                {connecting ? 'Connecting...' : 'Connect Wallet'}
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
