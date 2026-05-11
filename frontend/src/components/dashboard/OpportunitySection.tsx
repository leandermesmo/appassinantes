import React from "react";
import { Zap, AlertCircle, TrendingUp, Info } from "lucide-react";

interface Opportunity {
  id: string;
  symbol: string;
  type: "long" | "short";
  reason: string;
  strength: "alta" | "media";
}

const OPPORTUNITIES: Opportunity[] = [
  { id: "1", symbol: "BTC/USDT", type: "long", reason: "RSI e StochRSI em zona de sobrevenda no 1H", strength: "alta" },
  { id: "2", symbol: "SOL/USDT", type: "short", reason: "Divergência de baixa no RSI diário", strength: "media" },
];

export const OpportunitySection: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Zap className="text-yellow-500" size={18} fill="currentColor" />
          Oportunidades de Elite
        </h2>
        <span className="text-[10px] text-text-muted flex items-center gap-1">
          <Info size={12} />
            IA-Powered Insights
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {OPPORTUNITIES.map((opp) => (
          <div key={opp.id} className="glass-panel p-5 relative overflow-hidden group hover:border-primary/30 transition-all cursor-pointer">
            <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 opacity-5 transition-transform group-hover:scale-110 ${opp.type === 'long' ? 'text-success' : 'text-danger'}`}>
              <Zap size={96} fill="currentColor" />
            </div>
            
            <div className="flex justify-between items-start mb-3 relative z-10">
              <span className="font-bold text-lg">{opp.symbol}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${
                opp.type === 'long' ? 'bg-success-bg text-success' : 'bg-danger-bg text-danger'
              }`}>
                {opp.type === 'long' ? 'Compra (Long)' : 'Venda (Short)'}
              </span>
            </div>
            
            <p className="text-sm text-text-muted mb-4 line-clamp-2 relative z-10">{opp.reason}</p>
            
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2 text-[10px] font-semibold text-text-muted uppercase">
                <span>Confiança:</span>
                <div className="flex gap-0.5">
                  <div className={`w-3 h-1 rounded-full ${opp.strength === 'alta' || opp.strength === 'media' ? 'bg-primary' : 'bg-border'}`} />
                  <div className={`w-3 h-1 rounded-full ${opp.strength === 'alta' ? 'bg-primary' : 'bg-border'}`} />
                  <div className={`w-3 h-1 rounded-full ${opp.strength === 'alta' ? 'bg-primary' : 'bg-border'}`} />
                </div>
              </div>
              
              <button className="text-xs font-bold text-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Analisar Agora
                <TrendingUp size={14} />
              </button>
            </div>
          </div>
        ))}

        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center">
          <p className="text-xs text-primary font-medium mb-2">Novas oportunidades em breve!</p>
          <div className="flex justify-center gap-1">
             <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
             <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
             <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
          </div>
        </div>
      </div>
    </div>
  );
};
