import { FreemiumConfig } from "@prisma/client";
import { prisma } from "../database/prisma.client";

/**
 * Limites do plano FREE — estrutura tipada para uso no middleware e serviços.
 */
export interface FreemiumLimits {
  allowedSymbols: string[];
  allowedTimeframes: string[];
  maxHistoryRecords: number;
  maxSignals: number;
  maxFavorites: number;
}

/**
 * Valores default usados como fallback caso o banco não tenha config.
 * Equivale aos valores que estavam hardcoded anteriormente.
 */
const DEFAULT_LIMITS: FreemiumLimits = {
  allowedSymbols: ["BTCUSDT"],
  allowedTimeframes: ["1d"],
  maxHistoryRecords: 20,
  maxSignals: 1,
  maxFavorites: 3,
};

// Cache in-memory para evitar query a cada request
let cachedConfig: FreemiumLimits | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

/**
 * Repositório para leitura e escrita da configuração Freemium.
 * Implementa cache in-memory com TTL de 5 minutos para performance.
 */
export class FreemiumConfigRepository {
  /**
   * Lê a configuração atual do Freemium.
   * Usa cache in-memory — em caso de falha, retorna valores default.
   */
  static async getConfig(): Promise<FreemiumLimits> {
    const now = Date.now();

    // Retorna cache se ainda válido
    if (cachedConfig && now - cacheTimestamp < CACHE_TTL_MS) {
      return cachedConfig;
    }

    try {
      const config = await prisma.freemiumConfig.findUnique({
        where: { id: 1 },
      });

      if (!config) {
        cachedConfig = DEFAULT_LIMITS;
        cacheTimestamp = now;
        return DEFAULT_LIMITS;
      }

      const limits: FreemiumLimits = {
        allowedSymbols: config.allowedSymbols as string[],
        allowedTimeframes: config.allowedTimeframes as string[],
        maxHistoryRecords: config.maxHistoryRecords,
        maxSignals: config.maxSignals,
        maxFavorites: config.maxFavorites,
      };

      cachedConfig = limits;
      cacheTimestamp = now;
      return limits;
    } catch (error) {
      // Em caso de falha no banco, retorna default (nunca bloqueia o usuário)
      console.error("[FreemiumConfig] Falha ao ler config do banco, usando default:", error);
      return cachedConfig ?? DEFAULT_LIMITS;
    }
  }

  /**
   * Atualiza a configuração do Freemium e invalida o cache.
   */
  static async updateConfig(data: Partial<FreemiumLimits>): Promise<FreemiumConfig> {
    const updateData: Record<string, unknown> = {};

    if (data.allowedSymbols !== undefined) {
      updateData.allowedSymbols = data.allowedSymbols;
    }
    if (data.allowedTimeframes !== undefined) {
      updateData.allowedTimeframes = data.allowedTimeframes;
    }
    if (data.maxHistoryRecords !== undefined) {
      updateData.maxHistoryRecords = data.maxHistoryRecords;
    }
    if (data.maxSignals !== undefined) {
      updateData.maxSignals = data.maxSignals;
    }
    if (data.maxFavorites !== undefined) {
      updateData.maxFavorites = data.maxFavorites;
    }

    const updated = await prisma.freemiumConfig.update({
      where: { id: 1 },
      data: updateData,
    });

    // Invalida o cache para que a próxima leitura pegue do banco
    cachedConfig = null;
    cacheTimestamp = 0;

    return updated;
  }

  /**
   * Invalida o cache manualmente (útil para testes).
   */
  static invalidateCache(): void {
    cachedConfig = null;
    cacheTimestamp = 0;
  }
}
