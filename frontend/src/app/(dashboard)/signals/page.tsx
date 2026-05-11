"use client";

import React, { useState } from "react";
import { Zap, History, Filter, RefreshCw, AlertCircle, Lock } from "lucide-react";
import { useSignals } from "../../../hooks/useSignals";
import { useSubscription } from "../../../hooks/useSubscription";
import { SignalCard } from "../../../components/dashboard/SignalCard";
import { PremiumGate } from "../../../components/ui/PremiumGate";
import { BlurBlock } from "../../../components/ui/BlurBlock";
import { UpgradeCTA } from "../../../components/ui/UpgradeCTA";

export default function SignalsPage() {
  const { signals, isLoading, error, refresh } = useSignals();
  const { isPremium, isFree, isTimeframeAllowed } = useSubscription();
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("all");

  const timeframes = [
    { id: "all", label: "Todos" },
    { id: "1h", label: "1 Hora" },
    { id: "4h", label: "4 Horas" },
    { id: "1d", label: "Diário" },
  ];

  const filteredSignals = selectedTimeframe === "all" 
    ? signals 
    : signals.filter(s => s.timeframe === selectedTimeframe);

  const highlights = signals.filter(s => s.signal === 'STRONG_BUY' || s.signal === 'STRONG_SELL');

  return (
    <div className="space-y-10 pb-10 animate-in fade-in duration-700">
      {/* Banner de upgrade para FREE */}
      {isFree && (
        <UpgradeCTA
          variant="banner"
          title="Sinais limitados no plano gratuito"
          description="Você está vendo apenas o BTC. Desbloqueie todos os ativos e timeframes."
          buttonText="Desbloquear Sinais"
        />
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-2 premium-gradient">
            Sinais de Mercado
          </h1>
          <p className="text-text-muted flex items-center gap-2 text-sm">
            <Zap size={14} className="text-yellow-400" />
            {isPremium
              ? "Lógica de confluência avançada processada em tempo real"
              : "Visualização limitada — apenas BTC no timeframe diário"
            }
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => refresh()}
            className="p-2 text-text-muted hover:text-primary transition-colors bg-surface rounded-lg border border-border"
          >
            <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
          </button>
          <div className="flex items-center gap-1 bg-surface p-1 rounded-xl border border-border">
            {timeframes.map(tf => {
              const allowed = tf.id === "all" || isTimeframeAllowed(tf.id);
              return (
                <button
                  key={tf.id}
                  onClick={() => allowed && setSelectedTimeframe(tf.id)}
                  disabled={!allowed}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    !allowed
                      ? "text-text-muted/30 cursor-not-allowed"
                      : selectedTimeframe === tf.id 
                        ? "bg-primary text-white shadow-lg shadow-primary/20" 
                        : "text-text-muted hover:text-text-main"
                  }`}
                >
                  {tf.label}
                  {!allowed && <Lock size={10} className="text-amber-400/60" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Destaques Estratégicos — bloqueados para FREE */}
      {selectedTimeframe === "all" && (
        <PremiumGate
          showPreview
          message="Oportunidades de Ouro"
          subtitle="Sinais STRONG_BUY e STRONG_SELL com alta confiança."
        >
          {highlights.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2 px-1 text-primary">
                <Zap size={18} fill="currentColor" />
                <h2 className="text-lg font-bold">Oportunidades de Ouro</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {highlights.map((s) => (
                  <SignalCard key={`${s.symbol}-${s.timeframe}-h`} {...s} />
                ))}
              </div>
            </section>
          )}
        </PremiumGate>
      )}

      {/* Grid de Sinais */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-primary" />
            <h2 className="text-lg font-bold">Monitor de Sinais</h2>
          </div>
          <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest">
            {filteredSignals.length} {isFree ? "de 27+" : ""} Ativos Monitorados
          </p>
        </div>

        {error ? (
          <div className="p-10 text-center glass-panel border-rose-500/20 bg-rose-500/5">
            <AlertCircle className="mx-auto text-rose-500 mb-4" size={40} />
            <p className="text-rose-400 font-bold">Erro ao carregar sinais</p>
            <p className="text-xs text-text-muted mt-2">{error}</p>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-50">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-48 bg-surface animate-pulse rounded-xl border border-border" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSignals.map((s) => (
                <SignalCard key={`${s.symbol}-${s.timeframe}`} {...s} />
              ))}
            </div>

            {/* Placeholder de sinais bloqueados para FREE */}
            {isFree && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                {/* Sinais fantasma com blur para criar desejo */}
                {["ETH/USDT • 1d", "SOL/USDT • 4h", "BNB/USDT • 1h", "ADA/USDT • 1d", "XRP/USDT • 4h"].map((label) => (
                  <div key={label} className="relative h-48 rounded-xl overflow-hidden">
                    <div className="absolute inset-0 bg-surface border border-border rounded-xl p-5">
                      <div className="flex justify-between mb-4">
                        <div className="h-4 w-24 bg-border/40 rounded" />
                        <div className="h-4 w-12 bg-border/40 rounded" />
                      </div>
                      <div className="h-3 w-full bg-border/20 rounded mb-3" />
                      <div className="h-3 w-3/4 bg-border/20 rounded mb-6" />
                      <div className="flex gap-2">
                        <div className="h-6 w-16 bg-border/30 rounded" />
                        <div className="h-6 w-16 bg-border/30 rounded" />
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-background/60 backdrop-blur-[4px] flex items-center justify-center">
                      <div className="text-center">
                        <Lock size={16} className="text-amber-400 mx-auto mb-1" />
                        <p className="text-[10px] font-bold text-text-muted">{label}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {/* Footer Informativo */}
      <div className="p-6 rounded-2xl glass-panel border-primary/10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <History size={24} />
          </div>
          <div>
            <h3 className="font-bold">Histórico de Performance</h3>
            <p className="text-xs text-text-muted">Veja como nossa estratégia se comportou nos últimos 30 dias.</p>
          </div>
        </div>
        {isPremium ? (
          <button className="px-6 py-3 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary-hover transition-all shadow-lg shadow-primary/20">
            Acessar Relatório Completo
          </button>
        ) : (
          <BlurBlock variant="compact" ctaText="Relatório Premium">
            <button className="px-6 py-3 bg-primary text-white rounded-xl text-xs font-bold">
              Acessar Relatório Completo
            </button>
          </BlurBlock>
        )}
      </div>
    </div>
  );
}
