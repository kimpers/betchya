import React from "react";
import R from "ramda";
import { Button, Header } from "semantic-ui-react";
import { withRouter } from "react-router-dom";

import {
  toResult,
  STAGE_CREATED,
  STAGE_ACCEPTED,
  STAGE_CANCELLED,
  STAGE_SETTLED,
  STAGE_IN_PROGRESS,
  RESULT_PROPOSER_WON,
  RESULT_ACCEPTOR_WON,
  RESULT_NOT_SETTLED,
  RESULT_DRAW,
  EVENT_BET_ACCEPTED,
  EVENT_BET_JUDGE_CONFIRMED,
  EVENT_BET_SETTLED,
  EVENT_BET_WITHDRAWN
} from "../lib/contractUtils";
import BetForm from "./BetForm";
import SettleDropdown from "./SettleDropdown.js";

const canAcceptBet = (bet, account) =>
  bet.stage === STAGE_CREATED && bet.acceptor === account;

const canConfirmJudge = (bet, account) =>
  bet.stage === STAGE_ACCEPTED && bet.judge === account;

const canCancelBet = (bet, account) =>
  (bet.stage === STAGE_CREATED || bet.stage === STAGE_ACCEPTED) &&
  (account === bet.proposer || account === bet.acceptor);

const canWithdrawCancelled = (bet, account) =>
  bet.stage === STAGE_CANCELLED &&
  ((bet.proposer === account && !bet.proposerWithdrawn) ||
    (bet.acceptor === account && !bet.acceptorWithdrawn));

const canWithdrawWon = (bet, account) =>
  bet.stage === STAGE_SETTLED &&
  ((bet.proposer === account &&
    bet.result === RESULT_PROPOSER_WON &&
    !bet.proposerWithdrawn) ||
    (bet.acceptor === account &&
      bet.result === RESULT_ACCEPTOR_WON &&
      !bet.acceptorWithdrawn));

const canWithdrawDraw = (bet, account) =>
  bet.stage === STAGE_SETTLED &&
  bet.result === RESULT_DRAW &&
  ((bet.proposer === account && !bet.proposerWithdrawn) ||
    (bet.acceptor === account && !bet.acceptorWithdrawn));

const canWithdraw = (bet, account) =>
  canWithdrawCancelled(bet, account) ||
  canWithdrawWon(bet, account) ||
  canWithdrawDraw(bet, account);

const canJudge = (bet, account) =>
  bet.stage === STAGE_IN_PROGRESS && bet.judge === account;

class Bet extends React.Component {
  state = {
    bet: null
  };

  watchers = [];

  getBetInfo = async () => {
    const {
      betchyaContract,
      match: {
        params: { id }
      }
    } = this.props;

    let bet = await betchyaContract.getBet(id);

    // This should only ever be an array of 1 element or an empty array
    const logs = await betchyaContract
      .getLogsForBet(bet)
      .then(logs => logs.filter(l => l.args.betsIndex.toString() === id));

    const updateBetFromEvent = (err, logEvent) => {
      if (err) {
        console.error(err);
        return;
      }

      // Update bet state from with information from Events emitted from contract
      const updates = R.cond([
        [
          ({ event }) => event === EVENT_BET_ACCEPTED,
          R.always({ stage: STAGE_ACCEPTED })
        ],
        [
          ({ event }) => event === EVENT_BET_JUDGE_CONFIRMED,
          R.always({ stage: STAGE_IN_PROGRESS })
        ],
        [
          ({ event }) => event === EVENT_BET_SETTLED,
          ({ args: { result } }) => ({
            stage: STAGE_SETTLED,
            result: toResult(result)
          })
        ],
        [
          ({ event }) => event === EVENT_BET_WITHDRAWN,
          ({ args: { withdrawer } }) =>
            withdrawer === bet.proposer
              ? { proposerWithdrawn: true }
              : { acceptorWithdrawn: true }
        ]
      ])(logEvent);

      bet = {
        ...bet,
        ...updates
      };

      this.setState({
        bet
      });
    };

    // Watch for updates for this bet
    this.watchers = [
      EVENT_BET_ACCEPTED,
      EVENT_BET_JUDGE_CONFIRMED,
      EVENT_BET_SETTLED,
      EVENT_BET_WITHDRAWN
    ].map(eventName =>
      betchyaContract.contract[eventName]({
        betsIndex: bet.betsIndex
      }).watch(updateBetFromEvent)
    );

    this.setState({
      bet,
      log: logs[0]
    });
  };

  componentDidMount() {
    this.getBetInfo();
  }

  componentWillUnmount() {
    this.watchers.forEach(w => w.stopWatching());
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
            color: "rgba(0, 0, 0, 0.6)",
            display: "flex",
            justifyContent: "space-around"
          }}
        >
          <span>Stage: {bet.stage}</span>
          {bet.result !== RESULT_NOT_SETTLED && (
            <span>Result: {bet.result}</span>
          )}
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
        {canAcceptBet(bet, account) && (
          <Button
            primary
            onClick={() => betchyaContract.acceptBet(betsIndex, bet.amount)}
          >
            Accept bet
          </Button>
        )}
        {canConfirmJudge(bet, account) && (
          <Button
            primary
            onClick={() => betchyaContract.confirmJudge(betsIndex)}
          >
            Confirm judge
          </Button>
        )}
        {canCancelBet(bet, account) && (
          <Button
            secondary
            onClick={() => betchyaContract.cancelBet(betsIndex)}
          >
            Cancel bet
          </Button>
        )}
        {canWithdraw(bet, account) && (
          <Button primary onClick={() => betchyaContract.withdraw(betsIndex)}>
            Withdraw ether
          </Button>
        )}
        {canJudge(bet, account) && (
          <SettleDropdown bet={bet} betchyaContract={betchyaContract} />
        )}
      </div>
    );
  }
}

export default withRouter(Bet);
