"use client";

import React, { useEffect, useState } from "react";
import { Users, Crown, CreditCard, Activity, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { AdminService, DashboardMetrics } from "@/services/admin.service";
import { MetricCard } from "@/components/admin/MetricCard";

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadMetrics() {
      try {
        const data = await AdminService.getMetrics();
        setMetrics(data);
      } catch (err: any) {
        setError(err.message || "Erro ao carregar métricas do dashboard");
      } finally {
        setIsLoading(false);
      }
    }

    loadMetrics();
  }, []);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-8">
        <div>
          <div className="h-8 w-64 bg-surface rounded-lg mb-2" />
          <div className="h-4 w-96 bg-surface/50 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-surface rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-danger/10 border border-danger/20 rounded-2xl">
        <h3 className="text-danger font-bold">Erro</h3>
        <p className="text-sm text-danger/80">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-text-main tracking-tight mb-2">Visão Geral do Sistema</h1>
        <p className="text-text-muted">Acompanhe as métricas principais e o desempenho do Freemium.</p>
      </div>

      {metrics && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Total de Usuários"
              value={metrics.totalUsers}
              icon={<Users size={24} />}
              trend={{ value: 12, label: "vs mês anterior" }}
            />
            <MetricCard
              title="Assinantes Premium"
              value={metrics.premiumUsers}
              icon={<Crown size={24} />}
              trend={{ value: 5.2, label: "vs mês anterior" }}
            />
            <MetricCard
              title="Receita Estimada Mensal"
              value={metrics.estimatedMonthlyRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              valuePrefix="R$"
              icon={<CreditCard size={24} />}
              trend={{ value: 8.4, label: "vs mês anterior" }}
            />
            <MetricCard
              title="Taxa de Conversão"
              value={`${metrics.conversionRate}%`}
              icon={<Activity size={24} />}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-surface/40 border border-border/40 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-success/10 text-success">
                  <ArrowUpRight size={20} />
                </div>
                <h3 className="font-semibold">Novos Usuários (7 dias)</h3>
              </div>
              <p className="text-4xl font-bold text-text-main">{metrics.newUsersLast7Days}</p>
              <p className="text-sm text-text-muted mt-2">Cadastros recentes na plataforma</p>
            </div>

            <div className="bg-surface/40 border border-border/40 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-danger/10 text-danger">
                  <ArrowDownRight size={20} />
                </div>
                <h3 className="font-semibold">Cancelamentos Recentes</h3>
              </div>
              <p className="text-4xl font-bold text-text-main">{metrics.recentCancellations}</p>
              <p className="text-sm text-text-muted mt-2">Assinaturas canceladas nos últimos 30 dias</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
