import React, { Component } from "react";
import { Input, Button, Select } from "semantic-ui-react";
import styled from "styled-components";

const FormInput = styled(Input)`
  margin-bottom: 1em;
`;

class BetForm extends Component {
  constructor(props) {
    super();
    this.state = {
      acceptorAddress: props.acceptorAddresss,
      judgeAddress: props.judgeAddress,
      description: props.description,
      value: props.value,
      judgeType: "account"
    };
  }

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
    const { disabled, proposerAddress, ethPriceJudgeContract } = this.props;
    const judgeOptions = [
      { key: "judgeAddress", text: "Account", value: "account" },
      { key: "judgeEthPrice", text: "Eth price", value: "ethPrice" }
    ];

    const ethPriceJudgeAddress =
      ethPriceJudgeContract && ethPriceJudgeContract.contract.address;

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
          value={this.state.acceptorAddress}
          onChange={e => this.setState({ acceptorAddress: e.target.value })}
        />
        <FormInput
          type="text"
          label="ETH address of the judge"
          fluid
          disabled={disabled}
          value={this.state.judgeAddress}
          action
        >
          <Input
            style={{ width: "100%" }}
            placeholder="0x123456"
            disabled={this.state.judgeType === "ethPrice"}
            value={this.state.judgeAddress}
            onChange={e => this.setState({ judgeAddress: e.target.value })}
          />
          <Select
            compact
            options={judgeOptions}
            defaultValue="account"
            onChange={(_, { value }) =>
              this.setState({
                judgeType: value,
                judgeAddress: value === "ethPrice" ? ethPriceJudgeAddress : ""
              })
            }
          />
        </FormInput>
        <FormInput
          label="Description"
          disabled={disabled}
          placeholder="Go to the gym twice a week for 6 months"
          value={this.state.description}
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
          value={this.state.value}
          onChange={e => this.setState({ value: e.target.value })}
        />
      </div>
    );
  }
}

export default BetForm;
