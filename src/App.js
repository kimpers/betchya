import React, { Component } from "react";
import BetchyaContract from "../build/contracts/Betchya.json";
import getWeb3 from "./utils/getWeb3";
import styled from "styled-components";
import { Header } from "semantic-ui-react";

import BetForm from "./components/BetForm";

const AppWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  background: #a1d2ce;
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
      web3: null
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

  instantiateContract() {
    const contract = require("truffle-contract");
    const betchya = contract(BetchyaContract);
    betchya.setProvider(this.state.web3.currentProvider);

    // Declaring this for later so we can chain functions on SimpleStorage.
    let betchyaInstance;

    // Get accounts.
    this.state.web3.eth.getAccounts((error, accounts) => {
      //betchya
      //.deployed()
      //.then(instance => {
      //betchyaInstance = instance;
      //// Stores a given value, 5 by default.
      //return betchyaInstance.set(5, { from: accounts[0] });
      //})
      //.then(result => {
      //// Get the value from the contract to prove it worked.
      //return betchyaInstance.get.call(accounts[0]);
      //})
      //.then(result => {
      //// Update state with the result.
      //return this.setState({ storageValue: result.c[0] });
      //});
    });
  }

  render() {
    return (
      <AppWrapper>
        <AppHeader size="huge">Betchya.eth - challenge your friends!</AppHeader>
        <BetForm />
      </AppWrapper>
    );
  }
}

export default App;
