# Design patterns utilized

## Fail early, fail loud
The contract is designed to validate state and input variables and too revert as soon as possible if something is not correct.

## State machine
The contract implements the state machine pattern where each bet has several states which allow different types of interaction. The bet stages are:

1. Created - First created by the bet proposer. Amount to bet has been sent to contract. Awaiting the acceptor to accept the bet.
2. Accepted - The acceptor has accepted the bet and deposit the same amount as the proposer. Awaiting the judge to confirm participation.
3. InProgress - Judge has confirmed the participation. The bet is now In Progress. When the bet is over the judge can settle the bet by deciding on the winner (or draw).
4. Settled - Bet is over, the winning participant can withdraw both the deposits. Or in the case of Draw, each participant can withdraw their initial deposit.
5. Cancelled - Bet has been cancelled. Each participant can withdraw their initial deposit.

## Restrict access
The contract implmentents the restrict access pattern where some functions are only callable by the user with a specific role in the bets. The contract also implements functions that are only callable by the owner of the contract (onlyOwner).

## Pull payments (withdrawal pattern)
The contract implments the withdrawal pattern, when the bet is over/cancelled the users call the withdraw function to withdraw their funds from the contract.

## Circuit breaker pattern
The contract implements the circuit breaker patter. In case of any issues the contract owner can trigger the circuit breaker either stop any activity (Stopped state) in the contract or to stop any bet creation and interaction but still allowing the users to withdraw their initial deposits (onlyWithdrawal state) from ongoing bets.

