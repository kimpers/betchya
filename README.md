# Betchya - decentralized betting
## Consensys Academy 2018 final project

## What is Betchya
Betchya is a peer-to-peer betting/challenge dapp. Betchya allows users to challenge each other with bets of ether on events or actions that they will take.

A bet has 3 actors:

1. Proposer: The person creating the bet who is challening the other person.
2. Acceptor: The person being challenged by the proposer (bet counter party)
3. Judge: The person (or oracle smart contract) that will independently judge the outcome of the bet.

## User stories

1. As a user I want to be able to easily challenge my friends for ETH for competitions
2. As a user I want to be able to challenge my friends for ETH to establish new habits in my life, eg. go to the gym 3x a week
3. As a user I want to be able to entrust an objective third party (other friend) to judge my challenge
4. As a user I want to be able to challenge my friends to predict the price of ETH in the future
5. As a user I want to be able to cancel challenges and allow for the funds to be retrieved in case of unexpected circumstances


## Install instructions
1. Install latest nodejs (suggestedly using [http://linuxbrew.sh](http://linuxbrew.sh)
2. Clone repo from GitHut `git clone https://github.com/kimpers/betchya.git`
3. Install yarn `npm install -g yarn`
4. Install Ganache `npm install -g ganache-cli`
5. Open project directoru `cd betchya` then run `yarn install`
6. Start ganache `ganache-cli` and copy the mnemonic
7. Run `yarn truffle migrate`
8. Import mnemonic you copied in previous step into metamask
9. Set metamask to use private local network
10. Create 3 additional accounts in metamask. Each should have 100 ETH.
11. Run tests `yarn test` (or `NODE_ENV=development truffle test`). All tests should pass (EthPriceJudge are skipped for convenience for now)
12. Run `yarn start` to start and go to [http://localhost:3000](http://localhost:3000)
13. Enjoy using Betchya

## Testing Betchya
1. Metamask should now have 4 accounts. Copy the address of account 3 & 4 and store them somewhere. Switch to account #2.
2. Paste the address of account #3 into `ETH address of the challenged`
3. Paste the address of account #4 into `ETH address of the judge`
4. Write a short description, e.g. Go to the gym twice a week for 6 months.
5. Input amount in ETH, eg. 1
6. Click make bet and confirm in Metamask
7. When you see a message that the bet was successful click on the current bets dropdown and select the bet.
8. Now you can see details about the bet. Switch accounts in metamask to account #3 (the UI should automatically update)
9. Click on `Accept bet` and approve the transaction.
10. When transaction has been mined switch to account #4
11. Click on `Confirm judge` and approve the transaction. Let it get mined.
12. You should now be able to settle the bet. Select the winner in the dropdown eg Proposer (account #2) and press `Settle bet`. Let the transaction get mined. Then switch to account #2.
13. Click on withdraw ether and approve the transaction.
14. You should now have received both deposits as the winner.

## Testing Oracle contract
Betchya has an Oraclize contract for betting on the ETH-USD price on GDAX. This contract has not been incorperated in the UI yet but it can bet tested with the included unit tests. The Oraclize contract has been disabled initially due to the complex local development setup, follow these instructions to re-enable it and setup the environment.

1. Start the ethereum-bridge: `yarn ethereum-bridge -a 9 --dev`. Wait for it to finish starting up.
2. Copy the line `OAR = OraclizeAddrResolverI(0x...);` from the output into clipboard.
3. Edit `contracts/EthPriceJudge.sol` and replace the `OAR = OraclizeAddrResolverI(0x..)` in the constructor with the value that you copied. Save the file and close it.
1. Enable deployment of contract. Edit the file `migrations/2_deploy_contracts.js` and uncomment the line ```// await deployer.deploy(EthPriceJudge, Betchya.address)``` so that deploys the contract.
2. Run `yarn truffle migrate`
3. Edit `test/ethPriceJudge.js` remove the `skip` from `contract.skip` so that it reads `contract(`
4. Run `yarn test` and see how it the tests interact with the GDAX api through Oraclize.

## Strech goals implemented
* Project uses Oracle: Oracle integration (see Testing Oracle contract)
* Testnet Deployment: Contract deployed to Rinkeby (see `deployed_addresses.txt`)
* IPFS: Betchya hosted on IPFS at [https://gateway.ipfs.io/ipfs/QmUEPsmH6QUWP7yUeYL47GkDFiJGikKZgLgUy4F5UBTLA5](https://gateway.ipfs.io/ipfs/QmUEPsmH6QUWP7yUeYL47GkDFiJGikKZgLgUy4F5UBTLA5) (**WARNING** very slow to load, might require refresh if it gets stuck)

