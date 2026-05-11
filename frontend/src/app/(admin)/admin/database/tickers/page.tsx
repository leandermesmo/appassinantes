"use client";

import React, { useEffect, useState, useCallback } from "react";
import { AdminService, Cryptocurrency } from "@/services/admin.service";
import { DataTable } from "@/components/admin/DataTable";
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, RefreshCw, Power, PowerOff, Database, Coins, CheckCircle2, AlertCircle, Trash2 } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";

export default function TickersListPage() {
  const [cryptos, setCryptos] = useState<Cryptocurrency[]>([]);
  const [total, setTotal] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [inactiveCount, setInactiveCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<number | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [showOnlyActive, setShowOnlyActive] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const loadTickers = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await AdminService.listCryptocurrencies({
        page,
        limit: 10,
        search: debouncedSearch,
        isActive: showOnlyActive || undefined,
      });
      
      if (response.cryptos) {
        setCryptos(response.cryptos);
        setTotal(response.total);
        setActiveCount(response.activeCount || 0);
        setInactiveCount(response.inactiveCount || 0);
        setTotalPages(response.totalPages);
      }
    } catch (err: any) {
      setError(err.message || "Erro ao carregar tickers");
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, showOnlyActive]);

  useEffect(() => {
    loadTickers();
  }, [loadTickers]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, showOnlyActive]);

  const handleToggleStatus = async (crypto: Cryptocurrency) => {
    setIsUpdating(crypto.id);
    setError("");
    setSuccessMsg("");
    const newStatus = !crypto.isActive;
    
    try {
      await AdminService.toggleCryptocurrencyStatus(crypto.id, newStatus);
      setSuccessMsg(`Status de ${crypto.symbol} atualizado para ${newStatus ? "Ativo" : "Inativo"}`);
      
      // Update local state
      setCryptos(prev => prev.map(c => 
        c.id === crypto.id ? { ...c, isActive: newStatus } : c
      ));

      // Clear success msg after 3s
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      setError(err.message || "Erro ao atualizar status");
    } finally {
      setIsUpdating(null);
    }
  };

  const handleSync = async () => {
    if (!confirm("Isso irá sincronizar todos os pares de ativos disponíveis na Binance. Isso pode levar alguns segundos. Continuar?")) return;
    
    setIsSyncing(true);
    setError("");
    setSuccessMsg("");
    try {
      const response = await AdminService.syncCryptocurrencies();
      setSuccessMsg(response.message || "Sincronização concluída com sucesso!");
      loadTickers();
    } catch (err: any) {
      setError(err.message || "Erro ao sincronizar moedas");
    } finally {
      setIsSyncing(false);
    }
  };

  const TIMEFRAMES = ['15m', '1h', '4h', '1d', '1w', '1M'] as const;

  const candleCountCell = (tf: typeof TIMEFRAMES[number]) => ({
    header: tf.toUpperCase(),
    className: "text-center",
    cell: (crypto: Cryptocurrency) => {
      const count = crypto.candleCounts?.[tf] ?? 0;
      return (
        <span className={`inline-block min-w-[48px] text-center px-2 py-0.5 rounded-md text-xs font-bold ${
          count > 0
            ? "bg-success/10 text-success"
            : "bg-surface text-text-muted/40"
        }`}>
          {count.toLocaleString("pt-BR")}
        </span>
      );
    },
  });

  const columns = [
    {
      header: "Símbolo",
      cell: (crypto: Cryptocurrency) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-indigo-400">{crypto.symbol.slice(0, 2)}</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-text-main">{crypto.symbol}</span>
            <span className="text-[10px] text-text-muted uppercase tracking-wider">{crypto.name}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Base / Quote",
      cell: (crypto: Cryptocurrency) => (
        <span className="text-xs font-medium text-text-muted">
          {crypto.baseAsset} / {crypto.quoteAsset}
        </span>
      ),
    },
    {
      header: "Status",
      cell: (crypto: Cryptocurrency) => (
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${crypto.isActive ? "bg-success shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-text-muted/30"}`} />
          <span className={`text-xs font-semibold ${crypto.isActive ? "text-success" : "text-text-muted"}`}>
            {crypto.isActive ? "Ativo" : "Inativo"}
          </span>
        </div>
      ),
    },
    ...TIMEFRAMES.map(candleCountCell),
    {
      header: "Cadastro",
      cell: (crypto: Cryptocurrency) => (
        <span className="text-text-muted text-xs">
          {new Date(crypto.createdAt).toLocaleDateString("pt-BR")}
        </span>
      ),
    },
    {
      header: "Ações",
      className: "text-right",
      cell: (crypto: Cryptocurrency) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={async () => {
              setIsUpdating(crypto.id);
              try {
                const res = await AdminService.ingestCryptocurrency(crypto.id);
                setSuccessMsg(res.message || `Ingestão concluída para ${crypto.symbol}`);
                loadTickers(); // Atualiza contadores
                setTimeout(() => setSuccessMsg(""), 3000);
              } catch (err: any) {
                setError(err.message || "Erro ao ingerir dados");
              } finally {
                setIsUpdating(null);
              }
            }}
            disabled={isUpdating === crypto.id}
            title="Ingerir dados (6 tempos gráficos)"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-400 hover:bg-indigo-500/10 transition-all disabled:opacity-50"
          >
            {isUpdating === crypto.id ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <><Database size={14} /> Ingerir</>
            )}
          </button>

          <button
            onClick={async () => {
              const totalCandles = Object.values(crypto.candleCounts || {}).reduce((a, b) => a + b, 0);
              if (totalCandles === 0) {
                setError(`${crypto.symbol} não possui dados para remover.`);
                setTimeout(() => setError(""), 3000);
                return;
              }
              if (!confirm(`⚠️ ATENÇÃO: Isso irá remover TODOS os candles (${totalCandles.toLocaleString("pt-BR")}) e indicadores de ${crypto.symbol}. Esta ação é irreversível. Continuar?`)) return;
              setIsUpdating(crypto.id);
              setError("");
              setSuccessMsg("");
              try {
                const res = await AdminService.purgeCryptocurrency(crypto.id);
                setSuccessMsg(res.message || `Dados de ${crypto.symbol} removidos com sucesso.`);
                loadTickers();
                setTimeout(() => setSuccessMsg(""), 5000);
              } catch (err: any) {
                setError(err.message || "Erro ao remover dados");
              } finally {
                setIsUpdating(null);
              }
            }}
            disabled={isUpdating === crypto.id}
            title="Remover todos os candles e indicadores"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-orange-400 hover:bg-orange-500/10 transition-all disabled:opacity-50"
          >
            {isUpdating === crypto.id ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <><Trash2 size={14} /> Desingerir</>
            )}
          </button>

          <button
            onClick={() => handleToggleStatus(crypto)}
            disabled={isUpdating === crypto.id}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              crypto.isActive 
                ? "text-danger hover:bg-danger/10" 
                : "text-success hover:bg-success/10"
            } disabled:opacity-50`}
          >
            {isUpdating === crypto.id ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : crypto.isActive ? (
              <><PowerOff size={14} /> Desativar</>
            ) : (
              <><Power size={14} /> Ativar</>
            )}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-main tracking-tight mb-2">Banco de Dados: Tickers</h1>
          <p className="text-text-muted">Gerencie as criptomoedas disponíveis para análise na plataforma.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleSync}
            disabled={isSyncing || isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
          >
            {isSyncing ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <Database size={16} />
            )}
            Sincronizar com Binance
          </button>

          <button 
            onClick={loadTickers}
            className="flex items-center gap-2 px-4 py-2 bg-surface border border-border/40 rounded-xl text-sm font-semibold text-text-main hover:bg-surface-hover transition-all"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
            Atualizar Lista
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 bg-surface/40 border border-border/40 rounded-2xl flex items-center gap-4 transition-all hover:bg-surface/60">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
            <Coins size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.1em]">Total de Ativos</p>
            <h3 className="text-2xl font-bold text-text-main leading-none mt-1">{total}</h3>
          </div>
        </div>

        <div className="p-5 bg-surface/40 border border-border/40 rounded-2xl flex items-center gap-4 transition-all hover:bg-surface/60">
          <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center text-success">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.1em]">Ativos Habilitados</p>
            <h3 className="text-2xl font-bold text-success leading-none mt-1">{activeCount}</h3>
          </div>
        </div>

        <div className="p-5 bg-surface/40 border border-border/40 rounded-2xl flex items-center gap-4 transition-all hover:bg-surface/60">
          <div className="w-12 h-12 rounded-xl bg-danger/10 flex items-center justify-center text-danger">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.1em]">Ativos Desativados</p>
            <h3 className="text-2xl font-bold text-danger leading-none mt-1">{inactiveCount}</h3>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-4 bg-surface/40 border border-border/40 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
          <input
            type="text"
            placeholder="Buscar por símbolo ou nome (ex: BTC, Bitcoin)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface/60 border border-border/40 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50"
          />
        </div>

        <div className="flex items-center gap-3 px-2">
          <label className="relative inline-flex items-center cursor-pointer group">
            <input 
              type="checkbox" 
              checked={showOnlyActive}
              onChange={(e) => setShowOnlyActive(e.target.checked)}
              className="sr-only peer" 
            />
            <div className="w-11 h-6 bg-surface-hover peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-text-muted after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-success peer-checked:after:bg-white"></div>
            <span className="ms-3 text-sm font-medium text-text-muted group-hover:text-text-main transition-colors">Apenas Ativos</span>
          </label>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-danger/10 border border-danger/20 rounded-xl text-danger text-sm">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-success/10 border border-success/20 rounded-xl text-success text-sm">
          {successMsg}
        </div>
      )}

      {/* Table */}
      <DataTable 
        data={cryptos} 
        columns={columns} 
        isLoading={isLoading}
        emptyMessage={search ? "Nenhuma criptomoeda encontrada para a busca." : "Nenhuma criptomoeda cadastrada."}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-surface/40 border border-border/40 rounded-2xl">
          <span className="text-sm text-text-muted">
            Mostrando página <span className="font-bold text-text-main">{page}</span> de <span className="font-bold text-text-main">{totalPages}</span>
            {" "}(Total: {total})
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(1)}
              disabled={page === 1}
              title="Primeira Página"
              className="p-2 rounded-lg border border-border/40 text-text-muted hover:text-white hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronsLeft size={18} />
            </button>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              title="Anterior"
              className="p-2 rounded-lg border border-border/40 text-text-muted hover:text-white hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              title="Próxima"
              className="p-2 rounded-lg border border-border/40 text-text-muted hover:text-white hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight size={18} />
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
              title="Última Página"
              className="p-2 rounded-lg border border-border/40 text-text-muted hover:text-white hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronsRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
