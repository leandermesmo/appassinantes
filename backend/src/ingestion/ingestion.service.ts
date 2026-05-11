import { BinanceService } from '../infrastructure/external/binance.service';
import { CandleRepository, CandleRow } from '../infrastructure/repositories/candle.repository';
import { createLogger } from './logger';

const log = createLogger('Ingestion');

/**
 * Duração de 1 candle em milissegundos por timeframe.
 * Usado para calcular o startTime na atualização incremental.
 */
const TIMEFRAME_MS: Record<string, number> = {
  '15m': 15 * 60 * 1000,
  '1h':  60 * 60 * 1000,
  '4h':  4 * 60 * 60 * 1000,
  '1d':  24 * 60 * 60 * 1000,
  '1w':  7 * 24 * 60 * 60 * 1000,
  '1M':  30 * 24 * 60 * 60 * 1000, // Aproximação — a Binance ajusta
};

/**
 * Serviço de Ingestão de Candles.
 *
 * Responsabilidades:
 * - Backfill: carrega histórico completo (até 1000 candles por request)
 * - Incremental: atualiza a partir do último candle registrado
 * - Conversão string → DECIMAL
 * - Idempotência via ON DUPLICATE KEY UPDATE
 */
export class IngestionService {
  /**
   * Backfill completo para um par symbol+timeframe.
   *
   * Busca até 1000 candles da Binance (o máximo por request)
   * e insere/atualiza no banco via bulk upsert.
   */
  static async backfill(symbol: string, timeframe: string): Promise<number> {
    const startTime = performance.now();
    log.info(`Backfill iniciado`, { symbol, timeframe });

    let totalInserted = 0;
    let startFrom: number | undefined = undefined;
    let hasMore = true;

    while (hasMore) {
      const klines = await BinanceService.getKlinesRaw(symbol, timeframe, {
        startTime: startFrom,
        limit: 1000,
      });

      if (klines.length === 0) {
        hasMore = false;
        break;
      }

      // Converte para o formato do repositório
      const candles = this.mapToCandles(klines, symbol, timeframe);
      const affected = await CandleRepository.bulkUpsert(candles);
      totalInserted += candles.length;

      log.debug(`Chunk inserido`, {
        symbol,
        timeframe,
        count: candles.length,
      });

      // Se retornou menos de 1000, não há mais dados
      if (klines.length < 1000) {
        hasMore = false;
      } else {
        // Próxima página: começa do close_time do último + 1ms
        startFrom = klines[klines.length - 1].closeTime + 1;
      }
    }

    const duration = Math.round(performance.now() - startTime);
    log.info(`Backfill concluído`, {
      symbol,
      timeframe,
      count: totalInserted,
      duration,
    });

    return totalInserted;
  }

  /**
   * Atualização incremental para um par symbol+timeframe.
   *
   * Lógica:
   * 1. Busca o último open_time no banco
   * 2. Se não existe → executa backfill
   * 3. Se existe → busca a partir de (último open_time - 1 candle) para:
   *    - Atualizar o candle em formação (que pode ter mudado)
   *    - Capturar candles novos que fecharam
   * 4. Insere via ON DUPLICATE KEY UPDATE
   */
  static async incrementalUpdate(symbol: string, timeframe: string): Promise<number> {
    const lastOpenTime = await CandleRepository.getLastOpenTime(symbol, timeframe);

    // Se não tem dados, faz backfill completo
    if (lastOpenTime === null) {
      log.info(`Sem dados no banco, executando backfill`, { symbol, timeframe });
      return this.backfill(symbol, timeframe);
    }

    // Busca a partir de (último - 1 candle) para cobrir o candle em formação
    const candleDuration = TIMEFRAME_MS[timeframe] || TIMEFRAME_MS['1d'];
    const startTime = lastOpenTime - candleDuration;

    const klines = await BinanceService.getKlinesRaw(symbol, timeframe, {
      startTime,
      limit: 1000,
    });

    if (klines.length === 0) {
      log.debug(`Nenhum candle novo`, { symbol, timeframe });
      return 0;
    }

    const candles = this.mapToCandles(klines, symbol, timeframe);
    const affected = await CandleRepository.bulkUpsert(candles);

    log.debug(`Atualização incremental`, {
      symbol,
      timeframe,
      count: candles.length,
    });

    return candles.length;
  }

  /**
   * Converte klines da Binance para o formato CandleRow.
   * Garante que todos os valores numéricos são strings DECIMAL válidas.
   */
  private static mapToCandles(
    klines: Awaited<ReturnType<typeof BinanceService.getKlinesRaw>>,
    symbol: string,
    timeframe: string
  ): CandleRow[] {
    const now = Date.now();
    
    return klines
      .filter((k) => k.closeTime < now) // Apenas candles já consolidados (fechados)
      .map((k) => ({
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
  }
}
