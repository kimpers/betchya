const Betchya = artifacts.require("./Betchya.sol");
const EthPriceJudge = artifacts.require("./EthPriceJudge.sol");

module.exports = async deployer => {
  await deployer.deploy(Betchya);
  // Disabled for easier reviewing
  // Enable this if you want to test the Oracle contract
  // await deployer.deploy(EthPriceJudge, Betchya.address);
};
