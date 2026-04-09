import { ethers } from 'ethers';

export const CONTRACT_ABI = [
  "event Certified(address indexed owner, bytes32 indexed fileHash, string ipfsCid, uint256 timestamp, string title, string mime)",
  "function certify(bytes32 fileHash, string ipfsCid, string title, string mime)",
  "function getCertificate(bytes32 fileHash) view returns (tuple(address owner, bytes32 fileHash, string ipfsCid, uint256 timestamp, string title, string mime))",
  "function isCertified(bytes32 fileHash) view returns (bool)"
];

// Network configurations
export const NETWORKS = {
  POLYGON_AMOY: {
    chainId: '0x13882', // 80002 in hex
    chainName: 'Polygon Amoy',
    rpcUrls: ['https://rpc-amoy.polygon.technology'],
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18
    },
    blockExplorerUrls: ['https://amoy.polygonscan.com']
  },
  LOCALHOST: {
    chainId: '0x7A69', // 31337 in hex
    chainName: 'Localhost 8545',
    rpcUrls: ['http://127.0.0.1:8545'],
    nativeCurrency: {
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18
    }
  }
};

export async function switchToPolygonAmoy() {
  if (!window.ethereum) throw new Error('MetaMask not found');

  try {
    // Try to switch to Polygon Amoy
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: NETWORKS.POLYGON_AMOY.chainId }],
    });
  } catch (switchError) {
    // If network doesn't exist, add it
    if (switchError.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [NETWORKS.POLYGON_AMOY],
      });
    } else {
      throw switchError;
    }
  }
}

export async function switchToLocalhost() {
  if (!window.ethereum) throw new Error('MetaMask not found');

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: NETWORKS.LOCALHOST.chainId }],
    });
  } catch (switchError) {
    if (switchError.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [NETWORKS.LOCALHOST],
      });
    } else {
      throw switchError;
    }
  }
}

export function getProvider() {
  if (!window.ethereum) throw new Error('MetaMask not found');
  return new ethers.BrowserProvider(window.ethereum);
}

export async function getSigner() {
  if (!window.ethereum) throw new Error('MetaMask not found');

  const preferredNetwork = import.meta.env.VITE_PREFERRED_NETWORK || 'amoy';
  const targetNetwork = preferredNetwork === 'localhost' ? NETWORKS.LOCALHOST : NETWORKS.POLYGON_AMOY;

  // Get current chainId directly — before creating any BrowserProvider
  const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });

  // Switch network BEFORE creating the provider to avoid NETWORK_ERROR
  if (currentChainId !== targetNetwork.chainId) {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetNetwork.chainId }],
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [targetNetwork],
        });
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: targetNetwork.chainId }],
        });
      } else {
        throw switchError;
      }
    }
  }

  // Create a FRESH provider after network switch
  await window.ethereum.request({ method: 'eth_requestAccounts' });
  const provider = new ethers.BrowserProvider(window.ethereum);
  return await provider.getSigner();
}


export function getContract(address, signerOrProvider) {
  return new ethers.Contract(address, CONTRACT_ABI, signerOrProvider);
}

// Connect wallet and return address — triggers MetaMask popup
export async function connectWallet() {
  if (!window.ethereum) throw new Error('MetaMask not found. Please install MetaMask.');
  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
  return accounts[0] || null;
}

// Check if already connected (no popup)
export async function getConnectedAddress() {
  if (!window.ethereum) return null;
  try {
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    return accounts[0] || null;
  } catch {
    return null;
  }
}

// Get all certificates issued by a wallet address (reads blockchain events)
export async function getCertificatesByOwner(contractAddress, ownerAddress) {
  if (!window.ethereum || !contractAddress || !ownerAddress) return [];
  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, provider);
    const filter = contract.filters.Certified(ownerAddress);

    // Amoy's public RPC limits eth_getLogs to ~50k blocks per request.
    // Get current block and scan backwards far enough to catch recent certifications.
    const latestBlock = await provider.getBlockNumber();
    // Scan last 50,000 blocks (~1 day on Amoy with ~2s block time), min from block 0
    const fromBlock = Math.max(0, latestBlock - 50000);

    let events = [];
    try {
      events = await contract.queryFilter(filter, fromBlock, 'latest');
    } catch {
      // If still too large, try last 10,000 blocks only
      const smallFrom = Math.max(0, latestBlock - 10000);
      events = await contract.queryFilter(filter, smallFrom, 'latest');
    }

    return events.map(e => ({
      hash: e.args.fileHash,
      cid: e.args.ipfsCid,
      title: e.args.title,
      mime: e.args.mime,
      timestamp: Number(e.args.timestamp) * 1000,
      txHash: e.transactionHash,
      owner: e.args.owner
    }));
  } catch (err) {
    console.error('Failed to fetch certificates from blockchain:', err);
    return [];
  }
}

