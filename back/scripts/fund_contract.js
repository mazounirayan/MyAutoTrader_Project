const hre = require("hardhat");

async function main() {
  const MOCK_USDC_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const TRADER_CONTRACT_ADDRESS = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";

  // On récupère l'instance du contrat MockToken déjà déployé
  const MockToken = await hre.ethers.getContractAt("MockToken", MOCK_USDC_ADDRESS);

  console.log(`🏦 Financement du contrat AutoTrader (${TRADER_CONTRACT_ADDRESS})...`);
  
  // On mint 1 Million d'USDC (avec 6 décimales) pour couvrir les profits simulés
  const amount = hre.ethers.parseUnits("1000000", 6); 
  
  const tx = await MockToken.mint(TRADER_CONTRACT_ADDRESS, amount);
  await tx.wait();

  console.log(`✅ Succès ! Le contrat a reçu 1,000,000 USDC de liquidité.`);
  
  // Vérification du solde
  const balance = await MockToken.balanceOf(TRADER_CONTRACT_ADDRESS);
  console.log(`💰 Nouveau solde du contrat : ${hre.ethers.formatUnits(balance, 6)} USDC`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
