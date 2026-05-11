import { FastifyRequest, FastifyReply } from "fastify";
import { FreemiumConfigRepository, FreemiumLimits } from "../../infrastructure/repositories/freemium-config.repository";

/**
 * Limites do plano FREE — agora lidos dinamicamente do banco de dados.
 *
 * A configuração é gerenciável via painel admin (/admin/settings)
 * sem necessidade de deploy. O FreemiumConfigRepository implementa
 * cache in-memory com TTL de 5 minutos para performance.
 *
 * Fallback: se o banco estiver indisponível, usa valores hardcoded default.
 */

/**
 * Valores default — usados apenas como fallback caso o banco falhe.
 * Em operação normal, os valores vêm do FreemiumConfigRepository.
 */
const DEFAULT_FREE_TIER_LIMITS: FreemiumLimits = {
  allowedSymbols: ["BTCUSDT"],
  allowedTimeframes: ["1d"],
  maxHistoryRecords: 20,
  maxSignals: 1,
  maxFavorites: 3,
};

/**
 * Retorna os limites atuais do plano FREE.
 * Lê do banco com cache — fallback para default em caso de erro.
 */
export async function getFreeTierLimits(): Promise<FreemiumLimits> {
  try {
    return await FreemiumConfigRepository.getConfig();
  } catch {
    return DEFAULT_FREE_TIER_LIMITS;
  }
}

/**
 * Getter síncrono para compatibilidade com código existente.
 * Retorna os valores default — para uso em contextos onde async não é possível.
 * Prefira getFreeTierLimits() sempre que possível.
 */
export const FREE_TIER_LIMITS = DEFAULT_FREE_TIER_LIMITS;

export type UserTier = "FREE" | "PREMIUM" | "ADMIN";

/**
 * Middleware que classifica o tier do usuário SEM bloquear o acesso.
 *
 * Diferente do ensureSubscriptionActive (que lança 403),
 * este middleware apenas marca o request com o tier para que
 * controllers e services filtrem os dados adequadamente.
 *
 * Deve ser usado APÓS ensureAuthenticated.
 *
 * Fluxo:
 * 1. ADMIN → tier ADMIN (acesso total sem assinatura)
 * 2. subscriptionStatus === "active" → tier PREMIUM
 * 3. Qualquer outro caso → tier FREE
 */
export async function setUserTier(
  request: FastifyRequest,
  _reply: FastifyReply
) {
  if (!request.user) {
    request.tier = "FREE";
    return;
  }

  if (request.user.role === "ADMIN") {
    request.tier = "ADMIN";
    return;
  }

  if (request.user.subscriptionStatus === "active") {
    request.tier = "PREMIUM";
    return;
  }

  request.tier = "FREE";
}

/**
 * Verifica se um símbolo é acessível para o tier FREE.
 * Versão async que lê a config dinâmica do banco.
 */
export async function isSymbolAllowedForFree(symbol: string): Promise<boolean> {
  const limits = await getFreeTierLimits();
  return limits.allowedSymbols.includes(symbol.toUpperCase());
}

/**
 * Verifica se um timeframe é acessível para o tier FREE.
 * Versão async que lê a config dinâmica do banco.
 */
export async function isTimeframeAllowedForFree(timeframe: string): Promise<boolean> {
  const limits = await getFreeTierLimits();
  return limits.allowedTimeframes.includes(timeframe);
}

// Extensão de tipos para o Fastify incluir o campo tier no Request
declare module "fastify" {
  interface FastifyRequest {
    tier: UserTier;
  }
}
