import { useState, useEffect } from "react";
import { api } from "../services/api";
import { useSubscription } from "./useSubscription";

export function useFavorites() {
  const { isPremium } = useSubscription();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchFavorites() {
      try {
        setIsLoading(true);
        const response = await api.get<{ success: boolean; data: string[] }>("favorites");
        
        if (isMounted && response.data.success) {
          let symbols = response.data.data;

          // Lógica PREMIUM: Se não tiver favoritos e for o primeiro acesso (localStorage), sugerir defaults
          if (isPremium && symbols.length === 0) {
            const hasSeenDefaults = localStorage.getItem("appcrypto_premium_defaults");
            if (!hasSeenDefaults) {
              const defaults = ["BTCUSDT", "ETHUSDT", "XRPUSDT"];
              // Tentar adicionar os defaults no backend (fire and forget ou aguardar?)
              // Por enquanto, apenas atualizamos o estado local e marcamos como visto
              setFavorites(defaults);
              localStorage.setItem("appcrypto_premium_defaults", "true");
              
              // Opcional: Adicionar silenciosamente no backend para persistir
              defaults.forEach(async (s) => {
                try { await api.post("favorites", { symbol: s }); } catch (e) {}
              });
              
              return;
            }
          }

          setFavorites(symbols);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.response?.data?.message || "Erro ao carregar favoritos.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchFavorites();

    return () => { isMounted = false; };
  }, [isPremium]);

  const addFavorite = async (symbol: string) => {
    try {
      await api.post("favorites", { symbol });
      setFavorites((prev) => [...new Set([...prev, symbol])]);
      return true;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || "Erro ao adicionar favorito.");
    }
  };

  const removeFavorite = async (symbol: string) => {
    try {
      await api.delete(`favorites/${symbol}`);
      setFavorites((prev) => prev.filter((s) => s !== symbol));
      return true;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || "Erro ao remover favorito.");
    }
  };

  return { favorites, setFavorites, isLoading, error, addFavorite, removeFavorite };
}
