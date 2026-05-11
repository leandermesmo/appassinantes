"use client";

import React, { useState, useEffect } from "react";
import { 
  TrendingUp, 
  Search, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Activity, 
  BarChart3, 
  Clock, 
  Info,
  ChevronDown,
  RefreshCw,
  Zap,
  Star
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { MarketService } from "@/services/market.service";
import { MarketAnalysisResponse } from "@/types/market";

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

function formatUTCDate(ts: number, showYear = false) {
  const d = new Date(ts);
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const year = String(d.getUTCFullYear()).slice(-2);
  return showYear ? `${day}/${month}/${year}` : `${day}/${month}`;
}

export default function TechnicalAnalysisPage() {
  const [selectedSymbol, setSelectedSymbol] = useState("BTCUSDT");
  const [timeframe, setTimeframe] = useState("1d");
  const [isLoading, setIsLoading] = useState(false);
  const [historyData, setHistoryData] = useState<MarketAnalysisResponse | null>(null);
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchHistory();
  }, [selectedSymbol]);

  const fetchHistory = async () => {
    try {
      const data = await MarketService.getAnalysis(selectedSymbol, "1d");
      setHistoryData(data);
    } catch (error) {
      console.error("Erro ao buscar histórico:", error);
    }
  };

  const paginatedData = (historyData?.indicators || []).slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const totalPages = Math.ceil((historyData?.indicators.length || 0) / itemsPerPage);

  // Simulação de dados (em um cenário real viria da API)
  const analysisData = {
    price: 64235.50,
    change24h: 2.45,
    status: "Compra Forte",
    indicators: [
      { 
        name: "RSI MA", 
        type: "Média", 
        tf: { "15m": "Baixa", "1h": "Neutro", "4h": "Alta", "1d": "Alta", "1w": "Alta", "1M": "Alta" }
      },
      { 
        name: "RSI", 
        type: "Oscilador", 
        tf: { "15m": "Venda", "1h": "Neutro", "4h": "Compra", "1d": "Compra", "1w": "Compra Forte", "1M": "Compra" }
      },
      { 
        name: "StochRSI K", 
        type: "Oscilador", 
        tf: { "15m": "Venda", "1h": "Venda", "4h": "Neutro", "1d": "Alta", "1w": "Alta", "1M": "Alta" }
      },
      { 
        name: "StochRSI D", 
        type: "Oscilador", 
        tf: { "15m": "Venda", "1h": "Venda", "4h": "Baixa", "1d": "Alta", "1w": "Alta", "1M": "Alta" }
      },
      { 
        name: "EMA (24)", 
        type: "Média", 
        tf: { "15m": "Abaixo", "1h": "Acima", "4h": "Acima", "1d": "Acima", "1w": "Acima", "1M": "Acima" }
      },
      { 
        name: "EMA (168)", 
        type: "Média", 
        tf: { "15m": "Abaixo", "1h": "Abaixo", "4h": "Abaixo", "1d": "Acima", "1w": "Acima", "1M": "Acima" }
      },
      { 
        name: "MACD", 
        type: "Tendência", 
        tf: { "15m": "Baixa", "1h": "Neutro", "4h": "Alta", "1d": "Alta", "1w": "Alta", "1M": "Alta" }
      },
    ],
    timeframes: [
      { label: "15m", status: "Venda", color: "text-danger" },
      { label: "1h", status: "Neutro", color: "text-text-muted" },
      { label: "4h", status: "Compra", color: "text-success" },
      { label: "1d", status: "Compra Forte", color: "text-success" },
      { label: "1w", status: "Compra", color: "text-success" },
    ]
  };

  const getStatusColor = (status: string) => {
    if (!status) return "text-text-muted bg-surface";
    const s = status.toLowerCase();
    if (s.includes("compra") || s === "alta" || s === "acima") return "text-success bg-success/10";
    if (s.includes("venda") || s === "baixa" || s === "abaixo" || s === "sobrecomprado") return "text-danger bg-danger/10";
    return "text-text-muted bg-surface";
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header da Análise */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-surface/30 border border-border/40 p-6 rounded-3xl backdrop-blur-md">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-primary/20">
            <TrendingUp size={32} strokeWidth={2.5} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-3xl font-black tracking-tight text-text-main">
                {selectedSymbol}
              </h1>
              <button className="p-1.5 text-text-muted hover:text-amber-400 transition-colors">
                <Star size={20} />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold font-mono text-text-main">
                ${analysisData.price.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
              <span className={cn(
                "flex items-center gap-1 text-sm font-bold px-2 py-0.5 rounded-lg",
                analysisData.change24h >= 0 ? "text-success bg-success/10" : "text-danger bg-danger/10"
              )}>
                {analysisData.change24h >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
                {Math.abs(analysisData.change24h)}%
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group min-w-[200px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Buscar ativo..."
              className="w-full bg-background border border-border/40 rounded-2xl py-3 pl-12 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
            />
          </div>
          
          <div className="flex bg-background border border-border/40 rounded-2xl p-1">
            {["15m", "1h", "4h", "1d", "1w"].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                  timeframe === tf 
                    ? "bg-primary text-white shadow-lg shadow-primary/20" 
                    : "text-text-muted hover:text-text-main hover:bg-surface"
                )}
              >
                {tf.toUpperCase()}
              </button>
            ))}
          </div>

          <button className="p-3 bg-surface border border-border/40 rounded-2xl text-text-muted hover:text-primary transition-all hover:border-primary/40">
            <RefreshCw size={20} />
          </button>
        </div>
      </div>

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Coluna da Esquerda: Resumo e Nota Informativa */}
        <div className="space-y-8 lg:h-[600px] lg:flex lg:flex-col lg:space-y-0 lg:gap-8">
          {/* Status Geral */}
          <div className="bg-surface/30 border border-border/40 rounded-3xl p-6 relative overflow-hidden group shrink-0">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
              <Zap size={80} className="text-primary" />
            </div>
            <h3 className="text-sm font-bold text-text-muted uppercase tracking-widest mb-6 flex items-center gap-2">
              <Activity size={16} className="text-primary" />
              Sentimento do Mercado
            </h3>
            <div className="text-center py-4">
              <div className="text-4xl font-black text-success mb-2 drop-shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                {analysisData.status.toUpperCase()}
              </div>
              <p className="text-xs text-text-muted font-medium">Baseado em 24 indicadores técnicos</p>
            </div>
          </div>

          {/* Nota Informativa da Tendência */}
          <div className="bg-surface/30 border border-border/40 rounded-3xl p-6 flex flex-col flex-1 overflow-hidden">
            <h3 className="text-sm font-bold text-text-muted uppercase tracking-widest mb-6 flex items-center gap-2">
              <Info size={16} className="text-primary" />
              Análise de Tendência
            </h3>
            
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
              <div className="p-4 bg-background/50 border border-border/20 rounded-2xl border-l-4 border-l-primary">
                <p className="text-text-main text-sm font-semibold mb-2">Perspectiva Técnica</p>
                <p className="text-text-muted text-xs leading-relaxed">
                  O ativo <span className="text-primary font-bold">{selectedSymbol}</span> apresenta uma estrutura de {analysisData.status === "Compra Forte" ? "alta robusta" : "tendência definida"} no curto prazo. O preço encontra-se sustentado por médias móveis importantes, sugerindo continuidade do movimento atual enquanto o suporte principal for respeitado.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-success/5 border border-success/10 rounded-xl">
                  <p className="text-[10px] font-bold text-success uppercase mb-1">Suporte Imediato</p>
                  <p className="text-sm font-mono text-text-main">${(analysisData.price * 0.98).toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="p-3 bg-danger/5 border border-danger/10 rounded-xl">
                  <p className="text-[10px] font-bold text-danger uppercase mb-1">Resistência Chave</p>
                  <p className="text-sm font-mono text-text-main">${(analysisData.price * 1.05).toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Pontos de Atenção</p>
                <div className="flex items-start gap-3">
                  <div className="mt-1 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  <p className="text-xs text-text-muted leading-snug">RSI em {analysisData.indicators[0].tf["1d"]} indica força no período selecionado.</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  <p className="text-xs text-text-muted leading-snug">O volume de negociação permanece consistente, validando a força do {analysisData.status.toLowerCase()}.</p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border/20">
              <div className="flex items-center justify-between text-[10px] font-bold text-text-muted">
                <span>ÚLTIMA ATUALIZAÇÃO</span>
                <span className="text-text-main uppercase">HÁ 5 MINUTOS</span>
              </div>
            </div>
          </div>
        </div>

        {/* Coluna Central/Direita: Widget de Gráfico (TradingView) */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-surface/30 border border-border/40 rounded-3xl overflow-hidden h-[600px] relative flex flex-col shadow-2xl">
            <div className="p-4 border-b border-border/40 bg-surface/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 size={18} className="text-primary" />
                <span className="text-sm font-bold text-text-main">Gráfico Avançado TradingView</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-success bg-success/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Activity size={10} /> LIVE
                </span>
              </div>
            </div>
            
            {/* Widget do TradingView */}
            <div className="flex-1 bg-[#131722] relative">
              <div id="tradingview_chart" className="w-full h-full" />
              <TradingViewWidget symbol={selectedSymbol} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Indicadores Detalhada */}
      <div className="bg-surface/30 border border-border/40 rounded-3xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
            <Info size={16} className="text-primary" />
            Detalhes dos Indicadores
          </h3>
          <button className="text-[10px] font-bold text-primary hover:underline">VER TODOS</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-border/40">
                <th className="pb-4 text-[10px] font-bold text-text-muted uppercase tracking-wider">Indicador</th>
                <th className="pb-4 text-[10px] font-bold text-text-muted uppercase tracking-wider">Tipo</th>
                {["15m", "1h", "4h", "1d", "1w", "1M"].map(tf => (
                  <th key={tf} className="pb-4 text-[10px] font-bold text-text-muted uppercase tracking-wider text-center">{tf}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {analysisData.indicators.map((ind, i) => (
                <tr key={i} className="group hover:bg-white/5 transition-colors">
                  <td className="py-4 font-bold text-text-main text-sm">{ind.name}</td>
                  <td className="py-4">
                    <span className="text-[10px] font-bold text-text-muted bg-surface px-2 py-1 rounded-md">
                      {ind.type.toUpperCase()}
                    </span>
                  </td>
                  {["15m", "1h", "4h", "1d", "1w", "1M"].map(tf => (
                    <td key={tf} className="py-4 text-center">
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-1 rounded-lg inline-block min-w-[70px]",
                        getStatusColor((ind.tf as any)[tf])
                      )}>
                        {(ind.tf as any)[tf] || "-"}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>



    </div>
  );
}

function TrendBadge({ trend }: { trend: "Alta" | "Baixa" }) {
  const isHigh = trend === "Alta";
  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all",
      isHigh 
        ? "bg-success/10 text-success border border-success/20" 
        : "bg-danger/10 text-danger border border-danger/20"
    )}>
      {trend}
    </span>
  );
}

// Componente para renderizar o Widget do TradingView
function TradingViewWidget({ symbol }: { symbol: string }) {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = () => {
      if (typeof (window as any).TradingView !== "undefined") {
        new (window as any).TradingView.widget({
          autosize: true,
          symbol: `BINANCE:${symbol}`,
          interval: "D",
          timezone: "Etc/UTC",
          theme: "dark",
          style: "1",
          locale: "br",
          toolbar_bg: "#131722",
          enable_publishing: false,
          hide_side_toolbar: false,
          allow_symbol_change: true,
          container_id: "tradingview_chart",
        });
      }
    };
    document.head.appendChild(script);

    return () => {
      // Limpeza opcional se necessário
    };
  }, [symbol]);

  return null;
}
