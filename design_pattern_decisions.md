# Design patterns utilized

## Fail early, fail loud
The contract is designed to validate state and input variables and to revert as soon as possible if something is not correct.

This is important as the contract uses interactions from people in order to change state. It is therefore important validate that all circumstances are correct before executing any logic. Using require to verify state and input is very readable and convenient.

## State machine
The contract implements the state machine pattern where each bet has several states, each of which allow different types of interaction. The bet stages are:

1. Created - First created by the bet proposer. Amount to bet has been sent to contract. Awaiting the acceptor to accept the bet.
2. Accepted - The acceptor has accepted the bet and deposit the same amount as the proposer. Awaiting the judge to confirm participation.
3. InProgress - Judge has confirmed the participation. The bet is now In Progress. When the bet is over the judge can settle the bet by deciding on the winner (or draw).
4. Settled - Bet is over, the winning participant can withdraw both the deposits. Or in the case of Draw, each participant can withdraw their initial deposit.
5. Cancelled - Bet has been cancelled. Each participant can withdraw their initial deposit.

Using the state machine pattern simplifies the contract as it is easy to clearly define which types of interactions are allowed in different contract stages.

## Restrict access
The contract implmentents the restrict access pattern where some functions are only callable by the user with a specific role in the bets. The contract also implements functions that are only callable by the owner of the contract (onlyOwner).

The contract relies on users having different roles being able to interact with the contract in different ways and the restrict access pattern makes it easy manage user access. The contract also has administrative functionality that only should be accessable for the contract administrator and protects this functionality with the onlyOwner accessibility pattern.

## Pull payments (withdrawal pattern)
The contract implements the withdrawal pattern, when the bet is over/cancelled the users call the withdraw function to withdraw their funds from the contract.

Having the users withdraw their funds from the contract when the bet is finialized allows for a much safer way to transfer funds then having it be part of the bet settlement function. Users can at their own leasure withdraw the funds, if something goes wrong they can try again at a later point.

## Circuit breaker pattern
The contract implements the circuit breaker patter. In case of any issues the contract owner can trigger the circuit breaker either stop any activity (Stopped state) in the contract or to stop any bet creation and interaction but still allowing the users to withdraw their initial deposits (onlyWithdrawal state) from ongoing bets.

In case of any severe issue found with the contract the administrator can pause the contract completely or set it to only allow users to withdraw their funds while a solution to the problem is developed and deployed. Before going live on the main net this contract will also implement the upgradable contract pattern to allow for fixing of contract issues post deploy.

