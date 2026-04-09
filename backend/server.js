import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const RPC = process.env.POLYGON_AMOY_RPC || '';
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || (() => {
  try {
    const deployments = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'blockchain', 'contracts', 'deployments.json'), 'utf-8'));
    // fallback to any key inside deployments
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
    // Convert BigInt fields to strings for JSON serialization (ethers v6)
    const certificate = [
      cert[0],                    // owner address (string)
      cert[1],                    // fileHash (bytes32 hex string)
      cert[2],                    // ipfsCid (string)
      cert[3].toString(),         // timestamp (BigInt → string)
      cert[4],                    // title (string)
      cert[5]                     // mime (string)
    ];
    return res.json({ exists: true, certificate });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend listening on ${PORT}`));
