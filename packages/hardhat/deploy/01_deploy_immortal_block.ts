import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

const deployImmortalBlock: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  await deploy("ImmortalBlock", {
    from: deployer,
    args: [deployer],
    log: true,
    autoMine: true,
  });

  // Get the deployed contract to interact with it after deploying.
  const immortalBlock = await hre.ethers.getContract<Contract>("ImmortalBlock", deployer);
  console.log("🏆 ImmortalBlock contract deployed successfully!");
  console.log("📋 Total records count:", await immortalBlock.getRecordsCount());

  // Optional: Forge a test block to verify the contract is working
  console.log("⚡ Forging a test immortal block...");
  const tx = await immortalBlock.forgeBlock(
    1, // matchId
    deployer, // winner address
    "Test Winner", // winner name
    "Test match - deployment verification", // extra data
  );
  await tx.wait();

  console.log("✅ Test block forged! New records count:", await immortalBlock.getRecordsCount());
};

export default deployImmortalBlock;

deployImmortalBlock.tags = ["ImmortalBlock"];
