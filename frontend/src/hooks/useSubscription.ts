"use client";

import { useSession } from "next-auth/react";
import type { SubscriptionTier, TierLimits } from "@/types/subscription";
import { FREE_LIMITS } from "@/types/subscription";

/**
 * Hook que deriva o tier do usuário a partir da session NextAuth.
 *
 * A source of truth é o subscriptionStatus na session (vindo do JWT),
 * que por sua vez é populado pelo callback jwt do auth.config.ts
 * consultando o banco a cada renovação de token (~1h).
 *
 * Retorna helpers booleanos e os limites aplicáveis para facilitar
 * renderização condicional nos componentes de dashboard.
 */
export function useSubscription() {
  const { data: session, status, update } = useSession();

  const subscriptionStatus = session?.user?.subscriptionStatus || "none";
  const role = session?.user?.role || "USER";
  const isAdmin = role === "ADMIN";
  const isPremium = subscriptionStatus === "active" || isAdmin; // Admin também é premium por padrão
  const isFree = !isPremium;
  const tier: SubscriptionTier = isPremium ? "PREMIUM" : "FREE";
  const isLoading = status === "loading";

  /** Limites aplicáveis — null para PREMIUM (sem limites) */
  const limits: TierLimits | null = isFree ? FREE_LIMITS : null;

  /**
   * Força revalidação do status da assinatura.
   * Útil após checkout bem-sucedido — atualiza a session
   * sem exigir logout/login do usuário.
   */
  const refreshSubscription = async () => {
    await update();
  };

  /**
   * Verifica se um símbolo é acessível no tier atual.
   */
  const isSymbolAllowed = (symbol: string): boolean => {
    if (isPremium) return true;
    return FREE_LIMITS.allowedSymbols.includes(symbol.toUpperCase());
  };

  /**
   * Verifica se um timeframe é acessível no tier atual.
   */
  const isTimeframeAllowed = (timeframe: string): boolean => {
    if (isPremium) return true;
    return FREE_LIMITS.allowedTimeframes.includes(timeframe);
  };

  return {
    tier,
    isPremium,
    isFree,
    isAdmin,
    role,
    isLoading,
    limits,
    subscriptionStatus,
    isSymbolAllowed,
    isTimeframeAllowed,
    refreshSubscription,
  };
}
