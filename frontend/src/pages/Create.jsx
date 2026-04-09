import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Hash, Globe, Wallet, CheckCircle, AlertCircle, Copy, ExternalLink } from 'lucide-react';
import { uploadFile } from '../lib/ipfs.js';
import { getSigner, getContract } from '../lib/chain.js';

function toHex(bytes) {
  return '0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

const steps = [
  { id: 'upload', label: 'Upload File', icon: Upload },
  { id: 'hash', label: 'Generate Hash', icon: Hash },
  { id: 'ipfs', label: 'Store on IPFS', icon: Globe },
  { id: 'wallet', label: 'Sign Transaction', icon: Wallet },
  { id: 'complete', label: 'Certificate Created', icon: CheckCircle }
];

export default function Create() {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [mime, setMime] = useState('');
  const [status, setStatus] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;
  const disabled = useMemo(() => !file || !title || !contractAddress || isLoading, [file, title, contractAddress, isLoading]);

  async function sha256(file) {
    const buf = await file.arrayBuffer();
    const digest = await crypto.subtle.digest('SHA-256', buf);
    return toHex(new Uint8Array(digest));
  }

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      if (!title) setTitle(droppedFile.name);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  async function onSubmit(e) {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);
    
    try {
      setCurrentStep(1);
      setStatus('Generating file hash...');
      const fileHash32 = await sha256(file);
      
      setCurrentStep(2);
      setStatus('Uploading to IPFS...');
      const cid = await uploadFile(file);
      
      setCurrentStep(3);
      setStatus('Waiting for wallet signature...');
      const signer = await getSigner();
      const contract = getContract(contractAddress, signer);
      
      setCurrentStep(4);
      setStatus('Sending transaction to blockchain...');
      const tx = await contract.certify(fileHash32, cid, title, mime || file.type || 'application/octet-stream');
      await tx.wait();
      
      setCurrentStep(5);
      setStatus('Certificate created successfully!');
      
      const certificateData = {
        hash: fileHash32,
        cid,
        title,
        timestamp: Date.now(),
        txHash: tx.hash
      };
      
      setResult(certificateData);
      
      const list = JSON.parse(localStorage.getItem('my_hashes') || '[]');
      list.unshift(certificateData);
      localStorage.setItem('my_hashes', JSON.stringify(list.slice(0, 25)));
      
    } catch (e) {
      setStatus('Error: ' + (e.reason || e.message));
      setCurrentStep(0);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold gradient-text mb-4">Create Certificate</h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Upload your digital asset and create an immutable proof-of-existence certificate
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index <= currentStep;
              const isCurrent = index === currentStep;
              
              return (
                <div key={step.id} className="flex flex-col items-center">
                  <motion.div
                    animate={{
                      scale: isCurrent ? 1.1 : 1,
                      backgroundColor: isActive ? '#3b82f6' : '#1e293b'
                    }}
                    className={`w-12 h-12 rounded-full flex items-center justify-center border-2 mb-2 ${
                      isActive ? 'border-brand-400 text-white' : 'border-slate-600 text-slate-400'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </motion.div>
                  <span className={`text-sm ${isActive ? 'text-brand-300' : 'text-slate-500'}`}>
                    {step.label}
                  </span>
                  {index < steps.length - 1 && (
                    <div className={`absolute w-24 h-0.5 mt-6 ml-12 ${
                      index < currentStep ? 'bg-brand-400' : 'bg-slate-600'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Form Section */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="glass rounded-3xl p-8 border border-white/10"
          >
            <form onSubmit={onSubmit} className="space-y-6">
              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">Upload File</label>
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${
                    dragOver ? 'border-brand-400 bg-brand-500/10' : 'border-slate-600 hover:border-slate-500'
                  }`}
                >
                  <input
                    type="file"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-300 mb-2">
                    {file ? file.name : 'Drop your file here or click to browse'}
                  </p>
                  <p className="text-sm text-slate-500">
                    Any file type supported • Max 100MB
                  </p>
                </div>
              </div>

              {/* Title Input */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">Certificate Title</label>
                <input
                  type="text"
                  placeholder="Enter a descriptive title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl glass border border-white/10 focus:border-brand-400 focus:outline-none transition-colors"
                />
              </div>

              {/* MIME Type */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">MIME Type (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g., application/pdf, image/png"
                  value={mime}
                  onChange={(e) => setMime(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl glass border border-white/10 focus:border-brand-400 focus:outline-none transition-colors"
                />
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={disabled}
                whileHover={{ scale: disabled ? 1 : 1.02 }}
                whileTap={{ scale: disabled ? 1 : 0.98 }}
                className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                  disabled
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-brand-500 to-purple-600 hover:from-brand-400 hover:to-purple-500 text-white pulse-glow'
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <FileText className="h-5 w-5" />
                    Create Certificate
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>

          {/* Status/Result Section */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="space-y-6"
          >
            {/* Status */}
            {status && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass rounded-2xl p-6 border border-white/10"
              >
                <div className="flex items-center gap-3">
                  {isLoading ? (
                    <div className="w-6 h-6 border-2 border-brand-400/30 border-t-brand-400 rounded-full animate-spin" />
                  ) : result ? (
                    <CheckCircle className="h-6 w-6 text-green-400" />
                  ) : status.includes('Error') ? (
                    <AlertCircle className="h-6 w-6 text-red-400" />
                  ) : (
                    <div className="w-6 h-6 border-2 border-brand-400/30 border-t-brand-400 rounded-full animate-spin" />
                  )}
                  <span className="font-medium">{status}</span>
                </div>
              </motion.div>
            )}

            {/* Result */}
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass rounded-2xl p-6 border border-green-400/20 bg-green-500/5"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <CheckCircle className="h-6 w-6 text-green-400" />
                    <h3 className="font-semibold text-green-300">Certificate Created!</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-slate-400">Certificate Hash</label>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="flex-1 text-xs bg-black/40 p-2 rounded font-mono break-all">
                          {result.hash}
                        </code>
                        <button
                          onClick={() => copyToClipboard(result.hash)}
                          className="p-2 hover:bg-white/10 rounded transition-colors"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <a
                        href={`https://ipfs.io/ipfs/${result.cid}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 px-4 py-2 bg-brand-500/20 hover:bg-brand-500/30 rounded-xl text-center text-sm font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        View on IPFS
                      </a>
                      <button
                        onClick={() => copyToClipboard(`${window.location.origin}/#/verify/${result.hash}`)}
                        className="flex-1 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 rounded-xl text-center text-sm font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <Copy className="h-4 w-4" />
                        Copy Verify Link
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Info Card */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="glass rounded-2xl p-6 border border-white/10"
            >
              <h3 className="font-semibold text-white mb-3">How it works</h3>
              <div className="space-y-2 text-sm text-slate-400">
                <p>• Your file is hashed locally using SHA-256</p>
                <p>• File is uploaded to IPFS for decentralized storage</p>
                <p>• Certificate is minted on Polygon blockchain</p>
                <p>• You get a shareable verification link</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
