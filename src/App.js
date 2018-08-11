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
      message: null
    };
  }

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

  handleEvent = (err, eventLog) => {
    if (err) {
      console.error(err);
      return;
    }

    if (eventLog.event === "BetCreated") {
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
      const instance = await betchya.deployed();

      const historyEvents = ["proposer", "acceptor", "judge"].map(role =>
        instance.BetCreated(
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
      const participations = await Promise.all(
        historyEvents.map(
          event =>
            new Promise((resolve, reject) => {
              event.get((err, eventLog) => {
                if (err) {
                  reject(err);
                  return;
                }

                const eventData = eventLog.map(e => ({
                  ...e.args,
                  blockNumber: e.blockNumber,
                  role: role(e.args)
                }));
                resolve(eventData);
              });
            })
        )
      )
        .then(p => p.reduce((memo, e) => memo.concat(e), []))
        .then(l => l.sort((a, b) => b.blockNumber - a.blockNumber));

      const betchyaContract = new BetchyaContract(web3, instance, account);

      this.setState({
        betchyaContract,
        participations
      });
    });
  };

  render() {
    const { message, participations, betchyaContract } = this.state;

    if (!betchyaContract) {
      return null;
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
