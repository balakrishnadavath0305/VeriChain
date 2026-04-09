import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar.jsx';
import Home from './Home.jsx';
import CreateCertificate from './CreateCertificate.jsx';
import Verify from './Verify.jsx';
import My from './My.jsx';

export default function App() {
  const [page, setPage] = useState('home');
  const [walletAddress, setWalletAddress] = useState(null);

  const content = useMemo(() => {
    if (page === 'create') return <CreateCertificate />;
    if (page === 'verify') return <Verify />;
    if (page === 'my') return <My walletAddress={walletAddress} onConnectWallet={() => { }} />;
    return <Home onGetStarted={() => setPage('create')} />;
  }, [page, walletAddress]);

  return (
    <div className="min-h-screen">
      <Navbar onNav={setPage} walletAddress={walletAddress} setWalletAddress={setWalletAddress} />
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        {content}
      </motion.div>
    </div>
  );
}
