import { prisma } from "../../infrastructure/database/prisma.client";
import { FLAGS } from "../../shared/config";

import { BinanceService } from "../../infrastructure/external/binance.service";
import { IndicatorService, IndicatorResult } from "./indicator.service";
import { SignalType } from "@prisma/client";

export interface SignalSummary {
  symbol: string;
  name: string;
  timeframe: string;
  signal: SignalType;
  strength: number; // 0-100
  price: number;
  lastUpdate: Date;
}

export class MarketSignalService {
  /**
   * Calcula o sinal estratégico baseado em múltiplos indicadores.
   * Esta lógica é mantida no servidor para proteção de IP.
   */
  static async calculateSignal(symbol: string, timeframe: string): Promise<SignalSummary> {
    // 1. Obter dados da Binance
    const klines = await BinanceService.getKlines(symbol, timeframe, 500);
    const crypto = await prisma.cryptocurrency.findUnique({ where: { symbol } });
    
    if (!crypto) throw new Error(`Moeda ${symbol} não encontrada`);

    // 2. Calcular Indicadores
    const indicators = IndicatorService.calculate({
      time: klines.openTime,
      open: klines.open,
      high: klines.high,
      low: klines.low,
      close: klines.close
    });

    const current = indicators[indicators.length - 1];
    const prev = indicators[indicators.length - 2];
    
    // 3. Lógica Secreta de Classificação
    let signal: SignalType = SignalType.NEUTRAL;
    let strength = 50;

    const rsi = current.rsi;
    const stochK = current.stochK;
    const stochD = current.stochD;
    const prevStochK = prev.stochK;
    const prevStochD = prev.stochD;
    
    const macd = current.macd;
    const price = current.close;
    const ema50 = current.ema50 || 0;
    const ema200 = current.ema200 || 0;

    // Condições de Compra
    const stochCrossUp = prevStochK <= prevStochD && stochK > stochD;
    const isAboveEma200 = price > ema200;
    const isAboveEma50 = price > ema50;
    const macdHistPos = macd ? macd.histogram > 0 : false;

    if (rsi < 30 && stochCrossUp && macdHistPos && isAboveEma200) {
      signal = SignalType.STRONG_BUY;
      strength = 90;
    } else if (rsi < 45 && stochCrossUp && isAboveEma50) {
      signal = SignalType.BUY;
      strength = 70;
    }
    // Condições de Venda
    else if (rsi > 70 && stochK < stochD && !macdHistPos && !isAboveEma200) {
      signal = SignalType.STRONG_SELL;
      strength = 90;
    } else if (rsi > 55 && stochK < stochD && !isAboveEma50) {
      signal = SignalType.SELL;
      strength = 70;
    }

    // 4. Salvar Histórico (Apenas se o sinal for relevante ou se passar tempo suficiente)
    if (FLAGS.ENABLE_INDICATOR_PERSISTENCE) {
      await this.saveToHistory(crypto.id, timeframe, signal, price);
    } else {
      console.log(`[MarketSignalService] Persistence disabled. Signal for ${symbol} (${timeframe}): ${signal}`);
    }

    return {
      symbol: crypto.symbol,
      name: crypto.name,
      timeframe,
      signal,
      strength,
      price,
      lastUpdate: new Date()
    };
  }

  private static async saveToHistory(cryptoId: number, timeframe: string, signalType: SignalType, value: number) {
    if (!FLAGS.ENABLE_INDICATOR_PERSISTENCE) return;

    // Buscar indicador de estratégia (criaremos via seed)
    const indicator = await prisma.technicalIndicator.findUnique({ where: { code: "confluence_strat" } });
    if (!indicator) return;

    // Evitar salvar duplicatas seguidas do mesmo sinal no mesmo timeframe
    const lastSignal = await prisma.signalHistory.findFirst({
      where: { cryptoId, timeframe, indicatorId: indicator.id },
      orderBy: { generatedAt: 'desc' }
    });

    if (lastSignal?.signalType === signalType) return;

    await prisma.signalHistory.create({
      data: {
        cryptoId,
        indicatorId: indicator.id,
        timeframe,
        signalType,
        value,
        generatedAt: new Date()
      }
    });
  }

  static async getSignalsForDashboard() {
    // Implementar busca rápida de sinais recentes para os favoritos ou top moedas
    // Por simplicidade, vamos calcular em tempo real para as principais moedas (em produção usaria cache/job)
    const symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT"];
    const timeframes = ["1h", "4h", "1d"];
    
    const results = [];
    for (const symbol of symbols) {
      for (const timeframe of timeframes) {
        try {
          const signal = await this.calculateSignal(symbol, timeframe);
          results.push(signal);
        } catch (e) {
          console.error(e);
        }
      }
    }
    return results;
  }

  static async getHistory(symbol: string, limit = 50) {
    if (!FLAGS.ENABLE_INDICATOR_PERSISTENCE) return [];

    return prisma.signalHistory.findMany({
      where: { crypto: { symbol } },
      include: { crypto: true },
      orderBy: { generatedAt: 'desc' },
      take: limit
    });
  }
}
