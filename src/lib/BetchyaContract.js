import { toBetObject, toBetParticipation } from "./contractUtils";

export default class BetchyaContract {
  constructor(web3, contract, account) {
    this.web3 = web3;
    this.contract = contract;
    this.account = account;
  }

  createBet = async (acceptor, judge, value) =>
    this.betchya.createBet(acceptor, judge, {
      from: this.account,
      value: (this.web3.utils || this.web3).toWei(value, "ether")
    });

  getAccountBetParticipations = async address => {
    const numBets = await this.contract.getUserBetParticipationsLength
      .call(address)
      .then(n => parseInt(n, 10));

    const bets = { proposer: [], acceptor: [], judge: [] };
    for (let i = 0; i < numBets; i++) {
      const betParticipation = await this.contract.addressToBetParticipation
        .call(address, i)
        .then(toBetParticipation);

      const bet = await this.contract.bets
        .call(betParticipation.betIndex)
        .then(toBetObject);

      // Split participations up based on role
      bets[betParticipation.participationType.toLowerCase()].push(bet);
    }

    return bets;
  };
}
