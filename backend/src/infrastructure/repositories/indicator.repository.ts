import { prisma } from '../database/prisma.client';

/**
 * Estrutura de um registro de indicador para persistência.
 */
export interface IndicatorRow {
  symbol: string;
  timeframe: string;
  open_time: number;
  rsi_k: number | null;
  rsi_d: number | null;
  rsi: number | null;
  rsi_ma: number | null;
  macd: number | null;
  macd_signal: number | null;
  ema1: number | null;
  ema2: number | null;
}

/**
 * Repositório de Indicadores — Raw SQL para máxima performance.
 *
 * Usa INSERT ... ON DUPLICATE KEY UPDATE para atualização contínua
 * sem duplicidade, garantindo consistência dos dados calculados.
 */
export class IndicatorRepository {
  /**
   * Insere/atualiza indicadores em batch via raw SQL.
   */
  static async bulkUpsert(indicators: IndicatorRow[]): Promise<number> {
    if (indicators.length === 0) return 0;

    const CHUNK_SIZE = 500;
    let totalAffected = 0;

    for (let i = 0; i < indicators.length; i += CHUNK_SIZE) {
      const chunk = indicators.slice(i, i + CHUNK_SIZE);
      const affected = await this.upsertChunk(chunk);
      totalAffected += affected;
    }

    return totalAffected;
  }

  /**
   * Executa o upsert de um chunk de indicadores.
   */
  private static async upsertChunk(indicators: IndicatorRow[]): Promise<number> {
    const placeholders = indicators
      .map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .join(', ');

    const values: (string | number | null)[] = [];
    for (const ind of indicators) {
      values.push(
        ind.symbol,
        ind.timeframe,
        ind.open_time,
        ind.rsi_k,
        ind.rsi_d,
        ind.rsi,
        ind.rsi_ma,
        ind.macd,
        ind.macd_signal,
        ind.ema1,
        ind.ema2
      );
    }

    const sql = `
      INSERT INTO indicators (
        symbol, timeframe, open_time,
        rsi_k, rsi_d, rsi, rsi_ma,
        macd, macd_signal,
        ema1, ema2
      ) VALUES ${placeholders}
      ON DUPLICATE KEY UPDATE
        rsi_k = VALUES(rsi_k),
        rsi_d = VALUES(rsi_d),
        rsi = VALUES(rsi),
        rsi_ma = VALUES(rsi_ma),
        macd = VALUES(macd),
        macd_signal = VALUES(macd_signal),
        ema1 = VALUES(ema1),
        ema2 = VALUES(ema2)
    `;

    const result = await prisma.$executeRawUnsafe(sql, ...values);
    return result;
  }
}
