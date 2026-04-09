import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Copy, Search, CheckCircle, AlertCircle } from 'lucide-react';

export default function BlockchainVerification({ transactionHash }) {
  const [copied, setCopied] = useState(false);
  
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getPolygonScanUrl = (txHash) => {
    // For Polygon Amoy testnet
    return `https://amoy.polygonscan.com/tx/${txHash}`;
  };

  const formatTxHash = (hash) => {
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-6 border border-white/10 mb-8"
    >
      <div className="flex items-center gap-3 mb-4">
        <CheckCircle className="h-6 w-6 text-green-400" />
        <h3 className="text-xl font-semibold text-white">Blockchain Verification</h3>
      </div>
      
      <div className="space-y-4">
        {/* Transaction Hash */}
        <div>
          <label className="text-sm font-medium text-slate-400 mb-2 block">Transaction Hash</label>
          <div className="flex items-center gap-2 p-3 rounded-xl bg-black/40 border border-white/10">
            <code className="flex-1 text-sm font-mono text-brand-300 break-all">
              {transactionHash}
            </code>
            <button
              onClick={() => copyToClipboard(transactionHash)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Copy transaction hash"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
          {copied && (
            <p className="text-xs text-green-400 mt-1">Copied to clipboard!</p>
          )}
        </div>

        {/* Verification Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href={getPolygonScanUrl(transactionHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 rounded-xl border border-purple-400/20 transition-colors"
          >
            <ExternalLink className="h-5 w-5" />
            <span className="font-medium">View on PolygonScan</span>
          </a>
          
          <button
            onClick={() => copyToClipboard(`https://amoy.polygonscan.com/tx/${transactionHash}`)}
            className="flex items-center justify-center gap-2 px-4 py-3 glass glass-hover rounded-xl border border-white/20 transition-colors"
          >
            <Copy className="h-5 w-5" />
            <span className="font-medium">Copy Verification Link</span>
          </button>
        </div>

        {/* Network Info */}
        <div className="bg-blue-500/10 border border-blue-400/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
            <span className="text-blue-300 font-medium text-sm">Polygon Amoy Testnet</span>
          </div>
          <p className="text-blue-200 text-sm">
            This certificate is permanently recorded on the Polygon blockchain. 
            The transaction hash above provides cryptographic proof of registration.
          </p>
        </div>

        {/* How to Verify */}
        <div className="border-t border-white/10 pt-4">
          <h4 className="text-sm font-semibold text-white mb-2">How to Verify Certificate:</h4>
          <div className="space-y-2 text-sm text-slate-400">
            <p>1. Use the <strong>Transaction ID</strong> from the certificate PDF</p>
            <p>2. Click "View on PolygonScan" or visit polygonscan.com manually</p>
            <p>3. Paste the Transaction ID in the search box</p>
            <p>4. Verify the transaction status shows "Success"</p>
            <p>5. Check the timestamp matches the certificate date</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
