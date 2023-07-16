import { deployments, ethers, getNamedAccounts, network } from 'hardhat';
import { developmentChains, networkConfig } from '../../helper-hardhat-config';
import { Raffle, VRFCoordinatorV2Mock } from '../../typechain-types';
import { assert, expect } from 'chai';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';

!developmentChains.includes(network.name)
  ? describe.skip
  : describe('Raffle Unit Tests', async () => {
      let raffle: Raffle;
      let raffleContract: Raffle;
      let vrfCoordinatorV2Mock: VRFCoordinatorV2Mock;
      let raffleEntranceFee: bigint;
      let deployer: string;
      let interval: bigint;
      const chainId = network.config.chainId || 0;
      let accounts: SignerWithAddress[];
      let player: SignerWithAddress;

      beforeEach(async () => {
        const deploymentResults = await deployments.fixture(['all']);

        const raffleContractAddress = deploymentResults['Raffle']?.address;
        raffleContract = await ethers.getContractAt('Raffle', raffleContractAddress);

        accounts = await ethers.getSigners();
        player = accounts[0];
        raffle = raffleContract.connect(player);

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

      describe('checkUpKeep', async () => {
        it("returns false if people haven't sent any ETH", async () => {
          await network.provider.send('evm_increaseTime', [
            Number(interval.toString()) + 1,
          ]);
          await network.provider.send('evm_mine');
          const { upkeepNeeded } = await raffle.checkUpkeep.staticCall(
            new Uint8Array(),
          );
          assert(!upkeepNeeded);
        });

        it("returns false if raffle isn't open", async () => {
          await raffle.enterRaffle({ value: raffleEntranceFee });
          await network.provider.send('evm_increaseTime', [
            Number(interval.toString()) + 1,
          ]);
          await network.provider.send('evm_mine');
          await raffle.performUpkeep(new Uint8Array());
          const raffleState = await raffle.getRaffleState();
          const { upkeepNeeded } = await raffle.checkUpkeep.staticCall(
            new Uint8Array(),
          );
          assert.equal(raffleState.toString(), '1');
          assert.equal(upkeepNeeded, false);
        });
      });

      describe('performUpKeep', async () => {
        it('it can only run if checkupkeep is true', async () => {
          await raffle.enterRaffle({ value: raffleEntranceFee });
          await network.provider.send('evm_increaseTime', [
            Number(interval.toString()) + 1,
          ]);
          await network.provider.send('evm_mine', []);
          const tx = await raffle.performUpkeep(new Uint8Array());
          assert(tx);
        });

        it('reverts when checkupkeep is false', async () => {
          await expect(
            raffle.performUpkeep(new Uint8Array()),
          ).to.be.revertedWithCustomError(raffle, 'Raffle_UpkeepNotNeeded');
        });

        it('updates the raffle state, emits an event, and calls the vrf coordinatior', async () => {
          await raffle.enterRaffle({ value: raffleEntranceFee });
          await network.provider.send('evm_increaseTime', [
            Number(interval.toString()) + 1,
          ]);
          await network.provider.send('evm_mine', []);
          const txResponse = await raffle.performUpkeep(new Uint8Array());
          const txReceipt = await txResponse.wait(1);
          const raffleDeployment = await deployments.get('Raffle');
          const raffleInterface = new ethers.Interface(raffleDeployment.abi);
          const parsedLogs = (txReceipt?.logs || []).map((log) => {
            return raffleInterface.parseLog({
              topics: [...log?.topics] || [],
              data: log?.data || '',
            });
          });
          const requestId: bigint = parsedLogs[1]?.args[0] || BigInt(0);
          const raffleState = await raffle.getRaffleState();
          assert(Number(requestId.toString()) > 0);
          assert(Number(raffleState.toString()) == 1);
        });
      });

      describe('fullfillRandomWords', async () => {
        beforeEach(async () => {
          await raffle.enterRaffle({ value: raffleEntranceFee });
          await network.provider.send('evm_increaseTime', [
            Number(interval.toString()) + 1,
          ]);
          await network.provider.send('evm_mine', []);
        });

        it('can only be called after performUpKeep', async () => {
          const raffleAddress = await raffle.getAddress();
          await expect(
            vrfCoordinatorV2Mock.fulfillRandomWords(0, raffleAddress),
          ).to.be.rejectedWith('nonexistent request');
          await expect(
            vrfCoordinatorV2Mock.fulfillRandomWords(1, raffleAddress),
          ).to.be.rejectedWith('nonexistent request');
        });

        // it('picks a winner, resets the lottery, and sends money', async () => {
        //   const additionalEntrance = 3;
        //   const startingAccountIndex = 1;
        //   const accounts = await ethers.getSigners();
        //   for (
        //     let i = startingAccountIndex;
        //     i < startingAccountIndex + additionalEntrance;
        //     i++
        //   ) {
        //     const accountConnectedRaffle = raffle.connect(accounts[i]);
        //     await accountConnectedRaffle.enterRaffle({
        //       value: raffleEntranceFee,
        //     });
        //   }
        //   const startingTimeStamp = await raffle.getLatestTimeStamp();

        //   await new Promise<void>(async (resolve, reject) => {
        //     const winnerEvent = raffle.getEvent("WinnerPicked");
        //     await raffle.once<typeof winnerEvent>(winnerEvent, async () => {
        //       console.log('found the event');
        //       try {
        //         const raffleState = await raffle.getRaffleState();
        //         const endingTimeStamp = await raffle.getLatestTimeStamp();
        //         const numberOfPlayers = await raffle.getNumberOfPlayers();

        //         assert(numberOfPlayers.toString(), '0');
        //         assert.equal(raffleState.toString(), '0');
        //         assert(endingTimeStamp > startingTimeStamp);
        //         resolve();
        //       } catch (error) {
        //         reject(error);
        //       }
        //     });

        //     // call raffle.performupkeep and then call vrfCoordinator.fulfillRandomWords with the requestId from the event of the first transaction.
        //     const txResponse = await raffle.performUpkeep(new Uint8Array());
        //     const txReceipt = await txResponse.wait(1);
        //     console.log('raffle performupkeep transaction mined');
        //     const raffleAddress = await raffle.getAddress();
        //     const parsedLogs = (txReceipt?.logs || []).map((log) => {
        //       return raffle.interface.parseLog({
        //         topics: [...log?.topics] || [],
        //         data: log?.data || '',
        //       });
        //     });
        //     const requestId: bigint = parsedLogs[1]?.args[0] || BigInt(0);
        //     await vrfCoordinatorV2Mock.fulfillRandomWords(requestId, raffleAddress);
        //     console.log('accounts[1]', accounts[1].address);
        //     console.log('accounts[2]', accounts[2].address);
        //     console.log('accounts[3]', accounts[3].address);
        //     console.log('accounts[4]', accounts[4].address);
        //     const winner = await raffle.getRecentWinner();
        //     console.log('winner', winner);
        //   });
        // });
      });
    });
