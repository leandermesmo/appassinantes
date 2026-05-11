import { prisma } from '../../infrastructure/database/prisma.client';
import { createLogger } from '../../ingestion/logger';

const log = createLogger('ActiveCryptosRepo');

export interface ActiveCrypto {
  symbol: string;
  id: number;
}

/**
 * Repositório para gerenciar a lista de criptomoedas ativas para ingestão.
 */
export class ActiveCryptosRepository {
  private static cache: ActiveCrypto[] | null = null;
  private static lastFetch = 0;
  private static readonly CACHE_TTL = 60 * 1000; // 1 minuto de cache

  /**
   * Busca todas as criptomoedas que possuem is_active = true.
   * Implementa cache leve para evitar consultas excessivas ao banco.
   */
  static async getActiveSymbols(forceRefresh = false): Promise<ActiveCrypto[]> {
    const now = Date.now();

    if (!forceRefresh && this.cache && (now - this.lastFetch < this.CACHE_TTL)) {
      return this.cache;
    }

    try {
      const cryptos = await prisma.cryptocurrency.findMany({
        where: { isActive: true },
        select: { symbol: true, id: true },
      });

      this.cache = cryptos;
      this.lastFetch = now;
      
      log.debug(`Lista de ativos atualizada: ${cryptos.length} ativos encontrados`);
      return this.cache;
    } catch (error) {
      log.error('Erro ao buscar ativos ativos no banco', error);
      return this.cache || []; // Retorna cache antigo em caso de erro no banco
    }
  }

  /**
   * Invalida o cache manual (útil se houver um webhook/evento de alteração).
   */
  static invalidateCache(): void {
    this.cache = null;
    this.lastFetch = 0;
  }
}
