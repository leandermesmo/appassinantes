"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  TrendingUp, 
  Wallet, 
  Settings, 
  LogOut,
  History,
  Lock,
  Crown,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  User
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { useSubscription } from "@/hooks/useSubscription";

function cn(...inputs: Parameters<typeof clsx>) {
  return twMerge(clsx(inputs));
}

export function Sidebar() {
  const pathname = usePathname();
  const { isPremium, isFree, isAdmin } = useSubscription();

  return (
    <aside className="hidden lg:flex w-72 flex-col border-r border-border/40 bg-[#0f1115]/80 backdrop-blur-xl h-full sticky top-0">
      <div className="p-8 flex flex-col h-full">
        {/* Logo Section */}
        <Link href="/dashboard" className="flex items-center gap-3 mb-10 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform duration-300">
            <TrendingUp size={24} strokeWidth={2.5} />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
              AppCrypto
            </span>
            <span className="text-[10px] font-bold text-primary tracking-[0.2em] uppercase">
              Technical Analysis
            </span>
          </div>
        </Link>
        
        {/* Navigation */}
        <nav className="space-y-1.5 flex-1">
          <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-4 px-3">
            Menu Principal
          </div>
          <NavItem 
            icon={<LayoutDashboard size={20} />} 
            label="Dashboard" 
            href="/dashboard" 
            active={pathname === "/dashboard"} 
          />
          <NavItem 
            icon={<TrendingUp size={20} />} 
            label="Análise Técnica" 
            href="/dashboard/analise" 
            active={pathname === "/dashboard/analise"}
            locked={isFree}
            lockLabel="Premium"
          />
          <NavItem 
            icon={<TrendingUp size={20} />} 
            label="Análise de Tendência" 
            href="/analysis/trend" 
            active={pathname === "/analysis/trend"}
            locked={isFree}
            lockLabel="Premium"
          />
          <NavItem 
            icon={<History size={20} />} 
            label="Histórico do Gráfico" 
            href="/dashboard/historico" 
            active={pathname === "/dashboard/historico"}
          />
          <NavItem 
            icon={<Sparkles size={20} />} 
            label="Teste" 
            href="/dashboard/teste" 
            active={pathname === "/dashboard/teste"}
          />
          <NavItem 
            icon={<Wallet size={20} />} 
            label="Minha Assinatura" 
            href="/dashboard/assinatura" 
            active={pathname === "/dashboard/assinatura"}
          />
          
          <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-8 mb-4 px-3">
            Preferências
          </div>
          <NavItem 
            icon={<User size={20} />} 
            label="Meu Perfil" 
            href="/perfil" 
            active={pathname === "/perfil"}
          />
          <NavItem 
            icon={<Settings size={20} />} 
            label="Configurações" 
            href="/dashboard/configuracoes" 
            active={pathname === "/dashboard/configuracoes"}
          />
          {isAdmin && (
            <NavItem 
              icon={<ShieldCheck size={20} />} 
              label="Administração" 
              href="/admin" 
              active={pathname.startsWith("/admin")}
            />
          )}
        </nav>

        {/* Bottom Section */}
        <div className="mt-auto pt-6 border-t border-border/40">
          {/* CTA de upgrade para FREE */}
          {isFree ? (
            <Link
              href="/planos"
              className="block mb-6 group"
            >
              <div className="relative overflow-hidden bg-gradient-to-br from-amber-500/10 via-yellow-400/5 to-amber-500/10 border border-amber-500/20 rounded-2xl p-4 hover:border-amber-500/40 transition-all">
                <div className="absolute inset-0 shimmer" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <Crown size={16} className="text-amber-400" />
                    <span className="text-xs font-bold text-amber-400">Upgrade para Premium</span>
                  </div>
                  <p className="text-[10px] text-text-muted mb-3">
                    Desbloqueie 50+ ativos, todos os timeframes e sinais em tempo real.
                  </p>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-amber-400 group-hover:translate-x-1 transition-transform">
                    <span>Ver planos</span>
                    <ArrowRight size={12} />
                  </div>
                </div>
              </div>
            </Link>
          ) : (
            <div className="bg-surface/40 border border-border/40 rounded-2xl p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-text-muted uppercase">Binance Spot</span>
                <span className="flex h-2 w-2 rounded-full bg-success animate-pulse"></span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-text-main">BTC/USDT</span>
                <span className="text-xs font-bold text-success">+$2.45%</span>
              </div>
            </div>
          )}

          <Link href="/" className="flex items-center gap-3 text-text-muted hover:text-danger transition-all duration-200 w-full px-4 py-3 rounded-xl hover:bg-danger/10 group">
            <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-semibold">Sair da Conta</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}

function NavItem({ 
  icon, 
  label, 
  href, 
  active,
  locked = false,
  lockLabel,
}: { 
  icon: React.ReactNode;
  label: string;
  href: string;
  active: boolean;
  locked?: boolean;
  lockLabel?: string;
}) {
  return (
    <Link 
      href={href}
      className={cn(
        "flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-300 relative group",
        active 
          ? "bg-primary/10 text-primary shadow-[inset_0_0_0_1px_rgba(59,130,246,0.1)]" 
          : "text-text-muted hover:bg-surface-hover hover:text-text-main"
      )}
    >
      <div className={cn(
        "transition-transform duration-300 group-hover:scale-110",
        active ? "text-primary" : "text-text-muted group-hover:text-primary"
      )}>
        {icon}
      </div>
      <span className="text-sm font-semibold tracking-wide">{label}</span>
      {locked && (
        <span className="ml-auto flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
          <Lock size={8} className="text-amber-400" />
          <span className="text-[8px] font-bold text-amber-400 uppercase">{lockLabel}</span>
        </span>
      )}
      {active && !locked && (
        <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
      )}
    </Link>
  );
}
