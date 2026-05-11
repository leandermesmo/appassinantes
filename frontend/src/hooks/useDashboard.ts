import { useState, useEffect } from "react";
import { api } from "../services/api";

export interface DashboardData {
  symbol: string;
  lastPrice: number;
  indicators: {
    rsi: number | null;
    stochRsi: {
      k: number;
      d: number;
    } | null;
  };
}

export function useDashboard(symbol: string = "BTCUSDT") {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Se o símbolo for vazio, não fazer fetch (usado no Freemium para evitar requests)
    if (!symbol) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    let isMounted = true;

    async function fetchData() {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await api.get<{ success: boolean; data: DashboardData }>(`market/dashboard/${symbol}`);
        
        if (isMounted && response.data.success) {
          setData(response.data.data);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const errorObj = err as { response?: { data?: { message?: string } } };
          setError(errorObj.response?.data?.message || "Erro ao carregar dados do dashboard.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchData();

    // Auto-refresh a cada 30 segundos
    const interval = setInterval(fetchData, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [symbol]);

  return { data, isLoading, error };
}
