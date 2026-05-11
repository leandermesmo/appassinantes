"use client";

import React, { useEffect, useState, useCallback } from "react";
import { AdminService, SubscriptionDetail, PaginatedResponse } from "@/services/admin.service";
import { DataTable } from "@/components/admin/DataTable";
import { CreditCard, Filter, ChevronLeft, ChevronRight, Edit2, AlertCircle } from "lucide-react";
import { ActionModal } from "@/components/admin/ActionModal";
import { SubscriptionStatus } from "@/types/prisma";

export default function SubscriptionsListPage() {
  const [data, setData] = useState<PaginatedResponse<SubscriptionDetail>["data"] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("ALL");

  // Modal State
  const [selectedSub, setSelectedSub] = useState<SubscriptionDetail | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newStatus, setNewStatus] = useState<SubscriptionStatus | "">("");

  const loadSubscriptions = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await AdminService.listSubscriptions({
        page,
        limit: 15,
        status,
      });
      setData(response);
      setError("");
    } catch (err: any) {
      setError(err.message || "Erro ao carregar assinaturas");
    } finally {
      setIsLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    loadSubscriptions();
  }, [loadSubscriptions]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [status]);

  const handleEditClick = (sub: SubscriptionDetail) => {
    setSelectedSub(sub);
    setNewStatus(sub.status);
    setIsModalOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedSub || !newStatus || newStatus === selectedSub.status) return;

    setIsSubmitting(true);
    try {
      await AdminService.updateSubscription(selectedSub.id, { status: newStatus as SubscriptionStatus });
      await loadSubscriptions(); // Recarrega a lista
      setIsModalOpen(false);
    } catch (err: any) {
      alert(err.message || "Erro ao atualizar assinatura");
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    {
      header: "ID Assinatura",
      cell: (sub: SubscriptionDetail) => (
        <span className="text-xs font-mono text-text-muted">{sub.id.split("-")[0]}...</span>
      ),
    },
    {
      header: "Usuário",
      cell: (sub: SubscriptionDetail) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-surface-hover flex items-center justify-center overflow-hidden shrink-0">
            {sub.user.image ? (
              <img src={sub.user.image} alt={sub.user.name || "User"} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-bold text-text-muted">
                {sub.user.name ? sub.user.name[0].toUpperCase() : "?"}
              </span>
            )}
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-text-main truncate max-w-[150px]">{sub.user.name || "Sem nome"}</span>
            <span className="text-xs text-text-muted truncate max-w-[150px]">{sub.user.email}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Plano",
      cell: (sub: SubscriptionDetail) => (
        <div className="flex flex-col">
          <span className="font-semibold text-amber-400">{sub.plan.name}</span>
          <span className="text-xs text-text-muted">{sub.plan.billingCycle} - R$ {Number(sub.plan.price).toFixed(2)}</span>
        </div>
      ),
    },
    {
      header: "Status",
      cell: (sub: SubscriptionDetail) => {
        const styles: Record<string, string> = {
          ACTIVE: "bg-success/10 text-success border-success/20",
          CANCELED: "bg-danger/10 text-danger border-danger/20",
          PAST_DUE: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        };
        const style = styles[sub.status] || "bg-text-muted/10 text-text-muted border-text-muted/20";
        return (
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border inline-flex ${style}`}>
            {sub.status}
          </span>
        );
      },
    },
    {
      header: "Ações",
      className: "text-right",
      cell: (sub: SubscriptionDetail) => (
        <button 
          onClick={() => handleEditClick(sub)}
          className="inline-flex items-center justify-center p-2 text-text-muted hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
          title="Editar Status"
        >
          <Edit2 size={16} />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-main tracking-tight mb-2">Gestão de Assinaturas</h1>
        <p className="text-text-muted">Acompanhe as assinaturas ativas, pagamentos em atraso e cancelamentos.</p>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 p-4 bg-surface/40 border border-border/40 rounded-2xl justify-end">
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="bg-surface/60 border border-border/40 rounded-xl py-2 pl-9 pr-8 text-sm text-text-main focus:outline-none appearance-none min-w-[200px]"
          >
            <option value="ALL">Todos os Status</option>
            <option value="ACTIVE">Ativa</option>
            <option value="CANCELED">Cancelada</option>
            <option value="PAST_DUE">Em Atraso (Past Due)</option>
            <option value="TRIALING">Em Teste (Trial)</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-danger/10 border border-danger/20 rounded-xl text-danger text-sm">
          {error}
        </div>
      )}

      {/* Table */}
      <DataTable 
        data={data?.subscriptions || []} 
        columns={columns} 
        isLoading={isLoading}
        emptyMessage="Nenhuma assinatura encontrada."
      />

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-surface/40 border border-border/40 rounded-2xl">
          <span className="text-sm text-text-muted">
            Mostrando página <span className="font-bold text-text-main">{data.page}</span> de <span className="font-bold text-text-main">{data.totalPages}</span>
            {" "}(Total: {data.total})
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={data.page === 1}
              className="p-2 rounded-lg border border-border/40 text-text-muted hover:text-white hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
              disabled={data.page === data.totalPages}
              className="p-2 rounded-lg border border-border/40 text-text-muted hover:text-white hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <ActionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Editar Assinatura"
        footer={
          <>
            <button 
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-text-main hover:bg-surface-hover rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={handleUpdate}
              disabled={isSubmitting || newStatus === selectedSub?.status}
              className="px-4 py-2 text-sm font-semibold text-white bg-indigo-500 hover:bg-indigo-600 rounded-xl transition-all disabled:opacity-50"
            >
              {isSubmitting ? "Salvando..." : "Salvar Alterações"}
            </button>
          </>
        }
      >
        {selectedSub && (
          <div className="space-y-6 text-text-muted">
            <div className="flex items-center gap-3 p-4 bg-surface/40 border border-border/40 rounded-xl">
              <CreditCard size={24} className="text-indigo-400" />
              <div>
                <p className="text-sm font-bold text-text-main">{selectedSub.user.email}</p>
                <p className="text-xs">{selectedSub.plan.name} ({selectedSub.plan.billingCycle})</p>
              </div>
            </div>

            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 text-xs flex gap-3 items-start">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <p>
                Atenção: Modificar o status aqui afeta imediatamente o acesso do usuário. 
                Isso não reembolsa nem cobra o cartão de crédito (apenas atualiza o estado interno da plataforma).
              </p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-text-main">Novo Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as SubscriptionStatus)}
                className="w-full bg-surface/60 border border-border/40 rounded-xl px-4 py-3 text-sm text-text-main focus:outline-none focus:border-indigo-500/50"
              >
                <option value="ACTIVE">ACTIVE (Acesso Liberado)</option>
                <option value="PAST_DUE">PAST_DUE (Atraso - Mantém Acesso com Alerta)</option>
                <option value="CANCELED">CANCELED (Acesso Revogado)</option>
              </select>
            </div>
          </div>
        )}
      </ActionModal>
    </div>
  );
}
