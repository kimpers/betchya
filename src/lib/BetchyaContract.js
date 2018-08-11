import { toBetObject } from "./contractUtils";

export default class BetchyaContract {
  constructor(web3, contract, account) {
    this.web3 = web3;
    this.contract = contract;
    this.account = account;
    window.contract = contract;
  }

  createBet = async (acceptor, judge, value, description) =>
    this.contract.createBet(acceptor, judge, description, {
      from: this.account,
      value: (this.web3.utils || this.web3).toWei(value, "ether")
    });

  getBet = bet => this.contract.bets.call(bet).then(toBetObject);

  getLogsForBet = bet => {
    const { proposer, acceptor, judge } = bet;
    const log = this.contract.BetCreated(
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
