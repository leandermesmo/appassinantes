import { MACD, EMA } from 'technicalindicators';
import { CandleRepository } from '../infrastructure/repositories/candle.repository';
import { IndicatorRepository, IndicatorRow } from '../infrastructure/repositories/indicator.repository';
import { createLogger } from './logger';

const log = createLogger('Indicators');

/**
 * Parâmetros dos indicadores técnicos.
 * Centralizados para facilitar ajustes futuros.
 */
const INDICATOR_CONFIG = {
  RSI_PERIOD: 14,
  STOCH_RSI_PERIOD: 14,
  STOCH_K_PERIOD: 3,
  STOCH_D_PERIOD: 3,
  RSI_MA_PERIOD: 14,
  MACD_FAST: 12,
  MACD_SLOW: 26,
  MACD_SIGNAL: 9,
  EMA1_PERIOD: 24,
  EMA2_PERIOD: 168,
  /**
   * Janela de candles usada para cálculo preciso dos indicadores.
   * Deve ser 1000 para corresponder à janela padrão da Binance API
   * e garantir convergência total dos indicadores (RSI, StochRSI, etc).
   */
  CALCULATION_WINDOW: 1000,
} as const;

/**
 * Estrutura intermediária para valores com timestamp.
 * Usada para alinhar indicadores por open_time.
 */
interface TimedValue {
  time: number;
  value: number;
}

/**
 * Serviço de Cálculo de Indicadores Técnicos.
 *
 * Implementa RSI (Wilder's Smoothing), StochRSI (Stochastic sobre RSI + SMA),
 * RSI MA (SMA), MACD e EMAs.
 *
 * A lógica de RSI, StochRSI e RSI MA segue a implementação validada
 * manualmente, garantindo precisão nos valores calculados.
 *
 * REGRA CRÍTICA: nunca calcula apenas o último candle.
 * Sempre recalcula uma janela completa para precisão.
 */
export class IndicatorService {
  /**
   * Calcula e persiste indicadores para um par symbol+timeframe.
   *
   * Fluxo:
   * 1. Busca últimos N candles consolidados do banco (janela)
   * 2. Calcula todos os indicadores técnicos
   * 3. Monta registros alinhados por open_time
   * 4. Persiste via bulk upsert
   */
  static async calculateAndPersist(symbol: string, timeframe: string): Promise<number> {
    const startTime = performance.now();

    // 1. Busca a janela de candles consolidados
    const candles = await CandleRepository.getCandlesForIndicators(
      symbol,
      timeframe,
      INDICATOR_CONFIG.CALCULATION_WINDOW
    );

    if (candles.length < INDICATOR_CONFIG.RSI_PERIOD + 1) {
      log.warn(`Candles insuficientes para cálculo (${candles.length}/${INDICATOR_CONFIG.RSI_PERIOD + 1})`, {
        symbol,
        timeframe,
      });
      return 0;
    }

    // Prepara dados com timestamp para alinhamento preciso
    const klines = candles.map((c) => ({
      time: c.open_time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
      volume: c.volume,
    }));

    const closes = candles.map((c) => c.close);
    const openTimes = candles.map((c) => c.open_time);

    // 2. Calcula indicadores com lógica validada

    // RSI — Wilder's Smoothing (implementação manual precisa)
    const rsiTimedValues = this.calculateRSI(klines, INDICATOR_CONFIG.RSI_PERIOD);

    // StochRSI — Stochastic aplicado sobre RSI + SMA para K e D
    const stochRsi = this.calculateStochRSI(
      rsiTimedValues,
      INDICATOR_CONFIG.STOCH_RSI_PERIOD,
      INDICATOR_CONFIG.STOCH_K_PERIOD,
      INDICATOR_CONFIG.STOCH_D_PERIOD
    );

    // RSI MA — SMA do RSI (não EMA, conforme lógica validada)
    const rsiMaValues = this.calculateSMA(rsiTimedValues, INDICATOR_CONFIG.RSI_MA_PERIOD);

    // MACD e EMAs — mantidos via lib (não existem no HTML, já validados)
    const macdValues = MACD.calculate({
      values: closes,
      fastPeriod: INDICATOR_CONFIG.MACD_FAST,
      slowPeriod: INDICATOR_CONFIG.MACD_SLOW,
      signalPeriod: INDICATOR_CONFIG.MACD_SIGNAL,
      SimpleMAOscillator: false,
      SimpleMASignal: false,
    });

    const ema1Values = EMA.calculate({ values: closes, period: INDICATOR_CONFIG.EMA1_PERIOD });
    const ema2Values = EMA.calculate({ values: closes, period: INDICATOR_CONFIG.EMA2_PERIOD });

    // 3. Cria Maps para lookup rápido por open_time
    const rsiMap = new Map(rsiTimedValues.map((v) => [v.time, v.value]));
    const rsiMaMap = new Map(rsiMaValues.map((v) => [v.time, v.value]));
    const stochKMap = new Map(stochRsi.k.map((v) => [v.time, v.value]));
    const stochDMap = new Map(stochRsi.d.map((v) => [v.time, v.value]));

    // MACD e EMAs usam offset por posição (lib retorna arrays posicionais)
    const macdOffset = closes.length - macdValues.length;
    const ema1Offset = closes.length - ema1Values.length;
    const ema2Offset = closes.length - ema2Values.length;

    // Monta registros apenas para os últimos 100 candles
    const totalCandles = closes.length;
    const processStart = Math.max(0, totalCandles - 100);
    const results: IndicatorRow[] = [];

    for (let i = processStart; i < totalCandles; i++) {
      const t = openTimes[i];
      const macdIdx = i - macdOffset;
      const ema1Idx = i - ema1Offset;
      const ema2Idx = i - ema2Offset;

      const row: IndicatorRow = {
        symbol,
        timeframe,
        open_time: t,
        rsi: rsiMap.has(t) ? this.round(rsiMap.get(t)!, 5) : null,
        rsi_k: stochKMap.has(t) ? this.round(stochKMap.get(t)!, 5) : null,
        rsi_d: stochDMap.has(t) ? this.round(stochDMap.get(t)!, 5) : null,
        rsi_ma: rsiMaMap.has(t) ? this.round(rsiMaMap.get(t)!, 5) : null,
        macd: macdIdx >= 0 && macdIdx < macdValues.length && macdValues[macdIdx].MACD !== undefined
          ? this.round(macdValues[macdIdx].MACD!, 8) : null,
        macd_signal: macdIdx >= 0 && macdIdx < macdValues.length && macdValues[macdIdx].signal !== undefined
          ? this.round(macdValues[macdIdx].signal!, 8) : null,
        ema1: ema1Idx >= 0 && ema1Idx < ema1Values.length
          ? this.round(ema1Values[ema1Idx], 8) : null,
        ema2: ema2Idx >= 0 && ema2Idx < ema2Values.length
          ? this.round(ema2Values[ema2Idx], 8) : null,
      };

      results.push(row);
    }

    if (results.length === 0) {
      log.warn('Nenhum indicador calculado', { symbol, timeframe });
      return 0;
    }

    // 4. Persiste
    const affected = await IndicatorRepository.bulkUpsert(results);
    const duration = Math.round(performance.now() - startTime);

    log.debug(`Indicadores calculados e persistidos`, {
      symbol,
      timeframe,
      count: results.length,
      duration,
    });

    return results.length;
  }

  // ─────────────────────────────────────────────
  // Cálculos manuais — Lógica validada
  // ─────────────────────────────────────────────

  /**
   * RSI com Wilder's Smoothing (Exponential Moving Average).
   *
   * Lógica:
   * 1. Primeiros `period` candles: média aritmética de ganhos e perdas
   * 2. Candles seguintes: suavização Wilder → (prev * (p-1) + current) / p
   *
   * Retorna array de {time, value} alinhado ao open_time de cada candle.
   */
  private static calculateRSI(
    klines: Array<{ time: number; close: number }>,
    period: number
  ): TimedValue[] {
    const results: TimedValue[] = [];
    let avgGain = 0;
    let avgLoss = 0;

    for (let i = 1; i < klines.length; i++) {
      const delta = klines[i].close - klines[i - 1].close;

      if (i <= period) {
        // Fase de acumulação inicial
        if (delta > 0) avgGain += delta;
        else avgLoss -= delta;

        if (i === period) {
          avgGain /= period;
          avgLoss /= period;
          const rs = avgGain / (avgLoss || 1);
          results.push({ time: klines[i].time, value: 100 - (100 / (1 + rs)) });
        }
      } else {
        // Wilder's Smoothing
        avgGain = (avgGain * (period - 1) + (delta > 0 ? delta : 0)) / period;
        avgLoss = (avgLoss * (period - 1) + (delta < 0 ? -delta : 0)) / period;
        const rs = avgGain / (avgLoss || 1);
        results.push({ time: klines[i].time, value: 100 - (100 / (1 + rs)) });
      }
    }

    return results;
  }

  /**
   * Stochastic RSI — Stochastic aplicado sobre valores de RSI.
   *
   * Lógica:
   * 1. Para cada janela de `period` valores de RSI, calcula:
   *    StochRSI = (RSI_atual - RSI_min) / (RSI_max - RSI_min) * 100
   * 2. K = SMA(StochRSI, kPeriod)
   * 3. D = SMA(K, dPeriod)
   *
   * Retorna { k: TimedValue[], d: TimedValue[] }
   */
  private static calculateStochRSI(
    rsiData: TimedValue[],
    period: number,
    kPeriod: number,
    dPeriod: number
  ): { k: TimedValue[]; d: TimedValue[] } {
    // Stochastic raw sobre RSI
    const stochValues: TimedValue[] = [];
    for (let i = period - 1; i < rsiData.length; i++) {
      const window = rsiData.slice(i - period + 1, i + 1);
      const min = Math.min(...window.map((v) => v.value));
      const max = Math.max(...window.map((v) => v.value));
      const range = max - min || 1;
      stochValues.push({
        time: rsiData[i].time,
        value: ((rsiData[i].value - min) / range) * 100,
      });
    }

    // K = SMA do Stochastic raw
    const kValues = this.calculateSMA(stochValues, kPeriod);

    // D = SMA do K
    const dValues = this.calculateSMA(kValues, dPeriod);

    return { k: kValues, d: dValues };
  }

  /**
   * SMA — Simple Moving Average.
   *
   * Calcula a média aritmética simples sobre uma janela deslizante.
   * Retorna array de {time, value} preservando o timestamp do último
   * elemento da janela.
   */
  private static calculateSMA(data: TimedValue[], period: number): TimedValue[] {
    const results: TimedValue[] = [];
    for (let i = period - 1; i < data.length; i++) {
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += data[i - j].value;
      }
      results.push({ time: data[i].time, value: sum / period });
    }
    return results;
  }

  /**
   * Arredonda um número para N casas decimais.
   */
  private static round(value: number, decimals: number): number {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  }
}
