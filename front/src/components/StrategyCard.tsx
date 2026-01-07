import { useReadContract, useWriteContract, useAccount } from "wagmi";
import { CONTRACT_ADDRESS, TRADER_ABI, MOCK_USDC_ADDRESS, ERC20_ABI } from "../constants";

interface Strategy {
  id: bigint; amountDeposited: bigint; buyPrice: bigint; sellPrice: bigint; stopLossPrice: bigint; isInvested: boolean; isActive: boolean;
}

export function StrategyCard({ tokenId }: { tokenId: bigint }) {
  const { data: strategy } = useReadContract({
    address: CONTRACT_ADDRESS, abi: TRADER_ABI, functionName: "getStrategy", args: [tokenId], query: { refetchInterval: 2000 },
  }) as { data: Strategy | undefined };
  
  const { writeContractAsync } = useWriteContract();
  const { address } = useAccount();
  
  const { data: currentPrice } = useReadContract({
    address: CONTRACT_ADDRESS, abi: TRADER_ABI, functionName: "getLatestPrice", query: { refetchInterval: 2000 },
  });

  if (!strategy || !currentPrice) return <div className="animate-pulse h-40 bg-[#1a1b35] rounded-xl border border-white/5"></div>;

  const buy = Number(strategy.buyPrice) / 1e8;
  const sell = Number(strategy.sellPrice) / 1e8;
  const current = Number(currentPrice) / 1e8;
  const amount = Number(strategy.amountDeposited) / 1e6;

  const isProfit = strategy.isInvested && current > buy;
  const pnlPercent = strategy.isInvested ? ((current - buy) / buy) * 100 : 0;
  const pnlAmount = strategy.isInvested ? (amount * pnlPercent) / 100 : 0;

  const progressPercent = strategy.isInvested 
    ? Math.min(100, Math.max(0, ((current - buy) / (sell - buy)) * 100))
    : 0;

  // ACTIONS
  const handleDeactivate = async () => {
    try { await writeContractAsync({ address: CONTRACT_ADDRESS, abi: TRADER_ABI, functionName: "deactivateStrategy", args: [tokenId] }); alert("✅ Stratégie désactivée !"); } 
    catch (e) { console.error(e); alert("Erreur"); }
  };

  const handleWithdraw = async () => {
    try { await writeContractAsync({ address: CONTRACT_ADDRESS, abi: TRADER_ABI, functionName: "withdraw", args: [tokenId] }); alert("✅ Fonds retirés !"); } 
    catch (e) { console.error(e); alert("Erreur"); }
  };

  const handleCopy = async () => {
    const amountToCopy = prompt("Montant à investir (USDC) :");
    if (!amountToCopy) return;
    try {
      const amountWei = BigInt(amountToCopy) * 10n ** 6n;
      await writeContractAsync({ address: MOCK_USDC_ADDRESS, abi: ERC20_ABI, functionName: "approve", args: [CONTRACT_ADDRESS, amountWei] });
      await writeContractAsync({ address: CONTRACT_ADDRESS, abi: TRADER_ABI, functionName: "copyStrategy", args: [tokenId, amountWei] });
      alert("✅ Stratégie copiée !");
    } catch (e) { console.error(e); alert("Erreur"); }
  };

  return (
    <div className={`p-6 rounded-2xl border transition-all duration-300 hover:shadow-2xl hover:scale-[1.01] ${strategy.isActive ? 'bg-[#1a1b35] border-white/10 hover:border-blue-500/30' : 'bg-[#0f1020] border-gray-800 opacity-60 grayscale'}`}>
      
      {/* Header */}
      <div className="flex justify-between items-start mb-5">
        <div className="flex items-center gap-3">
            <span className="bg-black/30 px-3 py-1 rounded-lg text-xs text-gray-400 font-mono border border-white/5">#{tokenId.toString()}</span>
            {strategy.isActive ? (
                strategy.isInvested ? 
                <span className="bg-green-900/30 text-green-400 px-3 py-1 rounded-lg text-xs font-bold border border-green-500/20 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>OPEN (ETH)
                </span> : 
                <span className="bg-yellow-900/30 text-yellow-400 px-3 py-1 rounded-lg text-xs font-bold border border-yellow-500/20 flex items-center gap-2">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>WAITING (USDC)
                </span>
            ) : (
                <span className="bg-gray-800 text-gray-400 px-3 py-1 rounded-lg text-xs font-bold border border-gray-600">CLOSED</span>
            )}
        </div>
        <div className="text-right">
            <span className="text-[10px] text-gray-500 uppercase tracking-wide">Investissement</span>
            <p className="font-bold text-white font-mono">{amount.toFixed(2)} USDC</p>
            {strategy.isInvested && (
                <p className={`text-xs font-bold ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                    {isProfit ? '+' : ''}{pnlAmount.toFixed(2)} USDC ({pnlPercent.toFixed(1)}%)
                </p>
            )}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <PriceBox label="Cible Achat" value={buy} color="text-green-400" border="border-green-500/20" />
        <PriceBox label="Cible Vente" value={sell} color="text-blue-400" border="border-blue-500/20" />
        <PriceBox label="Prix Actuel" value={current} color={isProfit ? 'text-green-300' : 'text-white'} border="border-white/10" highlight />
      </div>

      {/* Progress */}
      {strategy.isActive && strategy.isInvested && (
          <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden relative mb-4">
            <div className={`h-full absolute left-0 top-0 rounded-full shadow-lg ${isProfit ? 'bg-green-500 shadow-green-500/50' : 'bg-red-500 shadow-red-500/50'}`} 
                 style={{ width: `${progressPercent}%`, transition: 'width 1s ease-in-out' }}></div>
          </div>
      )}
      {strategy.isActive && !strategy.isInvested && (
          <div className="text-xs text-center text-gray-500 mb-4 font-mono">
            En attente : Prix ({current}) doit descendre sous ({buy})...
          </div>
      )}

      {/* Buttons */}
      <div className="flex gap-3">
        {strategy.isActive ? (
          <>
            <button onClick={handleDeactivate} className="flex-1 py-2.5 bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white rounded-xl text-xs font-bold transition-all uppercase tracking-wide">
              🛑 Stop
            </button>
            <button onClick={handleCopy} className="flex-1 py-2.5 bg-purple-500/10 text-purple-400 border border-purple-500/30 hover:bg-purple-500 hover:text-white rounded-xl text-xs font-bold transition-all uppercase tracking-wide">
              📋 Copier
            </button>
          </>
        ) : (
          <button onClick={handleWithdraw} disabled={strategy.amountDeposited === BigInt(0)} className="flex-1 py-2.5 bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500 hover:text-white rounded-xl text-xs font-bold transition-all uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed">
            💰 Retirer les fonds
          </button>
        )}
      </div>
    </div>
  );
}

function PriceBox({ label, value, color, border, highlight }: any) {
    return (
        <div className={`bg-black/20 p-3 rounded-xl text-center border ${border} ${highlight ? 'bg-white/5' : ''}`}>
            <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">{label}</p>
            <p className={`font-mono font-bold text-sm ${color}`}>${value.toLocaleString()}</p>
        </div>
    );
}