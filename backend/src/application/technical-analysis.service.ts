import { SignalHistoryRepository } from "../infrastructure/repositories/signal-history.repository";
import { CryptocurrencyRepository } from "../infrastructure/repositories/cryptocurrency.repository";
import { AppError } from "../shared/errors/AppError";
import { BinanceService } from "../infrastructure/external/binance.service";

export class TechnicalAnalysisService {
  
  /**
   * Obtém os dados consolidados para o dashboard.
   * Agora busca os sinais pré-calculados do banco de dados (Snapshot).
   */
  static async getDashboardData(symbol: string, timeframe: string = "1d") {
    const crypto = await CryptocurrencyRepository.findBySymbol(symbol);
    
    if (!crypto) {
      throw new AppError("Criptomoeda não encontrada ou inativa.", 404);
    }

    // Busca o snapshot mais recente de sinais do banco (já calculado pelo Scanner)
    const signals = await SignalHistoryRepository.findCurrentSnapshot({
      cryptoId: crypto.id,
      timeframe
    });

    // Busca o preço atual diretamente da Binance para precisão (preço não é um sinal pesado)
    // Mas os indicadores técnicos (pesados) vêm do banco.
    let lastPrice = 0;
    try {
      const klines = await BinanceService.getKlines(symbol, timeframe, 1);
      lastPrice = klines.close[klines.close.length - 1];
    } catch (err) {
      // Fallback: se a Binance falhar, usamos o último valor de sinal se disponível
      lastPrice = signals.length > 0 ? Number(signals[0].value) : 0;
    }
    
    // Transforma para o formato esperado pelo frontend
    const indicators: Record<string, any> = {};
    signals.forEach(sig => {
      indicators[sig.indicator.code] = {
        value: Number(sig.value),
        signal: sig.signalType,
        name: sig.indicator.name
      };
    });

    return {
      symbol,
      name: crypto.name,
      lastPrice,
      timeframe,
      indicators
    };
  }
}
