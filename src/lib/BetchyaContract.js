import { toBetObject } from "./contractUtils";

export default class BetchyaContract {
  constructor(web3, contract, account) {
    this.web3 = web3;
    this.contract = contract;
    this.account = account;
    window.contract = contract;
  }

  createBet = async (acceptor, judge, value, description, data = null) =>
    this.contract.createDataBet(acceptor, judge, description, data, {
      from: this.account,
      value: (this.web3.utils || this.web3).toWei(value, "ether")
    });

  acceptBet = (betsIndex, value) =>
    this.contract.acceptBet(betsIndex, {
      from: this.account,
      value
    });

  confirmJudge = betsIndex =>
    this.contract.confirmJudge(betsIndex, {
      from: this.account
    });

  cancelBet = betsIndex =>
    this.contract.cancelBet(betsIndex, { from: this.account });

  withdraw = betsIndex =>
    this.contract.withdraw(betsIndex, { from: this.account });

  settleBet = (betsIndex, result) =>
    this.contract.settleBet(betsIndex, result, { from: this.account });

  getBet = betsIndex =>
    this.contract.bets.call(betsIndex).then(b => ({
      ...toBetObject(b),
      betsIndex
    }));

  getLogsForBet = bet => {
    const { proposer, acceptor, judge } = bet;
    const log = this.contract.LogBetCreated(
      {
        proposer,
        acceptor,
        judge
      },
      { fromBlock: 0 }
    );

    return new Promise((resolve, reject) => {
      log.get((err, eventLog) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(eventLog);
      });
    });
  };
}
