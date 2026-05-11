import React from "react";
import { formatPrice, formatPercent } from "@/lib/formatters";
import { IndicatorBadge } from "./IndicatorBadge";
import { ChevronRight, Search } from "lucide-react";

interface CryptoAsset {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  rsi: number;
  stochRsi: number;
  signal: "strong_buy" | "buy" | "neutral" | "sell" | "strong_sell";
}

const MOCK_DATA: CryptoAsset[] = [
  { symbol: "BTC", name: "Bitcoin", price: 64230.50, change24h: 2.4, rsi: 45, stochRsi: 12, signal: "buy" },
  { symbol: "ETH", name: "Ethereum", price: 3450.12, change24h: -1.2, rsi: 58, stochRsi: 85, signal: "neutral" },
  { symbol: "SOL", name: "Solana", price: 145.80, change24h: 5.7, rsi: 72, stochRsi: 92, signal: "strong_sell" },
  { symbol: "BNB", name: "Binance Coin", price: 580.40, change24h: 0.8, rsi: 35, stochRsi: 5, signal: "strong_buy" },
  { symbol: "ADA", name: "Cardano", price: 0.45, change24h: -3.1, rsi: 28, stochRsi: 10, signal: "buy" },
  { symbol: "OPBTC", name: "Optimism", price: 0.00000160, change24h: 1.5, rsi: 42, stochRsi: 30, signal: "neutral" },
];

export const MarketTable: React.FC = () => {
  return (
    <div className="glass-panel overflow-hidden">
      <div className="p-6 border-b border-border flex justify-between items-center">
        <h2 className="text-xl font-bold">Visão Geral do Mercado</h2>
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={16} />
          <input 
            type="text" 
            placeholder="Filtrar ativos..." 
            className="bg-background/50 border border-border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary transition-all w-64"
          />
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-background/30 text-text-muted text-[10px] uppercase tracking-widest">
              <th className="px-6 py-4 font-semibold">Ativo</th>
              <th className="px-6 py-4 font-semibold">Preço</th>
              <th className="px-6 py-4 font-semibold">24h %</th>
              <th className="px-6 py-4 font-semibold">RSI (14)</th>
              <th className="px-6 py-4 font-semibold">StochRSI</th>
              <th className="px-6 py-4 font-semibold">Sinal Técnico</th>
              <th className="px-6 py-4 font-semibold text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {MOCK_DATA.map((asset) => (
              <tr key={asset.symbol} className="hover:bg-surface-hover/40 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3 font-bold text-primary text-xs">
                      {asset.symbol[0]}
                    </div>
                    <div>
                      <div className="font-bold text-sm">{asset.symbol}</div>
                      <div className="text-[10px] text-text-muted">{asset.name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 font-mono text-sm">${formatPrice(asset.price)}</td>
                <td className={`px-6 py-4 text-sm font-medium ${asset.change24h > 0 ? 'text-success' : 'text-danger'}`}>
                  {formatPercent(asset.change24h)}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-border rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${asset.rsi > 70 ? 'bg-danger' : asset.rsi < 30 ? 'bg-success' : 'bg-primary'}`} 
                        style={{ width: `${asset.rsi}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono">{asset.rsi}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-border rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${asset.stochRsi > 80 ? 'bg-danger' : asset.stochRsi < 20 ? 'bg-success' : 'bg-primary'}`} 
                        style={{ width: `${asset.stochRsi}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono">{asset.stochRsi}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <IndicatorBadge type={asset.signal} />
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="p-2 hover:bg-primary/10 rounded-lg text-text-muted hover:text-primary transition-all">
                    <ChevronRight size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="p-4 bg-background/20 border-t border-border flex justify-center">
        <button className="text-xs font-semibold text-primary hover:underline transition-all">
          Ver todos os ativos de mercado
        </button>
      </div>
    </div>
  );
};
