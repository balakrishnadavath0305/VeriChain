import React, { forwardRef } from 'react';

// Theme definitions
const THEMES = {
  academic: {
    bg: 'linear-gradient(135deg, #f0f9ff 0%, #ffffff 50%, #f0fdf4 100%)',
    border: '8px double #1d4ed8',
    accent: '#1d4ed8',
    titleColor: '#1e3a5f',
    badgeColor: '#16a34a',
    badgeBorder: '#16a34a',
    iconBg1: 'linear-gradient(135deg, #1d4ed8, #1e40af)',
    iconBg2: 'linear-gradient(135deg, #059669, #047857)',
    footerLabel: 'Academic Certificate',
    footerSub: 'Verified Scholarly Work',
  },
  corporate: {
    bg: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 50%, #f1f5f9 100%)',
    border: '8px double #334155',
    accent: '#0f172a',
    titleColor: '#0f172a',
    badgeColor: '#0f172a',
    badgeBorder: '#0f172a',
    iconBg1: 'linear-gradient(135deg, #0f172a, #334155)',
    iconBg2: 'linear-gradient(135deg, #334155, #64748b)',
    footerLabel: 'Corporate Certificate',
    footerSub: 'Business Asset Verified',
  },
  creative: {
    bg: 'linear-gradient(135deg, #fdf4ff 0%, #ffffff 50%, #fff7ed 100%)',
    border: '8px double #a21caf',
    accent: '#a21caf',
    titleColor: '#701a75',
    badgeColor: '#c2410c',
    badgeBorder: '#c2410c',
    iconBg1: 'linear-gradient(135deg, #a21caf, #db2777)',
    iconBg2: 'linear-gradient(135deg, #ea580c, #f59e0b)',
    footerLabel: 'Creative Certificate',
    footerSub: 'Digital Creative Asset',
  },
  technical: {
    bg: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 50%, #f0f9ff 100%)',
    border: '8px double #059669',
    accent: '#059669',
    titleColor: '#064e3b',
    badgeColor: '#0369a1',
    badgeBorder: '#0369a1',
    iconBg1: 'linear-gradient(135deg, #059669, #10b981)',
    iconBg2: 'linear-gradient(135deg, #0369a1, #0ea5e9)',
    footerLabel: 'Technical Certificate',
    footerSub: 'Engineering Asset Verified',
  }
};

const Certificate = forwardRef(({ certificateData, theme = 'corporate' }, ref) => {
  const {
    recipientName, projectTitle, description,
    transactionHash, timestamp, fileHash, fileCount, totalSize
  } = certificateData;

  const t = THEMES[theme] || THEMES.corporate;

  const formatDate = (ts) => new Date(ts).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const formatTime = (ts) => new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const s = {
    container: { fontFamily: 'Georgia, serif', width: '794px', minHeight: '1123px', backgroundColor: '#ffffff' },
    inner: { position: 'relative', width: '100%', minHeight: '1123px', background: t.bg, border: t.border, padding: '48px', boxSizing: 'border-box' },
    header: { textAlign: 'center', marginBottom: '28px' },
    iconRow: { display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '20px' },
    icon1: { width: '60px', height: '60px', background: t.iconBg1, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    icon2: { width: '60px', height: '60px', background: t.iconBg2, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    iconText: { color: '#fff', fontSize: '22px', fontWeight: 'bold' },
    h1: { fontSize: '2rem', fontWeight: 'bold', color: t.titleColor, marginBottom: '10px', letterSpacing: '0.05em' },
    divider: { width: '100px', height: '3px', background: t.accent, margin: '0 auto 10px auto', borderRadius: '2px' },
    subtitle: { fontSize: '1rem', color: '#6b7280', fontFamily: 'Arial, sans-serif' },
    body: { textAlign: 'center', marginBottom: '24px' },
    certifyText: { fontSize: '1.1rem', color: '#374151', marginBottom: '12px', fontFamily: 'Arial, sans-serif' },
    name: { fontSize: '2.2rem', fontWeight: 'bold', color: '#111827', marginBottom: '12px' },
    verifiedText: { fontSize: '0.95rem', color: '#6b7280', marginBottom: '10px', fontFamily: 'Arial, sans-serif' },
    projectTitle: { fontSize: '1.6rem', fontWeight: 'bold', color: '#111827', marginBottom: '12px' },
    description: { fontSize: '0.95rem', color: '#6b7280', fontStyle: 'italic', marginBottom: '16px', fontFamily: 'Arial, sans-serif' },
    blockchainText: { fontSize: '0.9rem', color: '#374151', lineHeight: '1.7', fontFamily: 'Arial, sans-serif', marginBottom: '16px' },
    statsRow: { display: 'flex', justifyContent: 'center', gap: '32px', marginBottom: '16px' },
    statBox: { textAlign: 'center' },
    statNum: { fontSize: '1.4rem', fontWeight: 'bold', color: t.accent, fontFamily: 'Arial, sans-serif' },
    statLabel: { fontSize: '0.7rem', color: '#6b7280', fontFamily: 'Arial, sans-serif' },
    verifySection: { backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', marginBottom: '20px' },
    badge: { display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' },
    badgeText: { fontSize: '1.1rem', fontWeight: 'bold', color: t.badgeColor, border: `2px solid ${t.badgeBorder}`, padding: '3px 14px', borderRadius: '4px', letterSpacing: '0.1em', fontFamily: 'Arial, sans-serif' },
    label: { fontSize: '0.7rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'Arial, sans-serif', marginBottom: '2px' },
    value: { fontSize: '0.82rem', color: '#111827', fontFamily: 'Arial, sans-serif', marginBottom: '8px' },
    mono: { fontSize: '0.6rem', fontFamily: 'monospace', color: '#1f2937', wordBreak: 'break-all', backgroundColor: '#fff', border: '1px solid #e5e7eb', padding: '3px 6px', borderRadius: '3px', display: 'block', marginBottom: '8px' },
    footer: { borderTop: `2px solid ${t.accent}30`, paddingTop: '20px', textAlign: 'center' },
    footerRow: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '32px', marginBottom: '10px' },
    footerCol: { textAlign: 'center' },
    footerLine: { width: '70px', height: '2px', backgroundColor: '#9ca3af', margin: '0 auto 6px auto' },
    footerLabel: { fontSize: '0.8rem', fontWeight: '600', color: '#4b5563', fontFamily: 'Arial, sans-serif' },
    footerSub: { fontSize: '0.65rem', color: '#9ca3af', fontFamily: 'Arial, sans-serif' },
    note: { fontSize: '0.65rem', color: '#9ca3af', fontFamily: 'Arial, sans-serif', marginTop: '6px' }
  };

  return (
    <div ref={ref} style={s.container}>
      <div style={s.inner}>
        {/* Header */}
        <div style={s.header}>
          <div style={s.iconRow}>
            <div style={s.icon1}><span style={s.iconText}>★</span></div>
            <div style={s.icon2}><span style={s.iconText}>✦</span></div>
          </div>
          <h1 style={s.h1}>CERTIFICATE OF AUTHENTICITY</h1>
          <div style={s.divider}></div>
          <p style={s.subtitle}>Blockchain-Verified Digital Asset Certificate</p>
        </div>

        {/* Body */}
        <div style={s.body}>
          <p style={s.certifyText}>This is to certify that</p>
          <h2 style={s.name}>{recipientName}</h2>
          <p style={s.verifiedText}>has successfully registered and verified</p>
          <h3 style={s.projectTitle}>{projectTitle}</h3>
          {description && <p style={s.description}>"{description}"</p>}
          <p style={s.blockchainText}>
            on the blockchain network, ensuring permanent and tamper-proof<br />
            verification of digital asset authenticity and ownership.
          </p>
        </div>

        {/* Stats */}
        {(fileCount || totalSize) && (
          <div style={s.statsRow}>
            {fileCount && <div style={s.statBox}><div style={s.statNum}>{fileCount}</div><div style={s.statLabel}>Files</div></div>}
            {totalSize && <div style={s.statBox}><div style={s.statNum}>{totalSize}</div><div style={s.statLabel}>Total Size</div></div>}
          </div>
        )}

        {/* Verification */}
        <div style={s.verifySection}>
          <div style={s.badge}><span style={s.badgeText}>✓ BLOCKCHAIN VERIFIED</span></div>
          <div style={s.label}>Certification Date &amp; Time</div>
          <div style={s.value}>{formatDate(timestamp)} — {formatTime(timestamp)}</div>
          {transactionHash && (<><div style={s.label}>Blockchain Transaction ID</div><code style={s.mono}>{transactionHash}</code></>)}
          {fileHash && (<><div style={s.label}>File Hash (SHA-256)</div><code style={s.mono}>{fileHash}</code></>)}
        </div>

        {/* Footer */}
        <div style={s.footer}>
          <div style={s.footerRow}>
            <div style={s.footerCol}><div style={s.footerLine}></div><div style={s.footerLabel}>VeriChain Platform</div><div style={s.footerSub}>Digital Certificate Authority</div></div>
            <div style={{ ...s.icon1, width: '48px', height: '48px' }}><span style={{ color: '#fff', fontSize: '18px' }}>✦</span></div>
            <div style={s.footerCol}><div style={s.footerLine}></div><div style={s.footerLabel}>{t.footerLabel}</div><div style={s.footerSub}>{t.footerSub}</div></div>
          </div>
          <p style={s.note}>Cryptographically secured and permanently recorded on the blockchain.</p>
        </div>
      </div>
    </div>
  );
});

Certificate.displayName = 'Certificate';
export default Certificate;
export { THEMES };
