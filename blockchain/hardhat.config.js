require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const { POLYGON_AMOY_RPC, PRIVATE_KEY } = process.env;

module.exports = {
  solidity: "0.8.24",
  networks: {
    hardhat: {},
    localhost: {
      url: "http://127.0.0.1:8545"
    },
    sepolia: {
      url: "https://rpc.sepolia.org",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : []
    },
    amoy: {
      url: POLYGON_AMOY_RPC || "",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : []
    }
  }
};
