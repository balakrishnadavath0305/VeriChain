import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Hash, Wallet, FileText, Award, Download, FolderOpen, CheckCircle, Copy, ExternalLink, Sparkles, AlertTriangle, Shield, Send } from 'lucide-react';
import { hashFiles, formatFileSize, getFileIcon } from '../lib/fileUtils.js';
import { ethers } from 'ethers';
import { getSigner, getContract } from '../lib/chain.js';
import { uploadFile } from '../lib/ipfs.js';
import { classifyDocuments, generateDescription, assessFraudRisk, detectMime, readFileContent, askAboutFiles } from '../lib/ai.js';
import Certificate from '../components/Certificate.jsx';
import BlockchainVerification from '../components/BlockchainVerification.jsx';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const steps = [
  { id: 'upload', label: 'Upload Files/Folders', icon: Upload },
  { id: 'hash', label: 'Generate Hash', icon: Hash },
  { id: 'form', label: 'Certificate Details', icon: FileText },
  { id: 'blockchain', label: 'Blockchain Registration', icon: Wallet },
  { id: 'certificate', label: 'Generate Certificate', icon: Award }
];

const THEMES = [
  { id: 'academic', label: 'Academic', emoji: '🎓', desc: 'Research & Study' },
  { id: 'corporate', label: 'Corporate', emoji: '💼', desc: 'Business & Finance' },
  { id: 'creative', label: 'Creative', emoji: '🎨', desc: 'Art & Design' },
  { id: 'technical', label: 'Technical', emoji: '⚙️', desc: 'Engineering & Code' }
];

const RISK_CONFIG = {
  low: { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', icon: '🟢', label: 'Low Risk' },
  medium: { color: '#d97706', bg: '#fffbeb', border: '#fde68a', icon: '🟡', label: 'Medium Risk' },
  high: { color: '#dc2626', bg: '#fef2f2', border: '#fecaca', icon: '🔴', label: 'High Risk' }
};

export default function CreateCertificate() {
  const [currentStep, setCurrentStep] = useState(0);
  const [files, setFiles] = useState([]);
  const [fileContent, setFileContent] = useState(null);
  const [projectHash, setProjectHash] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [transactionHash, setTransactionHash] = useState('');
  const [certificateData, setCertificateData] = useState(null);
  const [selectedTheme, setSelectedTheme] = useState('corporate');
  const [aiClassification, setAiClassification] = useState(null);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [fraudRisk, setFraudRisk] = useState(null);
  const [formData, setFormData] = useState({ recipientName: '', projectTitle: '', description: '' });
  const [fileChatMessages, setFileChatMessages] = useState([]);
  const [fileChatInput, setFileChatInput] = useState('');
  const [fileChatLoading, setFileChatLoading] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const fileChatEndRef = useRef();

  const certificateRef = useRef();
  const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;

  const handleFileUpload = async (selectedFiles) => {
    setFiles(Array.from(selectedFiles));
    setCurrentStep(1);
    setStatus('Generating project hash...');
    setIsLoading(true);
    try {
      const hash = await hashFiles(selectedFiles);
      setProjectHash(hash);
      // Read text content for AI chat (non-blocking)
      readFileContent(selectedFiles).then(content => setFileContent(content));
      setStatus('Hash generated successfully!');
      setCurrentStep(2);
    } catch (error) {
      setStatus('Error: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAIDescription = async () => {
    if (!formData.projectTitle) {
      setStatus('Please enter a project title first');
      return;
    }
    setAiGenerating(true);
    try {
      const desc = await generateDescription(formData.projectTitle, files, fileContent);
      setFormData(prev => ({ ...prev, description: desc.trim() }));
    } catch (e) {
      setStatus('AI error: ' + e.message);
    } finally {
      setAiGenerating(false);
    }
  };

  const handleFormSubmit = () => {
    if (!formData.recipientName || !formData.projectTitle) {
      setStatus('Please fill in all required fields');
      return;
    }
    // Feature 3: Assess fraud risk
    const risk = assessFraudRisk(files, formData.projectTitle);
    setFraudRisk(risk);
    setCurrentStep(3);
  };

  const handleBlockchainRegistration = async () => {
    if (!projectHash) return;
    setIsLoading(true);
    setStatus('Connecting to wallet...');
    try {
      if (!contractAddress) {
        setStatus('Demo Mode: Simulating blockchain registration...');
        await new Promise(r => setTimeout(r, 2000));
        const mockTxHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
        setTransactionHash(mockTxHash);
        setStatus('Demo Mode: Mock registration completed!');
        setCurrentStep(3);
        return;
      }
      const signer = await getSigner();
      const contract = getContract(contractAddress, signer);
      setStatus('Registering on blockchain...');
      const mime = detectMime(files);
      // Private mode: skip IPFS, store 'private' as CID
      const ipfsCid = isPrivate ? 'private' : await uploadFile(files[0]);
      if (!isPrivate) setStatus('Uploading to IPFS... done!');
      // Polygon Amoy requires a minimum gas tip of 25 Gwei — set explicit EIP-1559 gas overrides
      const tx = await contract.certify(projectHash, ipfsCid, formData.projectTitle || 'Untitled Project', mime, {
        maxPriorityFeePerGas: ethers.parseUnits('30', 'gwei'), // tip to miner (min 25 Gwei on Amoy)
        maxFeePerGas: ethers.parseUnits('60', 'gwei'),         // max total gas price willing to pay
      });
      setStatus('Waiting for confirmation...');
      await tx.wait();
      setTransactionHash(tx.hash);
      setStatus('Successfully registered on blockchain!');
      // Cache in localStorage for gallery fallback
      const cached = JSON.parse(localStorage.getItem('my_hashes') || '[]');
      cached.unshift({
        hash: projectHash,
        cid: ipfsCid,
        title: formData.projectTitle || 'Untitled Project',
        mime: detectMime(files),
        timestamp: Date.now(),
        txHash: tx.hash,
        owner: (await contract.runner.getAddress()).toLowerCase()
      });
      localStorage.setItem('my_hashes', JSON.stringify(cached.slice(0, 100)));

    } catch (error) {
      setStatus('Error: ' + (error.reason || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateCertificate = () => {
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    setCertificateData({
      ...formData,
      transactionHash,
      timestamp: Date.now(),
      fileHash: projectHash,
      fileCount: files.length,
      totalSize: formatFileSize(totalSize)
    });
    setCurrentStep(4);
  };

  const downloadCertificate = async () => {
    if (!certificateRef.current) return;
    setIsLoading(true);
    setStatus('Generating certificate PDF...');
    try {
      const canvas = await html2canvas(certificateRef.current, { scale: 2, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('portrait', 'mm', 'a4');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`${formData.projectTitle}_Certificate.pdf`);
      setStatus('Certificate downloaded successfully!');
    } catch (error) {
      setStatus('Error generating PDF: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const riskCfg = fraudRisk ? RISK_CONFIG[fraudRisk.level] : null;

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold gradient-text mb-4">Certificate Generator</h1>
          <p className="text-xl text-slate-400">AI-powered blockchain-verified certificate creation</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index <= currentStep;
              const isCurrent = index === currentStep;
              return (
                <div key={step.id} className="flex flex-col items-center">
                  <motion.div
                    animate={{ scale: isCurrent ? 1.1 : 1, backgroundColor: isActive ? '#3b82f6' : '#1e293b' }}
                    className={`w-14 h-14 rounded-full flex items-center justify-center border-2 mb-3 ${isActive ? 'border-brand-400 text-white' : 'border-slate-600 text-slate-400'}`}
                  >
                    <Icon className="h-6 w-6" />
                  </motion.div>
                  <span className={`text-sm text-center ${isActive ? 'text-brand-300' : 'text-slate-500'}`}>{step.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* STEP 0: Upload */}
          {currentStep === 0 && (
            <motion.div key="upload" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
              <div className="glass rounded-3xl p-8 border border-white/10 text-center">
                <FolderOpen className="h-16 w-16 text-brand-400 mx-auto mb-6" />
                <h2 className="text-2xl font-bold text-white mb-2">Upload Your Project Files</h2>
                <p className="text-slate-400 mb-2">AI will automatically classify your files and suggest a title</p>
                <div className="flex items-center justify-center gap-2 mb-8">
                  <Sparkles className="h-4 w-4 text-purple-400" />
                  <span className="text-sm text-purple-300">Powered by Gemini AI</span>
                </div>
                <div className="space-y-4">
                  <input type="file" multiple webkitdirectory="" onChange={(e) => handleFileUpload(e.target.files)} className="hidden" id="folder-upload" />
                  <label htmlFor="folder-upload" className="block">
                    <div className="border-2 border-dashed border-brand-400 rounded-2xl p-12 hover:bg-brand-500/10 transition-colors cursor-pointer">
                      <Upload className="h-12 w-12 text-brand-400 mx-auto mb-4" />
                      <p className="text-white font-medium">Click to select folder</p>
                      <p className="text-slate-400 text-sm">All files in the folder will be included</p>
                    </div>
                  </label>
                  <input type="file" multiple onChange={(e) => handleFileUpload(e.target.files)} className="hidden" id="file-upload" />
                  <label htmlFor="file-upload" className="block">
                    <div className="border-2 border-dashed border-purple-400 rounded-2xl p-8 hover:bg-purple-500/10 transition-colors cursor-pointer">
                      <FileText className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                      <p className="text-white font-medium">Or select individual files</p>
                    </div>
                  </label>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEPS 1–3 */}
          {currentStep >= 1 && currentStep < 4 && (
            <motion.div key="processing" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }}>
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Left: Files */}
                <div className="glass rounded-3xl p-6 border border-white/10">
                  <h3 className="text-xl font-bold text-white mb-4">Selected Files ({files.length})</h3>

                  {/* AI Classification Badge */}
                  {aiClassification && (
                    <div className="mb-4 p-3 bg-purple-500/10 border border-purple-400/20 rounded-xl">
                      <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="h-4 w-4 text-purple-400" />
                        <span className="text-sm font-semibold text-purple-300">AI Classification</span>
                        <span className="text-xs text-slate-400">({aiClassification.confidence}% confidence)</span>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-200 rounded-full capitalize">{aiClassification.category}</span>
                        <span className="text-xs text-slate-400">→ Theme: <span className="text-purple-300 capitalize">{aiClassification.theme}</span></span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 max-h-52 overflow-y-auto">
                    {files.slice(0, 10).map((file, index) => (
                      <div key={index} className="flex items-center gap-3 p-2 rounded bg-white/5">
                        <span className="text-xl">{getFileIcon(file.name)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">{file.name}</p>
                          <p className="text-xs text-slate-400">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                    ))}
                    {files.length > 10 && <p className="text-sm text-slate-400 text-center">... and {files.length - 10} more files</p>}
                  </div>

                  {/* AI File Chat */}
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-4 w-4 text-purple-400" />
                      <span className="text-sm font-semibold text-purple-300">Ask AI about your files</span>
                      {fileContent && <span className="text-xs text-green-400">● content loaded</span>}
                    </div>

                    {fileChatMessages.length === 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {['What does this project do?', 'Summarize the code', 'What tech stack is used?'].map(q => (
                          <button key={q} onClick={() => setFileChatInput(q)} className="text-xs px-2 py-1 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-400/20 rounded-full text-purple-300 transition-colors">{q}</button>
                        ))}
                      </div>
                    )}

                    {fileChatMessages.length > 0 && (
                      <div className="max-h-36 overflow-y-auto mb-2 space-y-2 pr-1">
                        {fileChatMessages.map((msg, i) => (
                          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xs px-2.5 py-1.5 rounded-xl text-xs ${msg.role === 'user' ? 'bg-brand-500/30 text-white' : 'bg-white/5 text-slate-300'}`}>
                              {msg.role === 'ai' && <Sparkles className="h-2.5 w-2.5 text-purple-400 inline mr-1" />}{msg.text}
                            </div>
                          </div>
                        ))}
                        {fileChatLoading && (
                          <div className="flex gap-1 pl-2">
                            <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        )}
                        <div ref={fileChatEndRef} />
                      </div>
                    )}

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={fileChatInput}
                        onChange={(e) => setFileChatInput(e.target.value)}
                        onKeyDown={async (e) => {
                          if (e.key === 'Enter' && fileChatInput.trim() && !fileChatLoading) {
                            const q = fileChatInput.trim();
                            setFileChatInput('');
                            setFileChatMessages(prev => [...prev, { role: 'user', text: q }]);
                            setFileChatLoading(true);
                            try {
                              const ans = await askAboutFiles(q, files, fileContent, formData.projectTitle);
                              setFileChatMessages(prev => [...prev, { role: 'ai', text: ans }]);
                            } catch (err) {
                              setFileChatMessages(prev => [...prev, { role: 'ai', text: err.message }]);
                            } finally {
                              setFileChatLoading(false);
                              fileChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                            }
                          }
                        }}
                        placeholder="Ask about your files... (Enter)"
                        className="flex-1 px-3 py-1.5 rounded-xl glass border border-white/10 focus:border-purple-400 focus:outline-none text-xs"
                      />
                      <button
                        disabled={fileChatLoading || !fileChatInput.trim()}
                        onClick={async () => {
                          const q = fileChatInput.trim();
                          if (!q) return;
                          setFileChatInput('');
                          setFileChatMessages(prev => [...prev, { role: 'user', text: q }]);
                          setFileChatLoading(true);
                          try {
                            const ans = await askAboutFiles(q, files, fileContent, formData.projectTitle);
                            setFileChatMessages(prev => [...prev, { role: 'ai', text: ans }]);
                          } catch (err) {
                            setFileChatMessages(prev => [...prev, { role: 'ai', text: err.message }]);
                          } finally {
                            setFileChatLoading(false);
                            fileChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                          }
                        }}
                        className="p-1.5 bg-purple-500/30 hover:bg-purple-500/50 rounded-xl border border-purple-400/20 transition-colors disabled:opacity-50"
                      >
                        <Send className="h-3.5 w-3.5 text-purple-300" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="glass rounded-3xl p-6 border border-white/10">
                  {/* STEP 1: Hash */}
                  {currentStep === 1 && (
                    <div>
                      <h3 className="text-xl font-bold text-white mb-4">Project Hash Generated</h3>
                      <div className="bg-black/40 p-4 rounded-xl mb-6">
                        <code className="text-xs font-mono text-brand-300 break-all">{projectHash}</code>
                      </div>
                      {isLoading ? (
                        <div className="flex items-center gap-3 text-slate-400">
                          <div className="w-5 h-5 border-2 border-brand-400/30 border-t-brand-400 rounded-full animate-spin" />
                          <span>Running AI analysis...</span>
                        </div>
                      ) : (
                        <button onClick={() => setCurrentStep(2)} className="w-full py-3 bg-gradient-to-r from-brand-500 to-purple-600 rounded-xl font-semibold">
                          Continue to Certificate Details
                        </button>
                      )}
                    </div>
                  )}

                  {/* STEP 2: Form with AI features */}
                  {currentStep === 2 && (
                    <div>
                      <h3 className="text-xl font-bold text-white mb-4">Certificate Details</h3>

                      {/* Manual AI Classifier Button */}
                      <button
                        onClick={async () => {
                          setAiGenerating(true);
                          try {
                            const classification = await classifyDocuments(files);
                            setAiClassification(classification);
                            if (classification.suggestedTitle) {
                              setFormData(prev => ({ ...prev, projectTitle: prev.projectTitle || classification.suggestedTitle }));
                            }
                            setSelectedTheme(classification.theme || 'corporate');
                          } catch (e) {
                            setStatus('AI error: ' + e.message);
                          } finally {
                            setAiGenerating(false);
                          }
                        }}
                        disabled={aiGenerating}
                        className="w-full mb-4 py-2.5 flex items-center justify-center gap-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/30 rounded-xl text-sm text-purple-300 font-medium transition-colors disabled:opacity-50"
                      >
                        {aiGenerating ? (
                          <><div className="w-4 h-4 border border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />Analyzing files...</>
                        ) : (
                          <><Sparkles className="h-4 w-4" />✨ Analyze with AI (auto-fill title & theme)</>
                        )}
                      </button>

                      {aiClassification && (
                        <div className="mb-3 p-3 bg-purple-500/10 border border-purple-400/20 rounded-xl text-xs text-purple-300">
                          <Sparkles className="h-3 w-3 inline mr-1" />
                          AI detected: <span className="font-semibold capitalize">{aiClassification.category}</span> project · Theme: <span className="font-semibold capitalize">{aiClassification.theme}</span> ({aiClassification.confidence}% confidence)
                        </div>
                      )}

                      <div className="space-y-4">
                        <input
                          type="text"
                          placeholder="Recipient Name *"
                          value={formData.recipientName}
                          onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl glass border border-white/10 focus:border-brand-400 focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Project Title *"
                          value={formData.projectTitle}
                          onChange={(e) => setFormData({ ...formData, projectTitle: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl glass border border-white/10 focus:border-brand-400 focus:outline-none"
                        />
                        {/* AI Description */}
                        <div className="relative">
                          <textarea
                            placeholder="Project Description (optional)"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl glass border border-white/10 focus:border-brand-400 focus:outline-none h-24 pr-32"
                          />
                          <button
                            onClick={handleAIDescription}
                            disabled={aiGenerating}
                            className="absolute top-2 right-2 flex items-center gap-1 px-3 py-1.5 bg-purple-500/30 hover:bg-purple-500/50 border border-purple-400/30 rounded-lg text-xs text-purple-300 font-medium transition-colors disabled:opacity-50"
                          >
                            {aiGenerating ? (
                              <><div className="w-3 h-3 border border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />Writing...</>
                            ) : (
                              <><Sparkles className="h-3 w-3" />AI Generate</>
                            )}
                          </button>
                        </div>

                        {/* Feature 5: Theme Selector */}
                        <div>
                          <p className="text-sm text-slate-400 mb-2 flex items-center gap-1">
                            <Sparkles className="h-3 w-3 text-purple-400" />
                            Certificate Theme {aiClassification && <span className="text-purple-300">(AI suggested: <span className="capitalize">{aiClassification.theme}</span>)</span>}
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            {THEMES.map(t => (
                              <button
                                key={t.id}
                                onClick={() => setSelectedTheme(t.id)}
                                className={`p-3 rounded-xl border text-left transition-all ${selectedTheme === t.id ? 'border-brand-400 bg-brand-500/20' : 'border-white/10 hover:border-white/30'}`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">{t.emoji}</span>
                                  <div>
                                    <p className="text-sm font-medium text-white">{t.label}</p>
                                    <p className="text-xs text-slate-400">{t.desc}</p>
                                  </div>
                                  {aiClassification?.theme === t.id && (
                                    <span className="ml-auto text-xs text-purple-300 border border-purple-400/30 px-1 rounded">AI</span>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>

                        <button onClick={handleFormSubmit} className="w-full py-3 bg-gradient-to-r from-brand-500 to-purple-600 rounded-xl font-semibold">
                          Continue to Blockchain Registration
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 3: Blockchain + Fraud Risk */}
                  {currentStep === 3 && (
                    <div>
                      <h3 className="text-xl font-bold text-white mb-4">Blockchain Registration</h3>

                      {/* Feature 3: Fraud Risk Score */}
                      {fraudRisk && (
                        <div className="mb-4 p-4 rounded-xl border" style={{ backgroundColor: riskCfg.bg, borderColor: riskCfg.border }}>
                          <div className="flex items-center gap-2 mb-2">
                            <Shield className="h-4 w-4" style={{ color: riskCfg.color }} />
                            <span className="font-semibold text-sm" style={{ color: riskCfg.color }}>
                              {riskCfg.icon} AI Risk Assessment: {riskCfg.label}
                            </span>
                          </div>
                          <ul className="space-y-1">
                            {fraudRisk.reasons.map((r, i) => (
                              <li key={i} className="text-xs flex items-center gap-1" style={{ color: riskCfg.color }}>
                                <span>•</span> {r}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Privacy Mode Toggle */}
                      <div className="mb-4 p-4 rounded-xl border border-white/10 bg-white/5">
                        <p className="text-sm font-semibold text-white mb-3">File Storage Mode</p>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() => setIsPrivate(false)}
                            className={`p-3 rounded-xl border text-left transition-all ${!isPrivate ? 'border-brand-400 bg-brand-500/20' : 'border-white/10 hover:border-white/20'}`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <ExternalLink className="h-4 w-4 text-brand-400" />
                              <span className="text-sm font-medium text-white">Public</span>
                            </div>
                            <p className="text-xs text-slate-400">File uploaded to IPFS — anyone with CID can access</p>
                          </button>
                          <button
                            onClick={() => setIsPrivate(true)}
                            className={`p-3 rounded-xl border text-left transition-all ${isPrivate ? 'border-yellow-400 bg-yellow-500/20' : 'border-white/10 hover:border-white/20'}`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <Shield className="h-4 w-4 text-yellow-400" />
                              <span className="text-sm font-medium text-white">Private</span>
                            </div>
                            <p className="text-xs text-slate-400">Hash only on-chain — file stays with you</p>
                          </button>
                        </div>
                        {isPrivate && (
                          <p className="mt-2 text-xs text-yellow-300">⚠️ Private mode: verifiers can confirm the hash exists but cannot access the file content</p>
                        )}
                      </div>

                      {!contractAddress && (
                        <div className="bg-yellow-500/10 border border-yellow-400/20 rounded-xl p-4 mb-4">
                          <p className="text-yellow-200 text-sm">Demo Mode: Contract not deployed. Will simulate registration.</p>
                        </div>
                      )}

                      {transactionHash ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-green-400 mb-2">
                            <CheckCircle className="h-5 w-5" />
                            <span className="font-semibold">Successfully registered on blockchain!</span>
                          </div>
                          <div className="bg-black/40 p-3 rounded-xl">
                            <p className="text-xs text-slate-400 mb-1">Transaction Hash</p>
                            <code className="text-xs font-mono text-brand-300 break-all">{transactionHash}</code>
                          </div>
                          <button onClick={handleGenerateCertificate} className="w-full py-3 bg-gradient-to-r from-green-500 to-blue-600 rounded-xl font-semibold flex items-center justify-center gap-2">
                            <Award className="h-5 w-5" /> Generate Certificate
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={handleBlockchainRegistration}
                          disabled={isLoading}
                          className="w-full py-3 bg-gradient-to-r from-brand-500 to-purple-600 rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {isLoading ? (
                            <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Processing...</>
                          ) : (
                            <><Wallet className="h-5 w-5" />Connect Wallet & Register</>
                          )}
                        </button>
                      )}
                    </div>
                  )}

                  {status && (
                    <div className="mt-4 p-3 rounded-xl bg-black/40 border border-white/10">
                      <p className="text-sm text-slate-300">{status}</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 4: Certificate */}
          {currentStep === 4 && certificateData && (
            <motion.div key="certificate" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <div className="text-center mb-8">
                <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-white mb-2">Certificate Generated!</h2>
                <p className="text-slate-400">Your blockchain-verified certificate is ready</p>
              </div>

              <div className="mb-8">
                <Certificate ref={certificateRef} certificateData={certificateData} theme={selectedTheme} />
              </div>

              <BlockchainVerification transactionHash={transactionHash} />

              {/* Verify Link */}
              <div className="mt-6 p-4 glass rounded-2xl border border-brand-400/20">
                <h3 className="font-semibold text-white mb-2">🔍 Verify this Certificate</h3>
                <p className="text-sm text-slate-400 mb-3">Use the <strong>File Hash</strong> below to verify (not the transaction hash):</p>
                <div className="flex items-center gap-2 bg-black/40 p-3 rounded-xl">
                  <code className="flex-1 text-xs font-mono text-brand-300 break-all">{projectHash}</code>
                  <button onClick={() => navigator.clipboard.writeText(projectHash)} className="p-2 hover:bg-white/10 rounded transition-colors flex-shrink-0">
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <a href={`/#/verify/${projectHash}`} className="mt-3 w-full py-2 bg-brand-500/20 hover:bg-brand-500/30 rounded-xl text-center text-sm font-medium transition-colors flex items-center justify-center gap-2 border border-brand-400/20">
                  <ExternalLink className="h-4 w-4" /> Open Verify Page
                </a>
              </div>

              <div className="text-center mt-6">
                <button onClick={downloadCertificate} disabled={isLoading} className="px-8 py-4 bg-gradient-to-r from-green-500 to-blue-600 rounded-xl font-semibold text-lg flex items-center gap-2 mx-auto">
                  {isLoading ? (
                    <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Generating PDF...</>
                  ) : (
                    <><Download className="h-5 w-5" />Download Certificate</>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
