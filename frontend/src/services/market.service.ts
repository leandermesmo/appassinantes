import { api } from "./api";
import { MarketAnalysisResponse } from "../types/market";

export const MarketService = {
  getAnalysis: async (symbol: string, interval: string = "1d") => {
    const { data } = await api.get<{ success: boolean; data: MarketAnalysisResponse }>(
      `market/analysis/${symbol}`,
      { params: { interval, t: Date.now() } }
    );
    return data.data;
  },

  getHistory: async (symbol: string, interval: string = "1d") => {
    const { data } = await api.get<{ success: boolean; data: MarketAnalysisResponse; totalAvailable?: number }>(
      `market/history/${symbol}`,
      { params: { interval } }
    );
    return data;
  },

  getAllSymbols: async () => {
    try {
      const { data } = await api.get<{ symbols: any[] }>("https://api.binance.com/api/v3/exchangeInfo");
      return data.symbols
        .filter(s => s.status === 'TRADING' && s.isSpotTradingAllowed)
        .map(s => s.symbol);
    } catch (error) {
      console.error("Erro ao buscar símbolos:", error);
      return ["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "ADAUSDT"];
    }
  },

  getSystemSymbols: async () => {
    try {
      const { data } = await api.get<{ success: boolean; data: any[] }>("market/symbols");
      return data.data.map(s => s.symbol);
    } catch (error) {
      console.error("Erro ao buscar símbolos do sistema:", error);
      return ["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "ADAUSDT"];
    }
  }

};
