"use client";

import React, { useEffect, useState, useCallback } from "react";
import { AdminService, UserSummary, PaginatedResponse } from "@/services/admin.service";
import { DataTable } from "@/components/admin/DataTable";
import { UserStatusBadge } from "@/components/admin/UserStatusBadge";
import { PlanBadge } from "@/components/admin/PlanBadge";
import { Search, Filter, Shield, User, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import Link from "next/link";
import { useDebounce } from "@/hooks/useDebounce";

export default function UsersListPage() {
  const [data, setData] = useState<PaginatedResponse<UserSummary>["data"] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [role, setRole] = useState("ALL");
  const [status, setStatus] = useState("ALL");

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await AdminService.listUsers({
        page,
        limit: 15,
        search: debouncedSearch,
        role,
        status,
      });
      setData(response);
      setError("");
    } catch (err: any) {
      setError(err.message || "Erro ao carregar usuários");
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, role, status]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, role, status]);

  const columns = [
    {
      header: "Usuário",
      cell: (user: UserSummary) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-surface-hover flex items-center justify-center overflow-hidden shrink-0">
            {user.image ? (
              <img src={user.image} alt={user.name || "User"} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-bold text-text-muted">
                {user.name ? user.name[0].toUpperCase() : "?"}
              </span>
            )}
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-text-main truncate max-w-[200px]">{user.name || "Sem nome"}</span>
            <span className="text-xs text-text-muted truncate max-w-[200px]">{user.email}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Tipo",
      cell: (user: UserSummary) => (
        <div className="flex items-center gap-1.5 text-xs font-medium text-text-muted">
          {user.role === "ADMIN" ? (
            <><Shield size={14} className="text-indigo-400" /> Admin</>
          ) : (
            <><User size={14} /> User</>
          )}
        </div>
      ),
    },
    {
      header: "Status",
      cell: (user: UserSummary) => <UserStatusBadge status={user.status} />,
    },
    {
      header: "Plano",
      cell: (user: UserSummary) => {
        if (user.role === "ADMIN") return <PlanBadge planName="Acesso Total" />;
        const activeSub = user.subscriptions[0];
        return <PlanBadge planName={activeSub?.plan.name} />;
      },
    },
    {
      header: "Cadastro",
      cell: (user: UserSummary) => (
        <span className="text-text-muted text-xs">
          {new Date(user.createdAt).toLocaleDateString("pt-BR")}
        </span>
      ),
    },
    {
      header: "Ações",
      className: "text-right",
      cell: (user: UserSummary) => (
        <Link 
          href={`/admin/users/${user.id}`}
          className="inline-flex items-center justify-center p-2 text-text-muted hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
          title="Ver Detalhes"
        >
          <Eye size={18} />
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-main tracking-tight mb-2">Gestão de Usuários</h1>
        <p className="text-text-muted">Gerencie acessos, status e assinaturas dos usuários da plataforma.</p>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 p-4 bg-surface/40 border border-border/40 rounded-2xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
          <input
            type="text"
            placeholder="Buscar por nome, email ou ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface/60 border border-border/40 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50"
          />
        </div>
        
        <div className="flex gap-4">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="bg-surface/60 border border-border/40 rounded-xl py-2 pl-9 pr-8 text-sm text-text-main focus:outline-none appearance-none min-w-[140px]"
            >
              <option value="ALL">Todas as Roles</option>
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="bg-surface/60 border border-border/40 rounded-xl py-2 px-4 text-sm text-text-main focus:outline-none appearance-none min-w-[140px]"
          >
            <option value="ALL">Todos os Status</option>
            <option value="ACTIVE">Ativo</option>
            <option value="INACTIVE">Inativo</option>
            <option value="SUSPENDED">Suspenso</option>
            <option value="BANNED">Banido</option>
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
        data={data?.users || []} 
        columns={columns} 
        isLoading={isLoading}
        emptyMessage={search ? "Nenhum usuário encontrado para a busca." : "Nenhum usuário cadastrado."}
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
    </div>
  );
}
