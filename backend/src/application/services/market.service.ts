import { BinanceService } from "../../infrastructure/external/binance.service";
import { CacheService } from "../../infrastructure/external/cache.service";
import { IndicatorService, IndicatorResult } from "./indicator.service";

export interface MarketDataResponse {
  symbol: string;
  interval: string;
  lastUpdate: number;
  indicators: IndicatorResult[];
}

export class MarketService {
  static async getAnalysis(symbol: string, interval: string): Promise<MarketDataResponse> {
    const cacheKey = `analysis:${symbol}:${interval}`;
    
    // 1. Tentar buscar do Cache (COMENTADO PARA TESTE DE SINCRONIZAÇÃO)
    /*
    const cachedData = await CacheService.get<MarketDataResponse>(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    */

    // 2. Buscar da Binance
    const klines = await BinanceService.getKlines(symbol, interval);
    
    // 3. Calcular Indicadores
    const indicators = IndicatorService.calculate({
      time: klines.openTime,
      open: klines.open,
      high: klines.high,
      low: klines.low,
      close: klines.close
    });

    const response: MarketDataResponse = {
      symbol,
      interval,
      lastUpdate: Date.now(),
      indicators: indicators.reverse(), // Mais recente primeiro para o frontend
    };

    // 4. Salvar no Cache (TTL de 10 segundos sincronizado com o frontend)
    await CacheService.set(cacheKey, response, 10);

    return response;
  }
}
