// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import '@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol';
import '@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol';

error Raffle_SendMoreETH();

contract Raffle is VRFConsumerBaseV2 {
  /* State Variables */
  uint256 private immutable i_entranceFee;
  address payable[] private s_players;

  /* Events */
  event RaffleEnter(address indexed player);

  constructor(address vrfCoordinatorV2, uint256 _entranceFee) VRFConsumerBaseV2(vrfCoordinatorV2) {
    i_entranceFee = _entranceFee;
  }

  function enterRaffle() public payable {
    if (msg.value < i_entranceFee) {
      revert Raffle_SendMoreETH();
    }
    s_players.push(payable(msg.sender));
    emit RaffleEnter(msg.sender);
  }

  function requestRandomWinnner() external {}

  function fulfillRandomWords(
    uint256 requestId,
    uint256[] memory randomWords
  ) internal override {}

  /* View/ Pure Functions */
  function getEntranceFee() public view returns (uint256) {
    return i_entranceFee;
  }

  function getPlayers(uint256 index) public view returns (address) {
    return s_players[index];
  }
}
