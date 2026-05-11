"use client";

import React from "react";
import Link from "next/link";
import { Crown, ArrowRight, Sparkles, Zap } from "lucide-react";

type CTAVariant = "card" | "banner" | "inline" | "floating";

interface UpgradeCTAProps {
  /** Variante visual do CTA */
  variant?: CTAVariant;
  /** Título do CTA */
  title?: string;
  /** Descrição curta */
  description?: string;
  /** Texto do botão */
  buttonText?: string;
  /** Link de destino */
  href?: string;
  /** Métricas de "o que você está perdendo" */
  metrics?: { label: string; value: string }[];
}

/**
 * Componente CTA de upgrade reutilizável com múltiplas variantes.
 * Usado em diversas seções do dashboard para incentivar conversão.
 */
export function UpgradeCTA({
  variant = "card",
  title = "Desbloqueie o potencial completo",
  description = "Acesse todos os indicadores, sinais e ativos com o plano Premium.",
  buttonText = "Assinar Premium",
  href = "/planos",
  metrics,
}: UpgradeCTAProps) {
  if (variant === "inline") {
    return (
      <Link
        href={href}
        className="group inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500/10 to-yellow-400/10 border border-amber-500/20 rounded-lg text-amber-400 text-xs font-bold hover:from-amber-500/20 hover:to-yellow-400/20 transition-all"
      >
        <Crown size={14} />
        <span>{buttonText}</span>
        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
      </Link>
    );
  }

  if (variant === "banner") {
    return (
      <div className="relative overflow-hidden bg-gradient-to-r from-amber-500/10 via-yellow-400/5 to-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="absolute inset-0 shimmer" />
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <Sparkles size={20} className="text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">{title}</p>
            <p className="text-[11px] text-text-muted">{description}</p>
          </div>
        </div>
        <Link
          href={href}
          className="relative z-10 flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-black rounded-xl text-xs font-bold hover:scale-105 active:scale-95 transition-all shadow-lg shadow-amber-500/20 whitespace-nowrap"
        >
          <Crown size={14} />
          {buttonText}
        </Link>
      </div>
    );
  }

  if (variant === "floating") {
    return (
      <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 duration-500">
        <Link
          href={href}
          className="group flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-400 text-black rounded-2xl text-sm font-bold hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-amber-500/30 upgrade-glow"
        >
          <Crown size={18} />
          <span>{buttonText}</span>
          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    );
  }

  // Variante "card" (default)
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600/20 via-primary/10 to-amber-500/10 border border-amber-500/20 rounded-2xl p-6 group hover:border-amber-500/40 transition-all">
      {/* Background decorativo */}
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
        <Crown size={80} />
      </div>
      <div className="absolute inset-0 shimmer" />

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <Zap size={18} className="text-amber-400" fill="currentColor" />
          <h3 className="text-lg font-bold text-white">{title}</h3>
        </div>
        <p className="text-sm text-text-muted mb-4 max-w-sm">{description}</p>

        {/* Métricas de "o que você está perdendo" */}
        {metrics && metrics.length > 0 && (
          <div className="grid grid-cols-2 gap-3 mb-5">
            {metrics.map((m) => (
              <div key={m.label} className="bg-background/40 rounded-xl p-3 border border-border/20">
                <p className="text-lg font-black text-amber-400">{m.value}</p>
                <p className="text-[10px] text-text-muted uppercase tracking-widest font-bold">{m.label}</p>
              </div>
            ))}
          </div>
        )}

        <Link
          href={href}
          className="group/btn flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-400 text-black rounded-xl text-sm font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-amber-500/20"
        >
          <Crown size={16} />
          {buttonText}
          <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
