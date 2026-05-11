"use client";

import { Bell, Mail, Signal, Zap } from "lucide-react";
import { useState } from "react";

export function NotificationSettings() {
  const [settings, setSettings] = useState({
    buySignals: true,
    sellSignals: true,
    volatility: false,
    email: true,
  });

  const toggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm h-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-500/10 rounded-lg">
          <Bell className="w-5 h-5 text-purple-400" />
        </div>
        <h3 className="text-lg font-semibold text-white">Alertas e Notificações</h3>
      </div>

      <div className="space-y-5">
        <div className="flex items-center justify-between p-4 bg-zinc-800/30 rounded-xl border border-zinc-700/50 group hover:border-zinc-600 transition-all">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg group-hover:bg-green-500/20 transition-all">
              <Signal className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Sinais de Compra</p>
              <p className="text-xs text-zinc-500">Notificar quando um padrão de compra for detectado</p>
            </div>
          </div>
          <button 
            onClick={() => toggle("buySignals")}
            className={`w-12 h-6 rounded-full transition-all relative ${settings.buySignals ? "bg-green-600" : "bg-zinc-700"}`}
          >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.buySignals ? "right-1" : "left-1"}`} />
          </button>
        </div>

        <div className="flex items-center justify-between p-4 bg-zinc-800/30 rounded-xl border border-zinc-700/50 group hover:border-zinc-600 transition-all">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/10 rounded-lg group-hover:bg-red-500/20 transition-all">
              <Signal className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Sinais de Venda</p>
              <p className="text-xs text-zinc-500">Notificar quando um padrão de venda for detectado</p>
            </div>
          </div>
          <button 
            onClick={() => toggle("sellSignals")}
            className={`w-12 h-6 rounded-full transition-all relative ${settings.sellSignals ? "bg-red-600" : "bg-zinc-700"}`}
          >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.sellSignals ? "right-1" : "left-1"}`} />
          </button>
        </div>

        <div className="flex items-center justify-between p-4 bg-zinc-800/30 rounded-xl border border-zinc-700/50 group hover:border-zinc-600 transition-all">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/10 rounded-lg group-hover:bg-yellow-500/20 transition-all">
              <Zap className="w-4 h-4 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Alta Volatilidade</p>
              <p className="text-xs text-zinc-500">Alertar sobre movimentos bruscos no mercado</p>
            </div>
          </div>
          <button 
            onClick={() => toggle("volatility")}
            className={`w-12 h-6 rounded-full transition-all relative ${settings.volatility ? "bg-yellow-600" : "bg-zinc-700"}`}
          >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.volatility ? "right-1" : "left-1"}`} />
          </button>
        </div>

        <div className="pt-4 border-t border-zinc-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-zinc-500" />
              <div>
                <p className="text-sm font-medium text-white">Canal: Email</p>
                <p className="text-xs text-zinc-500">Receber alertas via email sincronizado</p>
              </div>
            </div>
            <div className="px-3 py-1 bg-zinc-800 text-zinc-400 rounded-full text-[10px] font-bold uppercase border border-zinc-700">Ativo</div>
          </div>
        </div>
      </div>
    </div>
  );
}
