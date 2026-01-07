import type { NextApiRequest, NextApiResponse } from 'next';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, MOCK_USDC_ADDRESS, ERC20_ABI } from '../../constants';

// Configuration Hardhat Local
const LOCAL_RPC_URL = "http://127.0.0.1:8545";
const ADMIN_PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const provider = new ethers.JsonRpcProvider(LOCAL_RPC_URL);
    const wallet = new ethers.Wallet(ADMIN_PRIVATE_KEY, provider);
    const mockUsdc = new ethers.Contract(MOCK_USDC_ADDRESS, ERC20_ABI, wallet);

    // On envoie 1 Million d'USDC au contrat (depuis le wallet admin qui a minté les tokens au départ)
    // Note: Dans la vraie vie, l'admin doit avoir ces tokens. Sur MockToken, l'admin peut mint à l'infini.
    
    // On appelle la fonction mint du MockToken
    const amount = ethers.parseUnits("1000000", 6);
    console.log(`🏦 Financement du contrat ${CONTRACT_ADDRESS}...`);

    const tx = await mockUsdc.mint(CONTRACT_ADDRESS, amount);
    await tx.wait();

    return res.status(200).json({ 
        success: true, 
        hash: tx.hash,
        message: "Contrat renfloué avec 1,000,000 USDC !"
    });
    
  } catch (error: any) {
    console.error("Erreur Fund Contract:", error);
    return res.status(500).json({ 
        success: false, 
        message: error.message || "Erreur lors du financement" 
    });
  }
}
