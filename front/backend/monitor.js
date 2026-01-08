const { ethers } = require("ethers");
require("dotenv").config();

const MOCK_USDC_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const CONTRACT_ADDRESS = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";
const TRADER_ABI = [
  {
    "inputs": [],
    "name": "getLatestPrice",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_buyPrice", "type": "uint256" },
      { "internalType": "uint256", "name": "_sellPrice", "type": "uint256" },
      { "internalType": "uint256", "name": "_stopLoss", "type": "uint256" },
      { "internalType": "uint256", "name": "_amount", "type": "uint256" }
    ],
    "name": "createStrategy",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "name": "strategies",
    "outputs": [
      { "internalType": "uint256", "name": "id", "type": "uint256" },
      { "internalType": "uint256", "name": "amountDeposited", "type": "uint256" },
      { "internalType": "uint256", "name": "buyPrice", "type": "uint256" },
      { "internalType": "uint256", "name": "sellPrice", "type": "uint256" },
      { "internalType": "uint256", "name": "stopLossPrice", "type": "uint256" },
      { "internalType": "bool", "name": "isInvested", "type": "bool" },
      { "internalType": "bool", "name": "isActive", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "nextTokenId",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "executeAllStrategies",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// Configuration pour le réseau local Hardhat
const LOCAL_RPC_URL = "http://127.0.0.1:8545";
// Clé privée par défaut de l'Account #0 de Hardhat
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

const provider = new ethers.JsonRpcProvider(LOCAL_RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, TRADER_ABI, wallet);

async function checkAndExecute() {
    const now = new Date().toLocaleTimeString();
    console.log(`[${now}] 🔍 Vérification des stratégies...`);
    
    try {
        // On vérifie d'abord s'il y a des stratégies à exécuter
        const nextId = await contract.nextTokenId();
        if (nextId == 0) {
            console.log("   Wait : Aucune stratégie sur le contrat.");
            return;
        }

        const tx = await contract.executeAllStrategies();
        console.log("   ✅ Transaction d'exécution envoyée:", tx.hash);
        await tx.wait();
        console.log("   ✅ Exécution terminée avec succès");
    } catch (error) {
        // Souvent l'erreur signifie juste qu'aucune condition n'est remplie (revert volontaire)
        console.log("   ⏭️  Rien à faire (Conditions non remplies ou erreur)");
    }
}

// Exécuter immédiatement au lancement
checkAndExecute();

// Puis toutes les 10 secondes (plus rapide pour la démo)
setInterval(checkAndExecute, 10000);

console.log("🤖 Bot de monitoring lancé sur Localhost (8545)");
console.log("   Utilise l'adresse de l'exécuteur :", wallet.address);
