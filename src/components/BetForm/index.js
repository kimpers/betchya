import React, { Component } from "react";
import { Input } from "semantic-ui-react";
import styled from "styled-components";

const FormInput = styled(Input)`
  margin-bottom: 1em;
`;

class BetForm extends Component {
  state = {
    acceptorAddress: null,
    judgeAddress: null,
    description: null,
    value: null
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
    const { disabled, proposerAddress } = this.props;

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column"
        }}
      >
        {proposerAddress && (
          <FormInput
            label="ETH address of the proposer"
            fluid
            disabled={disabled}
            placeholder="0x123456"
            value={disabled ? proposerAddress : null}
          />
        )}
        <FormInput
          label="ETH address of the challenged"
          fluid
          disabled={disabled}
          placeholder="0x123456"
          value={
            disabled ? this.props.acceptorAddress : this.state.acceptorAddress
          }
          onChange={e => this.setState({ acceptorAddress: e.target.value })}
        />
        <FormInput
          label="ETH address of the judge"
          fluid
          disabled={disabled}
          placeholder="0x123456"
          value={disabled ? this.props.judgeAddress : this.state.judgeAddress}
          onChange={e => this.setState({ judgeAddress: e.target.value })}
        />

        <FormInput
          label="Description"
          disabled={disabled}
          placeholder="Go to the gym twice a week for 6 months"
          value={disabled ? this.props.description : this.state.description}
          onChange={e => this.setState({ description: e.target.value })}
        />

        <FormInput
          fluid
          disabled={disabled}
          action={
            disabled
              ? null
              : {
                  color: "teal",
                  labelPosition: "left",
                  icon: "ethereum",
                  content: "Make bet",
                  onClick: () => this.handleCreateBet()
                }
          }
          label="Amount to bet (in ether)"
          placeholder="0.1"
          value={disabled ? this.props.amount : this.state.value}
          onChange={e => this.setState({ value: e.target.value })}
        />
      </div>
    );
  }
}

export default BetForm;
