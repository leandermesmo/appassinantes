import { RSI, StochasticRSI } from "technicalindicators";
import { SignalType } from "@prisma/client";

interface IndicatorResult {
  code: string;
  value: number;
  signal: SignalType;
}

export class TechnicalAnalysisEngine {
  /**
   * Calcula todos os indicadores configurados para uma lista de preços de fechamento.
   */
  static calculateSignals(closes: number[]): IndicatorResult[] {
    const results: IndicatorResult[] = [];

    // 1. RSI (14)
    const rsiArray = RSI.calculate({ values: closes, period: 14 });
    const latestRsi = rsiArray[rsiArray.length - 1];
    
    if (latestRsi !== undefined) {
      results.push({
        code: "rsi_14",
        value: latestRsi,
        signal: this.getRsiSignal(latestRsi),
      });
    }

    // 2. StochRSI (14, 14, 3, 3)
    const stochRsiArray = StochasticRSI.calculate({
      values: closes,
      rsiPeriod: 14,
      stochasticPeriod: 14,
      kPeriod: 3,
      dPeriod: 3,
    });
    const latestStoch = stochRsiArray[stochRsiArray.length - 1];

    if (latestStoch !== undefined) {
      // Usamos a média de K e D para o sinal simplificado ou apenas K
      results.push({
        code: "stochrsi_14",
        value: latestStoch.k, // Salvamos o K como valor principal
        signal: this.getStochSignal(latestStoch.k, latestStoch.d),
      });
    }

    return results;
  }

  private static getRsiSignal(value: number): SignalType {
    if (value >= 70) return SignalType.SELL;
    if (value >= 60) return SignalType.NEUTRAL; // Viés de baixa se aproximando de sobrecompra
    if (value <= 30) return SignalType.BUY;
    if (value <= 40) return SignalType.NEUTRAL; // Viés de alta se aproximando de sobrevenda
    return SignalType.NEUTRAL;
  }

  private static getStochSignal(k: number, d: number): SignalType {
    // Escala 0-100 (algumas libs retornam 0-1)
    const kVal = k > 1 ? k : k * 100;
    const dVal = d > 1 ? d : d * 100;

    if (kVal >= 80 && dVal >= 80) return SignalType.STRONG_SELL;
    if (kVal <= 20 && dVal <= 20) return SignalType.STRONG_BUY;
    
    // Cruzamento de linhas
    if (kVal > dVal && kVal < 30) return SignalType.BUY;
    if (kVal < dVal && kVal > 70) return SignalType.SELL;

    return SignalType.NEUTRAL;
  }
}
