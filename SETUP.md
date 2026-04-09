# VeriChain Certificate Generator - Setup Guide

## 🚀 Quick Start (Demo Mode)

The platform is currently running in **demo mode** and works immediately:

1. **Upload files/folders** - Works instantly
2. **Generate hash** - Works instantly  
3. **Blockchain registration** - Simulated (generates mock transaction hash)
4. **Fill certificate form** - Works instantly
5. **Generate & download certificate** - Works instantly

## 🔧 Production Setup (Real Blockchain)

To enable real blockchain functionality:

### 1. Get Required Services

**Polygon Amoy RPC:**
- Sign up at [Alchemy](https://alchemy.com) or [Infura](https://infura.io)
- Create a new app for Polygon Amoy testnet
- Copy the RPC URL

**Web3.Storage Token:**
- Sign up at [web3.storage](https://web3.storage)
- Create an API token for IPFS uploads

**MetaMask Wallet:**
- Install MetaMask browser extension
- Add Polygon Amoy testnet
- Get test MATIC from [Polygon Faucet](https://faucet.polygon.technology)

### 2. Deploy Smart Contract

```bash
# Navigate to blockchain folder
cd blockchain

# Create .env file
cp .env.example .env

# Edit .env with your values:
# POLYGON_AMOY_RPC=https://polygon-amoy.g.alchemy.com/v2/YOUR_KEY
# PRIVATE_KEY=0xYOUR_PRIVATE_KEY

# Deploy contract
npx hardhat run scripts/deploy.js --network amoy
```

### 3. Configure Frontend

```bash
# Navigate to frontend folder
cd frontend

# Create .env file
cp .env.example .env

# Edit .env with deployed contract address:
# VITE_CONTRACT_ADDRESS=0xYOUR_DEPLOYED_CONTRACT_ADDRESS
# VITE_WEB3_STORAGE_TOKEN=YOUR_WEB3_STORAGE_TOKEN
# VITE_BACKEND_URL=http://localhost:4000
```

### 4. Configure Backend

```bash
# Navigate to backend folder
cd backend

# Create .env file
cp .env.example .env

# Edit .env with your values:
# POLYGON_AMOY_RPC=https://polygon-amoy.g.alchemy.com/v2/YOUR_KEY
# CONTRACT_ADDRESS=0xYOUR_DEPLOYED_CONTRACT_ADDRESS
```

### 5. Restart Services

```bash
# Restart backend (from backend folder)
node server.js

# Restart frontend (from frontend folder)
npm run dev
```

## 🎯 Current Status

**✅ Working in Demo Mode:**
- File/folder upload and hashing
- Certificate form and generation
- PDF download
- Beautiful UI with animations

**🔧 Requires Setup for Production:**
- Real blockchain registration
- IPFS file storage
- MetaMask wallet integration
- Certificate verification via blockchain

## 🌐 Network Configuration

**Polygon Amoy Testnet:**
- Network Name: Polygon Amoy
- RPC URL: https://rpc-amoy.polygon.technology
- Chain ID: 80002
- Currency Symbol: MATIC
- Block Explorer: https://amoy.polygonscan.com

## 📋 Environment Variables Reference

### Blockchain (.env)
```
POLYGON_AMOY_RPC=https://polygon-amoy.g.alchemy.com/v2/YOUR_KEY
PRIVATE_KEY=0xYOUR_WALLET_PRIVATE_KEY
```

### Backend (.env)
```
POLYGON_AMOY_RPC=https://polygon-amoy.g.alchemy.com/v2/YOUR_KEY
CONTRACT_ADDRESS=0xYOUR_DEPLOYED_CONTRACT_ADDRESS
```

### Frontend (.env)
```
VITE_CONTRACT_ADDRESS=0xYOUR_DEPLOYED_CONTRACT_ADDRESS
VITE_WEB3_STORAGE_TOKEN=YOUR_WEB3_STORAGE_TOKEN
VITE_BACKEND_URL=http://localhost:4000
```

## 🎨 Features

- **Folder Upload Support** - Upload entire project directories
- **File Hashing** - SHA-256 hashing of all files combined
- **Blockchain Registration** - Immutable proof on Polygon
- **Beautiful Certificates** - Professional, colorful PDF certificates
- **Form Integration** - Custom recipient name and project details
- **PDF Generation** - High-quality downloadable certificates
- **Verification System** - Public certificate verification

## 🔍 Troubleshooting

**Button Disabled?**
- Check if contract address is set in frontend .env
- Demo mode works without any setup

**Transaction Failed?**
- Ensure you have test MATIC in your wallet
- Check if you're connected to Polygon Amoy network
- Verify contract address is correct

**PDF Not Generating?**
- Check browser console for errors
- Ensure all form fields are filled
- Try refreshing the page

## 📞 Support

The platform is designed to work immediately in demo mode for testing and presentation purposes. For production deployment, follow the setup steps above.
