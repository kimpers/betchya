pragma solidity ^0.4.24;

import "./CircuitBreaker.sol";

/** @title Betchya */
contract Betchya is CircuitBreaker {
  enum BetStages { Created, Accepted, InProgress, Settled, Cancelled }
  enum BetResults { NotSettled, ProposerWon, AcceptorWon, Draw }

  struct Bet {
    address proposer;
    address acceptor;
    address judge;
    uint256 amount;
    BetStages stage;
    BetResults result;
    bool proposerWithdrawn;
    bool acceptorWithdrawn;
    bool acceptorDeposited;
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

  /**
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
    string description,
    uint256 betsIndex
  );


  /**
  * @dev Event confirming that the bet has been accepted by the acceptor and matching amount has been transferred
  * @param betsIndex Current bet's element index in the bets array
  */
  event BetAccepted(
    uint256 indexed betsIndex
  );

  /**
  * @dev Event confirming that the juge has confirmed to jugde the bet
  * @param betsIndex Current bet's element index in the bets array
  */
  event BetJudgeConfirmed(
    uint256 indexed betsIndex
  );

  /**
  * @dev Event confirming that the juge has settled the result of the bet
  * @param betsIndex Current bet's element index in the bets array
  */
  event BetSettled(
    uint256 indexed betsIndex
  );

  /**
  * @dev Event confirming that a specfic bet has been cancelled (before starting)
  * @param betsIndex Current bet's element index in the bets array
  */
  event BetCancelled(
    uint256 indexed betsIndex
  );

  Bet[] public bets;

  /**
  * @dev Creates a bet between the sender and acceptor
  * @param acceptor Address of the person being challenged
  * @param judge Address of the person judging the challenge
  */
  function createBet(address acceptor, address judge, string description)
    public
    contractStarted
    payable
  {
    // Require bet of some ETH
    require(msg.value != 0);
    // Acceptor and jugde can't be 0x0
    require(acceptor != address(0));
    require(judge != address(0));

    // Don't allow empty descriptions
    require(bytes(description).length != 0);

    Bet memory bet = Bet(
      msg.sender,
      acceptor,
      judge,
      msg.value,
      BetStages.Created,
      BetResults.NotSettled,
      false,
      false,
      false
    );



    uint index =  bets.push(bet) - 1;
    emit BetCreated(msg.sender, acceptor, judge, description, index);
  }

  /**
  * @dev Accepts a bet if called by acceptor, value sent is the same as the proposer and stage is "Created"
  * @param betsIndex Current bet's element index in the bets array
  */
  function acceptBet(uint betsIndex)
    public
    contractStarted
    onlyInCreatedStage(betsIndex)
    onlyAcceptor(betsIndex)
    payable
  {
    Bet storage bet = bets[betsIndex];

    // Acceptor needs to send same amount as proposer
    require(msg.value == bet.amount);
    bet.acceptorDeposited = true;

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
    contractStarted
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
    contractStarted
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

  /**
  * @dev Cancels a bet that has not yet started when called by either proposer or acceptor
  * @param betsIndex Current bet's element index in the bets array
  */
  function cancelBet(uint betsIndex)
    public
    contractStarted
  {
    Bet storage bet = bets[betsIndex];

    // Only allow bet to be cancelled before it's in progress
    require(bet.stage == BetStages.Created || bet.stage == BetStages.Accepted);
    // Bets can be cancelled by either proposer or acceptor
    require(msg.sender == bet.proposer || msg.sender == bet.acceptor);

    bet.stage = BetStages.Cancelled;

    emit BetCancelled(betsIndex);
  }

  function withdraw(uint betsIndex)
    public
    contractAllowsWithdrawal
  {
    Bet storage bet = bets[betsIndex];

    require(bet.stage == BetStages.Settled ||
            bet.stage == BetStages.Cancelled ||
            CircuitBreaker.state == CircuitBreaker.BreakerStates.OnlyWithdrawal
           );

    // Only allow acceptor to withdraw if he/she has deposited
    if (msg.sender == bet.acceptor) {
      require(bet.acceptorDeposited == true);
    }

    // Allow both parties to withdraw their deposit in case of
    // draw or cancellation, circuit breaker only withdrawal
    if (bet.result == BetResults.Draw ||
        bet.stage == BetStages.Cancelled ||
        CircuitBreaker.state == CircuitBreaker.BreakerStates.OnlyWithdrawal
       ) {
      if (msg.sender == bet.proposer) {
        require(bet.proposerWithdrawn == false);

        bet.proposerWithdrawn = true;

        // On draw allow withdrawal of initial bet for each party
        bet.proposer.transfer(bet.amount);
      } else if (msg.sender == bet.acceptor) {
        require(bet.acceptorWithdrawn == false);

        bet.acceptorWithdrawn = true;
        // On draw allow withdrawal of initial bet for each party
        bet.acceptor.transfer(bet.amount);
      } else {
        // Only proposer & acceptor should be able to withdraw
        revert();
      }
    } else if (bet.result == BetResults.ProposerWon) {
      require(msg.sender == bet.proposer);
      // Only allow one withdrawal
      require(bet.proposerWithdrawn == false);

      bet.proposerWithdrawn = true;

      // Winner gets ether from both proposer and acceptor
      bet.proposer.transfer(bet.amount * 2);
    } else if (bet.result == BetResults.AcceptorWon) {
      require (msg.sender == bet.acceptor);
      // Only allow one withdrawal
      require(bet.acceptorWithdrawn == false);

      bet.acceptorWithdrawn = true;

      // Winner gets ether from both proposer and acceptor
      bet.acceptor.transfer(bet.amount * 2);
    } else {
    // Cannot withdraw, revert
    revert();
    }
  }
}
