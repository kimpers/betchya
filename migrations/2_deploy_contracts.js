const Betchya = artifacts.require("./Betchya.sol");
const EthPriceJudge = artifacts.require("./EthPriceJudge.sol");

module.exports = async deployer => {
  await deployer.deploy(Betchya);
  await deployer.deploy(EthPriceJudge, Betchya.address);
};
