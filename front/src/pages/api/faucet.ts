import type { NextApiRequest, NextApiResponse } from 'next';
import { ethers } from 'ethers';

// Configuration Hardhat Local par défaut
const LOCAL_RPC_URL = "http://127.0.0.1:8545";
// Clé privée Account #0 (Le compte riche de Hardhat)
const ADMIN_PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { address } = req.body;

  if (!address || !ethers.isAddress(address)) {
    return res.status(400).json({ message: 'Adresse invalide' });
  }

  try {
    const provider = new ethers.JsonRpcProvider(LOCAL_RPC_URL);
    const wallet = new ethers.Wallet(ADMIN_PRIVATE_KEY, provider);

    console.log(`⛽ Envoi de Gas vers ${address}...`);

    const tx = await wallet.sendTransaction({
      to: address,
      value: ethers.parseEther("10.0") // Envoi de 10 ETH
    });

    await tx.wait();

    return res.status(200).json({ 
        success: true, 
        hash: tx.hash,
        message: "10 ETH envoyés avec succès !"
    });
    
  } catch (error: any) {
    console.error("Erreur Faucet:", error);
    return res.status(500).json({ 
        success: false, 
        message: error.message || "Erreur lors de l'envoi" 
    });
  }
}
