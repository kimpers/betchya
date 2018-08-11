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
    const {
      disabled,
      proposerAddress,
      acceptorAddress,
      judgeAddress,
      description,
      amount
    } = this.props;

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
            defaultValue={proposerAddress ? proposerAddress : null}
          />
        )}
        <FormInput
          label="ETH address of the challenged"
          fluid
          disabled={disabled}
          placeholder="0x123456"
          defaultValue={acceptorAddress ? acceptorAddress : null}
          onChange={e => this.setState({ acceptorAddress: e.target.value })}
        />
        <FormInput
          label="ETH address of the judge"
          fluid
          disabled={disabled}
          placeholder="0x123456"
          defaultValue={judgeAddress ? judgeAddress : null}
          onChange={e => this.setState({ judgeAddress: e.target.value })}
        />

        <FormInput
          label="Description"
          disabled={disabled}
          defaultValue={description ? description : null}
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
          placeholder={amount ? amount : null}
          onChange={e => this.setState({ value: e.target.value })}
        />
      </div>
    );
  }
}

export default BetForm;
