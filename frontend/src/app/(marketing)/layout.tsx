import React from "react";
import Link from "next/link";
import { Activity, LayoutDashboard, User } from "lucide-react";
import { auth } from "@/auth";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0c]">
      <header className="fixed top-0 z-50 w-full border-b border-white/5 bg-[#0a0a0c]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Activity className="h-6 w-6 text-primary" />
            </div>
            <span className="text-2xl font-black tracking-tighter">AppCrypto</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-10">
            <Link href="#features" className="text-sm font-bold text-slate-400 hover:text-white transition-colors">Funcionalidades</Link>
            <Link href="#pricing" className="text-sm font-bold text-slate-400 hover:text-white transition-colors">Planos</Link>
            <Link href="#testimonials" className="text-sm font-bold text-slate-400 hover:text-white transition-colors">Resultados</Link>
          </nav>
          
          <div className="flex items-center gap-6">
            {session ? (
              <Link 
                href="/dashboard" 
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white/5 border border-white/10 px-6 text-sm font-black text-white transition-all hover:bg-white/10"
              >
                <LayoutDashboard className="w-4 h-4" />
                Painel
              </Link>
            ) : (
              <>
                <Link href="/login" className="hidden sm:block text-sm font-bold text-slate-400 hover:text-white transition-colors">
                  Entrar
                </Link>
                <Link 
                  href="/login" 
                  className="inline-flex h-12 items-center justify-center rounded-xl bg-blue-600 px-6 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 hover:scale-105"
                >
                  Começar Agora
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
