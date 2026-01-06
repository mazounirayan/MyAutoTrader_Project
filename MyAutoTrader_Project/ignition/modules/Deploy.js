const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("MyAutoTraderModule", (m) => {
  // --- Étape 1 : Déployer le Faux Oracle (Mock) ---
  // On lui donne 8 décimales et un prix initial de 2000$ (2000 + 8 zéros)
  const mockOracle = m.contract("MockV3Aggregator", [8, 200000000000]);

  // --- Étape 2 : Déployer ton Bot de Trading ---
  // On passe l'adresse du faux oracle au constructeur de MyAutoTrader
  const autoTrader = m.contract("MyAutoTrader", [mockOracle]);

  // On retourne les contrats pour pouvoir interagir avec eux
  return { mockOracle, autoTrader };
});