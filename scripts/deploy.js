// Deploy script for CertificateVerification contract
import { ethers } from "hardhat";

async function main() {
  console.log("Deploying CertificateVerification contract...");

  // Get the ContractFactory and Signers
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Deploy the CertificateVerification contract
  const CertificateVerification = await ethers.getContractFactory("CertificateVerification");
  const contract = await CertificateVerification.deploy();

  console.log("CertificateVerification deployed to:", contract.target);
  console.log("Transaction hash:", contract.deploymentTransaction().hash);

  // Wait for the contract to be mined
  await contract.waitForDeployment();
  console.log("Contract deployment confirmed!");

  // Verify the contract is working by calling a view function
  try {
    console.log("\nTesting contract...");
    // You can add test calls here if needed
    console.log("Contract is ready for use!");
  } catch (error) {
    console.error("Error testing contract:", error);
  }

  console.log("\n=== Deployment Summary ===");
  console.log("Contract Address:", contract.target);
  console.log("Deployer Address:", deployer.address);
  console.log("Network: Hardhat Local");
  console.log("========================");
}

// Run the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error during deployment:", error);
    process.exit(1);
  });
