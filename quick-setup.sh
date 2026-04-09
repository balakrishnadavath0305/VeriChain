#!/bin/bash

echo "🚀 VeriChain FREE Setup Script"
echo "=============================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the VeriChain root directory"
    exit 1
fi

echo "📋 Setting up FREE blockchain development environment..."
echo ""

# Create .env files if they don't exist
echo "📁 Creating environment files..."

# Blockchain .env
if [ ! -f "blockchain/.env" ]; then
    cp blockchain/.env.example blockchain/.env
    echo "✅ Created blockchain/.env"
else
    echo "⚠️  blockchain/.env already exists"
fi

# Frontend .env
if [ ! -f "frontend/.env" ]; then
    cp frontend/.env.example frontend/.env
    echo "✅ Created frontend/.env"
else
    echo "⚠️  frontend/.env already exists"
fi

# Backend .env
if [ ! -f "backend/.env" ]; then
    cp backend/.env.example backend/.env
    echo "✅ Created backend/.env"
else
    echo "⚠️  backend/.env already exists"
fi

echo ""
echo "🎯 Next Steps (ALL FREE):"
echo ""
echo "1. 💰 Get FREE test MATIC:"
echo "   Visit: https://faucet.polygon.technology"
echo "   Connect MetaMask, select Polygon Amoy, get free tokens"
echo ""
echo "2. 🔗 Get FREE RPC endpoint:"
echo "   Visit: https://alchemy.com"
echo "   Sign up, create Polygon Amoy app, copy RPC URL"
echo ""
echo "3. 📦 Get FREE IPFS storage:"
echo "   Visit: https://web3.storage"
echo "   Sign up, create API token (5GB free)"
echo ""
echo "4. ⚙️  Configure your .env files:"
echo "   Edit blockchain/.env with your RPC and private key"
echo "   Edit frontend/.env with contract address (after deployment)"
echo ""
echo "5. 🚀 Deploy contract (FREE):"
echo "   cd blockchain"
echo "   npm install"
echo "   npx hardhat run scripts/deploy.js --network amoy"
echo ""
echo "6. 🎉 Start the app:"
echo "   npm run dev (in each folder: backend, frontend)"
echo ""
echo "💡 Total cost: $0.00 - Everything is FREE for testing!"
echo ""
echo "📖 Read FREE_SETUP_GUIDE.md for detailed instructions"
