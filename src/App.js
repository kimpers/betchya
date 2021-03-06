import React, { Component } from "react";
import getWeb3 from "./utils/getWeb3";

import BetchyaContractDefinition from "../build/contracts/Betchya.json";

import BetchyaContract from "./lib/BetchyaContract";

import Home from "./pages/Home";

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      storageValue: 0,
      web3: null,
      contractMethods: null,
      message: null,
      participations: []
    };
  }

  watchers = [];

  componentWillMount() {
    // Get network provider and web3 instance.
    // See utils/getWeb3 for more info.

    getWeb3
      .then(({ web3 }) => {
        // Instantiate contract once web3 provided.
        this.instantiateContract(web3);

        this.setState({
          web3
        });
      })
      .catch(() => {
        console.log("Error finding web3.");
      });
  }

  componentWillUnmount() {
    this.watchers.forEach(w => w.stopWatching());
    clearInterval(this.accountChecker);
  }

  handleEvent = (err, eventLog) => {
    if (err) {
      console.error(err);
      return;
    }

    if (eventLog.event === "LogBetCreated") {
      this.setState({
        message:
          "Bet successfully created! Awaiting acceptor and judge to confirm."
      });
    }
  };

  instantiateContract = web3 => {
    // Get accounts.
    web3.eth.getAccounts(async (error, accounts) => {
      const contract = require("truffle-contract");
      const account = accounts[0];

      const betchya = contract(BetchyaContractDefinition);

      betchya.setProvider(web3.currentProvider);
      const betchyaInstance = await betchya.deployed();

      const historyEvents = ["proposer", "acceptor", "judge"].map(role =>
        betchyaInstance.LogBetCreated(
          {
            [role]: account
          },
          {
            fromBlock: 0
          }
        )
      );

      const role = participation => {
        if (participation.proposer === account) {
          return "proposer";
        } else if (participation.acceptor === account) {
          return "acceptor";
        } else if (participation.judge === account) {
          return "judge";
        }
      };

      const eventLogToBet = e => ({
        ...e.args,
        blockNumber: e.blockNumber,
        role: role(e.args),
        transactionHash: e.transactionHash
      });

      Promise.all(
        historyEvents.map(
          event =>
            new Promise((resolve, reject) => {
              event.get((err, eventLog) => {
                if (err) {
                  reject(err);
                  return;
                }

                const eventData = eventLog.map(eventLogToBet);
                resolve(eventData);
              });
            })
        )
      )
        .then(p => p.reduce((memo, e) => memo.concat(e), []))
        .then(l => l.sort((a, b) => b.blockNumber - a.blockNumber))
        .then(participations => {
          this.setState({ participations });
        });

      const handleUpdate = (error, eventLog) => {
        if (error) {
          console.error(error);
          return;
        }

        const { participations } = this.state;

        const eventData = eventLogToBet(eventLog);

        // Make sure it's a new bet
        if (
          !participations.some(
            e => e.transactionHash === eventData.transactionHash
          )
        ) {
          const updates = {
            participations: [eventData, ...participations]
          };

          if (eventData.proposer === account) {
            updates.message = "Bet successfully created";

            setTimeout(
              () =>
                this.setState({
                  message: null
                }),
              10000
            );
          }
          this.setState(updates);
        }
      };

      this.watchers = ["proposer", "acceptor", "judge"].map(role =>
        betchyaInstance
          .LogBetCreated(
            {
              [role]: account
            },
            {
              fromBlock: "latest"
            }
          )
          .watch(handleUpdate)
      );

      const betchyaContract = new BetchyaContract(
        web3,
        betchyaInstance,
        account
      );

      this.accountChecker = setInterval(() => {
        if (web3.eth.accounts[0] !== betchyaContract.account) {
          // Stop old interval
          clearInterval(this.accountChecker);

          // It's safest to just re-initialize everything on account change
          this.instantiateContract(web3);
        }
      }, 300);

      this.setState({
        betchyaContract
      });
    });
  };

  render() {
    const { message, participations, betchyaContract } = this.state;

    if (!betchyaContract) {
      return <span>Loading...</span>;
    }

    return (
      <Home
        message={message}
        participations={participations}
        betchyaContract={betchyaContract}
        onDismiss={() => this.setState({ message: null })}
      />
    );
  }
}

export default App;
