import { ethers } from 'hardhat';

export interface networkConfigItem {
  name?: string;
  blockConfirmations?: number;
  vrfCoordinatorV2?: string;
  entranceFee?: bigint;
  gasLane?: string;
  subscriptionId?: string;
  callbackGasLimit?: string;
  interval?: string;
}

export interface networkConfigInfo {
  [key: string]: networkConfigItem;
}

export const networkConfig: networkConfigInfo = {
  11155111: {
    name: 'sepolia',
    blockConfirmations: 6,
    vrfCoordinatorV2: '0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625',
    entranceFee: ethers.parseEther('0.01'),
    gasLane: "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c",
    subscriptionId: "0",
    callbackGasLimit: "500000",
    interval: "30"
  },
  31337: {
    name: 'hardhat',
    entranceFee: ethers.parseEther('0.01'),
    gasLane: "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c",
    callbackGasLimit: "500000",
    interval: "30"
  },
};

export const developmentChains: string[] = ['hardhat', 'localhost'];
export const BASE_FEE = ethers.parseEther('0.25');
export const GAS_PRICE_LINK = 1e9;
