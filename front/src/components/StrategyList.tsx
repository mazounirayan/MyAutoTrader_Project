"use client";

import { useReadContract, useAccount } from "wagmi";
import { CONTRACT_ADDRESS, TRADER_ABI } from "../constants";
import { StrategyCard } from "./StrategyCard";

export function StrategyList() {
  const { address } = useAccount();
  const { data: strategyIds, error, isError, isLoading } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: TRADER_ABI,
    functionName: "getMyStrategies",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 5000 },
  }) as { data: bigint[] | undefined; error: any; isError: boolean; isLoading: boolean };

  // 🔍 LOGS DÉTAILLÉS
  console.log("🔍 DEBUG StrategyList:");
  console.log("- Address:", address);
  console.log("- Strategy IDs:", strategyIds);
  console.log("- Is Loading:", isLoading);
  console.log("- Is Error:", isError);
  console.log("- Error:", error);
  console.log("- Contract Address:", CONTRACT_ADDRESS);
 if (isLoading) {
    return (
      <div className="bg-[#131426] p-6 rounded-xl border border-white/5">
        <h2 className="font-bold text-xl mb-4">📊 Mes Stratégies</h2>
        <p className="text-gray-400 text-center py-8">Chargement...</p>
      </div>
    );
  }
   if (isError) {
    return (
      <div className="bg-[#131426] p-6 rounded-xl border border-white/5">
        <h2 className="font-bold text-xl mb-4">📊 Mes Stratégies</h2>
        <p className="text-red-400 text-center py-8">
          ❌ Erreur: {error?.message || "Impossible de charger les stratégies"}
        </p>
        <p className="text-xs text-gray-600 text-center mt-2">
          Contrat: {CONTRACT_ADDRESS}
        </p>
      </div>
    );
  }
  if (!strategyIds || strategyIds.length === 0) {
    return (
      <div className="bg-[#131426] p-6 rounded-xl border border-white/5">
        <h2 className="font-bold text-xl mb-4">📊 Mes Stratégies</h2>
        <p className="text-gray-400 text-center py-8">
          Aucune stratégie créée. Commence par en créer une ! 🚀
        </p>
     
        <p className="text-xs text-gray-600 text-center">
          Debug: address={address ? "✅" : "❌"} | ids={strategyIds?.toString() || "undefined"}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#131426] p-6 rounded-xl border border-white/5">
      <h2 className="font-bold text-xl mb-4">
        📊 Mes Stratégies ({strategyIds.length})
      </h2>
      <div className="space-y-4">
        {strategyIds.map((id) => (
          <StrategyCard key={id.toString()} tokenId={id} />
        ))}
      </div>
    </div>
  );
}
