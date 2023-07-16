import { Raffle } from './../typechain-types/contracts/Raffle';
import { readFileSync, writeFileSync } from 'fs';
import { deployments, ethers, network } from 'hardhat';
import { DeployFunction, Deployment, DeploymentsExtension } from 'hardhat-deploy/dist/types';
import { HardhatRuntimeEnvironment, Network } from 'hardhat/types';

const FRONT_END_ADDRESSES_FILE =
  '../next-eth-sat/src/app/lib/raffleContractAddresses.json';
const FRONT_END_ABI_FILE = '../next-eth-sat/src/app/lib/raffleAbi.json';

const updateFrontend: DeployFunction = async ({
  deployments,
  network,
}: HardhatRuntimeEnvironment) => {
  if (process.env.UPDATE_FRONT_END) {
    console.log('Updating front end...');
    await updateContractAddresses();
    await updateAbi();
  }
};

async function updateContractAddresses() {
  const raffleDeployment: Deployment = await deployments.get('Raffle');
  const contractAddresses = JSON.parse(
    readFileSync(FRONT_END_ADDRESSES_FILE, 'utf-8'),
  );
  const chainId = network.config.chainId?.toString() || '';

  if (chainId in contractAddresses) {
    if (!contractAddresses[chainId].includes(raffleDeployment.address)) {
      contractAddresses[chainId].push(raffleDeployment.address);
    }
  } else {
    contractAddresses[chainId] = [raffleDeployment.address];
  }
  console.log('writing contract addresses...');
  writeFileSync(FRONT_END_ADDRESSES_FILE, JSON.stringify(contractAddresses));
}

async function updateAbi() {
  const raffleDeployment: Deployment = await deployments.get('Raffle');
  const raffle: Raffle = await ethers.getContractAt(
    'Raffle',
    raffleDeployment.address,
  );
  console.log('writing abi...');
  writeFileSync(FRONT_END_ABI_FILE, raffle.interface.formatJson());
}

export default updateFrontend;
updateFrontend.tags = ['all', 'raffle'];
