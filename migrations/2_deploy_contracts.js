const Betchya = artifacts.require("./Betchya.sol");
const EthPriceJudge = artifacts.require("./EthPriceJudge.sol");

module.exports = function(deployer) {
  deployer.deploy(Betchya);
  deployer.deploy(EthPriceJudge);
};
