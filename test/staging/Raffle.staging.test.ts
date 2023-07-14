import { deployments, ethers, getNamedAccounts, network } from 'hardhat';
import { developmentChains } from '../../helper-hardhat-config';
import { Raffle } from '../../typechain-types';
import { assert, expect } from 'chai';

developmentChains.includes(network.name)
  ? describe.skip
  : describe('Raffle staging tests', async () => {
      let raffle: Raffle;
      let raffleEntranceFee: bigint;
      let deployer: string;

      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer;
        const raffleDeployment = await deployments.get('Raffle');
        raffle = await ethers.getContractAt('Raffle', raffleDeployment.address);
        raffleEntranceFee = await raffle.getEntranceFee();
      });

      describe("fulfillRandomWords",async () => {
        it("works with live chainlink keepers and chainlink VRF, we get a random winner",async () => {
          const startingTimestamp = await raffle.getLatestTimeStamp();
          const accounts = await ethers.getSigners();

        await new Promise<void>(async (resolve, reject) => {
          const WinnerPickedEvent = raffle.getEvent("WinnerPicked");
          raffle.on(WinnerPickedEvent,async () => {
            try {
              console.log('winner event fired');
              const recentWinner = await raffle.getRecentWinner();
              const raffleState = await raffle.getRaffleState();
              const winnerEndingBalance = await accounts[0].provider.getBalance(accounts[0].address);
              const endingTimeStamp = await raffle.getLatestTimeStamp();
              await expect(raffle.getPlayers(0)).to.be.reverted;
              assert.equal(recentWinner.toString(), accounts[0].address);
              assert.equal(raffleState, BigInt(0));
              resolve();
            } catch (error) {
              console.log(error);
              reject(error);
            }
          });

          await raffle.enterRaffle({ value: raffleEntranceFee });
          const winnerStartingBalance = await accounts[0].provider.getBalance(accounts[0].address);
        })
        })
      })
    });
