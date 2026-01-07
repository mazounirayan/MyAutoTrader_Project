import { ethers } from "ethers";
require("dotenv").config();


export const MOCK_USDC_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
export const CONTRACT_ADDRESS = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";
export const TRADER_ABI = [
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
  }
];

// ABI ERC20 (Standard)
export const ERC20_ABI = [
  {
    "inputs": [{ "internalType": "address", "name": "account", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "to", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "mint",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "spender", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "approve",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
  name: "getStrategy",
  type: "function",
  stateMutability: "view",
  inputs: [{ name: "tokenId", type: "uint256" }],
  outputs: [{
    type: "tuple",
    components: [
      { name: "id", type: "uint256" },
      { name: "amountDeposited", type: "uint256" },
      { name: "buyPrice", type: "uint256" },
      { name: "sellPrice", type: "uint256" },
      { name: "stopLossPrice", type: "uint256" },
      { name: "isInvested", type: "bool" },
      { name: "isActive", type: "bool" }
    ]
  }]
},
{
  name: "getMyStrategies",
  type: "function",
  stateMutability: "view",
  inputs: [{ name: "owner", type: "address" }],
  outputs: [{ name: "", type: "uint256[]" }]
}
];
const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_MUMBAI_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, TRADER_ABI, wallet);

async function checkAndExecute() {
    console.log("🔍 Vérification des stratégies...");
    
    try {
        const tx = await contract.executeAllStrategies();
        console.log("✅ Transaction envoyée:", tx.hash);
        await tx.wait();
        console.log("✅ Exécution terminée");
    } catch (error) {
        console.log("⏭️ Aucune action nécessaire");
    }
}

// Exécuter toutes les 30 secondes
setInterval(checkAndExecute, 30000);
console.log("🤖 Bot de monitoring lancé");