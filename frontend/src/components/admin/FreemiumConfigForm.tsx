"use client";

import React, { useState } from "react";
import { FreemiumLimits } from "@/services/admin.service";
import { Save, AlertCircle } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: Parameters<typeof clsx>) {
  return twMerge(clsx(inputs));
}

interface FreemiumConfigFormProps {
  initialData: FreemiumLimits;
  onSubmit: (data: Partial<FreemiumLimits>) => Promise<void>;
  isLoading: boolean;
}

export function FreemiumConfigForm({ initialData, onSubmit, isLoading }: FreemiumConfigFormProps) {
  const [formData, setFormData] = useState<FreemiumLimits>({
    allowedSymbols: initialData.allowedSymbols || [],
    allowedTimeframes: initialData.allowedTimeframes || [],
    maxHistoryRecords: initialData.maxHistoryRecords || 20,
    maxSignals: initialData.maxSignals || 1,
    maxFavorites: initialData.maxFavorites || 3,
  });

  const [symbolsInput, setSymbolsInput] = useState(formData.allowedSymbols.join(", "));
  const [timeframesInput, setTimeframesInput] = useState(formData.allowedTimeframes.join(", "));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const parsedData: Partial<FreemiumLimits> = {
      allowedSymbols: symbolsInput.split(",").map(s => s.trim().toUpperCase()).filter(Boolean),
      allowedTimeframes: timeframesInput.split(",").map(s => s.trim()).filter(Boolean),
      maxHistoryRecords: Number(formData.maxHistoryRecords),
      maxSignals: Number(formData.maxSignals),
      maxFavorites: Number(formData.maxFavorites),
    };

    await onSubmit(parsedData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Aviso */}
      <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex gap-3 text-indigo-400 text-sm">
        <AlertCircle size={20} className="shrink-0 mt-0.5" />
        <p>
          As alterações feitas aqui refletem em tempo real para todos os usuários do plano Free.
          Diminuir limites afetará a experiência imediatamente.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-semibold text-text-main">Ativos Permitidos (Separados por vírgula)</label>
          <input
            type="text"
            value={symbolsInput}
            onChange={(e) => setSymbolsInput(e.target.value)}
            placeholder="Ex: BTCUSDT, ETHUSDT"
            className="w-full bg-surface/40 border border-border/40 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/50"
            required
          />
          <p className="text-[10px] text-text-muted">Apenas estes pares serão visíveis no dashboard para usuários Free.</p>
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-semibold text-text-main">Timeframes Permitidos (Separados por vírgula)</label>
          <input
            type="text"
            value={timeframesInput}
            onChange={(e) => setTimeframesInput(e.target.value)}
            placeholder="Ex: 1d, 4h"
            className="w-full bg-surface/40 border border-border/40 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/50"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-text-main">Máx. Velas Históricas</label>
          <input
            type="number"
            min="1"
            max="1000"
            value={formData.maxHistoryRecords}
            onChange={(e) => setFormData(prev => ({ ...prev, maxHistoryRecords: Number(e.target.value) }))}
            className="w-full bg-surface/40 border border-border/40 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/50"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-text-main">Máx. Sinais Simultâneos</label>
          <input
            type="number"
            min="1"
            max="50"
            value={formData.maxSignals}
            onChange={(e) => setFormData(prev => ({ ...prev, maxSignals: Number(e.target.value) }))}
            className="w-full bg-surface/40 border border-border/40 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/50"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-text-main">Máx. Ativos Favoritos</label>
          <input
            type="number"
            min="1"
            max="10"
            value={formData.maxFavorites}
            onChange={(e) => setFormData(prev => ({ ...prev, maxFavorites: Number(e.target.value) }))}
            className="w-full bg-surface/40 border border-border/40 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/50"
            required
          />
        </div>
      </div>

      <div className="pt-6 border-t border-border/40 flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save size={20} />
          )}
          Salvar Configurações
        </button>
      </div>
    </form>
  );
}
