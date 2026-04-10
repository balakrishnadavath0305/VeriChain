import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Multer: store uploaded files in memory (no disk writes)
const upload = multer({ storage: multer.memoryStorage() });

const RPC = process.env.POLYGON_AMOY_RPC || '';
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || (() => {
  try {
    const deployments = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'blockchain', 'contracts', 'deployments.json'), 'utf-8'));
    const first = Object.values(deployments)[0];
    return first?.address || '';
  } catch {
    return '';
  }
})();

const ABI = [
  "function getCertificate(bytes32) view returns (tuple(address owner, bytes32 fileHash, string ipfsCid, uint256 timestamp, string title, string mime))",
  "function isCertified(bytes32) view returns (bool)"
];

// ─── Route: Verify certificate on blockchain ─────────────────────────────────
app.get('/api/verify', async (req, res) => {
  try {
    const hash = req.query.hash;
    if (!hash || !/^0x[0-9a-fA-F]{64}$/.test(hash)) return res.status(400).json({ error: 'Invalid hash' });
    if (!RPC || !CONTRACT_ADDRESS) return res.status(500).json({ error: 'Server not configured' });

    const provider = new ethers.JsonRpcProvider(RPC);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

    const exists = await contract.isCertified(hash);
    if (!exists) return res.json({ exists: false });

    const cert = await contract.getCertificate(hash);
    const certificate = [
      cert[0],
      cert[1],
      cert[2],
      cert[3].toString(),
      cert[4],
      cert[5]
    ];
    return res.json({ exists: true, certificate });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// ─── Route: Upload file to IPFS via Pinata (secret key stays server-side) ────
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    const jwt = process.env.PINATA_JWT;
    if (!jwt) return res.status(500).json({ error: 'Pinata not configured on server' });
    if (!req.file) return res.status(400).json({ error: 'No file received' });

    const formData = new FormData();
    const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
    formData.append('file', blob, req.file.originalname);
    formData.append('pinataMetadata', JSON.stringify({ name: req.file.originalname || 'verichain-upload' }));
    formData.append('pinataOptions', JSON.stringify({ cidVersion: 1 }));

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: { Authorization: `Bearer ${jwt}` },
      body: formData,
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(500).json({ error: `Pinata error: ${err}` });
    }

    const data = await response.json();
    return res.json({ cid: data.IpfsHash });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// ─── Route: Proxy Gemini AI calls (secret key stays server-side) ─────────────
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

app.post('/api/ai', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Gemini not configured on server' });

    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'prompt is required' });

    const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 1024 }
      }),
    });

    // Pass through rate-limit status so frontend can retry
    if (response.status === 429) {
      return res.status(429).json({ error: 'AI rate limited, please retry shortly' });
    }

    if (!response.ok) {
      const err = await response.json();
      return res.status(response.status).json({ error: err?.error?.message || 'Gemini API error' });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return res.json({ text });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend listening on ${PORT}`));
