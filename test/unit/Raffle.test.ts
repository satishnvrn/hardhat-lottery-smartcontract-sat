import { deployments, ethers, network } from "hardhat";
import { developmentChains, networkConfig } from "../../helper-hardhat-config";
import { Raffle } from "../../typechain-types";
import { assert } from "chai";

!developmentChains.includes(network.name) ? describe.skip : describe("Raffle Unit Tests", async () => {
  let raffle: Raffle;
  let vrfCoordinatorV2Mock;
  const chainId = network.config.chainId || 0;

  beforeEach(async () => {
    const deploymentResults = await deployments.fixture(["all"]);

    const raffleContractAddress = deploymentResults["Raffle"]?.address;
    raffle = await ethers.getContractAt("Raffle", raffleContractAddress);

    const vrfCoordinatorAddress = deploymentResults["VRFCoordinatorV2Mock"]?.address;
    vrfCoordinatorV2Mock = await ethers.getContractAt("VRFCoordinatorV2Mock", vrfCoordinatorAddress);
  });

  describe("constructor", async () => {
    it("initializes the raffle correctly", async () => {
      const raffleState = await raffle.getRaffleState();
      const interval = await raffle.getInterval();
      assert.equal(raffleState.toString(), "0");
      assert.equal(interval.toString(), networkConfig[chainId]["interval"]);
    })
  });
})