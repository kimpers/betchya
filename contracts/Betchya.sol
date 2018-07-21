pragma solidity ^0.4.24;

import "zeppelin/ownership/Ownable.sol";

/** @title Betchya */
contract Betchya is Ownable {
  enum BetStages { Created, Accepted, InProgress, Completed  }

  struct Bet {
    address proposer;
    address acceptor;
    address judge;
    uint256 amount;
    BetStages stage;
  }

  /**
  * @dev Only allow function to be executed if bet is in stage "Created"
  * @param betsIndex Current bet's element index in the bets array
  */
  modifier onlyInCreatedStage(uint betsIndex) {
    require(bets[betsIndex].stage == BetStages.Created);
    _;
  }

  /**
  * @dev Only allow function to be executed if it's called by the acceptor of the bet
  * @param betsIndex Current bet's element index in the bets array
  */
  modifier onlyAcceptor(uint betsIndex) {
    require(bets[betsIndex].acceptor == msg.sender);
    _;
  }

  /*
  * @dev Event confirming the creation of a bet challenge
  * @param proposer Address of the bet proposing user
  * @param acceptor Address of the user being challenged in the bet
  * @param judge Address of the user suggested as bet judge
  * @param betsIndex Current bet's element index in the bets array
  */
  event BetCreated(
    address indexed proposer,
    address indexed acceptor,
    address indexed judge,
    uint256 betsIndex
  );

  event BetAccepted(
    uint256 indexed betsIndex
  );

  // TODO: implement
  event BetJudgeConfirmed();

  Bet[] public bets;

  mapping(address => uint[]) public proposerToBetIndex;

  /**
  * @dev Creates a bet between the sender and acceptor
  * @param acceptor Address of the person being challenged
  * @param judge Address of the person judging the challenge
  */
  function createBet(address acceptor, address judge) public payable {
    // Require bet of some ETH
    require(msg.value != 0);
    // Acceptor and jugde can't be 0x0
    require(acceptor != address(0));
    require(judge != address(0));

    Bet memory bet = Bet(msg.sender, acceptor, judge, msg.value, BetStages.Created);


    uint index =  bets.push(bet) - 1;
    // TODO: how to handle spam making array too big?
    proposerToBetIndex[acceptor].push(index);
    emit BetCreated(msg.sender, acceptor, judge, index);
  }

  /**
  * @dev Accepts a bet if called by acceptor and value sent is the same as the proposer
  * @param betsIndex Current bet's element index in the bets array
  */
  function acceptBet(uint betsIndex)
    public
    onlyInCreatedStage(betsIndex)
    onlyAcceptor(betsIndex)
    payable
  {
    Bet storage bet = bets[betsIndex];

    // Acceptor needs to send same amount as proposer
    require(msg.value == bet.amount);

    // Transition into "Accepted" stage
    bet.stage = BetStages.Accepted;
    emit BetAccepted(betsIndex);
  }
}
