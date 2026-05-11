"use client";

import React from "react";
import { Lock, Crown, ArrowRight } from "lucide-react";
import Link from "next/link";

interface BlurBlockProps {
  /** Mensagem principal exibida sobre o blur */
  message?: string;
  /** Subtítulo descritivo */
  subtitle?: string;
  /** Texto do botão CTA */
  ctaText?: string;
  /** Link do CTA (padrão: /planos) */
  ctaHref?: string;
  /** Conteúdo que será exibido com blur por baixo (opcional) */
  children?: React.ReactNode;
  /** Altura mínima quando não há children */
  minHeight?: string;
  /** Variante visual */
  variant?: "default" | "compact" | "inline";
}

/**
 * Componente de bloqueio premium com blur.
 *
 * Exibe conteúdo parcialmente visível sob um overlay com blur,
 * acompanhado de mensagem e CTA de upgrade. Projetado para criar
 * desejo sem frustração — o usuário vê que existe valor, mas
 * precisa assinar para acessar.
 */
export function BlurBlock({
  message = "Conteúdo exclusivo Premium",
  subtitle = "Desbloqueie acesso completo a todos os indicadores e sinais.",
  ctaText = "Desbloquear com Premium",
  ctaHref = "/planos",
  children,
  minHeight = "200px",
  variant = "default",
}: BlurBlockProps) {
  if (variant === "inline") {
    return (
      <div className="relative inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface/60 border border-border/40">
        <Lock size={12} className="text-amber-400" />
        <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Premium</span>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className="relative overflow-hidden rounded-xl">
        {/* Conteúdo blurrado */}
        {children && (
          <div className="blur-[6px] pointer-events-none select-none opacity-40">
            {children}
          </div>
        )}
        {/* Overlay */}
        <div
          className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[2px]"
          style={{ minHeight: children ? undefined : minHeight }}
        >
          <Link
            href={ctaHref}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-black rounded-lg text-xs font-bold hover:scale-105 active:scale-95 transition-all shadow-lg shadow-amber-500/20"
          >
            <Lock size={14} />
            {ctaText}
          </Link>
        </div>
      </div>
    );
  }

  // Variante default
  return (
    <div className="relative overflow-hidden rounded-2xl" style={{ minHeight: children ? undefined : minHeight }}>
      {/* Conteúdo blurrado por baixo — mostra que existe valor */}
      {children && (
        <div className="blur-[8px] pointer-events-none select-none opacity-30 saturate-50">
          {children}
        </div>
      )}

      {/* Overlay com gradiente + glassmorphism */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background/90 backdrop-blur-[3px] flex flex-col items-center justify-center p-8 text-center">
        {/* Ícone de cadeado premium */}
        <div className="relative mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-400/10 border border-amber-500/20 flex items-center justify-center upgrade-glow">
            <Crown size={28} className="text-amber-400" />
          </div>
          {/* Glow animado */}
          <div className="absolute inset-0 w-16 h-16 rounded-2xl bg-amber-500/10 animate-pulse" />
        </div>

        {/* Mensagem */}
        <h3 className="text-lg font-bold text-white mb-2">{message}</h3>
        <p className="text-sm text-text-muted max-w-sm mb-6">{subtitle}</p>

        {/* CTA */}
        <Link
          href={ctaHref}
          className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-400 text-black rounded-xl text-sm font-bold hover:scale-105 active:scale-95 transition-all shadow-xl shadow-amber-500/20 shimmer"
        >
          <Lock size={16} />
          {ctaText}
          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </Link>

        {/* Indicador de features */}
        <p className="text-[10px] text-text-muted mt-4 uppercase tracking-widest font-bold">
          Acesso instantâneo após pagamento
        </p>
      </div>
    </div>
  );
}
