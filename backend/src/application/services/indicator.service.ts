import { EMA, MACD, RSI, SMA, StochasticRSI } from "technicalindicators";

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
  macd?: {
    MACD: number;
    signal: number;
    histogram: number;
  };
  ema20?: number;
  ema50?: number;
  ema200?: number;
  trendRSIe1: "Alta" | "Baixa";
  trendRSIe2: "Alta" | "Baixa";
  trendRsi1: "Alta" | "Baixa";
  trendRsi2: "Alta" | "Baixa";
  trend: "Alta" | "Baixa";
  signal: "Compra" | "Venda" | "Neutro";
}

export interface KlineData {
  time: number[];
  open: number[];
  high: number[];
  low: number[];
  close: number[];
}

export class IndicatorService {
  static calculate(klines: KlineData, rsiPeriod = 14, smaPeriod = 14): IndicatorResult[] {
    const prices = klines.close;
    const times = klines.time;
    const rsiValues = RSI.calculate({ values: prices, period: rsiPeriod });
    const rsiMAValues = SMA.calculate({ values: rsiValues, period: smaPeriod });
    
    const stochRSIValues = StochasticRSI.calculate({
      values: prices,
      rsiPeriod,
      stochasticPeriod: rsiPeriod,
      kPeriod: 3,
      dPeriod: 3,
    });

    const macdValues = MACD.calculate({
      values: prices,
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9,
      SimpleMAOscillator: false,
      SimpleMASignal: false
    });

    const ema20Values = EMA.calculate({ values: prices, period: 20 });
    const ema50Values = EMA.calculate({ values: prices, period: 50 });
    const ema200Values = EMA.calculate({ values: prices, period: 200 });

    const results: IndicatorResult[] = [];
    
    // Alinhando os dados (RSI e StochRSI começam mais tarde que os preços)
    // Precisamos de pelo menos 2 valores para comparar tendências (atual vs anterior)
    // Criar Mapas para busca rápida O(1) dos indicadores calculados
    const rsiMap = new Map(rsiValues.map((v, i) => [times[times.length - rsiValues.length + i], v]));
    const rsiMaMap = new Map(rsiMAValues.map((v, i) => [times[times.length - rsiMAValues.length + i], v]));
    const stochKMap = new Map(stochRSIValues.map((v, i) => [times[times.length - stochRSIValues.length + i], v.k]));
    const stochDMap = new Map(stochRSIValues.map((v, i) => [times[times.length - stochRSIValues.length + i], v.d]));
    const macdMap = new Map(macdValues.map((v, i) => [times[times.length - macdValues.length + i], v]));
    const ema20Map = new Map(ema20Values.map((v, i) => [times[times.length - ema20Values.length + i], v]));
    const ema50Map = new Map(ema50Values.map((v, i) => [times[times.length - ema50Values.length + i], v]));
    const ema200Map = new Map(ema200Values.map((v, i) => [times[times.length - ema200Values.length + i], v]));

    for (let i = 0; i < prices.length; i++) {
      const currentTime = times[i];
      const currentClose = prices[i];
      const currentOpen = klines.open[i];
      const currentHigh = klines.high[i];
      const currentLow = klines.low[i];

      const currentRsi = rsiMap.get(currentTime) || 0;
      const currentRsiMA = rsiMaMap.get(currentTime) || 0;
      const currentStochK = stochKMap.get(currentTime) || 0;
      const currentStochD = stochDMap.get(currentTime) || 0;
      const currentMacd = macdMap.get(currentTime);
      const currentEma20 = ema20Map.get(currentTime);
      const currentEma50 = ema50Map.get(currentTime);
      const currentEma200 = ema200Map.get(currentTime);

      // Pegar valores anteriores para tendências
      const prevTime = i > 0 ? times[i - 1] : currentTime;
      const prevRsiMA = rsiMaMap.get(prevTime) || 0;
      const prevStochD = stochDMap.get(prevTime) || 0;

      // Lógica de tendências
      const trendRSIe1 = (currentStochD > prevStochD && currentStochK > currentStochD) ? "Alta" : "Baixa";
      const trendRSIe2 = (currentStochK > currentStochD) ? "Alta" : "Baixa";
      const trendRsi1 = (currentRsiMA > prevRsiMA && currentRsi > currentRsiMA) ? "Alta" : "Baixa";
      const trendRsi2 = (currentRsiMA > prevRsiMA) ? "Alta" : "Baixa";

      const trend = trendRsi2;
      
      let signal: "Compra" | "Venda" | "Neutro" = "Neutro";
      if (trendRsi1 === "Alta" && trendRSIe1 === "Alta") signal = "Compra";
      else if (trendRsi2 === "Baixa" && trendRSIe2 === "Baixa") signal = "Venda";

      results.push({
        time: currentTime,
        open: currentOpen,
        high: currentHigh,
        low: currentLow,
        close: currentClose,
        rsi: currentRsi,
        rsiMa: currentRsiMA,
        stochK: currentStochK,
        stochD: currentStochD,
        macd: currentMacd ? {
          MACD: currentMacd.MACD ?? 0,
          signal: currentMacd.signal ?? 0,
          histogram: currentMacd.histogram ?? 0,
        } : undefined,
        ema20: currentEma20,
        ema50: currentEma50,
        ema200: currentEma200,
        trendRSIe1,
        trendRSIe2,
        trendRsi1,
        trendRsi2,
        trend,
        signal
      });
    }

    return results;
  }
}
