import { BinanceService } from '../../infrastructure/external/binance.service';
import { CandleRepository, CandleRow } from '../../infrastructure/repositories/candle.repository';
import { TimeframeStrategy } from './timeframe.strategy';
import { BinanceTimeService } from './binance-time.service';
import { createLogger } from '../../ingestion/logger';

const log = createLogger('CandleIngestionService');

/**
 * Serviço especializado na ingestão de candles faltantes.
 * Garante que apenas candles fechados sejam processados.
 */
export class CandleIngestionService {
  /**
   * Executa a ingestão incremental para um símbolo e timeframe específicos.
   * Busca apenas o que falta entre o último registro no banco e o último candle fechado na Binance.
   */
  static async ingest(symbol: string, timeframe: string): Promise<number> {
    try {
      const serverTime = await BinanceTimeService.getServerTime();
      const lastClosedTime = TimeframeStrategy.getLastClosedCandle(timeframe, serverTime);
      
      const lastOpenInDb = await CandleRepository.getLastOpenTime(symbol, timeframe);

      // Se o banco já está atualizado com o último candle fechado, não faz nada
      if (lastOpenInDb !== null) {
        const lastOpenTimeRequired = lastClosedTime - TimeframeStrategy.getDurationMs(timeframe) + 1;
        if (lastOpenInDb >= lastOpenTimeRequired) {
          return 0;
        }
      }

      // Busca candles a partir do último open_time no banco (ou backfill se null)
      // Usamos um pequeno overlap de 1 candle para garantir consistência
      const startTime = lastOpenInDb 
        ? lastOpenInDb - TimeframeStrategy.getDurationMs(timeframe) 
        : undefined;

      const klines = await BinanceService.getKlinesRaw(symbol, timeframe, {
        startTime,
        limit: 1000,
      });

      if (klines.length === 0) return 0;

      // Filtra apenas candles fechados conforme o tempo da Binance
      const closedKlines = klines.filter(k => k.closeTime <= lastClosedTime);
      
      if (closedKlines.length === 0) return 0;

      const candles: CandleRow[] = closedKlines.map(k => ({
        symbol,
        timeframe,
        open_time: k.openTime,
        close_time: k.closeTime,
        open: k.open,
        high: k.high,
        low: k.low,
        close: k.close,
        volume: k.volume,
        quote_asset_volume: k.quoteAssetVolume,
        number_of_trades: k.numberOfTrades,
        taker_buy_base_asset_volume: k.takerBuyBaseAssetVolume,
        taker_buy_quote_asset_volume: k.takerBuyQuoteAssetVolume,
      }));

      const affected = await CandleRepository.bulkUpsert(candles);
      
      log.debug(`Ingestão concluída`, { symbol, timeframe, inserted: candles.length });
      return candles.length;
    } catch (error) {
      log.error(`Falha na ingestão de ${symbol} (${timeframe})`, error);
      throw error;
    }
  }
}
