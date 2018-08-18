pragma solidity ^0.4.24;

import "zeppelin/ownership/Ownable.sol";

/** @title CircuitBreaker */
contract CircuitBreaker is Ownable {
  enum BreakerStates { Started, OnlyWithdrawal, Stopped }
  BreakerStates public state;

  constructor() {
    state = BreakerStates.Started;
  }

  /**
  * @dev Only allow function to be executed with Contract is in state "Started"
  */
  modifier contractStarted() {
    require(state == BreakerStates.Started);
    _;
  }

  /**
  * @dev Only allow function to be executed with Contract is in state "Started" or "OnlyWithdrawal"
  */
  modifier contractAllowsWithdrawal() {
    require(state == BreakerStates.Started || state == BreakerStates.OnlyWithdrawal);
    _;
  }


  /**
  * @dev Enables circuit breaker stopping all functionality except withdrawal of initial deposits
  */
  function onlyWithdrawal()
    public
    onlyOwner
  {
    state = BreakerStates.OnlyWithdrawal;
  }

  /**
  * @dev Enables circuit breaker stopping all functionality
  */
  function stopContract()
    public
    onlyOwner
  {
    state = BreakerStates.Stopped;
  }

  /**
  * @dev Disables circuit breaker enabling all functionality
  */
  function startContract()
    public
    onlyOwner
  {
    state = BreakerStates.Started;
  }
}
