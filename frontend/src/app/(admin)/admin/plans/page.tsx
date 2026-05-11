"use client";

import React, { useEffect, useState } from "react";
import { AdminService, PlanDetail } from "@/services/admin.service";
import { ActionModal } from "@/components/admin/ActionModal";
import { 
  Package, 
  Plus, 
  Edit2, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  ChevronRight,
  Zap,
  Clock,
  DollarSign
} from "lucide-react";

export default function PlansPage() {
  const [plans, setPlans] = useState<PlanDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlanDetail | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    billingCycle: "MONTHLY" as "MONTHLY" | "YEARLY",
    maxFavorites: 5,
    maxSignals: 1,
    maxHistoryRecords: 20,
    hasVipSignals: false,
    hasSignalAlerts: false,
    isActive: true
  });

  useEffect(() => {
    loadPlans();
  }, []);

  async function loadPlans() {
    try {
      const data = await AdminService.listPlans();
      setPlans(data);
    } catch (error) {
      console.error("Erro ao carregar planos:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleOpenModal = (plan: PlanDetail | null = null) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({
        name: plan.name,
        description: plan.description || "",
        price: Number(plan.price),
        billingCycle: plan.billingCycle,
        maxFavorites: plan.maxFavorites,
        maxSignals: plan.maxSignals,
        maxHistoryRecords: plan.maxHistoryRecords,
        hasVipSignals: plan.hasVipSignals,
        hasSignalAlerts: plan.hasSignalAlerts,
        isActive: plan.isActive
      });
    } else {
      setEditingPlan(null);
      setFormData({
        name: "",
        description: "",
        price: 0,
        billingCycle: "MONTHLY",
        maxFavorites: 5,
        maxSignals: 1,
        maxHistoryRecords: 20,
        hasVipSignals: false,
        hasSignalAlerts: false,
        isActive: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingPlan) {
        await AdminService.updatePlan(editingPlan.id, formData);
      } else {
        await AdminService.createPlan(formData);
      }
      await loadPlans();
      setIsModalOpen(false);
    } catch (error: any) {
      alert(error.message || "Erro ao salvar plano");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja remover este plano? Se houverem assinaturas ativas, ele será apenas inativado.")) return;
    try {
      await AdminService.deletePlan(id);
      await loadPlans();
    } catch (error: any) {
      alert(error.message || "Erro ao remover plano");
    }
  };

  const toggleStatus = async (plan: PlanDetail) => {
    try {
      await AdminService.updatePlan(plan.id, { isActive: !plan.isActive });
      await loadPlans();
    } catch (error: any) {
      alert(error.message || "Erro ao alterar status");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-48 bg-surface rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-surface/40 rounded-2xl border border-border/40" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-main tracking-tight flex items-center gap-3">
            <Package className="text-indigo-500" size={32} />
            Gestão de Planos
          </h1>
          <p className="text-text-muted mt-1">Configure os planos de assinatura disponíveis para os usuários.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20"
        >
          <Plus size={20} />
          Novo Plano
        </button>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div 
            key={plan.id}
            className={`group relative bg-surface/40 border border-border/40 rounded-3xl p-6 transition-all duration-300 hover:border-indigo-500/50 hover:bg-surface/60 overflow-hidden ${!plan.isActive ? 'opacity-75 grayscale-[0.5]' : ''}`}
          >
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[40px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />

            {/* Plan Badge */}
            <div className="flex items-center justify-between mb-6">
              <div className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border ${
                plan.isActive 
                  ? "bg-success/10 text-success border-success/20" 
                  : "bg-text-muted/10 text-text-muted border-text-muted/20"
              }`}>
                {plan.isActive ? "Ativo" : "Inativo"}
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleOpenModal(plan)} className="p-2 bg-surface hover:bg-surface-hover rounded-lg text-text-muted hover:text-white transition-colors border border-border/40">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => handleDelete(plan.id)} className="p-2 bg-danger/10 hover:bg-danger/20 rounded-lg text-danger transition-colors border border-danger/20">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <h3 className="text-xl font-bold text-text-main mb-2">{plan.name}</h3>
            <p className="text-sm text-text-muted mb-6 line-clamp-2 min-h-[40px]">
              {plan.description || "Sem descrição disponível."}
            </p>

            <div className="flex items-baseline gap-1 mb-8">
              <span className="text-3xl font-black text-text-main">R$ {Number(plan.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              <span className="text-sm text-text-muted">/{plan.billingCycle === 'MONTHLY' ? 'mês' : 'ano'}</span>
            </div>

            {/* Features List */}
            <div className="flex flex-wrap gap-2 mb-6">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-surface-hover/40 rounded-lg text-[11px] font-medium text-text-muted">
                <Zap size={12} className="text-indigo-400" />
                {plan.maxFavorites} Favoritos
              </div>
              {plan.hasVipSignals && (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 rounded-lg text-[11px] font-medium text-indigo-400">
                  <CheckCircle size={12} />
                  Sinais VIP
                </div>
              )}
              {plan.hasSignalAlerts && (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 rounded-lg text-[11px] font-medium text-emerald-400">
                  <Zap size={12} />
                  Alertas Instantâneos
                </div>
              )}
            </div>

            <button 
              onClick={() => toggleStatus(plan)}
              className={`w-full py-3 rounded-2xl font-bold text-sm transition-all border ${
                plan.isActive 
                  ? "bg-surface hover:bg-danger/10 hover:text-danger border-border/40 hover:border-danger/20" 
                  : "bg-indigo-500 text-white border-transparent hover:bg-indigo-600"
              }`}
            >
              {plan.isActive ? "Desativar Plano" : "Ativar Plano"}
            </button>
          </div>
        ))}
      </div>

      {/* CRUD Modal */}
      <ActionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPlan ? "Editar Plano" : "Criar Novo Plano"}
        size="lg"
        footer={
          <>
            <button 
              onClick={() => setIsModalOpen(false)}
              className="px-6 py-2.5 text-sm font-semibold text-text-muted hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-8 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
            >
              {isSubmitting ? "Salvando..." : (editingPlan ? "Salvar Alterações" : "Criar Plano")}
            </button>
          </>
        }
      >
        <form className="grid grid-cols-1 md:grid-cols-2 gap-6 p-1">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider ml-1">Nome do Plano</label>
              <input 
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Premium Mensal"
                className="w-full bg-surface-hover/60 border border-border/40 rounded-xl px-4 py-3 text-sm text-text-main focus:outline-none focus:border-indigo-500/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider ml-1">Descrição</label>
              <textarea 
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Uma breve descrição dos benefícios..."
                rows={3}
                className="w-full bg-surface-hover/60 border border-border/40 rounded-xl px-4 py-3 text-sm text-text-main focus:outline-none focus:border-indigo-500/50 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider ml-1">Preço (R$)</label>
                <div className="relative">
                  <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input 
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                    className="w-full bg-surface-hover/60 border border-border/40 rounded-xl pl-9 pr-4 py-3 text-sm text-text-main focus:outline-none focus:border-indigo-500/50"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider ml-1">Ciclo</label>
                <select 
                  value={formData.billingCycle}
                  onChange={e => setFormData({ ...formData, billingCycle: e.target.value as any })}
                  className="w-full bg-surface-hover/60 border border-border/40 rounded-xl px-4 py-3 text-sm text-text-main focus:outline-none focus:border-indigo-500/50"
                >
                  <option value="MONTHLY">Mensal</option>
                  <option value="YEARLY">Anual</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-surface/40 border border-border/40 rounded-2xl space-y-4">
              <h4 className="text-xs font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
                <Zap size={14} className="text-amber-400" />
                Funcionalidades (Features)
              </h4>
              
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-text-muted">Limite de Favoritos</label>
                  <input 
                    type="number"
                    min={1}
                    max={999}
                    value={formData.maxFavorites}
                    onChange={e => setFormData({ ...formData, maxFavorites: parseInt(e.target.value) || 0 })}
                    className="w-full bg-surface-hover/40 border border-border/40 rounded-lg px-4 py-2.5 text-sm text-text-main focus:outline-none focus:border-indigo-500/40 transition-colors"
                  />
                </div>

                {/* Toggle: Sinais VIP */}
                <div className="flex items-center justify-between p-3 bg-surface-hover/20 rounded-xl border border-border/20">
                  <span className="text-sm text-text-main">Acesso Sinais VIP</span>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, hasVipSignals: !formData.hasVipSignals })}
                    className={`w-11 h-6 rounded-full relative transition-colors duration-200 focus:outline-none ${
                      formData.hasVipSignals ? 'bg-indigo-500' : 'bg-surface-hover'
                    }`}
                  >
                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                      formData.hasVipSignals ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                {/* Toggle: Alertas */}
                <div className="flex items-center justify-between p-3 bg-surface-hover/20 rounded-xl border border-border/20">
                  <span className="text-sm text-text-main">Alertas Instantâneos</span>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, hasSignalAlerts: !formData.hasSignalAlerts })}
                    className={`w-11 h-6 rounded-full relative transition-colors duration-200 focus:outline-none ${
                      formData.hasSignalAlerts ? 'bg-indigo-500' : 'bg-surface-hover'
                    }`}
                  >
                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                      formData.hasSignalAlerts ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 px-1">
              <input 
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 rounded border-border/40 bg-surface-hover text-indigo-500 focus:ring-0"
              />
              <label htmlFor="isActive" className="text-sm text-text-main cursor-pointer font-medium">Plano disponível para venda</label>
            </div>
          </div>
        </form>
      </ActionModal>
    </div>
  );
}
