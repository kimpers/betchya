# Avoiding common attacks

## Logic bugs
To avoid logic bugs each contract function has an a test suite that tests different execution flows in order to verify functionality. Contract is structured according to general best practices and tries to use established design patterns where possible (see `design_pattern_decisions.md`). The contract is written with clarity and readability in mind.

## Recursive calls
To avoid recursive calls attacks the contracts implements the **checks-effects-interactions-pattern** where contract state is checked and updated before any external calls are made (at the end of the function). 

## Integer overflow/underflow
The contract uses the **SafeMath** library to do any math operations in order to avoid Integer overflow/underflow issues. SafeMath checks for these issues on any operation.


## Poison data
The contract validates all the user input is of the correct type. Unbounded input of the string type is validated to a set maximum length of 255 bytes.

## Exposure
The contract uses explict defined visibility for properties in order to not rely on default values. Unit tests are implemented to ensure the correct visibility of properties. No sensitive information is stored in the contract.

## External errors
Contract uses acct.transfer to send any funds which throws an exception if it is unsuccessful. Contract also utilizes the **checks-effects-interactions-pattern** to check and update contract state before doing any external interactions.

## Timestamp vulnerabilities
The contract does not rely on exact timestamps for any functionality. Smaller manipulation of block timestamp will not affect the contract.

## Malicious admins
Contract only has one elevated access account (contract owner), this minimizes the risk for malicious actors. When contract is being deployed on the mainnet this account should be managed through a multisig wallet.

## Cross chain replay
Hard forks should not pose any additional issues for this contract.

## Tx.origin
Tx.origin is not used in contract in order to elminate this attack verctor.

## Gas limit
The contract does not do any looping of indetermined length. Any unbounded user input is validated with a maximum length. The contract uses the **withdrawal pattern** to avoid having to do any loops for paying out bet winnings.