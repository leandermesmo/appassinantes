"use client";

import React, { useState, useEffect } from "react";
import { 
  Search, 
  ChevronRight, 
  ChevronLeft, 
  Filter, 
  ArrowUpRight, 
  ArrowDownRight,
  TrendingUp,
  Activity,
  BarChart2,
  Clock,
  Lock
} from "lucide-react";
import { MarketService } from "@/services/market.service";
import { IndicatorResult, MarketAnalysisResponse } from "@/types/market";
import { useSubscription } from "@/hooks/useSubscription";
import { BlurBlock } from "@/components/ui/BlurBlock";
import { UpgradeCTA } from "@/components/ui/UpgradeCTA";
import { clsx } from "clsx";

function cn(...inputs: Parameters<typeof clsx>) {
  return clsx(inputs);
}

function formatDate(ts: number, showYear = false, showTime = false) {
  try {
    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: '2-digit',
      timeZone: 'America/Sao_Paulo',
    };

    if (showYear) options.year = '2-digit';
    if (showTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
      options.hour12 = false;
    }

    return new Intl.DateTimeFormat('pt-BR', options).format(new Date(Number(ts)));
  } catch (e) {
    console.error("Erro ao formatar data:", e);
    return "--/--";
  }
}

export default function HistoryPage() {
  const { isPremium, isFree, isSymbolAllowed, isTimeframeAllowed } = useSubscription();

  const [symbol, setSymbol] = useState("BTCUSDT");
  const [interval, setInterval] = useState("1d");
  const [symbolSearch, setSymbolSearch] = useState("");
  const [tableFilter, setTableFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mainData, setMainData] = useState<MarketAnalysisResponse | null>(null);
  const [shortTerm, setShortTerm] = useState<IndicatorResult | null>(null);
  const [mediumTerm, setMediumTerm] = useState<IndicatorResult | null>(null);
  const [longTerm, setLongTerm] = useState<IndicatorResult | null>(null);
  
  const [allSymbols, setAllSymbols] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  /** Info sobre limitação de dados retornados pelo backend */
  const [totalAvailable, setTotalAvailable] = useState<number | null>(null);

  useEffect(() => {
    MarketService.getSystemSymbols().then(setAllSymbols);
  }, []);


  useEffect(() => {
    fetchData();
  }, [symbol, interval]);

  useEffect(() => {
    setPage(1);
  }, [tableFilter]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    setTotalAvailable(null);
    try {
      // Busca dados históricos do banco de dados (candles + indicadores consolidados)
      const historyResponse = await MarketService.getHistory(symbol, interval);
      const historyData = historyResponse.data;
      setMainData(historyData);

      // Captura totalAvailable se o backend informou (Freemium)
      const anyResponse = historyResponse as unknown as Record<string, unknown>;
      const anyData = anyResponse.data as Record<string, unknown> | undefined;
      if (anyData?.totalAvailable) {
        setTotalAvailable(anyData.totalAvailable as number);
      }

      // Cards de análise multi-timeframe — usa primeiro registro de cada timeframe
      if (historyData.indicators.length > 0 && interval === "1d") {
        setShortTerm(historyData.indicators[0]);
      } else {
        // Busca separado para o card de curto prazo
        const d1 = await MarketService.getHistory(symbol, "1d");
        setShortTerm(d1.data.indicators[0] || null);
      }

      if (isPremium) {
        const [w1, m1] = await Promise.all([
          MarketService.getHistory(symbol, "1w"),
          MarketService.getHistory(symbol, "1M"),
        ]);
        setMediumTerm(w1.data.indicators[0] || null);
        setLongTerm(m1.data.indicators[0] || null);
      } else {
        setMediumTerm(null);
        setLongTerm(null);
      }

    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string; upgradeRequired?: boolean } } };
      if (errorObj.response?.data?.upgradeRequired) {
        setError("Este recurso está disponível apenas no plano Premium.");
      } else {
        setError(errorObj.response?.data?.message || "Não foi possível conectar ao servidor de análise.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSymbolSearchChange = (val: string) => {
    const term = val.toUpperCase();
    setSymbolSearch(term);
    
    if (term.length > 0) {
      const filtered = allSymbols.filter(s => s.includes(term)).slice(0, 8);
      setSearchResults(filtered);
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  };

  const selectSymbol = (s: string) => {
    // FREE: bloqueio visual de símbolo não permitido
    if (!isSymbolAllowed(s)) {
      setError("Este ativo está disponível apenas no plano Premium. Apenas BTCUSDT é acessível no plano gratuito.");
      setShowDropdown(false);
      setSymbolSearch("");
      return;
    }
    setSymbol(s);
    setSymbolSearch(s);
    setShowDropdown(false);
    setPage(1);
    setTableFilter("");
  };

  const filteredIndicators = (mainData?.indicators || []).filter(item => {
    const showYear = interval === '1w' || interval === '1M';
    const showTime = ['15m', '1h', '4h'].includes(interval);
    const dateStr = formatDate(item.time, showYear, showTime);
    return dateStr.includes(tableFilter) || item.close.toString().includes(tableFilter);
  });

  const totalPages = Math.ceil(filteredIndicators.length / itemsPerPage);
  const paginatedData = filteredIndicators.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const getPageNumbers = () => {
    const pages = [];
    let startPage = Math.max(1, page - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    if (endPage - startPage < 4) startPage = Math.max(1, endPage - 4);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700" onClick={() => setShowDropdown(false)}>
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Histórico de Mercado</h1>
          <p className="text-text-muted mt-1 text-sm">
            {isPremium
              ? "Análise técnica detalhada e histórico de indicadores."
              : "Histórico limitado — apenas BTCUSDT no timeframe diário."
            }
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Search Input */}
          <div className="relative group" onClick={(e) => e.stopPropagation()}>
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={18} />
            <input 
              type="text" 
              placeholder={isFree ? "Apenas BTCUSDT (Free)" : "Buscar moeda (ex: BTCUSDT)..."}
              value={symbolSearch}
              onChange={(e) => handleSymbolSearchChange(e.target.value)}
              onFocus={() => symbolSearch.length > 0 && setShowDropdown(true)}
              className="bg-surface/50 border border-border/40 rounded-xl py-2.5 pl-11 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all w-full lg:w-64"
            />
            
            {showDropdown && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-surface border border-border/40 rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl">
                {searchResults.map((res) => {
                  const allowed = isSymbolAllowed(res);
                  return (
                    <button
                      key={res}
                      onClick={() => selectSymbol(res)}
                      className={cn(
                        "w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between group/item",
                        allowed
                          ? "text-text-muted hover:text-white hover:bg-primary/10"
                          : "text-text-muted/40"
                      )}
                    >
                      <span>{res}</span>
                      {allowed ? (
                        <ChevronRight size={14} className="opacity-0 group-hover/item:opacity-100 transition-opacity" />
                      ) : (
                        <Lock size={12} className="text-amber-400/60" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Timeframe Filter */}
          <div className="flex bg-surface/50 border border-border/40 p-1 rounded-xl">
            {["15m", "1h", "4h", "1d", "1w", "1M"].map((tf) => {
              const allowed = isTimeframeAllowed(tf);
              return (
                <button
                  key={tf}
                  onClick={() => { if (allowed) { setInterval(tf); setPage(1); } }}
                  disabled={!allowed}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
                    !allowed
                      ? "text-text-muted/30 cursor-not-allowed"
                      : interval === tf 
                        ? "bg-primary text-white shadow-lg shadow-primary/20" 
                        : "text-text-muted hover:text-white hover:bg-white/5"
                  )}
                >
                  {tf.toUpperCase()}
                  {!allowed && <Lock size={10} className="text-amber-400/60" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filter and Summary Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm group">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={16} />
          <input 
            type="text" 
            placeholder="Filtrar dados na tabela..."
            value={tableFilter}
            onChange={(e) => setTableFilter(e.target.value)}
            className="w-full bg-surface/30 border border-border/40 rounded-xl py-2 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-primary/50 transition-all"
          />
        </div>
        
        <div className="flex items-center gap-3">
          {mainData && (
            <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest bg-white/5 px-4 py-2 rounded-xl border border-border/20">
              Registros: <span className="text-white">{mainData.indicators.length}</span>
              {totalAvailable && totalAvailable > mainData.indicators.length && (
                <span className="text-amber-400 ml-2">
                  ({totalAvailable} disponíveis no Premium)
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-danger/10 border border-danger/20 rounded-2xl p-4 flex items-center gap-3 text-danger text-sm animate-in slide-in-from-top duration-300">
          <Activity size={18} />
          <p className="font-medium">{error}</p>
          <button onClick={fetchData} className="ml-auto underline font-bold hover:text-danger/80">Tentar novamente</button>
        </div>
      )}

      {/* Analysis Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Curto Prazo — sempre visível */}
        <AnalysisCard 
          title="Curto Prazo" 
          subtitle="Timeframe Diário"
          data={shortTerm} 
          icon={<Clock size={20} className="text-primary" />}
        />

        {/* Médio Prazo — bloqueado para FREE */}
        {isPremium ? (
          <AnalysisCard 
            title="Médio Prazo" 
            subtitle="Timeframe Semanal"
            data={mediumTerm} 
            icon={<BarChart2 size={20} className="text-indigo-400" />}
          />
        ) : (
          <BlurBlock
            variant="compact"
            message="Análise Semanal"
            subtitle="Disponível no plano Premium"
            ctaText="Desbloquear"
          >
            <AnalysisCard 
              title="Médio Prazo" 
              subtitle="Timeframe Semanal"
              data={null} 
              icon={<BarChart2 size={20} className="text-indigo-400" />}
            />
          </BlurBlock>
        )}

        {/* Longo Prazo — bloqueado para FREE */}
        {isPremium ? (
          <AnalysisCard 
            title="Longo Prazo" 
            subtitle="Timeframe Mensal"
            data={longTerm} 
            icon={<TrendingUp size={20} className="text-emerald-400" />}
          />
        ) : (
          <BlurBlock
            variant="compact"
            message="Análise Mensal"
            subtitle="Disponível no plano Premium"
            ctaText="Desbloquear"
          >
            <AnalysisCard 
              title="Longo Prazo" 
              subtitle="Timeframe Mensal"
              data={null} 
              icon={<TrendingUp size={20} className="text-emerald-400" />}
            />
          </BlurBlock>
        )}
      </div>

      {/* Indicador de limite para FREE */}
      {isFree && totalAvailable && totalAvailable > (mainData?.indicators.length || 0) && (
        <UpgradeCTA
          variant="banner"
          title={`Exibindo ${mainData?.indicators.length} de ${totalAvailable} registros`}
          description="O plano Premium libera o histórico completo com todos os timeframes."
          buttonText="Ver Histórico Completo"
        />
      )}

      {/* Main Table Section */}
      <div className="bg-surface/30 border border-border/40 rounded-3xl overflow-hidden backdrop-blur-sm">
        <div className="p-6 border-b border-border/40 flex items-center justify-between bg-surface/10">
          <div className="flex items-center gap-3">
            <Activity size={20} className="text-primary" />
            <h2 className="text-lg font-bold text-white">Dados Históricos</h2>
          </div>
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest bg-surface/50 px-3 py-1 rounded-full border border-border/20">
            {symbol} / {interval.toUpperCase()}
          </span>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/40 bg-surface/20">
                <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest whitespace-nowrap">Data</th>
                <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest whitespace-nowrap">Abertura</th>
                <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest whitespace-nowrap">Máxima</th>
                <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest whitespace-nowrap">Mínima</th>
                <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest whitespace-nowrap">Fechamento</th>
                <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest whitespace-nowrap">RSI K</th>
                <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest whitespace-nowrap">RSI D</th>
                <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest whitespace-nowrap">RSI</th>
                <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest whitespace-nowrap">RSI MA</th>
                <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest whitespace-nowrap">RSIe1</th>
                <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest whitespace-nowrap">RSIe2</th>
                <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest whitespace-nowrap">RSI1</th>
                <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest whitespace-nowrap">RSI2</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {loading ? (
                <tr>
                  <td colSpan={13} className="px-6 py-10 text-center text-text-muted">
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-5 h-5 border-2 border-border border-b-primary rounded-full animate-spin" />
                      <span>Carregando dados...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={13} className="px-6 py-10 text-center text-text-muted italic">
                    Nenhum dado encontrado para {symbol} / {interval.toUpperCase()}
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, idx) => {
                  const isPositiveCandle = item.close > item.open;
                  const showYear = interval === '1w' || interval === '1M';
                  const showTime = ['15m', '1h', '4h'].includes(interval);
                  return (
                    <tr key={item.time} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-3.5 text-sm font-semibold text-primary whitespace-nowrap">
                        {formatDate(item.time, showYear, showTime)}
                      </td>
                      <td className="px-6 py-3.5 text-sm text-text-muted whitespace-nowrap">
                        {item.open.toFixed(2)}
                      </td>
                      <td className="px-6 py-3.5 text-sm text-text-muted whitespace-nowrap">
                        {item.high.toFixed(2)}
                      </td>
                      <td className="px-6 py-3.5 text-sm text-text-muted whitespace-nowrap">
                        {item.low.toFixed(2)}
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <span className={cn(
                          "inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold",
                          isPositiveCandle
                            ? "bg-success/10 text-success border border-success/20"
                            : "bg-text-muted/10 text-text-muted border border-border/20"
                        )}>
                          {item.close.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-sm text-text-muted whitespace-nowrap">
                        {item.stochK.toFixed(2)}
                      </td>
                      <td className="px-6 py-3.5 text-sm text-text-muted whitespace-nowrap">
                        {item.stochD.toFixed(2)}
                      </td>
                      <td className="px-6 py-3.5 text-sm text-text-muted whitespace-nowrap">
                        {item.rsi.toFixed(2)}
                      </td>
                      <td className="px-6 py-3.5 text-sm text-text-muted whitespace-nowrap">
                        {item.rsiMa.toFixed(2)}
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <TrendBadge trend={item.trendRSIe1} />
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <TrendBadge trend={item.trendRSIe2} />
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <TrendBadge trend={item.trendRsi1} />
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <TrendBadge trend={item.trendRsi2} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-6 border-t border-border/40 flex items-center justify-between bg-surface/10">
          <p className="text-xs text-text-muted">
            Exibindo <span className="text-white font-bold">{Math.min((page - 1) * itemsPerPage + 1, filteredIndicators.length)}</span> a <span className="text-white font-bold">{Math.min(page * itemsPerPage, filteredIndicators.length)}</span> de <span className="text-white font-bold">{filteredIndicators.length}</span> registros
          </p>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={page === 1}
              className="p-2 rounded-lg border border-border/40 hover:bg-surface-hover disabled:opacity-30 disabled:hover:bg-transparent transition-all"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex items-center gap-1">
              {getPageNumbers().map((p) => (
                <button
                  key={p}
                  onClick={() => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className={cn(
                    "w-9 h-9 rounded-lg text-xs font-bold transition-all",
                    page === p 
                      ? "bg-primary text-white shadow-lg shadow-primary/20" 
                      : "text-text-muted hover:text-white hover:bg-white/5 border border-border/20"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
            <button 
              onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={page === totalPages || totalPages === 0}
              className="p-2 rounded-lg border border-border/40 hover:bg-surface-hover disabled:opacity-30 disabled:hover:bg-transparent transition-all"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AnalysisCard({ title, subtitle, data, icon }: { title: string, subtitle: string, data: IndicatorResult | null, icon: React.ReactNode }) {
  if (!data) return (
    <div className="bg-surface/30 border border-border/40 rounded-3xl p-6 animate-pulse h-64" />
  );

  const isPositive = data.trend === "Alta";

  return (
    <div className={cn(
      "bg-surface/30 border border-border/40 rounded-3xl p-6 transition-all duration-500 hover:scale-[1.02] group relative overflow-hidden",
      isPositive ? "hover:border-success/30" : "hover:border-danger/30"
    )}>
      {/* Background Decor */}
      <div className={cn(
        "absolute -right-4 -bottom-4 w-24 h-24 blur-3xl rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-500",
        isPositive ? "bg-success" : "bg-danger"
      )} />

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-surface/50 border border-border/20 shadow-inner">
            {icon}
          </div>
          <div>
            <h3 className="font-bold text-white">{title}</h3>
            <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">{subtitle}</p>
          </div>
        </div>
        <div className={cn(
          "p-2 rounded-xl border border-border/20",
          isPositive ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
        )}>
          {isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <IndicatorRow label="RSIe1" value={data.trendRSIe1} />
        <IndicatorRow label="RSIe2" value={data.trendRSIe2} />
        <IndicatorRow label="RSI1" value={data.trendRsi1} />
        <IndicatorRow label="RSI2" value={data.trendRsi2} />
      </div>

      <div className="space-y-2 pt-4 border-t border-border/40">
        <div className="flex justify-between items-center text-xs">
          <span className="text-text-muted font-medium">Preço Atual</span>
          <span className="text-white font-bold">${data.close.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-text-muted font-medium">Status Geral</span>
          <span className={cn("font-black uppercase tracking-tighter", isPositive ? "text-success" : "text-danger")}>
            {data.trend} Tendência
          </span>
        </div>
      </div>
    </div>
  );
}

function IndicatorRow({ label, value }: { label: string, value: "Alta" | "Baixa" }) {
  const isHigh = value === "Alta";
  return (
    <div className="space-y-1">
      <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{label}</span>
      <div className={cn(
        "text-sm font-black uppercase tracking-tighter",
        isHigh ? "text-success" : "text-danger"
      )}>
        {value}
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
