"use client";

import React from "react";
import { useSubscription } from "@/hooks/useSubscription";
import { BlurBlock } from "./BlurBlock";

interface PremiumGateProps {
  /** Conteúdo exibido para PREMIUM */
  children: React.ReactNode;
  /** Conteúdo alternativo para FREE (padrão: BlurBlock) */
  fallback?: React.ReactNode;
  /** Mensagem do BlurBlock padrão */
  message?: string;
  /** Subtítulo do BlurBlock padrão */
  subtitle?: string;
  /** Se true, mostra o children com blur para FREE (preview) */
  showPreview?: boolean;
}

/**
 * Gate condicional que renderiza conteúdo premium ou versão bloqueada.
 *
 * Uso:
 * <PremiumGate message="Acesse indicadores avançados">
 *   <AdvancedIndicators />
 * </PremiumGate>
 *
 * Com preview (mostra conteúdo blurrado):
 * <PremiumGate showPreview message="Desbloqueie rankings">
 *   <RankingTable />
 * </PremiumGate>
 */
export function PremiumGate({
  children,
  fallback,
  message,
  subtitle,
  showPreview = false,
}: PremiumGateProps) {
  const { isPremium, isLoading } = useSubscription();

  // Enquanto carrega a session, mostra skeleton sutil
  if (isLoading) {
    return (
      <div className="animate-pulse rounded-2xl bg-surface/30 border border-border/20 min-h-[200px]" />
    );
  }

  // PREMIUM: renderiza normalmente
  if (isPremium) {
    return <>{children}</>;
  }

  // FREE: renderiza fallback personalizado ou BlurBlock padrão
  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <BlurBlock message={message} subtitle={subtitle}>
      {showPreview ? children : null}
    </BlurBlock>
  );
}
