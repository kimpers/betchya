pragma solidity ^0.4.24;

import "zeppelin/ownership/Ownable.sol";

/** @title Betchya */
contract Betchya is Ownable {
  enum BetStages { Created, Accepted, InProgress, Settled  }
  enum BetResults { NotSettled, ProposerWon, AcceptorWon, Draw }

  struct Bet {
    address proposer;
    address acceptor;
    address judge;
    uint256 amount;
    BetStages stage;
    BetResults result;
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
  * @dev Only allow function to be executed if bet is in stage "Accepted"
  * @param betsIndex Current bet's element index in the bets array
  */
  modifier onlyInAcceptedStage(uint betsIndex) {
    require(bets[betsIndex].stage == BetStages.Accepted);
    _;
  }

  /**
  * @dev Only allow function to be executed if bet is in stage "InProgress"
  * @param betsIndex Current bet's element index in the bets array
  */
  modifier onlyInProgressStage(uint betsIndex) {
    require(bets[betsIndex].stage == BetStages.InProgress);
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

  /**
  * @dev Only allow function to be executed if it's called by the judge of the bet
  * @param betsIndex Current bet's element index in the bets array
  */
  modifier onlyJudge(uint betsIndex) {
    require(bets[betsIndex].judge == msg.sender);
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


  /*
  * @dev Event confirming that the bet has been accepted by the acceptor and matching amount has been transferred
  * @param betsIndex Current bet's element index in the bets array
  */
  event BetAccepted(
    uint256 indexed betsIndex
  );

  /*
  * @dev Event confirming that the juge has confirmed to jugde the bet
  * @param betsIndex Current bet's element index in the bets array
  */
  event BetJudgeConfirmed(
    uint256 indexed betsIndex
  );

  /*
  * @dev Event confirming that the juge has settled the result of the bet
  * @param betsIndex Current bet's element index in the bets array
  */
  event BetSettled(
    uint256 indexed betsIndex
  );

  Bet[] public bets;

  /**
  * @dev Different roles a user can have when participating in a bet
  */
  enum ParticipantType { Proposer, Acceptor, Judge }

  struct BetParticipation {
    uint256 betIndex;
    ParticipantType participantType;
  }

  mapping(address => BetParticipation[]) public addressToBetParticipation;


  /**
  * @dev Returns the number of bets that the user is participating in
  * @param user address
  */
  function getUserBetParticipationsLength(address user)
    public
    view
    returns (uint)
  {
    return addressToBetParticipation[user].length;
  }

  /**
  * @dev Creates a bet between the sender and acceptor
  * @param acceptor Address of the person being challenged
  * @param judge Address of the person judging the challenge
  */
  function createBet(address acceptor, address judge)
    public
    payable
  {
    // Require bet of some ETH
    require(msg.value != 0);
    // Acceptor and jugde can't be 0x0
    require(acceptor != address(0));
    require(judge != address(0));

    Bet memory bet = Bet(msg.sender, acceptor, judge, msg.value, BetStages.Created, BetResults.NotSettled);



    uint index =  bets.push(bet) - 1;
    // Add all the participants to BetParticipation mapping
    addressToBetParticipation[msg.sender].push(BetParticipation(index, ParticipantType.Proposer));
    addressToBetParticipation[acceptor].push(BetParticipation(index, ParticipantType.Acceptor));
    addressToBetParticipation[judge].push(BetParticipation(index, ParticipantType.Judge));

    emit BetCreated(msg.sender, acceptor, judge, index);
  }

  /**
  * @dev Accepts a bet if called by acceptor, value sent is the same as the proposer and stage is "Created"
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

  /**
  * @dev Confirms the judge of the bet if called by the assigned judge and stage is "Accepted"
  * @param betsIndex Current bet's element index in the bets array
  */
  function confirmJudge(uint betsIndex)
    public
    onlyInAcceptedStage(betsIndex)
    onlyJudge(betsIndex)
  {
    Bet storage bet = bets[betsIndex];

    bet.stage = BetStages.InProgress;
    emit BetJudgeConfirmed(betsIndex);
  }

  /**
  * @dev Settles the results of a bet if called by the assigned jugde and stage is "InProgress"
  * @param betsIndex Current bet's element index in the bets array
  * @param result Result of the bet, valid results ProposerWon, AcceptorWon, Draw
  */
  function settleBet(uint betsIndex, BetResults result)
    public
    onlyInProgressStage(betsIndex)
    onlyJudge(betsIndex)
  {
    // Don't allow jugde to settle as "NotSettled"
    require(result != BetResults.NotSettled);

    Bet storage bet = bets[betsIndex];

    bet.result = result;
    bet.stage = BetStages.Settled;

    emit BetSettled(betsIndex);
  }
}
