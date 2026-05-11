import { useState, useEffect } from 'react';
import { api } from '../services/api';

interface Signal {
  symbol: string;
  name: string;
  timeframe: string;
  signal: 'BUY' | 'SELL' | 'NEUTRAL' | 'STRONG_BUY' | 'STRONG_SELL';
  strength: number;
  price: number;
  lastUpdate: string;
}

export const useSignals = () => {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSignals = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('signals/summary');
      setSignals(response.data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar sinais');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSignals();
    // Refresh a cada 1 minuto
    const interval = setInterval(fetchSignals, 60000);
    return () => clearInterval(interval);
  }, []);

  return { signals, isLoading, error, refresh: fetchSignals };
};
