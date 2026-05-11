"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AdminService, UserDetail } from "@/services/admin.service";
import { UserStatusBadge } from "@/components/admin/UserStatusBadge";
import { PlanBadge } from "@/components/admin/PlanBadge";
import { ActionModal } from "@/components/admin/ActionModal";
import { ArrowLeft, User, Mail, Shield, Calendar, History, Activity, AlertTriangle, CheckCircle, Crown, Lock } from "lucide-react";
import Link from "next/link";
import { UserStatus } from "@/types/prisma";

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [user, setUser] = useState<UserDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Modais State
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [premiumDuration, setPremiumDuration] = useState("30");

  useEffect(() => {
    async function loadUser() {
      try {
        const data = await AdminService.getUserDetail(userId);
        setUser(data);
      } catch (err: any) {
        setError(err.message || "Erro ao carregar detalhes do usuário");
      } finally {
        setIsLoading(false);
      }
    }
    loadUser();
  }, [userId]);

  const handleStatusChange = async (newStatus: UserStatus) => {
    setIsSubmitting(true);
    try {
      await AdminService.changeUserStatus(userId, newStatus);
      setUser(prev => prev ? { ...prev, status: newStatus } : null);
      setIsStatusModalOpen(false);
    } catch (err: any) {
      alert(err.message || "Erro ao alterar status");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGrantPremium = async () => {
    setIsSubmitting(true);
    try {
      // Usando planId=2 (Premium 01 Mensal) como default para o override manual
      await AdminService.grantPremiumAccess(userId, 2, parseInt(premiumDuration, 10));
      // Recarregar os dados para pegar a nova subscription
      const data = await AdminService.getUserDetail(userId);
      setUser(data);
      setIsPremiumModalOpen(false);
    } catch (err: any) {
      alert(err.message || "Erro ao conceder acesso premium");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-64 bg-surface rounded-lg" />
        <div className="h-64 w-full bg-surface/40 rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-96 bg-surface/40 rounded-2xl" />
          <div className="h-96 bg-surface/40 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="p-6 bg-danger/10 border border-danger/20 rounded-2xl">
        <h3 className="text-danger font-bold">Erro</h3>
        <p className="text-sm text-danger/80">{error || "Usuário não encontrado."}</p>
        <button onClick={() => router.back()} className="mt-4 text-sm text-text-main hover:underline">
          Voltar
        </button>
      </div>
    );
  }

  const isBlocked = user.status === "BANNED" || user.status === "SUSPENDED";
  const activeSubscription = user.subscriptions.find(s => s.status === "ACTIVE");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/users" className="p-2 bg-surface/40 hover:bg-surface-hover rounded-xl text-text-muted transition-colors border border-border/40">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-text-main tracking-tight">Detalhes do Usuário</h1>
          <p className="text-sm text-text-muted">ID: {user.id}</p>
        </div>
        <div className="ml-auto flex gap-3">
          <button 
            onClick={() => setIsPremiumModalOpen(true)}
            className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-sm font-semibold border border-amber-500/20 rounded-xl transition-all flex items-center gap-2"
          >
            <Crown size={16} /> Conceder Premium
          </button>
          <button 
            onClick={() => setIsStatusModalOpen(true)}
            disabled={user.role === "ADMIN"}
            className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all flex items-center gap-2 ${
              isBlocked 
                ? "bg-success/10 hover:bg-success/20 text-success border border-success/20" 
                : "bg-danger/10 hover:bg-danger/20 text-danger border border-danger/20"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isBlocked ? <CheckCircle size={16} /> : <Lock size={16} />}
            {isBlocked ? "Desbloquear" : "Bloquear"}
          </button>
        </div>
      </div>

      {/* Main Info Card */}
      <div className="bg-surface/40 border border-border/40 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row gap-8 items-start relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        
        <div className="w-24 h-24 rounded-2xl bg-surface-hover flex items-center justify-center overflow-hidden shrink-0 border border-border/40">
          {user.image ? (
            <img src={user.image} alt={user.name || "User"} className="w-full h-full object-cover" />
          ) : (
            <span className="text-3xl font-bold text-text-muted">
              {user.name ? user.name[0].toUpperCase() : "?"}
            </span>
          )}
        </div>

        <div className="flex-1 space-y-6 z-10 w-full">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-text-main flex items-center gap-3">
                {user.name || "Usuário sem nome"}
                {user.role === "ADMIN" && (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-indigo-500/20 text-indigo-400 text-xs rounded border border-indigo-500/30 uppercase tracking-widest">
                    <Shield size={12} /> Admin
                  </span>
                )}
              </h2>
              <div className="flex items-center gap-2 text-text-muted mt-1">
                <Mail size={14} />
                <span>{user.email}</span>
                {user.accounts.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded bg-surface border border-border/60 text-[10px] ml-2">
                    {user.accounts[0].provider}
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <UserStatusBadge status={user.status} className="text-sm px-3 py-1.5" />
              <PlanBadge planName={user.role === "ADMIN" ? "Acesso Total" : activeSubscription?.plan.name} className="text-sm px-3 py-1.5" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-border/20">
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Calendar size={14} /> Data de Cadastro
              </p>
              <p className="text-sm font-medium text-text-main">
                {new Date(user.createdAt).toLocaleDateString("pt-BR", { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Activity size={14} /> Última Atualização
              </p>
              <p className="text-sm font-medium text-text-main">
                {new Date(user.updatedAt).toLocaleDateString("pt-BR")}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Crown size={14} /> Assinaturas Totais
              </p>
              <p className="text-sm font-medium text-text-main">{user.subscriptions.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Histórico de Assinaturas */}
        <div className="bg-surface/40 border border-border/40 rounded-2xl flex flex-col h-[500px]">
          <div className="px-6 py-5 border-b border-border/40 bg-surface/30 flex items-center gap-3 shrink-0">
            <div className="p-2 bg-primary/10 text-primary rounded-lg">
              <Crown size={20} />
            </div>
            <h2 className="text-lg font-bold text-text-main">Assinaturas</h2>
          </div>
          <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
            {user.subscriptions.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-text-muted">
                <Crown size={32} className="mb-3 opacity-20" />
                <p>Nenhuma assinatura registrada.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {user.subscriptions.map((sub) => (
                  <div key={sub.id} className="p-4 rounded-xl border border-border/40 bg-surface/20 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-text-main">{sub.plan.name}</span>
                        <span className="text-xs text-text-muted">({sub.plan.billingCycle})</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                        sub.status === "ACTIVE" ? "bg-success/10 text-success border-success/20" :
                        sub.status === "CANCELED" ? "bg-danger/10 text-danger border-danger/20" :
                        "bg-text-muted/10 text-text-muted border-text-muted/20"
                      }`}>
                        {sub.status}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-text-muted pt-3 border-t border-border/20">
                      <span>Início: {new Date(sub.currentPeriodStart).toLocaleDateString("pt-BR")}</span>
                      <span>Término: {new Date(sub.currentPeriodEnd).toLocaleDateString("pt-BR")}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Auditoria / Log de Ações */}
        <div className="bg-surface/40 border border-border/40 rounded-2xl flex flex-col h-[500px]">
          <div className="px-6 py-5 border-b border-border/40 bg-surface/30 flex items-center gap-3 shrink-0">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <History size={20} />
            </div>
            <h2 className="text-lg font-bold text-text-main">Log de Auditoria</h2>
          </div>
          <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
            {user.adminTargetActions.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-text-muted">
                <History size={32} className="mb-3 opacity-20" />
                <p>Nenhuma ação administrativa registrada.</p>
              </div>
            ) : (
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border/40 before:to-transparent">
                {user.adminTargetActions.map((action, index) => (
                  <div key={action.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full border border-surface bg-surface-hover shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm text-indigo-400 ml-[-5px] md:ml-0 z-10">
                      <div className="w-2 h-2 bg-current rounded-full" />
                    </div>
                    <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.5rem)] p-4 rounded-xl border border-border/40 bg-surface/20 hover:bg-surface/40 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm text-text-main">{action.action.replace(/_/g, " ")}</span>
                        <span className="text-[10px] text-text-muted font-medium">
                          {new Date(action.createdAt).toLocaleDateString("pt-BR", { day: '2-digit', month: 'short' })}
                        </span>
                      </div>
                      <p className="text-xs text-text-muted mt-2">
                        Por: {action.admin.email}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Modal */}
      <ActionModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title={isBlocked ? "Desbloquear Usuário" : "Bloquear Usuário"}
        footer={
          <>
            <button 
              onClick={() => setIsStatusModalOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-text-main hover:bg-surface-hover rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={() => handleStatusChange(isBlocked ? UserStatus.ACTIVE : UserStatus.BANNED)}
              disabled={isSubmitting}
              className={`px-4 py-2 text-sm font-semibold text-white rounded-xl transition-all ${
                isBlocked ? "bg-success hover:bg-success/90" : "bg-danger hover:bg-danger/90"
              } disabled:opacity-50`}
            >
              {isSubmitting ? "Processando..." : (isBlocked ? "Sim, Desbloquear" : "Sim, Bloquear")}
            </button>
          </>
        }
      >
        <div className="flex items-center gap-4 text-text-muted">
          <div className={`p-3 rounded-xl ${isBlocked ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}>
            <AlertTriangle size={24} />
          </div>
          <p>
            Tem certeza que deseja <strong>{isBlocked ? "desbloquear" : "bloquear"}</strong> o usuário <strong>{user.email}</strong>?<br/>
            {isBlocked 
              ? "Ele voltará a ter acesso à plataforma." 
              : "Ele perderá imediatamente o acesso à plataforma, incluindo sua assinatura."}
          </p>
        </div>
      </ActionModal>

      {/* Premium Modal */}
      <ActionModal
        isOpen={isPremiumModalOpen}
        onClose={() => setIsPremiumModalOpen(false)}
        title="Conceder Acesso Premium"
        footer={
          <>
            <button 
              onClick={() => setIsPremiumModalOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-text-main hover:bg-surface-hover rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={handleGrantPremium}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-semibold text-black bg-amber-400 hover:bg-amber-500 rounded-xl transition-all disabled:opacity-50"
            >
              {isSubmitting ? "Processando..." : "Confirmar Liberação"}
            </button>
          </>
        }
      >
        <div className="space-y-4 text-text-muted">
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 text-sm flex gap-3 items-start">
            <Crown size={20} className="shrink-0 mt-0.5" />
            <p>Isto criará uma assinatura Premium forçada (bypass do gateway de pagamento). Use com cautela.</p>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-text-main">Duração do Acesso (Dias)</label>
            <select
              value={premiumDuration}
              onChange={(e) => setPremiumDuration(e.target.value)}
              className="w-full bg-surface/60 border border-border/40 rounded-xl px-4 py-3 text-sm text-text-main focus:outline-none focus:border-amber-400/50"
            >
              <option value="7">7 dias (Trial manual)</option>
              <option value="30">30 dias (1 Mês)</option>
              <option value="90">90 dias (3 Meses)</option>
              <option value="365">365 dias (1 Ano)</option>
            </select>
          </div>
        </div>
      </ActionModal>

    </div>
  );
}
