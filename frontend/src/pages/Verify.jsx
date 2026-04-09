import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, CheckCircle, XCircle, ExternalLink, Copy, Shield, Calendar, User, Hash, Sparkles, Send } from 'lucide-react';
import { askAboutCertificate, fetchIPFSContent } from '../lib/ai.js';

export default function Verify() {
  const [hash, setHash] = useState('');
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [ipfsContent, setIpfsContent] = useState(null);
  const [ipfsFetching, setIpfsFetching] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    const urlHash = window.location.hash.split('/verify/')[1];
    if (urlHash) { setHash(urlHash); verifyHash(urlHash); }
  }, []);

  const copyToClipboard = (text) => navigator.clipboard.writeText(text);

  const verifyHash = async (hashToVerify = hash) => {
    if (!hashToVerify || !/^0x[0-9a-fA-F]{64}$/.test(hashToVerify)) {
      setError('Please enter a valid 64-character hash starting with 0x');
      return;
    }
    setIsLoading(true);
    setError('');
    setResult(null);
    setChatMessages([]);
    setIpfsContent(null);
    try {
      const url = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000') + `/api/verify?hash=${hashToVerify}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification failed');
      setResult(data);
      // Try to fetch IPFS content in background (works with real CIDs, silently skips mocks)
      if (data.exists && data.certificate?.[2]) {
        setIpfsFetching(true);
        fetchIPFSContent(data.certificate[2])
          .then(content => setIpfsContent(content))
          .finally(() => setIpfsFetching(false));
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (timestamp) => new Date(Number(timestamp) * 1000).toLocaleString();
  const formatAddress = (address) => `${address.slice(0, 6)}...${address.slice(-4)}`;

  const sendChatMessage = async (question) => {
    if (!question.trim() || chatLoading) return;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: question }]);
    setChatLoading(true);
    try {
      const ans = await askAboutCertificate(question, result.certificate, ipfsContent);
      setChatMessages(prev => [...prev, { role: 'ai', text: ans }]);
    } catch {
      setChatMessages(prev => [...prev, { role: 'ai', text: 'Error: Check your Gemini API key in frontend/.env' }]);
    } finally {
      setChatLoading(false);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold gradient-text mb-4">Verify Certificate</h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">Enter a certificate hash to verify its authenticity and view details</p>
        </div>

        {/* Search */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }} className="glass rounded-3xl p-8 border border-white/10 mb-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">Certificate Hash</label>
              <div className="relative">
                <Hash className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="0x... (64-character SHA-256 hash)"
                  value={hash}
                  onChange={(e) => setHash(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-xl glass border border-white/10 focus:border-brand-400 focus:outline-none transition-colors font-mono text-sm"
                />
              </div>
            </div>
            <motion.button
              onClick={() => verifyHash()}
              disabled={!hash || isLoading}
              whileHover={{ scale: !hash || isLoading ? 1 : 1.02 }}
              whileTap={{ scale: !hash || isLoading ? 1 : 0.98 }}
              className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center justify-center gap-2 ${!hash || isLoading ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-brand-500 to-purple-600 hover:from-brand-400 hover:to-purple-500 text-white pulse-glow'}`}
            >
              {isLoading ? (<><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Verifying...</>) : (<><Search className="h-5 w-5" />Verify Certificate</>)}
            </motion.button>
          </div>
        </motion.div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass rounded-2xl p-6 border border-red-400/20 bg-red-500/5 mb-8">
              <div className="flex items-center gap-3">
                <XCircle className="h-6 w-6 text-red-400" />
                <div>
                  <h3 className="font-semibold text-red-300">Verification Failed</h3>
                  <p className="text-red-200 text-sm mt-1">{error}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} transition={{ duration: 0.6 }}>
              {result.exists ? (
                <div className="space-y-6">
                  {/* Success Header */}
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass rounded-2xl p-6 border border-green-400/20 bg-green-500/5">
                    <div className="flex items-center gap-3 mb-4">
                      <CheckCircle className="h-8 w-8 text-green-400" />
                      <div>
                        <h3 className="text-xl font-semibold text-green-300">Certificate Verified!</h3>
                        <p className="text-green-200 text-sm">This certificate is authentic and recorded on the blockchain</p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Certificate Details */}
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass rounded-3xl p-8 border border-white/10">
                    <h3 className="text-2xl font-semibold text-white mb-6 flex items-center gap-2">
                      <Shield className="h-6 w-6 text-brand-400" /> Certificate Details
                    </h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-400">Title</label>
                        <div className="p-4 rounded-xl bg-black/20 border border-white/5">
                          <p className="text-white font-medium">{result.certificate[4] || 'Untitled'}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-400 flex items-center gap-1"><User className="h-4 w-4" />Owner</label>
                        <div className="p-4 rounded-xl bg-black/20 border border-white/5">
                          <div className="flex items-center justify-between">
                            <code className="text-brand-300 font-mono text-sm">{formatAddress(result.certificate[0])}</code>
                            <button onClick={() => copyToClipboard(result.certificate[0])} className="p-1 hover:bg-white/10 rounded transition-colors"><Copy className="h-4 w-4" /></button>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-400 flex items-center gap-1"><Calendar className="h-4 w-4" />Created</label>
                        <div className="p-4 rounded-xl bg-black/20 border border-white/5">
                          <p className="text-white">{formatDate(result.certificate[3])}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-400">MIME Type</label>
                        <div className="p-4 rounded-xl bg-black/20 border border-white/5">
                          <p className="text-white">{result.certificate[5] || 'application/octet-stream'}</p>
                        </div>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-medium text-slate-400 flex items-center gap-1"><Hash className="h-4 w-4" />File Hash</label>
                        <div className="p-4 rounded-xl bg-black/20 border border-white/5">
                          <div className="flex items-center justify-between">
                            <code className="text-brand-300 font-mono text-sm break-all">{result.certificate[1]}</code>
                            <button onClick={() => copyToClipboard(result.certificate[1])} className="p-1 hover:bg-white/10 rounded transition-colors ml-2"><Copy className="h-4 w-4" /></button>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-medium text-slate-400">File Storage</label>
                        <div className="p-4 rounded-xl bg-black/20 border border-white/5">
                          {result.certificate[2] === 'private' ? (
                            <div className="flex items-center gap-2">
                              <Shield className="h-5 w-5 text-yellow-400" />
                              <span className="text-yellow-300 font-medium">Private Certificate</span>
                              <span className="text-xs text-slate-400 ml-1">— file not stored on IPFS by owner’s choice</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <code className="text-purple-300 font-mono text-sm break-all">{result.certificate[2]}</code>
                              <div className="flex gap-2 ml-2">
                                <button onClick={() => copyToClipboard(result.certificate[2])} className="p-1 hover:bg-white/10 rounded transition-colors"><Copy className="h-4 w-4" /></button>
                                <a href={`https://ipfs.io/ipfs/${result.certificate[2]}`} target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-white/10 rounded transition-colors"><ExternalLink className="h-4 w-4" /></a>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-4 mt-8">
                      {result.certificate[2] !== 'private' && (
                        <a href={`https://ipfs.io/ipfs/${result.certificate[2]}`} target="_blank" rel="noopener noreferrer" className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 rounded-xl text-center font-medium transition-colors flex items-center justify-center gap-2 border border-purple-400/20">
                          <ExternalLink className="h-5 w-5" /> View Original File
                        </a>
                      )}
                      <button onClick={() => copyToClipboard(window.location.href)} className="flex-1 px-6 py-3 glass glass-hover rounded-xl font-medium transition-colors flex items-center justify-center gap-2 border border-white/20">
                        <Copy className="h-5 w-5" /> Share Verification Link
                      </button>
                    </div>
                  </motion.div>

                  {/* AI Chat Assistant */}
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass rounded-3xl p-6 border border-purple-400/20 bg-purple-500/5">
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="h-5 w-5 text-purple-400" />
                      <h3 className="text-lg font-semibold text-white">AI Certificate Assistant</h3>
                      <span className="text-xs text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-full">Powered by Gemini</span>
                      {ipfsFetching && <span className="text-xs text-slate-400">⏳ loading file content...</span>}
                      {ipfsContent && !ipfsFetching && <span className="text-xs text-green-400">● file content loaded</span>}
                    </div>
                    <p className="text-sm text-slate-400 mb-4">Ask me anything about this certificate!</p>

                    {chatMessages.length === 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {['Who owns this certificate?', 'When was it registered?', 'Is this certificate authentic?'].map(q => (
                          <button key={q} onClick={() => sendChatMessage(q)} className="text-xs px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-400/20 rounded-full text-purple-300 transition-colors">{q}</button>
                        ))}
                      </div>
                    )}

                    {chatMessages.length > 0 && (
                      <div className="max-h-48 overflow-y-auto mb-4 space-y-3 pr-1">
                        {chatMessages.map((msg, i) => (
                          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xs px-3 py-2 rounded-xl text-sm ${msg.role === 'user' ? 'bg-brand-500/30 text-white' : 'bg-white/5 text-slate-300'}`}>
                              {msg.role === 'ai' && <Sparkles className="h-3 w-3 text-purple-400 inline mr-1" />}{msg.text}
                            </div>
                          </div>
                        ))}
                        {chatLoading && (
                          <div className="flex justify-start">
                            <div className="bg-white/5 px-4 py-2 rounded-xl">
                              <div className="flex gap-1">
                                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                              </div>
                            </div>
                          </div>
                        )}
                        <div ref={chatEndRef} />
                      </div>
                    )}

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') sendChatMessage(chatInput); }}
                        placeholder="Ask about this certificate... (Press Enter)"
                        className="flex-1 px-4 py-2 rounded-xl glass border border-white/10 focus:border-purple-400 focus:outline-none text-sm"
                      />
                      <button onClick={() => sendChatMessage(chatInput)} disabled={chatLoading || !chatInput.trim()} className="p-2 bg-purple-500/30 hover:bg-purple-500/50 rounded-xl border border-purple-400/20 transition-colors disabled:opacity-50">
                        <Send className="h-4 w-4 text-purple-300" />
                      </button>
                    </div>
                  </motion.div>
                </div>
              ) : (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass rounded-2xl p-8 border border-yellow-400/20 bg-yellow-500/5 text-center">
                  <XCircle className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-yellow-300 mb-2">Certificate Not Found</h3>
                  <p className="text-yellow-200">No certificate exists for this hash. The file may not have been certified yet.</p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 0.8 }} className="mt-12 glass rounded-2xl p-6 border border-white/10">
          <h3 className="font-semibold text-white mb-3">How Verification Works</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-slate-400">
            <div className="space-y-2">
              <p>• Hash is queried from the blockchain</p>
              <p>• Certificate details are retrieved if found</p>
            </div>
            <div className="space-y-2">
              <p>• AI assistant answers questions about the certificate</p>
              <p>• All data is cryptographically verified</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
