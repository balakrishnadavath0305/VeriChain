const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying VeriChain contract to local network...");
  
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  console.log("💰 Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  const VeriChain = await ethers.getContractFactory("VeriChain");
  const verichain = await VeriChain.deploy();
  
  await verichain.waitForDeployment();
  const contractAddress = await verichain.getAddress();
  
  console.log("✅ VeriChain deployed to:", contractAddress);
  console.log("");
  console.log("🔧 Add this to your frontend/.env file:");
  console.log(`VITE_CONTRACT_ADDRESS=${contractAddress}`);
  console.log("");
  console.log("🎉 Contract deployed successfully!");
  console.log("💡 Users will connect their own wallets - no private keys needed in production!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
