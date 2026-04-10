import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Calendar, ExternalLink, Copy, Hash, Search, Filter, Shield, Wallet, RefreshCw, Lock } from 'lucide-react';
import { getCertificatesByOwner, connectWallet } from '../lib/chain.js';

export default function My({ walletAddress: propWallet }) {
  const [walletAddress, setWalletAddress] = useState(propWallet || null);
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [connecting, setConnecting] = useState(false);
  const [source, setSource] = useState(''); // 'blockchain' | 'local'

  const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;

  // Load certificates when wallet is available
  useEffect(() => {
    if (propWallet) setWalletAddress(propWallet);
  }, [propWallet]);

  useEffect(() => {
    if (walletAddress) loadCertificates(walletAddress);
  }, [walletAddress]);

  const loadCertificates = async (addr) => {
    setLoading(true);
    try {
      // Fetch from blockchain (which might only return recent ones due to RPC block limits)
      const blockchainCerts = await getCertificatesByOwner(contractAddress, addr);

      // Fetch from local cache
      const local = JSON.parse(localStorage.getItem('my_hashes') || '[]');
      const myLocal = local.filter(c => !c.owner || c.owner?.toLowerCase() === addr.toLowerCase());

      // Merge both, preferring blockchain data, to ensure old certificates aren't lost
      const merged = [...blockchainCerts];
      const blockchainHashes = new Set(blockchainCerts.map(c => c.hash));

      myLocal.forEach(localCert => {
        if (!blockchainHashes.has(localCert.hash)) {
          merged.push(localCert);
        }
      });

      // Sort by newest first by default
      merged.sort((a, b) => b.timestamp - a.timestamp);

      setCerts(merged);

      // If we have certs in our local cache that the blockchain didn't return (due to RPC limits), show pending
      const hasPending = myLocal.some(c => !blockchainHashes.has(c.hash));
      if (merged.length > 0) {
        setSource(hasPending ? 'local' : 'blockchain');
      } else {
        setSource('');
      }

    } catch {
      const local = JSON.parse(localStorage.getItem('my_hashes') || '[]');
      const myLocal = local.filter(c => !c.owner || c.owner?.toLowerCase() === addr.toLowerCase());
      setCerts(myLocal.sort((a, b) => b.timestamp - a.timestamp));
      setSource(myLocal.length > 0 ? 'local' : '');
    } finally {
      setLoading(false);
    }
  };

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

  const filteredAndSorted = certs
    .filter(cert =>
      cert.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.hash?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'newest') return b.timestamp - a.timestamp;
      if (sortBy === 'oldest') return a.timestamp - b.timestamp;
      if (sortBy === 'title') return (a.title || '').localeCompare(b.title || '');
      return 0;
    });

  const formatDate = (ts) => new Date(ts).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
  const shortHash = (h) => h ? `${h.slice(0, 10)}...${h.slice(-8)}` : '—';
  const shortAddr = (a) => a ? `${a.slice(0, 6)}...${a.slice(-4)}` : '—';
  const copyToClipboard = (text) => navigator.clipboard.writeText(text);

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold gradient-text mb-4">My Certificates</h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            All certificates registered to your wallet address
          </p>
        </div>

        {/* No wallet connected */}
        {!walletAddress ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-3xl p-12 border border-white/10 text-center max-w-md mx-auto"
          >
            <Wallet className="h-16 w-16 text-brand-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Connect Your Wallet</h3>
            <p className="text-slate-400 mb-6">Connect MetaMask to view all certificates registered to your address</p>
            <motion.button
              onClick={handleConnect}
              disabled={connecting}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-gradient-to-r from-brand-500 to-purple-600 rounded-xl font-semibold disabled:opacity-50 flex items-center gap-2 mx-auto"
            >
              <Wallet className="h-5 w-5" />
              {connecting ? 'Connecting...' : 'Connect MetaMask'}
            </motion.button>
          </motion.div>
        ) : (
          <>
            {/* Wallet info + controls */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="glass rounded-2xl p-6 border border-white/10 mb-8"
            >
              {/* Wallet badge */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-sm text-slate-400">Connected:</span>
                  <code className="text-sm text-brand-300 font-mono">{shortAddr(walletAddress)}</code>
                  <button onClick={() => copyToClipboard(walletAddress)} className="p-1 hover:bg-white/10 rounded">
                    <Copy className="h-3.5 w-3.5 text-slate-400" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  {source && (
                    <span className={`text-xs px-2 py-1 rounded-full ${source === 'blockchain'
                      ? 'bg-green-500/10 text-green-400 border border-green-400/20'
                      : 'bg-yellow-500/10 text-yellow-400 border border-yellow-400/20'
                      }`}>
                      {source === 'blockchain' ? '⛓ From blockchain' : '⏳ Pending sync — certify on Amoy to update'}
                    </span>
                  )}
                  <button
                    onClick={() => loadCertificates(walletAddress)}
                    disabled={loading}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm glass glass-hover rounded-lg border border-white/10 disabled:opacity-50"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>
              </div>

              {/* Search + Sort */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by title or hash..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl glass border border-white/10 focus:border-brand-400 focus:outline-none"
                  />
                </div>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="pl-10 pr-8 py-3 rounded-xl glass border border-white/10 focus:border-brand-400 focus:outline-none appearance-none cursor-pointer"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="title">By Title</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-6 mt-4 pt-4 border-t border-white/10">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Shield className="h-4 w-4" />
                  <span>{certs.length} Total Certificates</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Search className="h-4 w-4" />
                  <span>{filteredAndSorted.length} Showing</span>
                </div>
              </div>
            </motion.div>

            {/* Certificates Grid */}
            <AnimatePresence>
              {loading ? (
                <div className="text-center py-16">
                  <RefreshCw className="h-10 w-10 text-brand-400 mx-auto animate-spin mb-4" />
                  <p className="text-slate-400">Fetching certificates from blockchain...</p>
                </div>
              ) : filteredAndSorted.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="glass rounded-3xl p-12 border border-white/10 text-center"
                >
                  <FileText className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-300 mb-2">
                    {searchTerm ? 'No certificates found' : 'No certificates yet'}
                  </h3>
                  <p className="text-slate-400 mb-6">
                    {searchTerm ? 'Try adjusting your search' : 'Create your first certificate to get started'}
                  </p>
                  {!searchTerm && (
                    <motion.button
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={() => window.location.hash = '#/create'}
                      className="px-6 py-3 bg-gradient-to-r from-brand-500 to-purple-600 rounded-xl font-medium"
                    >
                      Create Certificate
                    </motion.button>
                  )}
                </motion.div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredAndSorted.map((cert, index) => (
                    <motion.div
                      key={cert.hash || index}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.08, duration: 0.5 }}
                      whileHover={{ scale: 1.02, y: -5 }}
                      className="group glass glass-hover rounded-2xl p-6 border border-white/10 relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="relative z-10">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                              {cert.cid === 'private' ? <Lock className="h-5 w-5 text-white" /> : <FileText className="h-5 w-5 text-white" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-white truncate group-hover:text-brand-300 transition-colors">
                                {cert.title || 'Untitled Certificate'}
                              </h3>
                              <div className="flex items-center gap-1 text-xs text-slate-400">
                                <Calendar className="h-3 w-3" />
                                <span>{cert.timestamp ? formatDate(cert.timestamp) : '—'}</span>
                              </div>
                            </div>
                          </div>
                          {cert.cid === 'private' && (
                            <span className="text-xs px-2 py-0.5 bg-yellow-500/10 border border-yellow-400/20 text-yellow-300 rounded-full flex-shrink-0">🔒 Private</span>
                          )}
                        </div>

                        {/* Hash */}
                        <div className="mb-4">
                          <label className="text-xs text-slate-500 flex items-center gap-1 mb-1">
                            <Hash className="h-3 w-3" /> Certificate Hash
                          </label>
                          <div className="flex items-center gap-2">
                            <code className="text-xs font-mono text-brand-300 bg-black/20 px-2 py-1 rounded flex-1 truncate">
                              {shortHash(cert.hash)}
                            </code>
                            <button onClick={() => copyToClipboard(cert.hash)} className="p-1 hover:bg-white/10 rounded transition-colors">
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* MIME */}
                        {cert.mime && (
                          <div className="mb-4">
                            <span className="text-xs px-2 py-0.5 bg-white/5 border border-white/10 text-slate-400 rounded-full">{cert.mime}</span>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2">
                          {cert.cid !== 'private' && (
                            <a
                              href={`https://ipfs.io/ipfs/${cert.cid}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg text-center text-sm font-medium transition-colors flex items-center justify-center gap-1"
                            >
                              <ExternalLink className="h-3 w-3" /> IPFS
                            </a>
                          )}
                          <button
                            onClick={() => {
                              const verifyUrl = `${window.location.origin}${window.location.pathname}#/verify/${cert.hash}`;
                              window.open(verifyUrl, '_blank');
                            }}
                            className="flex-1 px-3 py-2 bg-brand-500/20 hover:bg-brand-500/30 rounded-lg text-center text-sm font-medium transition-colors flex items-center justify-center gap-1"
                          >
                            <Shield className="h-3 w-3" /> Verify
                          </button>
                        </div>

                        {/* Tx Hash */}
                        {cert.txHash && (
                          <div className="mt-3 pt-3 border-t border-white/5">
                            <label className="text-xs text-slate-500">Transaction</label>
                            <div className="flex items-center gap-2 mt-1">
                              <code className="text-xs font-mono text-slate-400 flex-1 truncate">
                                {cert.txHash.slice(0, 10)}...{cert.txHash.slice(-6)}
                              </code>
                              <button onClick={() => copyToClipboard(cert.txHash)} className="p-1 hover:bg-white/10 rounded">
                                <Copy className="h-3 w-3" />
                              </button>
                              <a
                                href={`https://amoy.polygonscan.com/tx/${cert.txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 hover:bg-white/10 rounded"
                                title="View on Amoy PolygonScan"
                              >
                                <ExternalLink className="h-3 w-3 text-purple-400" />
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>

            {certs.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="mt-12 glass rounded-2xl p-6 border border-white/10"
              >
                <h3 className="font-semibold text-white mb-3">About Your Gallery</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm text-slate-400">
                  <div className="space-y-2">
                    <p>• Certificates are fetched live from the blockchain</p>
                    <p>• 🔒 Private certs show metadata only — file not on IPFS</p>
                  </div>
                  <div className="space-y-2">
                    <p>• Click Verify to check the blockchain record</p>
                    <p>• Your wallet address is your permanent identity</p>
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}
