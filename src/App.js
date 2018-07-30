import React, { Component } from "react";
import getWeb3 from "./utils/getWeb3";
import styled from "styled-components";
import { Header, Message } from "semantic-ui-react";

import BetchyaContractDefinition from "../build/contracts/Betchya.json";

import BetForm from "./components/BetForm";
import BetSelector from "./components/BetSelector";

import BetchyaContract from "./lib/BetchyaContract";

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
    const { web3 } = this.state;

    // Get accounts.
    web3.eth.getAccounts(async (error, accounts) => {
      const contract = require("truffle-contract");
      const account = accounts[0];

      const betchya = contract(BetchyaContractDefinition);
      betchya.setProvider(web3.currentProvider);
      const instance = await betchya.deployed();
      instance.allEvents({}, this.handleEvent);

      const betchyaContract = new BetchyaContract(web3, instance, account);

      const participations = await betchyaContract.getAccountBetParticipations(
        account
      );

      this.setState({
        betchyaContract,
        participations
      });
    });
  };

  render() {
    const { message, participations } = this.state;

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
          <BetSelector participations={participations} />
          <AppHeader size="huge">
            Betchya.eth - challenge your friends!
          </AppHeader>
          <BetForm betchyaContract={this.state.betchyaContract} />
        </ContentWrapper>
      </AppWrapper>
    );
  }
}

export default App;
