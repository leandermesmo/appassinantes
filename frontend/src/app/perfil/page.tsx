import { UserInfoCard } from "@/components/profile/UserInfoCard";
import { GeneralPreferences } from "@/components/profile/GeneralPreferences";
import { MarketPreferences } from "@/components/profile/MarketPreferences";
import { NotificationSettings } from "@/components/profile/NotificationSettings";
import { SubscriptionCard } from "@/components/profile/SubscriptionCard";
import { ArrowLeft, Settings } from "lucide-react";
import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  const user = {
    name: session.user.name || "Usuário",
    email: session.user.email || "",
    image: session.user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.name || 'User'}`,
  };

  return (
    <main className="min-h-screen bg-black text-zinc-100 selection:bg-blue-500/30">
      {/* Header Fixo/Sticky */}
      <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-black/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard" 
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors group"
              title="Voltar ao Dashboard"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </Link>
            <div className="h-6 w-px bg-zinc-800 hidden md:block" />
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-500" />
              <h1 className="text-xl font-bold tracking-tight">Perfil do Usuário</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="hidden md:flex flex-col items-end">
                <span className="text-xs text-zinc-500 font-medium">SESSÃO ATIVA</span>
                <span className="text-[10px] text-green-500 font-bold uppercase tracking-widest">Seguro</span>
             </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-10 max-w-6xl">
        <div className="grid grid-cols-1 gap-8">
          
          {/* Seção 1: Identidade */}
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <UserInfoCard user={user} />
          </section>

          {/* Seção 2: Assinatura (Destaque) */}
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
            <SubscriptionCard />
          </section>

          {/* Seção 3: Preferências (Grid) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
            <GeneralPreferences />
            <MarketPreferences />
          </div>

          {/* Seção 4: Notificações */}
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
            <NotificationSettings />
          </section>

          {/* Footer de Ações Rápidas ou Info */}
          <footer className="mt-12 pt-8 border-t border-zinc-900 flex flex-col md:flex-row items-center justify-between gap-6 text-zinc-500">
            <p className="text-sm">© 2026 AppCrypto - Sua plataforma premium de análise.</p>
            <div className="flex items-center gap-6 text-xs font-medium">
              <button className="hover:text-white transition-colors">Termos de Uso</button>
              <button className="hover:text-white transition-colors">Privacidade</button>
              <button className="hover:text-white transition-colors text-red-500/70 hover:text-red-500">Encerrar Sessão</button>
            </div>
          </footer>
        </div>
      </div>
    </main>
  );
}
