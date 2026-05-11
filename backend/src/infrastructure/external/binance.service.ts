import axios, { AxiosError } from "axios";
import { createLogger } from "../../ingestion/logger";

const log = createLogger('Binance');

/**
 * Candle bruto retornado pela API da Binance (array posicional).
 * Docs: https://binance-docs.github.io/apidocs/spot/en/#kline-candlestick-data
 */
export interface BinanceKlineRaw {
  openTime: number;       // [0]
  open: string;           // [1]
  high: string;           // [2]
  low: string;            // [3]
  close: string;          // [4]
  volume: string;         // [5]
  closeTime: number;      // [6]
  quoteAssetVolume: string;        // [7]
  numberOfTrades: number;          // [8]
  takerBuyBaseAssetVolume: string;  // [9]
  takerBuyQuoteAssetVolume: string; // [10]
}

interface KlinesParams {
  startTime?: number;
  endTime?: number;
  limit?: number;
}

/**
 * Serviço de integração com a Binance API.
 *
 * Inclui:
 * - Retry com backoff exponencial (3 tentativas)
 * - Rate limiting interno (delay entre requisições)
 * - Conversão segura de tipos
 */
export class BinanceService {
  private static baseUrl = process.env.BINANCE_API_URL || "https://api.binance.com/api/v3";
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_BASE_DELAY_MS = 1000;
  // Delay mínimo entre requisições para não estourar rate limit (1200 req/min)
  private static readonly REQUEST_DELAY_MS = 75;
  private static lastRequestTime = 0;

  /**
   * Busca klines formatadas (legado — usado pela API REST existente).
   */
  static async getKlines(symbol: string, interval: string, limit: number = 1000) {
    const raw = await this.getKlinesRaw(symbol, interval, { limit });

    return {
      openTime: raw.map(k => k.openTime),
      open: raw.map(k => parseFloat(k.open)),
      high: raw.map(k => parseFloat(k.high)),
      low: raw.map(k => parseFloat(k.low)),
      close: raw.map(k => parseFloat(k.close)),
      volume: raw.map(k => parseFloat(k.volume)),
      closeTime: raw.map(k => k.closeTime),
    };
  }

  /**
   * Busca klines em formato bruto (array de objetos tipados).
   * Suporta startTime para paginação e atualização incremental.
   */
  static async getKlinesRaw(
    symbol: string,
    interval: string,
    params: KlinesParams = {}
  ): Promise<BinanceKlineRaw[]> {
    const { startTime, endTime, limit = 1000 } = params;

    const queryParams: Record<string, string | number> = {
      symbol,
      interval,
      limit: Math.min(limit, 1000), // Binance permite no máximo 1000
    };

    if (startTime) queryParams.startTime = startTime;
    if (endTime) queryParams.endTime = endTime;

    const data = await this.requestWithRetry<unknown[][]>(
      '/klines',
      queryParams
    );

    return data.map((k) => ({
      openTime: k[0] as number,
      open: k[1] as string,
      high: k[2] as string,
      low: k[3] as string,
      close: k[4] as string,
      volume: k[5] as string,
      closeTime: k[6] as number,
      quoteAssetVolume: k[7] as string,
      numberOfTrades: k[8] as number,
      takerBuyBaseAssetVolume: k[9] as string,
      takerBuyQuoteAssetVolume: k[10] as string,
    }));
  }

  /**
   * Busca informações da exchange (pares de trading).
   */
  static async getExchangeInfo() {
    return this.requestWithRetry<{
      symbols: Array<{
        symbol: string;
        status: string;
        baseAsset: string;
        quoteAsset: string;
      }>;
    }>('/exchangeInfo', {});
  }

  /**
   * Busca o tempo atual do servidor da Binance.
   */
  static async getServerTime(): Promise<number> {
    const data = await this.requestWithRetry<{ serverTime: number }>('/time', {});
    return data.serverTime;
  }

  /**
   * Request HTTP com retry e backoff exponencial.
   * Protege contra falhas temporárias da Binance API.
   */
  private static async requestWithRetry<T>(
    path: string,
    params: Record<string, string | number>
  ): Promise<T> {
    // Rate limiting: garante delay mínimo entre requests
    await this.throttle();

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const response = await axios.get<T>(`${this.baseUrl}${path}`, {
          params,
          timeout: 30000, // 30s timeout
        });

        return response.data;
      } catch (error) {
        const isLastAttempt = attempt === this.MAX_RETRIES;
        const axiosError = error as AxiosError;

        // Se rate limited (429), espera mais tempo
        if (axiosError.response?.status === 429) {
          const retryAfter = parseInt(
            (axiosError.response.headers['retry-after'] as string) || '5',
            10
          );
          log.warn(`Rate limited pela Binance, aguardando ${retryAfter}s`, {
            symbol: params.symbol as string,
          });
          await this.sleep(retryAfter * 1000);
          continue;
        }

        // Se 418 (IP banned temporariamente), espera muito mais
        if (axiosError.response?.status === 418) {
          log.error('IP temporariamente banido pela Binance, aguardando 60s');
          await this.sleep(60000);
          continue;
        }

        if (isLastAttempt) {
          log.error(`Falha após ${this.MAX_RETRIES} tentativas`, error, {
            symbol: params.symbol as string,
          });
          throw new Error(
            `Binance API falhou para ${path}: ${axiosError.message}`
          );
        }

        // Backoff exponencial: 1s, 2s, 4s
        const delay = Math.pow(2, attempt - 1) * this.RETRY_BASE_DELAY_MS;
        log.warn(`Tentativa ${attempt}/${this.MAX_RETRIES} falhou, retry em ${delay}ms`, {
          symbol: params.symbol as string,
        });
        await this.sleep(delay);
      }
    }

    // Nunca chega aqui, mas TypeScript precisa
    throw new Error('Unreachable');
  }

  /**
   * Garante um delay mínimo entre requisições à Binance.
   */
  private static async throttle(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;

    if (elapsed < this.REQUEST_DELAY_MS) {
      await this.sleep(this.REQUEST_DELAY_MS - elapsed);
    }

    this.lastRequestTime = Date.now();
  }

  private static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
