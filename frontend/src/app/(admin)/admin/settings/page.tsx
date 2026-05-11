"use client";

import React, { useEffect, useState } from "react";
import { AdminService, FreemiumLimits } from "@/services/admin.service";
import { FreemiumConfigForm } from "@/components/admin/FreemiumConfigForm";
import { Settings, Shield } from "lucide-react";

export default function SettingsPage() {
  const [config, setConfig] = useState<FreemiumLimits | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    async function loadConfig() {
      try {
        const data = await AdminService.getFreemiumConfig();
        setConfig(data);
      } catch (err: any) {
        setError(err.message || "Erro ao carregar configurações Freemium");
      } finally {
        setIsLoading(false);
      }
    }

    loadConfig();
  }, []);

  const handleSave = async (data: Partial<FreemiumLimits>) => {
    setIsSaving(true);
    setError("");
    setSuccessMsg("");
    try {
      await AdminService.updateFreemiumConfig(data);
      setSuccessMsg("Configurações atualizadas com sucesso! Elas já estão valendo para todos os usuários Free.");
      // Recarrega config atualizada
      const updatedData = await AdminService.getFreemiumConfig();
      setConfig(updatedData);
    } catch (err: any) {
      setError(err.message || "Erro ao salvar configurações");
    } finally {
      setIsSaving(false);
      // Limpa mensagem de sucesso após 5s
      setTimeout(() => setSuccessMsg(""), 5000);
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-64 bg-surface rounded-lg" />
        <div className="h-[600px] w-full bg-surface/40 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-main tracking-tight mb-2">Configurações do Sistema</h1>
        <p className="text-text-muted">Ajuste os parâmetros dinâmicos da plataforma.</p>
      </div>

      <div className="bg-surface/40 border border-border/40 rounded-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-border/40 bg-surface/30 flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
            <Settings size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-main flex items-center gap-2">
              Regras do Plano Free
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-indigo-500/30 bg-indigo-500/10 text-[10px] uppercase text-indigo-400">
                <Shield size={10} /> Live
              </span>
            </h2>
          </div>
        </div>

        <div className="p-6 md:p-8">
          {error && (
            <div className="mb-6 p-4 bg-danger/10 border border-danger/20 rounded-xl text-danger text-sm">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="mb-6 p-4 bg-success/10 border border-success/20 rounded-xl text-success text-sm">
              {successMsg}
            </div>
          )}

          {config && (
            <FreemiumConfigForm 
              initialData={config} 
              onSubmit={handleSave} 
              isLoading={isSaving} 
            />
          )}
        </div>
      </div>
    </div>
  );
}
