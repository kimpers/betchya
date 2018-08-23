export default class EthPriceJudgeContract {
  constructor(web3, contract, account) {
    this.web3 = web3;
    this.contract = contract;
    this.account = account;
    window.ethPriceJudge = contract;
  }

  updatePrice = () => this.contract.updatePrice({ from: this.account });

  judge = (betsIndex, data) => this.contract.judge({ from: this.account });
}
