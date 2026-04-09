const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("VeriChain", function () {
  it("certifies and fetches", async function () {
    const [owner] = await ethers.getSigners();
    const VeriChain = await ethers.getContractFactory("VeriChain");
    const verichain = await VeriChain.deploy();
    await verichain.deployed();

    const fileHash = ethers.keccak256(ethers.toUtf8Bytes("dummy"));
    const tx = await verichain.certify(fileHash, "bafy...cid", "My File", "text/plain");
    await tx.wait();

    const cert = await verichain.getCertificate(fileHash);
    expect(cert.owner).to.equal(owner.address);
    expect(cert.fileHash).to.equal(fileHash);
    expect(cert.ipfsCid).to.equal("bafy...cid");
    expect(cert.title).to.equal("My File");
    expect(cert.mime).to.equal("text/plain");

    await expect(verichain.certify(fileHash, "cid2", "Dup", "text"))
      .to.be.revertedWithCustomError(verichain, "AlreadyCertified");
  });

  it("reverts for unknown", async function () {
    const VeriChain = await ethers.getContractFactory("VeriChain");
    const verichain = await VeriChain.deploy();
    await verichain.deployed();

    const unknown = ethers.keccak256(ethers.toUtf8Bytes("unknown"));
    await expect(verichain.getCertificate(unknown)).to.be.revertedWithCustomError(verichain, "NotFound");
  });
});
