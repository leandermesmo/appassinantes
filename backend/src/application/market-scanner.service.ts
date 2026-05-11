import cron from "node-cron";
import { prisma } from "../infrastructure/database/prisma.client";
import { FLAGS } from "../shared/config";

import { BinanceService } from "../infrastructure/external/binance.service";
import { TechnicalAnalysisEngine } from "./technical-analysis.engine";
import { SignalHistoryRepository } from "../infrastructure/repositories/signal-history.repository";

export class MarketScannerService {
  /**
   * Inicializa os agendamentos do scanner.
   * Executa a cada 15 minutos para ativos intradiários e diariamente para 1d.
   */
  static start() {
    if (!FLAGS.ENABLE_MARKET_SCANNER) {
      console.log("⚠️ [MarketScanner] DISABLED via config flags.");
      return;
    }

    console.log("🚀 Market Scanner iniciado.");
    
    // Scanner de 15 minutos (Intradiário)
    cron.schedule("*/15 * * * *", async () => {
      await MarketScannerService.scanTimeframe("15m");
    });

    // Scanner Diário (00:01 UTC)
    cron.schedule("1 0 * * *", async () => {
      await MarketScannerService.scanTimeframe("1d");
    });

    // Execução imediata no startup para popular o banco se estiver vazio
    MarketScannerService.scanTimeframe("1d").catch(console.error);
  }

  /**
   * Executa o ciclo de scan para um timeframe específico.
   */
  static async scanTimeframe(timeframe: string) {
    console.log(`[Scanner] Iniciando scan para timeframe: ${timeframe}`);

    const cryptos = await prisma.cryptocurrency.findMany({
      where: { isActive: true },
    });

    const indicatorsFromDb = FLAGS.ENABLE_INDICATOR_PERSISTENCE 
      ? await prisma.technicalIndicator.findMany()
      : [
          { id: 1, code: 'rsi_14', name: 'RSI (14)' },
          { id: 2, code: 'stochrsi_14', name: 'StochRSI (14)' },
          { id: 3, code: 'ema_21', name: 'EMA (21)' },
          { id: 4, code: 'ema_50', name: 'EMA (50)' },
          { id: 5, code: 'ema_200', name: 'EMA (200)' },
          { id: 6, code: 'confluence_strat', name: 'Confluence Strategy' }
        ];


    for (const crypto of cryptos) {
      try {
        // Busca klines da Binance
        const data = await BinanceService.getKlines(crypto.symbol, timeframe, 200);
        
        // Calcula sinais
        const signals = TechnicalAnalysisEngine.calculateSignals(data.close);
        
        const signalsToInsert = signals.map(sig => {
          const indicator = indicatorsFromDb.find(i => i.code === sig.code);
          if (!indicator) return null;

          return {
            cryptoId: crypto.id,
            indicatorId: indicator.id,
            timeframe: timeframe,
            signalType: sig.signal,
            value: sig.value,
            generatedAt: new Date(data.closeTime[data.closeTime.length - 1]),
          };
        }).filter(s => s !== null) as any[];

        if (signalsToInsert.length > 0 && FLAGS.ENABLE_INDICATOR_PERSISTENCE) {
          await SignalHistoryRepository.createMany(signalsToInsert);
        } else if (signalsToInsert.length > 0) {
          console.log(`[Scanner] Persistence disabled. Signals for ${crypto.symbol} (${timeframe}) would be:`, signalsToInsert);
        }

        console.log(`[Scanner] Sinais processados para ${crypto.symbol} (${timeframe})`);
      } catch (error) {
        console.error(`[Scanner] Erro ao processar ${crypto.symbol}:`, error);
      }
    }

    console.log(`[Scanner] Scan concluído para ${timeframe}.`);
  }
}
