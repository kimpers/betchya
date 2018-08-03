import React, { Component } from "react";
import { Input } from "semantic-ui-react";
import styled from "styled-components";

const FormInput = styled(Input)`
  margin-bottom: 1em;
`;

class BetForm extends Component {
  // TODO: remove default values
  state = {
    acceptorAddress: "0x3dc9310B010bAEC67cBFb9816DB86435DE057Bac",
    judgeAddress: "0x5C2a6467d6a1ddaE6C736c5dF0FB5f1F63D0715A",
    description: null,
    value: 0.1
  };

  handleCreateBet = () => {
    const { betchyaContract } = this.props;
    const { acceptorAddress, judgeAddress, value, description } = this.state;

    if (betchyaContract && acceptorAddress && judgeAddress) {
      betchyaContract.createBet(
        acceptorAddress,
        judgeAddress,
        value,
        description
      );
    } else {
      console.error(betchyaContract, acceptorAddress, judgeAddress);
    }
  };

  render() {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          maxWidth: "620px"
        }}
      >
        <FormInput
          label="ETH address of the challenged"
          fluid
          placeholder="0x123456"
          defaultValue="0x3dc9310B010bAEC67cBFb9816DB86435DE057Bac"
          onChange={e => this.setState({ acceptorAddress: e.target.value })}
        />
        <FormInput
          label="ETH address of the judge"
          fluid
          placeholder="0x123456"
          defaultValue="0x5C2a6467d6a1ddaE6C736c5dF0FB5f1F63D0715A"
          onChange={e => this.setState({ judgeAddress: e.target.value })}
        />

        <FormInput
          label="Description"
          placeholder="Going to the gym twice a week for 6 months"
          onChange={e => this.setState({ description: e.target.value })}
        />

        <FormInput
          fluid
          action={{
            color: "teal",
            labelPosition: "left",
            icon: "ethereum",
            content: "Make bet",
            onClick: () => this.handleCreateBet()
          }}
          label="Amount to bet (in ether)"
          placeholder="0.1"
          onChange={e => this.setState({ value: e.target.value })}
        />
      </div>
    );
  }
}

export default BetForm;
