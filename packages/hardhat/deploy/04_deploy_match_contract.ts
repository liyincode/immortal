import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

const deployMatchContract: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy, get } = hre.deployments;

  // Get previously deployed contracts
  const immortalBlock = await get("ImmortalBlock");
  const audienceManager = await get("AudienceManager");

  // For referee address, we'll use the deployer for now (in production, this should be a different address)
  const refereeAddress = deployer;

  await deploy("MatchContract", {
    from: deployer,
    args: [
      deployer, // _initialOwner
      immortalBlock.address, // _immortalBlockAddr
      audienceManager.address, // _audienceManagerAddr
      refereeAddress, // _refereeAddr
    ],
    log: true,
    autoMine: true,
  });

  // Get the deployed contract to interact with it after deploying.
  const matchContract = await hre.ethers.getContract<Contract>("MatchContract", deployer);
  console.log("⚔️  MatchContract deployed successfully!");
  console.log("📊 Total questions per match:", await matchContract.TOTAL_QUESTIONS());
  console.log("⏱️  Answer timeout duration:", await matchContract.ANSWER_TIMEOUT_DURATION(), "seconds");
  console.log("❌ Max consecutive wrong answers:", await matchContract.MAX_CONSECUTIVE_WRONG_ANSWERS_FOR_REPLACEMENT());

  // Verify contract dependencies
  console.log("🔗 Contract dependencies:");
  console.log("  📜 ImmortalBlock:", await matchContract.immortalBlockContractAddress());
  console.log("  🎭 AudienceManager:", await matchContract.audienceManagerContractAddress());
  console.log("  🏛️  Referee:", await matchContract.refereeAddress());

  // Optional: Start a test match
  console.log("⚡ Starting a test match...");
  const testPlayerA = deployer; // Use deployer as test player A
  const testPlayerB = "0x1234567890123456789012345678901234567890"; // Mock player B

  try {
    const tx = await matchContract.startMatch(1, testPlayerA, testPlayerB);
    await tx.wait();
    console.log("✅ Test match started successfully!");

    // Get match details
    const match = await matchContract.matches(1);
    console.log("🎮 Test match details:");
    console.log("  Match ID:", match.matchId.toString());
    console.log("  Player A:", match.playerA.playerAddress);
    console.log("  Player B:", match.playerB.playerAddress);
    console.log("  Status:", match.status);
    console.log("  Current turn:", match.currentPlayerTurn);
  } catch (error) {
    console.log("ℹ️  Skipping test match creation:", (error as Error).message);
  }
};

export default deployMatchContract;

// This deployment depends on ImmortalBlock and AudienceManager
deployMatchContract.dependencies = ["ImmortalBlock", "AudienceManager"];
deployMatchContract.tags = ["MatchContract"];
