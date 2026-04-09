import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Globe, Zap, FileCheck, Users, ArrowRight, Sparkles, Star } from 'lucide-react';

const features = [
  {
    icon: Shield,
    title: "Immutable Proof",
    description: "Blockchain-backed certificates that can never be altered or faked",
    color: "from-blue-500 to-cyan-500"
  },
  {
    icon: Zap,
    title: "Instant Verification",
    description: "Verify authenticity in seconds with our public verification system",
    color: "from-purple-500 to-pink-500"
  },
  {
    icon: Globe,
    title: "Decentralized Storage",
    description: "Files stored on IPFS ensure permanent accessibility and ownership",
    color: "from-green-500 to-emerald-500"
  }
];


export default function Home({ onGetStarted }) {
  return (
    <div className="relative overflow-hidden">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-brand-400/30 mb-6"
            >
              <Sparkles className="h-4 w-4 text-brand-400" />
              <span className="text-sm font-medium text-brand-300">Powered by Polygon Blockchain</span>
            </motion.div>
            
            <h1 className="text-5xl lg:text-7xl font-bold leading-tight mb-6">
              <span className="gradient-text">Digital Certificate</span>
              <br />
              <span className="text-white">Generator</span>
              <br />
              <span className="text-slate-400 text-3xl lg:text-4xl">for your projects</span>
            </h1>
            
            <p className="text-xl text-slate-300 mb-8 leading-relaxed">
              Generate beautiful, blockchain-verified certificates for your projects, code, and digital assets. 
              Upload files, register on blockchain, and create professional certificates.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <motion.button
                onClick={onGetStarted}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="group px-8 py-4 rounded-2xl bg-gradient-to-r from-brand-500 to-purple-600 hover:from-brand-400 hover:to-purple-500 text-white font-semibold text-lg transition-all duration-300 pulse-glow flex items-center justify-center gap-2"
              >
                Get Started
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                className="px-8 py-4 rounded-2xl glass glass-hover border border-white/20 text-white font-semibold text-lg"
              >
                Learn More
              </motion.button>
            </div>
          </motion.div>

          {/* Right Visual */}
          <motion.div
            initial={{ opacity: 0, x: 50, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative"
          >
            <div className="floating">
              <div className="relative glass rounded-3xl p-8 border border-white/20">
                {/* Certificate Preview */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-400 to-purple-500 flex items-center justify-center">
                      <Shield className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">Digital Certificate</h3>
                      <p className="text-sm text-slate-400">Blockchain Verified</p>
                    </div>
                  </div>
                  
                  {/* Sample Certificate Content */}
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="text-center mb-3">
                      <h4 className="text-lg font-bold text-white mb-1">CERTIFICATE OF AUTHENTICITY</h4>
                      <div className="w-16 h-0.5 bg-gradient-to-r from-brand-400 to-purple-500 mx-auto mb-2"></div>
                      <p className="text-xs text-slate-400">Blockchain-Verified Digital Asset</p>
                    </div>
                    
                    <div className="text-center mb-3">
                      <p className="text-sm text-slate-300 mb-2">This is to certify that</p>
                      <div className="bg-brand-500/10 rounded px-3 py-1 mb-2">
                        <p className="text-sm font-semibold text-brand-300">[Recipient Name]</p>
                      </div>
                      <p className="text-xs text-slate-400">has successfully verified</p>
                      <div className="bg-purple-500/10 rounded px-3 py-1 mt-1">
                        <p className="text-sm font-semibold text-purple-300">[Project Title]</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-white/5 rounded p-2 text-center">
                        <p className="text-slate-400">Date</p>
                        <p className="text-white font-mono">Oct 18, 2025</p>
                      </div>
                      <div className="bg-white/5 rounded p-2 text-center">
                        <p className="text-slate-400">Status</p>
                        <p className="text-green-400 font-semibold">VERIFIED</p>
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-2 border-t border-white/10 text-center">
                      <p className="text-xs text-slate-500">Transaction: 0x1a2b3c...def456</p>
                    </div>
                  </div>
                </div>
                
                {/* Floating Elements */}
                <div className="absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full animate-bounce" />
                <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full animate-pulse" />
              </div>
            </div>
            
            {/* Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-brand-500/20 to-purple-500/20 rounded-3xl blur-3xl -z-10" />
          </motion.div>
        </div>
      </div>


      {/* Features Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.8 }}
        className="max-w-7xl mx-auto px-6 py-20"
      >
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold gradient-text mb-4">Why Choose VeriChain?</h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Experience the future of digital asset verification with cutting-edge blockchain technology
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 + index * 0.2, duration: 0.6 }}
                whileHover={{ scale: 1.05, y: -10 }}
                className="group relative glass glass-hover rounded-2xl p-8 border border-white/10 overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="h-8 w-8 text-white" />
                </div>
                
                <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-brand-300 transition-colors">
                  {feature.title}
                </h3>
                
                <p className="text-slate-400 group-hover:text-slate-300 transition-colors">
                  {feature.description}
                </p>
                
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <ArrowRight className="h-5 w-5 text-brand-400" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
