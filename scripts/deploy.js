const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const VeriChain = await ethers.getContractFactory("VeriChain");
  const verichain = await VeriChain.deploy();
  await verichain.deployed();
  console.log("VeriChain deployed to:", verichain.address);

  const deploymentsPath = path.join(__dirname, "..", "contracts", "deployments.json");
  let data = {};
  if (fs.existsSync(deploymentsPath)) {
    try { data = JSON.parse(fs.readFileSync(deploymentsPath, "utf-8")); } catch (_) {}
  }
  const net = await verichain.runner.provider.getNetwork();
  const networkName = net.name || "amoy";
  data[networkName] = { address: verichain.address };
  fs.writeFileSync(deploymentsPath, JSON.stringify(data, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
