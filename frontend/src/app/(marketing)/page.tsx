import React from "react";
import Link from "next/link";
import {
  TrendingUp,
  Shield,
  Zap,
  Globe,
  ArrowRight,
  Target,
  Lock,
  Award,
  Users
} from "lucide-react";
import { FeatureItem } from "../../components/marketing/FeatureItem";
import { PricingCard } from "../../components/marketing/PricingCard";
import { auth } from "@/auth";
import { WordSwitcher } from "../../components/marketing/WordSwitcher";

export default async function LandingPage() {
  const session = await auth();
  const ctaHref = session ? "/dashboard" : "/login";
  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0c] text-white selection:bg-primary/30">

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[800px] bg-[radial-gradient(circle_at_50%_-20%,rgba(99,102,241,0.15),transparent_70%)] pointer-events-none" />
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <Zap size={12} fill="currentColor" />
              A Revolução da Análise Técnica
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-8 leading-[0.9] animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
              Antecipe o mercado com: <br className="md:hidden" />
              <WordSwitcher 
                className="premium-gradient" 
                words={["Estratégia.", "Inteligência.", "Oportunidades.", "Clareza."]} 
              />
            </h1>

            <p className="text-xl md:text-2xl text-slate-400 mb-12 leading-relaxed max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-12 duration-700 delay-200">
              Pare de operar no escuro. Tenha acesso a sinais de confluência em tempo real e indicadores avançados usados pelos maiores traders do mundo.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 animate-in fade-in slide-in-from-bottom-16 duration-700 delay-300">
              <Link
                href={ctaHref}
                className="group relative inline-flex h-16 items-center justify-center rounded-2xl bg-blue-600 px-10 text-lg font-black text-white shadow-[0_0_40px_rgba(37,99,235,0.3)] transition-all hover:bg-blue-700 hover:scale-105 active:scale-95"
              >
                {session ? "Ir para o Painel" : "Começar Agora Grátis"}
                <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="#pricing"
                className="h-16 px-10 flex items-center rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm text-lg font-bold hover:bg-white/10 transition-all"
              >
                Ver Planos Pro
              </Link>
            </div>

            {/* Social Proof Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-24 pt-12 border-t border-white/5 animate-in fade-in duration-1000 delay-500">
              <div>
                <div className="text-3xl font-black mb-1">94%</div>
                <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Precisão de Sinais</div>
              </div>
              <div>
                <div className="text-3xl font-black mb-1">24/7</div>
                <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Monitoramento</div>
              </div>
              <div>
                <div className="text-3xl font-black mb-1">12k+</div>
                <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Traders Ativos</div>
              </div>
              <div>
                <div className="text-3xl font-black mb-1">50+</div>
                <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Ativos Analisados</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="features" className="py-24 bg-[#0c0c0e]">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <h2 className="text-sm font-black text-primary uppercase tracking-[0.3em] mb-4">Benefícios Reais</h2>
            <p className="text-4xl md:text-5xl font-black tracking-tight">O que você ganha com o <span className="text-primary">AppCrypto</span></p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureItem
              icon={Target}
              title="Sinais de Confluência"
              description="Aguardamos a confirmação de múltiplos indicadores (RSI, StochRSI, MACD e EMAs) para gerar o sinal mais seguro possível."
            />
            <FeatureItem
              icon={Globe}
              title="Visão Multi-Timeframe"
              description="Analise o mercado em 1h, 4h, Diário e Semanal simultaneamente para identificar tendências macro e micro."
            />
            <FeatureItem
              icon={Lock}
              title="Lógica Blindada"
              description="Nossos algoritmos processam dados pesados no servidor, entregando apenas a inteligência refinada para você."
            />
            <FeatureItem
              icon={TrendingUp}
              title="Histórico Transparente"
              description="Audite todos os sinais passados e veja a taxa de acerto real de cada estratégia em cada ativo."
            />
            <FeatureItem
              icon={Shield}
              title="Gestão de Risco"
              description="Receba níveis claros de força do sinal para ajustar sua mão de acordo com a probabilidade de acerto."
            />
            <FeatureItem
              icon={Users}
              title="Comunidade VIP"
              description="Acesso a insights exclusivos e discussões estratégicas com traders profissionais."
            />
          </div>
        </div>
      </section>

      {/* Results Section / Proof of Value */}
      <section id="testimonials" className="py-24 relative">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-sm font-black text-primary uppercase tracking-[0.3em] mb-4">Resultados Comprovados</h2>
              <p className="text-4xl md:text-5xl font-black tracking-tight mb-8">
                A precisão que você precisa para <span className="text-primary">vencer o mercado.</span>
              </p>
              <p className="text-slate-400 text-lg mb-10 leading-relaxed">
                Nossos algoritmos analisam mais de 500.000 pontos de dados diariamente para encontrar as melhores oportunidades. Não operamos com base em "achismo", mas sim em confluência matemática pura.
              </p>

              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-surface/50 border border-white/5 flex items-center gap-6">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
                    <TrendingUp size={32} />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-emerald-500">+1.240%</div>
                    <div className="text-sm text-slate-400">Retorno médio acumulado em 2025</div>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-surface/50 border border-white/5 flex items-center gap-6">
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
                    <Award size={32} />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-white">Top 1%</div>
                    <div className="text-sm text-slate-400">Entre as ferramentas de análise técnica do Brasil</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 bg-primary/20 blur-[60px] rounded-full pointer-events-none" />
              <div className="relative glass-panel p-2 rounded-[32px] border-white/10 shadow-2xl overflow-hidden">
                <div className="bg-[#0f111a] rounded-[24px] p-8 min-h-[400px] flex flex-col justify-center">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-full bg-slate-700 animate-pulse" />
                    <div>
                      <div className="w-32 h-4 bg-slate-700 rounded animate-pulse mb-2" />
                      <div className="w-20 h-3 bg-slate-800 rounded animate-pulse" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="w-full h-4 bg-slate-800 rounded animate-pulse" />
                    <div className="w-full h-4 bg-slate-800 rounded animate-pulse" />
                    <div className="w-2/3 h-4 bg-slate-800 rounded animate-pulse" />
                  </div>
                  <div className="mt-12 pt-8 border-t border-white/5 flex justify-between items-center">
                    <div className="flex gap-2">
                      <div className="w-8 h-8 rounded bg-primary/20" />
                      <div className="w-8 h-8 rounded bg-primary/20" />
                      <div className="w-8 h-8 rounded bg-primary/20" />
                    </div>
                    <div className="px-4 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-black">
                      SINAL CONFIRMADO
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-full h-[600px] bg-[radial-gradient(circle_at_20%_100%,rgba(99,102,241,0.1),transparent_70%)] pointer-events-none" />

        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <h2 className="text-sm font-black text-primary uppercase tracking-[0.3em] mb-4">Planos e Preços</h2>
            <p className="text-4xl md:text-5xl font-black tracking-tight">Escolha seu nível de <span className="text-primary">Poder</span></p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <PricingCard
              name="Starter"
              price="R$ 0"
              description="Para quem está começando e quer sentir o poder dos nossos dados."
              features={[
                "Sinais básicos (Diário)",
                "3 Ativos favoritos",
                "Indicadores RSI/Stoch",
                "Suporte via e-mail"
              ]}
              cta="Começar Grátis"
            />
            <PricingCard
              name="Pro"
              price="R$ 49,90"
              isPopular={true}
              description="O plano ideal para traders consistentes que buscam performance."
              features={[
                "Todos os Timeframes (1h+)",
                "20 Ativos favoritos",
                "Histórico completo",
                "Sinais de confluência Pro",
                "Alertas no Telegram"
              ]}
              cta="Garantir Acesso Pro"
            />
            <PricingCard
              name="VIP Premium"
              price="R$ 99,90"
              description="Inteligência de nível institucional para quem não aceita menos que o topo."
              features={[
                "Tudo do Plano Pro",
                "Favoritos Ilimitados",
                "Sinais VIP Exclusivos",
                "Suporte Prioritário 24/7",
                "Consultoria mensal de estratégia"
              ]}
              cta="Seja VIP agora"
            />
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="bg-gradient-to-br from-indigo-600 to-primary rounded-[40px] p-12 md:p-24 text-center relative overflow-hidden shadow-2xl shadow-primary/20">
            <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12">
              <TrendingUp size={300} />
            </div>

            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight">Pronto para transformar seus resultados?</h2>
              <p className="text-indigo-100 text-lg md:text-xl mb-12 opacity-90">
                Junte-se a milhares de traders que já automatizaram sua análise técnica e estão operando com mais confiança.
              </p>
              <Link
                href={ctaHref}
                className="inline-flex h-16 items-center justify-center rounded-2xl bg-white px-12 text-lg font-black text-blue-600 transition-all hover:scale-105 active:scale-95 shadow-xl"
              >
                {session ? "Acessar meu Dashboard" : "Começar Gratuitamente Agora"}
              </Link>
              <p className="mt-8 text-sm text-indigo-200 font-medium">Sem cartão de crédito necessário.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Simples */}
      <footer className="py-12 border-t border-white/5 bg-[#08080a]">
        <div className="container mx-auto px-6 text-center">
          <p className="text-sm text-slate-500">© 2026 AppCrypto. Todos os direitos reservados. Opere com responsabilidade.</p>
        </div>
      </footer>
    </div>
  );
}
