const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying POCSORegistry to Sepolia...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);

  const balance = await deployer.getBalance();
  console.log("Deployer balance:", ethers.utils.formatEther(balance), "ETH\n");

  if (balance.eq(0)) {
    throw new Error("Deployer wallet has 0 ETH. Fund it from Sepolia faucet first.");
  }

  const Factory = await ethers.getContractFactory("POCSORegistry");
  console.log("Deploying contract...");

  const registry = await Factory.deploy();
  await registry.deployed();

  console.log("POCSORegistry deployed!");
  console.log("Contract address:", registry.address);
  console.log("Transaction hash:", registry.deployTransaction.hash);
  console.log(
    "Etherscan:",
    `https://sepolia.etherscan.io/address/${registry.address}`
  );

  // Quick sanity check
  const admin = await registry.admin();
  const count = await registry.getReportCount();
  console.log("\nSanity check:");
  console.log("  admin:", admin);
  console.log("  report count:", count.toString());
  console.log("\n📋 Add this to your .env:");
  console.log(`CONTRACT_ADDRESS=${registry.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Deployment failed:", err.message);
    process.exit(1);
  });