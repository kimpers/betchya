require("babel-register");
const HDWalletProvider = require("truffle-hdwallet-provider");
const mnemonic = process.env.MNEMONIC;
const infuraKey = process.env.INFURA_KEY;

module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*" // Match any network id
    },
    rinkeby: {
      provider: () => {
        if (!mnemonic) {
          throw new Error("MNEMONIC env variable missing");
        }

        if (!infuraKey) {
          throw new Error("INFURA_KEY env variable missing");
        }

        return new HDWalletProvider(
          mnemonic,
          `https://rinkeby.infura.io/${infuraKey}`
        );
      },
      network_id: 4
    }
  }
};
