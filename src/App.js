import React, { Component } from "react";
import BetchyaContract from "../build/contracts/Betchya.json";
import getWeb3 from "./utils/getWeb3";
import styled from "styled-components";
import { Header, Message } from "semantic-ui-react";

import BetForm from "./components/BetForm";
import { toBetObject } from "./lib/contractUtils";

const AppWrapper = styled.div`
  height: 100%;
  width: 100%;
  background: #a1d2ce;
`;

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
`;

const AppHeader = styled(Header)`
  display: inline-block;
  color: rgba(0, 0, 0, 0.6) !important;
`;

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
      .then(results => {
        this.setState({
          web3: results.web3
        });

        // Instantiate contract once web3 provided.
        this.instantiateContract();
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

  instantiateContract = () => {
    const contract = require("truffle-contract");
    const betchya = contract(BetchyaContract);
    betchya.setProvider(this.state.web3.currentProvider);

    const { web3 } = this.state;

    // Get accounts.
    web3.eth.getAccounts(async (error, accounts) => {
      const betchyaInstance = await betchya.deployed();

      betchyaInstance.allEvents({}, this.handleEvent);
      const account = accounts[0];

      const contractMethods = {
        createBet: (acceptor, judge, value) =>
          betchyaInstance.createBet(acceptor, judge, {
            from: account,
            value: (web3.utils || web3).toWei(value, "ether")
          }),
        getAccountBets: async address => {
          const numProposerBets = await betchyaInstance.getProposerBetsLength
            .call(address)
            .then(n => parseInt(n, 10));

          const proposerBets = [];
          for (let i = 0; i < numProposerBets; i++) {
            const betIndex = await betchyaInstance.proposerToBetIndex.call(
              address,
              i
            );
            const bet = await betchyaInstance.bets
              .call(betIndex)
              .then(toBetObject);

            proposerBets.push(bet);
          }

          return proposerBets;
        }
      };

      this.setState({
        contractMethods
      });
    });
  };

  render() {
    const { message } = this.state;

    return (
      <AppWrapper>
        {message && (
          <Message
            positive
            header="Success"
            onDismiss={() => this.setState({ message: null })}
          >
            {message}
          </Message>
        )}

        <ContentWrapper>
          <AppHeader size="huge">
            Betchya.eth - challenge your friends!
          </AppHeader>
          <BetForm contractMethods={this.state.contractMethods} />
        </ContentWrapper>
      </AppWrapper>
    );
  }
}

export default App;
