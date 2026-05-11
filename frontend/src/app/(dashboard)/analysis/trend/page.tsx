"use client";

import React from "react";
import { TrendAnalysisCard } from "@/components/dashboard/TrendAnalysisCard";
import { Activity, TrendingUp } from "lucide-react";

const trendData = [
  { timeframe: "15m", label: "Forte Alta", score: 82, confidence: "Alta", description: "Momentum crescente, volatilidade moderada no intraday." },
  { timeframe: "1h", label: "Alta", score: 74, confidence: "Alta", description: "Tendência consistente com baixa divergência nos indicadores." },
  { timeframe: "4h", label: "Alta", score: 68, confidence: "Média", description: "Consolidação saudável acima das médias móveis principais." },
  { timeframe: "1d", label: "Lateral", score: 52, confidence: "Média", description: "Aguardando confirmação de volume para definição de direção." },
  { timeframe: "1w", label: "Baixa", score: 34, confidence: "Alta", description: "Rejeição forte em zona de resistência histórica semanal." },
  { timeframe: "1M", label: "Forte Baixa", score: 21, confidence: "Alta", description: "Tendência macro de baixa consolidada em múltiplos níveis." }
] as const;

export default function TrendAnalysisPage() {
  return (
    <div className="space-y-10 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-[0.2em] mb-1">
          <TrendingUp size={14} className="animate-pulse" />
          Análise de Mercado
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-text-main premium-gradient">
              Análise de Tendência
            </h1>
            <p className="text-text-muted text-sm mt-2 max-w-2xl leading-relaxed">
              Visão consolidada da tendência por múltiplos timeframes. Use esta visão para identificar convergências de tendência e evitar operações contra o momentum principal.
            </p>
          </div>
          
          <div className="flex items-center gap-3 bg-surface/40 backdrop-blur-md border border-white/5 p-2 rounded-2xl">
            <div className="flex flex-col items-end px-3">
              <span className="text-[10px] font-bold text-text-muted uppercase">Ativo Analisado</span>
              <span className="text-sm font-black text-text-main tracking-tight">BTC/USDT</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-lg shadow-primary/10">
              <Activity size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {trendData.map((data) => (
          <TrendAnalysisCard
            key={data.timeframe}
            timeframe={data.timeframe}
            pair="BTC/USDT"
            label={data.label}
            score={data.score}
            confidence={data.confidence}
            description={data.description}
          />
        ))}
      </div>

      {/* Info Section (Opcional, para dar profundidade ao design) */}
      <div className="bg-gradient-to-r from-surface to-transparent border-l-4 border-primary p-6 rounded-r-2xl">
        <h4 className="text-sm font-bold text-text-main mb-1">Como interpretar o Score Técnico?</h4>
        <p className="text-xs text-text-muted leading-relaxed">
          O score é calculado com base em uma combinação de indicadores de momentum (RSI, Stochastic), tendência (Médias Móveis, ADX) e volume. 
          Scores acima de 70 indicam força compradora dominante, enquanto abaixo de 30 sugerem dominância vendedora.
        </p>
      </div>
    </div>
  );
}
