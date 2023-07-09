import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { developmentChains, BASE_FEE, GAS_PRICE_LINK } from "../helper-hardhat-config";

const deployMocks: DeployFunction = async function ({ getNamedAccounts, deployments: { deploy, log }, network }: HardhatRuntimeEnvironment) {
  const { deployer } = await getNamedAccounts();

  if (developmentChains.includes(network.name)) {
    log("local network detected! Deploying mocks...");
    await deploy("VRFCoordinatorV2Mock", {
      contract: "VRFCoordinatorV2Mock",
      from: deployer,
      log: true,
      args: [BASE_FEE, GAS_PRICE_LINK]
    });
    log("Mocks deployed!");
    log("------------------")
  }
};

export default deployMocks;
deployMocks.tags = ["all", "mocks"];