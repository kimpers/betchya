import React from "react";
import { withRouter } from "react-router-dom";

import BetForm from "../components/BetForm";

class Bet extends React.Component {
  state = {
    bet: null
  };

  async componentDidMount() {
    const {
      betchyaContract,
      match: {
        params: { id }
      }
    } = this.props;

    const bet = await betchyaContract.getBet(id);

    // This should only ever be an array of 1 element or an empty array
    const logs = await betchyaContract
      .getLogsForBet(bet)
      .then(logs => logs.filter(l => l.args.betsIndex.toString() === id));

    this.setState({
      bet,
      log: logs[0]
    });
  }

  render() {
    const { bet, log } = this.state;
    const { betchyaContract } = this.props;
    if (!bet || !log) {
      return null;
    }

    return (
      <BetForm
        betchyaContract={betchyaContract}
        disabled
        proposerAddress={log.args.proposer}
        acceptorAddress={log.args.acceptor}
        judgeAddress={log.args.judge}
        description={log.args.description}
        amount={betchyaContract.web3.fromWei(bet.amount, "ether")}
      />
    );
  }
}

export default withRouter(Bet);
