"use client";

import React from "react";
import { Crown, Sparkles } from "lucide-react";
import Link from "next/link";
import { useSubscription } from "@/hooks/useSubscription";

interface SubscriptionBadgeProps {
  /** Mostra link de upgrade para FREE */
  showUpgradeLink?: boolean;
}

/**
 * Badge visual que indica o tier do usuário.
 * Usado no Header e Sidebar para reforço visual constante.
 *
 * - FREE: badge neutro com micro-CTA "Upgrade"
 * - PREMIUM: badge dourado com ícone de coroa
 */
export function SubscriptionBadge({ showUpgradeLink = true }: SubscriptionBadgeProps) {
  const { tier, isLoading } = useSubscription();

  if (isLoading) {
    return (
      <div className="h-5 w-16 rounded-md bg-surface animate-pulse" />
    );
  }

  if (tier === "PREMIUM") {
    return (
      <div className="flex items-center gap-1.5">
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-gradient-to-r from-amber-500/20 to-yellow-400/20 border border-amber-500/30">
          <Crown size={10} className="text-amber-400" />
          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Pro</span>
        </span>
      </div>
    );
  }

  // FREE
  return (
    <div className="flex items-center gap-2">
      <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface border border-border">
        <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Free</span>
      </span>
      {showUpgradeLink && (
        <Link
          href="/planos"
          className="flex items-center gap-1 text-[10px] font-bold text-amber-400 hover:text-amber-300 transition-colors"
        >
          <Sparkles size={10} />
          Upgrade
        </Link>
      )}
    </div>
  );
}
