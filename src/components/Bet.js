import React from "react";
import { Button, Header } from "semantic-ui-react";
import { withRouter } from "react-router-dom";

import BetForm from "../components/BetForm";

const STAGE_CREATED = "Created";
const STAGE_ACCEPTED = "Accepted";

class Bet extends React.Component {
  state = {
    bet: null
  };

  canAcceptBet = (bet, account) =>
    bet.stage === STAGE_CREATED && bet.acceptor === account;

  canConfirmJudge = (bet, account) =>
    bet.stage === STAGE_ACCEPTED && bet.judge === account;

  getBetInfo = async () => {
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
  };

  componentDidMount() {
    this.getBetInfo();
  }

  componentDidUpdate(prevProps) {
    // Get new bet info whenever the bet id changes
    if (this.props.match.params.id !== prevProps.match.params.id) {
      this.getBetInfo();
    }
  }

  render() {
    const { bet, log } = this.state;
    const { betchyaContract } = this.props;
    if (!bet || !log) {
      return null;
    }

    const { account } = betchyaContract;
    const {
      args: { proposer, acceptor, judge, description, betsIndex }
    } = log;

    return (
      <div>
        <Header
          as="h2"
          style={{
            color: "rgba(0, 0, 0, 0.6)"
          }}
        >
          Stage: {bet.stage}
        </Header>
        <BetForm
          betchyaContract={betchyaContract}
          disabled
          proposerAddress={proposer}
          acceptorAddress={acceptor}
          judgeAddress={judge}
          description={description}
          amount={betchyaContract.web3.fromWei(bet.amount, "ether")}
        />
        {this.canAcceptBet(bet, account) && (
          <Button
            primary
            onClick={() => betchyaContract.acceptBet(betsIndex, bet.amount)}
          >
            Accept bet
          </Button>
        )}
        {this.canConfirmJudge(bet, account) && (
          <Button
            primary
            onClick={() => betchyaContract.confirmJudge(betsIndex)}
          >
            Confirm judge
          </Button>
        )}
      </div>
    );
  }
}

export default withRouter(Bet);
