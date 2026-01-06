const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("🚀 Déploiement avec le compte:", deployer.address);

  // 1. Déploiement de l'USDC (Mock)
  const MockToken = await hre.ethers.getContractFactory("MockToken");
  const usdc = await MockToken.deploy("USD Coin", "USDC");
  await usdc.waitForDeployment();
  console.log("✅ USDC déployé");

  // 2. Déploiement du WETH (Mock)
  const weth = await MockToken.deploy("Wrapped Ether", "WETH");
  await weth.waitForDeployment();
  console.log("✅ WETH déployé");

  // 3. Déploiement de l'Oracle (Mock)
  const MockOracle = await hre.ethers.getContractFactory("MockV3Aggregator");
  const oracle = await MockOracle.deploy(8, 200000000000n); // 2000$
  await oracle.waitForDeployment();
  console.log("✅ Oracle déployé");

  // 4. Déploiement du Trader (On lui donne les adresses des Mocks)
  const AutoTrader = await hre.ethers.getContractFactory("MyAutoTrader");
  const trader = await AutoTrader.deploy(oracle.target, usdc.target, weth.target);
  await trader.waitForDeployment();

  console.log("\n⚙️ Configuration de l'executor...");
    await trader.setExecutor(deployer.address);
    console.log("✅ Executor configuré:", deployer.address);
  console.log("\n============================================================");
  console.log("📋 A COPIER DANS LE FRONTEND :");
  console.log("============================================================");
console.log(`export const MOCK_USDC_ADDRESS = "${usdc.target}";`);
console.log(`export const MOCK_ORACLE_ADDRESS = "${oracle.target}";`);
console.log(`export const CONTRACT_ADDRESS = "${trader.target}";`);
  console.log("============================================================");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});