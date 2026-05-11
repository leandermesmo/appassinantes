"use client";

import { Calendar, CreditCard, ExternalLink, Gem } from "lucide-react";

export function SubscriptionCard() {
  const plan = {
    name: "Premium Elite",
    status: "Ativo",
    renewal: "15 de Junho, 2026",
    price: "R$ 97,00/mês"
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-indigo-500/30 rounded-2xl p-8 backdrop-blur-xl group">
      {/* Background Decor */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all duration-700" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-all duration-700" />

      <div className="relative z-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 text-indigo-400 rounded-full text-xs font-bold border border-indigo-500/30">
              <Gem className="w-3 h-3" />
              PLANO ATUAL
            </div>
            
            <div>
              <h3 className="text-3xl font-black text-white tracking-tight mb-1">{plan.name}</h3>
              <p className="text-zinc-400 flex items-center gap-2">
                <CreditCard className="w-4 h-4" /> {plan.price}
              </p>
            </div>

            <div className="flex items-center gap-4 py-2">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Status</span>
                <span className="text-sm font-semibold text-green-400 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  {plan.status}
                </span>
              </div>
              <div className="w-px h-8 bg-zinc-800" />
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Renovação</span>
                <span className="text-sm font-semibold text-zinc-200 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                  {plan.renewal}
                </span>
              </div>
            </div>
          </div>

          <button className="w-full md:w-auto px-8 py-4 bg-white hover:bg-zinc-200 text-zinc-900 font-bold rounded-xl transition-all shadow-xl shadow-white/5 flex items-center justify-center gap-2 group/btn">
            Gerenciar Assinatura
            <ExternalLink className="w-4 h-4 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}
