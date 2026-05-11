"use client";

import { Bitcoin, Clock, Save, TrendingUp } from "lucide-react";
import { useState } from "react";

export function MarketPreferences() {
  const [favorites, setFavorites] = useState(["BTC", "ETH", "SOL"]);
  const [timeframes, setTimeframes] = useState(["1h", "4h", "1d"]);

  const coins = ["BTC", "ETH", "SOL", "BNB", "XRP", "ADA", "DOT", "LINK", "MATIC"];
  const intervals = ["15m", "1h", "4h", "1d", "1w"];

  const toggleFavorite = (coin: string) => {
    setFavorites(prev => 
      prev.includes(coin) ? prev.filter(c => c !== coin) : [...prev, coin]
    );
  };

  const toggleTimeframe = (tf: string) => {
    setTimeframes(prev => 
      prev.includes(tf) ? prev.filter(t => t !== tf) : [...prev, tf]
    );
  };

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm h-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-orange-500/10 rounded-lg">
          <TrendingUp className="w-5 h-5 text-orange-400" />
        </div>
        <h3 className="text-lg font-semibold text-white">Preferências de Mercado</h3>
      </div>

      <div className="space-y-8">
        {/* Favoritos */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
            <Bitcoin className="w-4 h-4" /> Criptomoedas Favoritas
          </label>
          <div className="flex flex-wrap gap-2">
            {coins.map((coin) => (
              <button
                key={coin}
                onClick={() => toggleFavorite(coin)}
                className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                  favorites.includes(coin)
                    ? "bg-orange-500/20 border-orange-500/50 text-orange-400"
                    : "bg-zinc-800/50 border-zinc-700 text-zinc-500 hover:border-zinc-600"
                }`}
              >
                {coin}
              </button>
            ))}
          </div>
        </div>

        {/* Timeframes */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
            <Clock className="w-4 h-4" /> Timeframes Preferidos
          </label>
          <div className="flex flex-wrap gap-2">
            {intervals.map((tf) => (
              <button
                key={tf}
                onClick={() => toggleTimeframe(tf)}
                className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                  timeframes.includes(tf)
                    ? "bg-blue-500/20 border-blue-500/50 text-blue-400"
                    : "bg-zinc-800/50 border-zinc-700 text-zinc-500 hover:border-zinc-600"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        <button className="w-full bg-orange-600 hover:bg-orange-500 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 group shadow-lg shadow-orange-900/20 mt-4">
          <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />
          Salvar preferências
        </button>
      </div>
    </div>
  );
}
