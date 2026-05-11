import { prisma } from '../database/prisma.client';

/**
 * Estrutura de um candle bruto da Binance, já com valores convertidos.
 */
export interface CandleRow {
  symbol: string;
  timeframe: string;
  open_time: number;
  close_time: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  quote_asset_volume: string;
  number_of_trades: number;
  taker_buy_base_asset_volume: string;
  taker_buy_quote_asset_volume: string;
}

/**
 * Repositório de Candles — Raw SQL para máxima performance.
 *
 * Usa INSERT ... ON DUPLICATE KEY UPDATE para idempotência
 * e bulk insert para minimizar round-trips ao MySQL.
 */
export class CandleRepository {
  /**
   * Insere/atualiza candles em batch via raw SQL.
   * A cláusula ON DUPLICATE KEY UPDATE garante que:
   * - Candles novos são inseridos
   * - Candles existentes (em formação) são atualizados
   */
  static async bulkUpsert(candles: CandleRow[]): Promise<number> {
    if (candles.length === 0) return 0;

    // Processa em chunks de 500 para não estourar limites do MySQL
    const CHUNK_SIZE = 500;
    let totalAffected = 0;

    for (let i = 0; i < candles.length; i += CHUNK_SIZE) {
      const chunk = candles.slice(i, i + CHUNK_SIZE);
      const affected = await this.upsertChunk(chunk);
      totalAffected += affected;
    }

    return totalAffected;
  }

  /**
   * Executa o upsert para um chunk de candles.
   */
  private static async upsertChunk(candles: CandleRow[]): Promise<number> {
    // Constrói os VALUES placeholders
    const placeholders = candles
      .map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .join(', ');

    // Achata os valores para o prepared statement
    const values: (string | number)[] = [];
    for (const c of candles) {
      values.push(
        c.symbol,
        c.timeframe,
        c.open_time,
        c.close_time,
        c.open,
        c.high,
        c.low,
        c.close,
        c.volume,
        c.quote_asset_volume,
        c.number_of_trades,
        c.taker_buy_base_asset_volume,
        c.taker_buy_quote_asset_volume
      );
    }

    const sql = `
      INSERT INTO candles (
        symbol, timeframe, open_time, close_time,
        \`open\`, high, low, \`close\`,
        volume, quote_asset_volume, number_of_trades,
        taker_buy_base_asset_volume, taker_buy_quote_asset_volume
      ) VALUES ${placeholders}
      ON DUPLICATE KEY UPDATE
        close_time = VALUES(close_time),
        \`open\` = VALUES(\`open\`),
        high = VALUES(high),
        low = VALUES(low),
        \`close\` = VALUES(\`close\`),
        volume = VALUES(volume),
        quote_asset_volume = VALUES(quote_asset_volume),
        number_of_trades = VALUES(number_of_trades),
        taker_buy_base_asset_volume = VALUES(taker_buy_base_asset_volume),
        taker_buy_quote_asset_volume = VALUES(taker_buy_quote_asset_volume)
    `;

    const result = await prisma.$executeRawUnsafe(sql, ...values);
    return result;
  }

  /**
   * Retorna o último open_time registrado para um par symbol+timeframe.
   * Usado na atualização incremental para saber de onde continuar.
   */
  static async getLastOpenTime(symbol: string, timeframe: string): Promise<number | null> {
    const rows = await prisma.$queryRawUnsafe<{ max_open_time: bigint | null }[]>(
      `SELECT MAX(open_time) as max_open_time FROM candles WHERE symbol = ? AND timeframe = ?`,
      symbol,
      timeframe
    );

    if (!rows || rows.length === 0 || rows[0].max_open_time === null) {
      return null;
    }

    return Number(rows[0].max_open_time);
  }

  /**
   * Busca candles para cálculo de indicadores.
   * Retorna os últimos N candles ordenados por open_time ASC (mais antigo → mais recente).
   */
  static async getCandlesForIndicators(
    symbol: string,
    timeframe: string,
    limit: number = 300
  ): Promise<{
    open_time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }[]> {
    const rows = await prisma.$queryRawUnsafe<{
      open_time: bigint;
      open: string;
      high: string;
      low: string;
      close: string;
      volume: string;
    }[]>(
      `SELECT open_time, \`open\`, high, low, \`close\`, volume
       FROM candles
       WHERE symbol = ? AND timeframe = ? AND close_time < ?
       ORDER BY open_time DESC
       LIMIT ?`,
      symbol,
      timeframe,
      Date.now(),
      limit
    );

    // Converte para números e inverte para ASC (mais antigo primeiro)
    return rows
      .map((r) => ({
        open_time: Number(r.open_time),
        open: parseFloat(r.open),
        high: parseFloat(r.high),
        low: parseFloat(r.low),
        close: parseFloat(r.close),
        volume: parseFloat(r.volume),
      }))
      .reverse();
  }

  /**
   * Busca dados históricos combinando candles + indicadores do banco.
   * Retorna dados consolidados ordenados por open_time DESC (mais recente primeiro).
   * Usado pela rota /market/history para exibição no frontend.
   */
  static async getHistoryWithIndicators(
    symbol: string,
    timeframe: string,
    limit: number = 1000
  ): Promise<{
    open_time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    rsi: number | null;
    rsi_k: number | null;
    rsi_d: number | null;
    rsi_ma: number | null;
    macd: number | null;
    macd_signal: number | null;
    ema1: number | null;
    ema2: number | null;
  }[]> {
    const rows = await prisma.$queryRawUnsafe<{
      open_time: bigint;
      open: string;
      high: string;
      low: string;
      close: string;
      volume: string;
      rsi: string | null;
      rsi_k: string | null;
      rsi_d: string | null;
      rsi_ma: string | null;
      macd: string | null;
      macd_signal: string | null;
      ema1: string | null;
      ema2: string | null;
    }[]>(
      `SELECT 
         c.open_time, c.\`open\`, c.high, c.low, c.\`close\`, c.volume,
         i.rsi, i.rsi_k, i.rsi_d, i.rsi_ma, i.macd, i.macd_signal, i.ema1, i.ema2
       FROM candles c
       LEFT JOIN indicators i 
         ON c.symbol = i.symbol AND c.timeframe = i.timeframe AND c.open_time = i.open_time
       WHERE c.symbol = ? AND c.timeframe = ? AND c.close_time < ?
       ORDER BY c.open_time DESC
       LIMIT ?`,
      symbol,
      timeframe,
      Date.now(),
      limit
    );

    return rows.map((r) => ({
      open_time: Number(r.open_time),
      open: parseFloat(r.open),
      high: parseFloat(r.high),
      low: parseFloat(r.low),
      close: parseFloat(r.close),
      volume: parseFloat(r.volume),
      rsi: r.rsi !== null ? parseFloat(r.rsi) : null,
      rsi_k: r.rsi_k !== null ? parseFloat(r.rsi_k) : null,
      rsi_d: r.rsi_d !== null ? parseFloat(r.rsi_d) : null,
      rsi_ma: r.rsi_ma !== null ? parseFloat(r.rsi_ma) : null,
      macd: r.macd !== null ? parseFloat(r.macd) : null,
      macd_signal: r.macd_signal !== null ? parseFloat(r.macd_signal) : null,
      ema1: r.ema1 !== null ? parseFloat(r.ema1) : null,
      ema2: r.ema2 !== null ? parseFloat(r.ema2) : null,
    }));
  }

  /**
   * Conta o total de candles por symbol+timeframe.
   * Útil para verificar se o backfill foi feito.
   */
  static async countCandles(symbol: string, timeframe: string): Promise<number> {
    const rows = await prisma.$queryRawUnsafe<{ total: bigint }[]>(
      `SELECT COUNT(*) as total FROM candles WHERE symbol = ? AND timeframe = ?`,
      symbol,
      timeframe
    );

    return rows.length > 0 ? Number(rows[0].total) : 0;
  }
}
