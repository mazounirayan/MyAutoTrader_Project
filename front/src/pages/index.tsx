"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount
} from "wagmi";
import { useState, useEffect } from "react";
import {
  CONTRACT_ADDRESS,
  MOCK_USDC_ADDRESS,
  MOCK_ORACLE_ADDRESS,
  TRADER_ABI,
  ERC20_ABI,
  ORACLE_ABI,
  OWNER_OR_EXECUTOR_ADDRESS
} from "../constants";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { StrategyList } from "../components/StrategyList";

/* ================== CONSTANTES ================== */
const USDC_DECIMALS = 6n;
const ORACLE_DECIMALS = 8n;

export default function Home() {
  const { address } = useAccount();
  const isExecutor = address?.toLowerCase() === OWNER_OR_EXECUTOR_ADDRESS.toLowerCase();
  console.log("Wallet connecté :", address, "| Executor :", isExecutor);
  const [isClient, setIsClient] = useState(false);

  // --- FORM ---
  const [buyPrice, setBuyPrice] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [amount, setAmount] = useState("100");

  // --- ADMIN ---
  const [newPrice, setNewPrice] = useState("");
  const [strategyToExec, setStrategyToExec] = useState("");

  // --- UI ---
  const [step, setStep] = useState("IDLE");
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const [priceHistory, setPriceHistory] = useState<
    { time: string; price: number }[]
  >([]);

  useEffect(() => setIsClient(true), []);

  /* ================== READ ================== */
  const { data: ethPrice } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: TRADER_ABI,
    functionName: "getLatestPrice",
    query: { refetchInterval: 2000 }
  });

  const { data: usdcBalance, refetch: refetchBalance } = useReadContract({
    address: MOCK_USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 5000 }
  });

  const currentPrice =
    ethPrice ? Number(ethPrice) / 10 ** Number(ORACLE_DECIMALS) : 0;

  useEffect(() => {
    // Chargement initial depuis le localStorage
    const saved = localStorage.getItem("priceHistory");
    if (saved) {
      try {
        setPriceHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Erreur lecture historique", e);
      }
    }
  }, []);

  useEffect(() => {
    if (currentPrice > 0) {
      setPriceHistory((prev) => {
        const newPoint = {
          time: new Date().toLocaleTimeString("fr-FR"),
          price: currentPrice
        };
        // On garde les 50 derniers points pour ne pas surcharger
        const newHistory = [...prev.slice(-49), newPoint];
        localStorage.setItem("priceHistory", JSON.stringify(newHistory));
        return newHistory;
      });
    }
  }, [currentPrice]);

  /* ================== WRITE ================== */
  const { writeContractAsync } = useWriteContract();

  // Faucet USDC 
  const handleMint = async () => {
    try {
      setStep("MINTING");
      await writeContractAsync({
        address: MOCK_USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: "mint",
        args: [address, 1000n * (10n ** USDC_DECIMALS)]
      });
      refetchBalance();
      alert(" 1000 USDC reçus ");
    } finally {
      setStep("IDLE");
    }
  };

  // Create strategy
  const handleCreate = async () => {
    if (!buyPrice || !sellPrice || !amount) return;

    try {
      const amountWei = BigInt(amount) * (10n ** USDC_DECIMALS);

      setStep("APPROVING");
      await writeContractAsync({
        address: MOCK_USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [CONTRACT_ADDRESS, amountWei]
      });
        if (stopLoss && Number(stopLoss) >= Number(buyPrice)) {
        alert("Stop loss invalide");
        return;
        }
      setStep("CREATING");
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: TRADER_ABI,
        functionName: "createStrategy",
        args: [
          BigInt(buyPrice) * (10n ** ORACLE_DECIMALS),
          BigInt(sellPrice) * (10n ** ORACLE_DECIMALS),
          BigInt(stopLoss || "0") * (10n ** ORACLE_DECIMALS),
          amountWei
        ]
      });

      setTxHash(hash);
    } catch (e) {
      console.error(e);
      setStep("IDLE");
    }
  };

  // Oracle update (simulation)
  const handleUpdatePrice = async () => {
    try {

        await writeContractAsync({
        address: MOCK_ORACLE_ADDRESS,
        abi: ORACLE_ABI,
        functionName: "updateAnswer",
        args: [BigInt(newPrice) * (10n ** ORACLE_DECIMALS)]
        });

        alert("Oracle mis à jour (simulation)");
    }catch (e) {
        console.error(e);
        alert("Revert oracle");
    }
  };

  // Execute strategy
  const handleExecute = async () => {
    if (!strategyToExec) return;

    await writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: TRADER_ABI,
      functionName: "executeStrategy",
      args: [BigInt(strategyToExec)]
    });

    alert("Stratégie exécutée");
  };

  const { isSuccess, data: receipt } = useWaitForTransactionReceipt({
    hash: txHash ?? undefined
  });

  useEffect(() => {
    if (isSuccess && receipt) {
      setStep("IDLE");
      setTxHash(null);
      refetchBalance();

      try {
         const log = receipt.logs.find(l => l.address.toLowerCase() === CONTRACT_ADDRESS.toLowerCase());
         if(log) {
             const id = parseInt(log.topics[1] as string, 16); // Le topic 1 est l'index tokenId
             alert(`✅ Stratégie #${id} créée avec succès !`);
         } else {
             alert("✅ Stratégie créée (ID introuvable)");
         }
      } catch(e) {
          alert("✅ Stratégie créée");
      }
    }
  }, [isSuccess, receipt]);

  if (!isClient) return null;

  /* ================== UI ================== */
  return (
    <main className="min-h-screen p-6 bg-[#0a0b1e] text-white font-sans">
      <div className="mb-4 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-400 text-sm">
        ⚠️ Projet académique – trading simulé on-chain – aucun ordre réel
      </div>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">MyAutoTrader (Simulation)</h1>
        <ConnectButton showBalance={false} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT */}
        <div className="space-y-4">
          <div className="p-4 bg-blue-600/10 border border-blue-500/30 rounded-xl">
            <p className="text-xs text-blue-400 uppercase font-bold mb-1">Mon Portefeuille</p>
            <p className="text-2xl font-mono font-bold text-white">
              {usdcBalance ? (Number(usdcBalance) / 10**6).toLocaleString() : "0"} <span className="text-sm">USDC</span>
            </p>
          </div>

          <div className="flex gap-2">
             <button
              onClick={async () => {
                  if(!address) return alert("Connectez votre wallet d'abord !");
                  setStep("GAS");
                  try {
                      const res = await fetch('/api/faucet', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ address })
                      });
                      const data = await res.json();
                      if(data.success) alert(data.message);
                      else alert("Erreur: " + data.message);
                  } catch(e) { console.error(e); alert("Erreur appel API"); }
                  setStep("IDLE");
              }}
              className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 rounded-xl text-white font-bold transition-all text-sm"
            >
              ⛽ Gas (ETH)
            </button>
            <button
                onClick={handleMint}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl text-white font-bold transition-all text-sm"
            >
                🚰 Faucet USDC
            </button>
          </div>

          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Capital USDC"
            className="w-full p-2 rounded-lg bg-[#131426] border border-white/10 text-white"
          />
          <input
            value={buyPrice}
            onChange={(e) => setBuyPrice(e.target.value)}
            placeholder="Buy price $"
            className="w-full p-2 rounded-lg bg-[#131426] border border-green-500/30 text-green-400"
          />
          <input
            value={sellPrice}
            onChange={(e) => setSellPrice(e.target.value)}
            placeholder="Sell price $"
            className="w-full p-2 rounded-lg bg-[#131426] border border-blue-500/30 text-blue-400"
          />
          <input
            value={stopLoss}
            onChange={(e) => setStopLoss(e.target.value)}
            placeholder="Stop loss $"
            className="w-full p-2 rounded-lg bg-[#131426] border border-red-500/30 text-red-400"
          />

          <button
            disabled={step !== "IDLE"}
            onClick={handleCreate}
            className={`w-full py-2.5 rounded-xl font-bold text-white transition-all ${
              step === "IDLE" ? "bg-purple-600 hover:bg-purple-700" : "bg-gray-700 cursor-not-allowed"
            }`}
          >
            {step === "IDLE" ? "Créer stratégie" : step}
          </button>

          <p className="text-xs text-gray-400 mt-2">
            Prix oracle Chainlink – 8 décimales / USDC – 6 décimales
          </p>
        </div>

        <div className="lg:col-span-2 bg-[#131426] p-4 rounded-xl">
          <p className="text-xl mb-2 font-mono">${currentPrice.toFixed(2)}</p>

          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={priceHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="price" stroke="#3b82f6" dot={false} />
            </LineChart>
          </ResponsiveContainer>

          <div className="mt-4 p-3 border border-white/10 rounded-lg space-y-2">
            <p className="text-sm text-gray-400 mb-2">🧪 Mode simulation (Oracle Mock)</p>

            <input
              placeholder="Nouveau prix oracle"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              className="w-full p-2 rounded-lg bg-[#0f1020] border border-white/10 text-white"
            />
            
            {/* BOUTON SET ORACLE : J'ai enlevé "disabled" */}
            <button
              onClick={handleUpdatePrice}
              className="w-full py-2 rounded-xl bg-purple-500/20 text-purple-400 hover:bg-purple-500 hover:text-white transition-all font-bold"
            >
              SET ORACLE
            </button>

            <input
              placeholder="Strategy ID"
              value={strategyToExec}
              onChange={(e) => setStrategyToExec(e.target.value)}
              className="w-full p-2 rounded-lg bg-[#0f1020] border border-white/10 text-white"
            />
            
            {/* BOUTON EXECUTE : J'ai enlevé "disabled" */}
            <button
              onClick={handleExecute}
              className="w-full py-2 rounded-xl bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white transition-all font-bold"
            >
              EXECUTE
            </button>
            
            <div className="pt-4 mt-4 border-t border-white/10">
                <button
                onClick={async () => {
                    try {
                        const res = await fetch('/api/fund', { method: 'POST' });
                        const data = await res.json();
                        alert(data.message);
                    } catch(e) { console.error(e); alert("Erreur API"); }
                }}
                className="w-full py-2 rounded-xl bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500 hover:text-black transition-all font-bold text-xs uppercase"
                >
                🏦 Renflouer Contrat (Admin)
                </button>
                <p className="text-[10px] text-gray-500 text-center mt-1">À utiliser si le retrait échoue (manque de liquidité)</p>
            </div>
          </div>
        </div>
      </div>

      <StrategyList />
    </main>
  );
}
