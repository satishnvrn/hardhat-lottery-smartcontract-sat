import { deployments, ethers, getNamedAccounts, network } from 'hardhat';
import { developmentChains, networkConfig } from '../../helper-hardhat-config';
import { Raffle, VRFCoordinatorV2Mock } from '../../typechain-types';
import { assert, expect } from 'chai';

!developmentChains.includes(network.name)
  ? describe.skip
  : describe('Raffle Unit Tests', async () => {
      let raffle: Raffle;
      let vrfCoordinatorV2Mock: VRFCoordinatorV2Mock;
      let raffleEntranceFee: bigint;
      let deployer: string;
      let interval: bigint;
      const chainId = network.config.chainId || 0;

      beforeEach(async () => {
        const deploymentResults = await deployments.fixture(['all']);

        const raffleContractAddress = deploymentResults['Raffle']?.address;
        raffle = await ethers.getContractAt('Raffle', raffleContractAddress);

        const vrfCoordinatorAddress =
          deploymentResults['VRFCoordinatorV2Mock']?.address;
        vrfCoordinatorV2Mock = await ethers.getContractAt(
          'VRFCoordinatorV2Mock',
          vrfCoordinatorAddress,
        );

        raffleEntranceFee = await raffle.getEntranceFee();
        deployer = (await getNamedAccounts()).deployer;
        interval = await raffle.getInterval();
      });

      describe('constructor', async () => {
        it('initializes the raffle correctly', async () => {
          const raffleState = await raffle.getRaffleState();
          assert.equal(raffleState.toString(), '0');
          assert.equal(interval.toString(), networkConfig[chainId]['interval']);
        });
      });

      describe('enterRaffle', async () => {
        it("reverts when you don't pay enough", async () => {
          'Raffle_SendMoreETH';
        });

        it('records players when they enter', async () => {
          await raffle.enterRaffle({ value: raffleEntranceFee });
          const playerFromContract = await raffle.getPlayers(0);
          assert.equal(playerFromContract, deployer);
        });

        it('emits event on enter', async () => {
          await expect(
            raffle.enterRaffle({ value: raffleEntranceFee }),
          ).to.emit(raffle, 'RaffleEnter');
        });

        it("doesn't allow entrance when raffle is calculating", async () => {
          await raffle.enterRaffle({ value: raffleEntranceFee });
          await network.provider.send('evm_increaseTime', [
            Number(interval.toString()) + 1,
          ]);
          await network.provider.send('evm_mine');
          await raffle.performUpkeep(new Uint8Array());
          await expect(
            raffle.enterRaffle({ value: raffleEntranceFee }),
          ).to.be.revertedWithCustomError(raffle, 'Raffle_NotOpen');
        });
      });
    });
