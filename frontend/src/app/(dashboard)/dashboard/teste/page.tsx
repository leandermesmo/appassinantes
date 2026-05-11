"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  TrendingUp, 
  Activity, 
  Clock, 
  RefreshCw,
  Search,
  ChevronDown,
  BarChart3,
  Calendar
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { MarketService } from "@/services/market.service";
import { IndicatorResult } from "@/types/market";

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

const TIMEFRAMES = [
  { label: "15m", value: "15m" },
  { label: "1h", value: "1h" },
  { label: "4h", value: "4h" },
  { label: "1d", value: "1d" },
  { label: "1w", value: "1w" },
  { label: "1M", value: "1M" },
];

export default function TestePage() {
  const [symbols, setSymbols] = useState<string[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState("BTCUSDT");
  const [selectedTimeframe, setSelectedTimeframe] = useState("1d");
  const [data, setData] = useState<IndicatorResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchData = useCallback(async (quiet = false) => {
    if (!quiet) setIsLoading(true);
    setIsRefreshing(true);
    try {
      const response = await MarketService.getAnalysis(selectedSymbol, selectedTimeframe);
      if (response.indicators && response.indicators.length > 0) {
        // Pega o dado mais recente (o primeiro do array, já que vem invertido do service)
        setData(response.indicators[0]);
      }
      setLastRefresh(new Date());
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedSymbol, selectedTimeframe]);

  useEffect(() => {
    async function loadSymbols() {
      try {
        const sysSymbols = await MarketService.getSystemSymbols();
        setSymbols(sysSymbols);
        if (sysSymbols.length > 0 && !sysSymbols.includes(selectedSymbol)) {
          setSelectedSymbol(sysSymbols[0]);
        }
      } catch (error) {
        console.error("Erro ao carregar símbolos:", error);
        setSymbols(["BTCUSDT", "ETHUSDT"]);
      }
    }
    loadSymbols();
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 10000); // Sincronizado para 10 segundos
    return () => clearInterval(interval);
  }, [fetchData]);

  const formatValue = (val: number | undefined) => {
    if (val === undefined) return "--";
    return val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 8 });
  };

  const formatDate = (ts: number | undefined) => {
    if (!ts) return "--";
    return new Date(ts).toLocaleString("pt-BR");
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-2 premium-gradient">
            Ambiente de Teste
          </h1>
          <p className="text-text-muted flex items-center gap-2 text-sm font-medium">
            <Activity size={14} className="text-primary" />
            Monitoramento de dados técnicos em tempo real
          </p>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-bold text-text-muted bg-surface/50 border border-border/40 px-3 py-1.5 rounded-full">
          <Clock size={12} />
          SINCRO: 10s
          {isRefreshing && <RefreshCw size={12} className="animate-spin ml-1 text-primary" />}
        </div>
      </div>

      {/* Selectors */}
      <div className="flex flex-wrap items-center gap-4 bg-surface/30 border border-border/40 p-4 rounded-3xl backdrop-blur-md">
        <div className="flex-1 min-w-[200px] relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={18} />
          <select
            value={selectedSymbol}
            onChange={(e) => setSelectedSymbol(e.target.value)}
            className="w-full bg-background border border-border/40 rounded-2xl py-3 pl-12 pr-10 text-sm font-bold appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
          >
            {symbols.map(s => s && (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" size={16} />
        </div>

        <div className="flex bg-background border border-border/40 rounded-2xl p-1">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.value}
              onClick={() => setSelectedTimeframe(tf.value)}
              className={cn(
                "px-5 py-2.5 rounded-xl text-xs font-black transition-all uppercase tracking-wider",
                selectedTimeframe === tf.value 
                  ? "bg-primary text-white shadow-lg shadow-primary/20" 
                  : "text-text-muted hover:text-text-main hover:bg-surface"
              )}
            >
              {tf.label}
            </button>
          ))}
        </div>

        <button 
          onClick={() => fetchData()}
          disabled={isRefreshing}
          className="p-3 bg-primary/10 text-primary border border-primary/20 rounded-2xl hover:bg-primary/20 transition-all active:scale-95 disabled:opacity-50"
        >
          <RefreshCw size={20} className={cn(isRefreshing && "animate-spin")} />
        </button>
      </div>

      {/* Main Card */}
      <div className="max-w-4xl mx-auto">
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-indigo-500/50 rounded-[2.5rem] blur opacity-20 group-hover:opacity-40 transition duration-1000" />
          
          <div className="relative bg-[#0f1115] border border-border/40 rounded-[2.5rem] overflow-hidden shadow-2xl">
            {/* Card Header */}
            <div className="p-8 border-b border-border/20 bg-gradient-to-r from-surface/50 to-transparent flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <BarChart3 size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-text-main">{selectedSymbol}</h2>
                  <p className="text-xs font-bold text-text-muted uppercase tracking-[0.2em]">{selectedTimeframe} ANALYSIS</p>
                </div>
              </div>
              <div className={cn("text-right transition-all duration-500", isRefreshing && "opacity-50 blur-[1px]")}>
                <div className="text-3xl font-black text-text-main font-mono">
                  ${formatValue(data?.close)}
                </div>
                <div className="flex items-center justify-end gap-1 text-[10px] font-bold text-success mt-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                  SINCRO: 10s
                </div>
              </div>
            </div>

            {/* Card Content */}
            <div className="p-8">
              {isLoading && !data ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                  <p className="text-sm font-bold text-text-muted animate-pulse">SINCRONIZANDO DADOS...</p>
                </div>
              ) : (
                <div className={cn(
                  "grid grid-cols-1 md:grid-cols-2 gap-8 transition-all duration-500",
                  isRefreshing && "opacity-50 blur-[1px] scale-[0.99]"
                )}>
                  {/* Market Data */}
                  <div className="space-y-6">
                    <h3 className="text-xs font-black text-text-muted uppercase tracking-[0.2em] flex items-center gap-2">
                      <Calendar size={14} className="text-primary" />
                      Dados de Mercado
                    </h3>
                    <div className="space-y-4">
                      <DataItem label="Data" value={formatDate(data?.time)} />
                      <DataItem label="Abertura" value={`$${formatValue(data?.open)}`} />
                      <DataItem label="Máxima" value={`$${formatValue(data?.high)}`} highlight="text-success" />
                      <DataItem label="Mínima" value={`$${formatValue(data?.low)}`} highlight="text-danger" />
                      <DataItem label="Fechamento" value={`$${formatValue(data?.close)}`} highlight="text-primary font-black" />
                    </div>
                  </div>

                  {/* Technical Indicators */}
                  <div className="space-y-6">
                    <h3 className="text-xs font-black text-text-muted uppercase tracking-[0.2em] flex items-center gap-2">
                      <TrendingUp size={14} className="text-primary" />
                      Indicadores Técnicos
                    </h3>
                    <div className="space-y-4">
                      <DataItem label="RSI K" value={formatValue(data?.stochK)} />
                      <DataItem label="RSI D" value={formatValue(data?.stochD)} />
                      <DataItem label="RSI" value={formatValue(data?.rsi)} highlight={data && data.rsi > 70 ? "text-danger" : data && data.rsi < 30 ? "text-success" : ""} />
                      <DataItem label="RSI MA" value={formatValue(data?.rsiMa)} />
                      
                      <div className="mt-8 p-4 bg-primary/5 border border-primary/10 rounded-2xl">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-text-muted uppercase">Tendência</span>
                          <span className={cn(
                            "text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest transition-all",
                            data?.trend === "Alta" ? "bg-success/20 text-success" : "bg-danger/20 text-danger"
                          )}>
                            {data?.trend || "NEUTRO"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Card Footer */}
            <div className="p-6 bg-surface/20 border-t border-border/20 text-center">
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                Powered by AppCrypto Intelligence Engine
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DataItem({ label, value, highlight = "" }: { label: string, value: string, highlight?: string }) {
  return (
    <div className="flex justify-between items-center border-b border-border/10 pb-2 group/item">
      <span className="text-sm font-bold text-text-muted group-hover/item:text-text-main transition-colors">{label}</span>
      <span className={cn("text-sm font-mono font-bold text-text-main", highlight)}>{value}</span>
    </div>
  );
}
