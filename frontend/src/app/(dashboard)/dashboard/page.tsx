"use client";

import React from "react";
import { formatPrice } from "@/lib/formatters";
import { TrendingUp, Activity, Globe, LayoutDashboard, Lock, X } from "lucide-react";
import { useDashboard } from "../../../hooks/useDashboard";
import { useSubscription } from "../../../hooks/useSubscription";
import { useFavorites } from "../../../hooks/useFavorites";
import { TrendCard } from "../../../components/dashboard/TrendCard";
import { AddFavoriteModal } from "../../../components/dashboard/AddFavoriteModal";
import { MarketTable } from "../../../components/dashboard/MarketTable";
import { OpportunitySection } from "../../../components/dashboard/OpportunitySection";
import { PremiumGate } from "../../../components/ui/PremiumGate";
import { BlurBlock } from "../../../components/ui/BlurBlock";
import { UpgradeCTA } from "../../../components/ui/UpgradeCTA";

/**
 * Componente Wrapper para carregar dados de um favorito específico
 */
function FavoriteTrendCard({ 
  symbol, 
  onRemove 
}: { 
  symbol: string; 
  onRemove?: () => void;
}) {
  const { data, isLoading } = useDashboard(symbol);
  
  // Limpar símbolo para exibição (ex: BTCUSDT -> BTC)
  const displaySymbol = symbol.replace("USDT", "");
  const displayName = displaySymbol === "BTC" ? "Bitcoin" : displaySymbol === "ETH" ? "Ethereum" : displaySymbol;

  return (
    <div className="relative group">
      <TrendCard
        symbol={displaySymbol}
        name={displayName}
        price={data?.lastPrice || 0}
        change={data?.lastPrice ? "+2.45%" : "--"} // TODO: Pegar variação real da API se disponível
        isPositive={true}
        trend="up"
        isLoading={isLoading}
      />
      {onRemove && (
        <button 
          onClick={onRemove}
          className="absolute -top-2 -right-2 z-10 bg-surface border border-border p-1 rounded-full text-text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-all shadow-lg"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { isPremium, isFree } = useSubscription();
  const { favorites, addFavorite, removeFavorite, isLoading: isFavLoading } = useFavorites();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [mockFavorite, setMockFavorite] = React.useState<string | null>(null);

  // Fallback para BTC se não houver favoritos (Garante que sempre tenha algo)
  const displayFavorites = favorites.length > 0 ? favorites : ["BTCUSDT"];

  const handleAddClick = () => {
    setIsModalOpen(true);
  };

  const handleSelectFavorite = async (symbol: string) => {
    if (isFree) {
      setMockFavorite(symbol);
    } else {
      await addFavorite(symbol);
    }
  };

  return (
    <div className="space-y-10 pb-10 animate-in fade-in duration-700">
      {/* Modais */}
      <AddFavoriteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleSelectFavorite}
        existingFavorites={favorites}
      />

      {/* Banner de Upgrade para FREE */}
      {isFree && (
        <UpgradeCTA
          variant="banner"
          title="Você está no plano gratuito"
          description="Desbloqueie todos os ativos, indicadores e sinais em tempo real."
          buttonText="Ver Planos Premium"
        />
      )}

      {/* Header da Seção */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-2 premium-gradient">
            Dashboard {isPremium ? "Premium" : ""}
          </h1>
          <p className="text-text-muted flex items-center gap-2 text-sm">
            <Activity size={14} className="text-primary" />
            {isPremium
              ? "Análise em tempo real dos principais ativos do mercado"
              : "Análise limitada — BTC disponível gratuitamente"
            }
          </p>
        </div>
        
        <div className="flex items-center gap-3 bg-surface p-1 rounded-xl border border-border">
          <button className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold shadow-lg shadow-primary/20 flex items-center gap-2">
            <LayoutDashboard size={14} />
            Visão Geral
          </button>
          <button
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 ${
              isFree ? "text-text-muted/40 cursor-not-allowed" : "text-text-muted hover:text-text-main"
            }`}
            disabled={isFree}
          >
            <Globe size={14} />
            Mercado Global
            {isFree && <Lock size={10} className="text-amber-400" />}
          </button>
        </div>
      </div>

      {/* Top Trends Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <TrendingUp size={18} className="text-primary" />
          <h2 className="text-lg font-bold">Principais Tendências</h2>
          {isFree && (
            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md uppercase tracking-wider">
              {favorites.length > 0 ? favorites.length : 1} de 50+ ativos
            </span>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Renderização para PREMIUM */}
          {isPremium && (
            <>
              {displayFavorites.map((symbol) => (
                <FavoriteTrendCard 
                  key={symbol} 
                  symbol={symbol} 
                  onRemove={() => removeFavorite(symbol)}
                />
              ))}
              
              {/* Botão Adicionar (se tiver espaço no grid de 4, ou sempre se quiser permitir mais) */}
              {favorites.length < 8 && (
                <div 
                  onClick={handleAddClick}
                  className="glass-panel p-5 border-dashed border-2 border-border/60 flex flex-col items-center justify-center text-center group hover:border-primary/40 transition-all cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-border/40 flex items-center justify-center mb-3 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                    <span className="text-xl font-bold">+</span>
                  </div>
                  <p className="text-xs font-bold text-text-muted group-hover:text-text-main transition-colors">Adicionar Ativo</p>
                  <p className="text-[10px] text-text-muted mt-1 italic">Personalize sua grade</p>
                </div>
              )}
            </>
          )}

          {/* Renderização para FREE */}
          {isFree && (
            <>
              {/* BTC - Sempre presente */}
              <FavoriteTrendCard symbol="BTCUSDT" />

              {/* Ativo Mock (Adicionado mas borrado) */}
              {mockFavorite ? (
                <div className="relative group">
                  <BlurBlock variant="compact" ctaText="Premium" message="Dados em tempo real bloqueados">
                    <FavoriteTrendCard symbol={mockFavorite} />
                  </BlurBlock>
                  <button 
                    onClick={() => setMockFavorite(null)}
                    className="absolute top-2 right-2 z-10 p-1 bg-danger/20 text-danger rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                /* Botão Adicionar para FREE */
                <div 
                  onClick={handleAddClick}
                  className="glass-panel p-5 border-dashed border-2 border-primary/20 flex flex-col items-center justify-center text-center group hover:border-primary/40 transition-all cursor-pointer bg-primary/5"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
                    <span className="text-xl font-bold">+</span>
                  </div>
                  <p className="text-xs font-bold text-primary">Testar Ativo</p>
                  <p className="text-[10px] text-text-muted mt-1 italic">Apenas +1 (Visualização)</p>
                </div>
              )}

              {/* Slots Bloqueados fixos para manter o layout premium */}
              <div className="relative">
                <BlurBlock variant="compact" ctaText="Premium" message="">
                  <TrendCard symbol="ETH" name="Ethereum" price="$3,450" change="-1.2%" isPositive={false} trend="neutral" />
                </BlurBlock>
              </div>
              <div className="relative">
                <BlurBlock variant="compact" ctaText="Premium" message="">
                  <TrendCard symbol="SOL" name="Solana" price="$145" change="+5.8%" isPositive={true} trend="up" />
                </BlurBlock>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Main Content: Market Table & Opportunities */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2">
          <MarketTable />
        </div>
        
        <div className="space-y-8">
          {/* Oportunidades — bloqueadas para FREE */}
          <PremiumGate
            showPreview
            message="Oportunidades de Elite"
            subtitle="Descubra os melhores momentos de entrada e saída com IA."
          >
            <OpportunitySection />
          </PremiumGate>
          
          {/* Widget de Status / CTA de Upgrade */}
          {isPremium ? (
            <div className="bg-gradient-to-br from-indigo-600 to-primary rounded-2xl p-6 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
                <LayoutDashboard size={80} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 relative z-10">Status da Assinatura</h3>
              <p className="text-indigo-100 text-xs mb-4 relative z-10">Você possui acesso completo ao Terminal AppCrypto.</p>
              <div className="flex items-center gap-2 mb-6">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-100 uppercase tracking-widest">Ativa e Segura</span>
              </div>
              <button className="w-full py-3 bg-white text-primary rounded-xl text-xs font-bold hover:bg-indigo-50 transition-colors shadow-lg">
                Gerenciar Assinatura
              </button>
            </div>
          ) : (
            <UpgradeCTA
              variant="card"
              title="O que você está perdendo"
              description="Assinantes Premium têm acesso a recursos exclusivos."
              buttonText="Assinar Premium"
              metrics={[
                { label: "Ativos monitorados", value: "50+" },
                { label: "Sinais por dia", value: "27+" },
                { label: "Timeframes", value: "8" },
                { label: "Indicadores", value: "12+" },
              ]}
            />
          )}
        </div>
      </div>
    </div>
  );
}
