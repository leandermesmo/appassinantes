/**
 * Estratégia de cálculo para diferentes timeframes.
 * Define a duração e as regras de alinhamento de tempo.
 */
export class TimeframeStrategy {
  private static readonly TIMEFRAME_MAP: Record<string, number> = {
    '15m': 15 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '4h': 4 * 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000,
    '1w': 7 * 24 * 60 * 60 * 1000,
    '1M': 30 * 24 * 60 * 60 * 1000, // Aproximação base, corrigida no cálculo mensal
  };

  /**
   * Retorna os timeframes suportados pelo sistema.
   */
  static getSupportedTimeframes(): string[] {
    return Object.keys(this.TIMEFRAME_MAP);
  }

  /**
   * Calcula o timestamp de fechamento do último candle consolidado.
   * @param timeframe Intervalo (ex: '1h')
   * @param serverTime Tempo atual da Binance
   */
  static getLastClosedCandle(timeframe: string, serverTime: number): number {
    const duration = this.TIMEFRAME_MAP[timeframe];
    
    if (timeframe === '1M') {
      const date = new Date(serverTime);
      return new Date(date.getFullYear(), date.getMonth(), 1).getTime() - 1;
    }

    // Arredonda para baixo para o início do candle atual e subtrai 1ms para pegar o fechamento do anterior
    return Math.floor(serverTime / duration) * duration - 1;
  }

  /**
   * Calcula o próximo momento de execução (fechamento do candle atual + delay de segurança).
   * @param timeframe Intervalo
   * @param serverTime Tempo atual da Binance
   * @param safetyDelayMs Delay para garantir que a Binance já processou o fechamento
   */
  static getNextExecutionTime(timeframe: string, serverTime: number, safetyDelayMs = 2000): number {
    const duration = this.TIMEFRAME_MAP[timeframe];

    if (timeframe === '1M') {
      const date = new Date(serverTime);
      const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);
      return nextMonth.getTime() + safetyDelayMs;
    }

    const currentCandleStart = Math.floor(serverTime / duration) * duration;
    const nextCandleStart = currentCandleStart + duration;
    
    return nextCandleStart + safetyDelayMs;
  }

  /**
   * Retorna a duração em milissegundos de um timeframe.
   */
  static getDurationMs(timeframe: string): number {
    return this.TIMEFRAME_MAP[timeframe] || this.TIMEFRAME_MAP['1h'];
  }
}
