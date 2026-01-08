require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20", // On utilise une version récente compatible avec tout
  networks: {
    hardhat: {
       chainId: 31337,
      // Configuration par défaut pour les tests locaux
    },
  },
};