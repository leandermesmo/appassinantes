"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  ShieldCheck, 
  Users, 
  CreditCard, 
  Settings, 
  LogOut,
  LayoutDashboard,
  ArrowLeft,
  Package,
  Database
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: Parameters<typeof clsx>) {
  return twMerge(clsx(inputs));
}

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex w-72 flex-col border-r border-border/40 bg-[#0f1115]/80 backdrop-blur-xl h-full sticky top-0 z-40">
      <div className="p-8 flex flex-col h-full">
        {/* Logo Section */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <ShieldCheck size={24} strokeWidth={2.5} />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
              Admin
            </span>
            <span className="text-[10px] font-bold text-indigo-400 tracking-[0.2em] uppercase">
              AppCrypto
            </span>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="space-y-1.5 flex-1">
          <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-4 px-3">
            Gestão
          </div>
          <NavItem 
            icon={<LayoutDashboard size={20} />} 
            label="Visão Geral" 
            href="/admin" 
            active={pathname === "/admin"} 
          />
          <NavItem 
            icon={<Users size={20} />} 
            label="Usuários" 
            href="/admin/users" 
            active={pathname.startsWith("/admin/users")}
          />
          <NavItem 
            icon={<CreditCard size={20} />} 
            label="Assinaturas" 
            href="/admin/subscriptions" 
            active={pathname.startsWith("/admin/subscriptions")}
          />
          <NavItem 
            icon={<Package size={20} />} 
            label="Planos" 
            href="/admin/plans" 
            active={pathname.startsWith("/admin/plans")}
          />
          
          <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-8 mb-4 px-3">
            Sistema
          </div>
          <NavItem 
            icon={<Database size={20} />} 
            label="Banco de dados: Tickers" 
            href="/admin/database/tickers" 
            active={pathname.startsWith("/admin/database/tickers")}
          />
          <NavItem 
            icon={<Settings size={20} />} 
            label="Config Freemium" 
            href="/admin/settings" 
            active={pathname.startsWith("/admin/settings")}
          />
        </nav>

        {/* Bottom Section */}
        <div className="mt-auto pt-6 border-t border-border/40 space-y-2">
          <Link href="/dashboard" className="flex items-center gap-3 text-text-muted hover:text-white transition-all duration-200 w-full px-4 py-3 rounded-xl hover:bg-surface-hover group">
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-semibold">Voltar ao App</span>
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
}: { 
  icon: React.ReactNode;
  label: string;
  href: string;
  active: boolean;
}) {
  return (
    <Link 
      href={href}
      className={cn(
        "flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-300 relative group",
        active 
          ? "bg-indigo-500/10 text-indigo-400 shadow-[inset_0_0_0_1px_rgba(99,102,241,0.1)]" 
          : "text-text-muted hover:bg-surface-hover hover:text-text-main"
      )}
    >
      <div className={cn(
        "transition-transform duration-300 group-hover:scale-110",
        active ? "text-indigo-400" : "text-text-muted group-hover:text-indigo-400"
      )}>
        {icon}
      </div>
      <span className="text-sm font-semibold tracking-wide">{label}</span>
      {active && (
        <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
      )}
    </Link>
  );
}
