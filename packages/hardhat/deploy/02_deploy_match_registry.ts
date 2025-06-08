import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

const deployMatchRegistry: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  await deploy("MatchRegistry", {
    from: deployer,
    args: [deployer],
    log: true,
    autoMine: true,
  });

  // Get the deployed contract to interact with it after deploying.
  const matchRegistry = await hre.ethers.getContract<Contract>("MatchRegistry", deployer);
  console.log("🥊 MatchRegistry contract deployed successfully!");
  console.log("📋 Current match ID:", await matchRegistry.currentMatchId());
  console.log("🚪 Registration status:", await matchRegistry.registrationOpen());

  // Optional: Open the first match registration to test the contract
  console.log("⚡ Opening first match registration...");
  const tx = await matchRegistry.openNewMatchRegistration();
  await tx.wait();

  console.log("✅ First match registration opened!");
  console.log("📋 New current match ID:", await matchRegistry.currentMatchId());
  console.log("🚪 New registration status:", await matchRegistry.registrationOpen());

  // Get current candidate pool (should be empty initially)
  const candidatePool = await matchRegistry.getCurrentCandidatePool();
  console.log("👥 Current candidate pool size:", candidatePool.length);
};

export default deployMatchRegistry;

deployMatchRegistry.tags = ["MatchRegistry"];
