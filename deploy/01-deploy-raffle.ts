import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction, Deployment } from 'hardhat-deploy/dist/types';
import { developmentChains, networkConfig } from '../helper-hardhat-config';
import { VRFCoordinatorV2Mock } from '../typechain-types';
import { ethers } from 'hardhat';
import { verify } from '../utils/verify';

const VRF_SUBSCRIPTION_FUND_AMOUNT = ethers.parseEther('30');

const deployRaffle: DeployFunction = async ({
  getNamedAccounts,
  deployments: { deploy, log, get: getContract },
  network,
}: HardhatRuntimeEnvironment) => {
  const { deployer } = await getNamedAccounts();
  const chainId: number = network.config.chainId || 0;

  let vrfCoordinatorV2Address;
  let subsciptionId;
  if (developmentChains.includes(network.name)) {
    const vrfCoordinatorV2Deployment: Deployment = await getContract('VRFCoordinatorV2Mock');
    vrfCoordinatorV2Address = vrfCoordinatorV2Deployment.address;
    const vrfCoordinatorV2Mock: VRFCoordinatorV2Mock = await ethers.getContractAt("VRFCoordinatorV2Mock", vrfCoordinatorV2Address);

    const transactionResponse = await vrfCoordinatorV2Mock.createSubscription();
    const transactionReceipt = await transactionResponse.wait(1);
    // subsciptionId = BigInt(await transactionReceipt?.logs[0].topics[0] || '0');
    subsciptionId = 1;
    await vrfCoordinatorV2Mock.fundSubscription(subsciptionId, VRF_SUBSCRIPTION_FUND_AMOUNT);
  } else {
    vrfCoordinatorV2Address = networkConfig[chainId]['vrfCoordinatorV2'];
    subsciptionId = networkConfig[chainId]["subscriptionId"];
  }

  const entranceFee = networkConfig[chainId]['entranceFee'];
  const gasLane = networkConfig[chainId]['gasLane'];
  const callbackGasLimit = networkConfig[chainId]['callbackGasLimit'];
  const interval = networkConfig[chainId]['interval'];
  const args: any[] = [vrfCoordinatorV2Address, entranceFee, gasLane, subsciptionId, callbackGasLimit, interval];
  const raffle = await deploy('Raffle', {
    from: deployer,
    args,
    log: true,
    waitConfirmations: networkConfig[chainId]?.blockConfirmations || 1,
  });
  log(`Raffle deployed at ${raffle.address}`);

  if (!developmentChains.includes(network.name)) {
    log('verifying the contract!');
    await verify(raffle.address, args);
  }
};

export default deployRaffle;
deployRaffle.tags = ['all', 'raffle'];
