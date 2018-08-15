import React from "react";
import { Button, Dropdown } from "semantic-ui-react";

import { resultNameToValue } from "../lib/contractUtils.js";

class SettleDropdown extends React.Component {
  state = {
    betResult: null
  };

  render() {
    const { bet, betchyaContract } = this.props;

    const options = [
      {
        text: `Proposer (${bet.proposer})`,
        value: resultNameToValue("ProposerWon"),
        key: "settle-proposer"
      },
      {
        text: `Acceptor (${bet.acceptor})`,
        value: resultNameToValue("AcceptorWon"),
        key: "settle-acceptor"
      },
      {
        text: "Draw",
        value: resultNameToValue("Draw"),
        key: "settle-draw"
      }
    ];

    return (
      <div>
        <Dropdown
          item
          button
          placeholder="Select the result of bet"
          options={options}
          onChange={(_, { value }) => this.setState({ betResult: value })}
        />
        <Button
          disbled={!this.state.betResult}
          onClick={() =>
            betchyaContract.settleBet(bet.betsIndex, this.state.betResult)
          }
          primary
        >
          Settle bet
        </Button>
      </div>
    );
  }
}

export default SettleDropdown;
