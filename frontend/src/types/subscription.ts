/**
 * Tipos centralizados do sistema de assinatura/Freemium.
 * Usados por hooks, componentes e pages para renderização condicional.
 */

export type SubscriptionTier = "FREE" | "PREMIUM";
export type SubscriptionStatus = "active" | "none" | "past_due";

export interface TierLimits {
  allowedSymbols: string[];
  allowedTimeframes: string[];
  maxHistoryRecords: number;
  maxSignals: number;
  maxFavorites: number;
}

/**
 * Limites do plano FREE espelhados do backend.
 * Usados APENAS para renderização visual (blur, locks, CTAs).
 * A validação real acontece server-side — estes valores são meramente visuais.
 */
export const FREE_LIMITS: TierLimits = {
  allowedSymbols: ["BTCUSDT"],
  allowedTimeframes: ["1d"],
  maxHistoryRecords: 20,
  maxSignals: 1,
  maxFavorites: 3,
};
