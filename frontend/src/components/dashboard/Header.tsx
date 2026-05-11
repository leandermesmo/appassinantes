import React from "react";
import { Search, Bell, Menu, LogOut, User } from "lucide-react";
import Link from "next/link";
import { auth, signOut } from "@/auth";
import { SubscriptionBadge } from "@/components/ui/SubscriptionBadge";

export async function Header() {
  const session = await auth();
  const user = session?.user;

  // Pegar as iniciais do nome
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "??";

  // Derivar tier server-side para renderização inicial
  const subscriptionStatus = user?.subscriptionStatus || "none";
  const isPremium = subscriptionStatus === "active";

  return (
    <header className="h-20 border-b border-border/40 bg-[#0f1115]/50 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-30">
      <div className="flex items-center gap-6 flex-1">
        <button className="lg:hidden p-2.5 hover:bg-surface-hover rounded-xl text-text-muted transition-colors border border-transparent hover:border-border/40">
          <Menu size={22} />
        </button>
        
        {/* Dynamic Title / Breadcrumb Placeholder */}
        <div className="hidden xl:flex flex-col">
          <h1 className="text-sm font-bold text-text-main tracking-tight">Visão Geral</h1>
          <p className="text-[10px] text-text-muted font-medium uppercase tracking-wider">Dashboard / Home</p>
        </div>

        {/* Enhanced Search */}
        <div className="relative max-w-md w-full hidden md:block group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Buscar ativos, indicadores ou sinais..." 
            className="w-full bg-surface/40 border border-border/40 rounded-2xl py-2.5 pl-12 pr-4 text-sm focus:outline-none focus:border-primary/50 focus:bg-surface/60 focus:ring-4 focus:ring-primary/5 transition-all placeholder:text-text-muted/50"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded border border-border/60 bg-surface-hover/50 text-[10px] font-bold text-text-muted">
            <span>⌘</span>
            <span>K</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-5">
        {/* API Status Indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/5 border border-success/10">
          <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          <span className="text-[10px] font-bold text-success uppercase tracking-wider">Binance Live</span>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2.5 text-text-muted hover:text-text-main hover:bg-surface-hover rounded-xl transition-all relative group border border-transparent hover:border-border/40">
            <Bell size={20} />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full border-2 border-[#0f1115] shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span>
          </button>
        </div>
        
        <div className="flex items-center gap-4 pl-5 border-l border-border/40">
          <div className="text-right hidden md:block">
            <p className="text-sm font-bold text-text-main tracking-tight leading-none mb-1">
              {user?.name || "Usuário"}
            </p>
            <div className="flex items-center justify-end gap-1.5">
              {/* Badge dinâmico de tier — usa Server Component data */}
              {isPremium ? (
                <div className="flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-amber-400" />
                  <p className="text-[10px] text-amber-400 font-bold uppercase tracking-widest">
                    {user?.role === 'ADMIN' ? 'Admin' : 'Pro'}
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-text-muted" />
                  <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">
                    Free
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <div className="group relative">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-primary/20 to-indigo-600/20 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/5 overflow-hidden">
              {user?.image ? (
                <img src={user.image} alt={user.name || ""} className="w-full h-full object-cover" />
              ) : (
                <span>{initials}</span>
              )}
            </div>

            {/* Simple Dropdown on Hover/Click */}
            <div className="absolute right-0 top-full mt-2 w-52 bg-[#111111] border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 p-2 space-y-1">
              <Link
                href="/perfil"
                className="flex items-center gap-2 px-3 py-2 text-sm text-text-muted hover:text-text-main hover:bg-surface-hover rounded-lg transition-all"
              >
                <User className="w-4 h-4" />
                Meu Perfil
              </Link>
              
              <div className="h-px bg-white/5 my-1" />

              <form
                action={async () => {
                  "use server"
                  await signOut()
                }}
              >
                <button
                  type="submit"
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sair da Conta
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
