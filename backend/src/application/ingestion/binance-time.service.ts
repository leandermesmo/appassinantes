import { BinanceService } from '../../infrastructure/external/binance.service';
import { createLogger } from '../../ingestion/logger';

const log = createLogger('BinanceTime');

/**
 * Serviço responsável por sincronizar o tempo do sistema com o servidor da Binance.
 * Garante que a ingestão ocorra exatamente após o fechamento do candle na exchange.
 */
export class BinanceTimeService {
  private static offset = 0;
  private static lastSync = 0;
  private static readonly SYNC_INTERVAL_MS = 30 * 60 * 1000; // Sincroniza a cada 30 min

  /**
   * Obtém o tempo atual sincronizado com a Binance (serverTime).
   */
  static async getServerTime(): Promise<number> {
    const now = Date.now();
    
    // Se nunca sincronizou ou o intervalo passou, sincroniza
    if (this.lastSync === 0 || now - this.lastSync > this.SYNC_INTERVAL_MS) {
      await this.sync();
    }

    return Date.now() + this.offset;
  }

  /**
   * Realiza a sincronização efetiva via API da Binance.
   */
  private static async sync(): Promise<void> {
    try {
      const startTime = Date.now();
      // O endpoint /time retorna { "serverTime": number }
      // Como BinanceService.requestWithRetry é private, vamos usar axios direto ou expor um método
      // Para manter a arquitetura, vamos assumir que adicionaremos getSystemTime ao BinanceService
      const serverTime = await BinanceService.getServerTime(); 
      const endTime = Date.now();

      // Calcula o delay da rede (aproximado)
      const networkDelay = (endTime - startTime) / 2;
      
      this.offset = serverTime - (endTime - networkDelay);
      this.lastSync = Date.now();

      log.info('Tempo sincronizado com Binance', { 
        offset: this.offset, 
        serverTime: new Date(serverTime).toISOString() 
      });
    } catch (error) {
      log.error('Falha ao sincronizar tempo com Binance', error);
      // Em caso de falha, mantém o offset atual ou usa 0
    }
  }
}
