import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

const deployAudienceManager: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  await deploy("AudienceManager", {
    from: deployer,
    args: [deployer],
    log: true,
    autoMine: true,
  });

  // Get the deployed contract to interact with it after deploying.
  const audienceManager = await hre.ethers.getContract<Contract>("AudienceManager", deployer);
  console.log("🎭 AudienceManager contract deployed successfully!");
  console.log("🪑 Total seats per match:", await audienceManager.TOTAL_SEATS());

  // Test setting active fighters for a sample match
  console.log("⚡ Setting test active fighters for match 1...");
  const testPlayerA = "0x1234567890123456789012345678901234567890";
  const testPlayerB = "0x0987654321098765432109876543210987654321";

  try {
    const tx = await audienceManager.setActiveFighters(1, testPlayerA, testPlayerB);
    await tx.wait();
    console.log("✅ Test active fighters set successfully!");

    // Verify the active fighters
    const activeFighters = await audienceManager.getActiveFighters(1);
    console.log("👥 Active fighters for match 1:", activeFighters);
  } catch (error) {
    console.log("ℹ️  Skipping test active fighters setup:", (error as Error).message);
  }
};

export default deployAudienceManager;

deployAudienceManager.tags = ["AudienceManager"];
