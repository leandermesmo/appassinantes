export interface IndicatorResult {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  rsi: number;
  rsiMa: number;
  stochK: number;
  stochD: number;
  trendRSIe1: "Alta" | "Baixa";
  trendRSIe2: "Alta" | "Baixa";
  trendRsi1: "Alta" | "Baixa";
  trendRsi2: "Alta" | "Baixa";
  trend: "Alta" | "Baixa";
  signal: "Compra" | "Venda" | "Neutro";
}

export interface MarketAnalysisResponse {
  symbol: string;
  interval: string;
  lastUpdate: number;
  indicators: IndicatorResult[];
}
