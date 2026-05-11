import React from 'react';
import { formatPrice } from '@/lib/formatters';

interface SignalCardProps {
  symbol: string;
  name: string;
  timeframe: string;
  signal: 'BUY' | 'SELL' | 'NEUTRAL' | 'STRONG_BUY' | 'STRONG_SELL';
  strength: number;
  price: number;
  lastUpdate: string;
}

export const SignalCard: React.FC<SignalCardProps> = ({
  symbol,
  name,
  timeframe,
  signal,
  strength,
  price,
  lastUpdate
}) => {
  const getSignalConfig = () => {
    switch (signal) {
      case 'STRONG_BUY':
        return { 
          label: 'Compra Forte', 
          color: 'text-emerald-400', 
          bg: 'bg-emerald-500/10', 
          border: 'border-emerald-500/20',
          glow: 'shadow-[0_0_15px_rgba(16,185,129,0.2)]'
        };
      case 'BUY':
        return { 
          label: 'Compra', 
          color: 'text-green-400', 
          bg: 'bg-green-500/10', 
          border: 'border-green-500/20',
          glow: ''
        };
      case 'STRONG_SELL':
        return { 
          label: 'Venda Forte', 
          color: 'text-rose-400', 
          bg: 'bg-rose-500/10', 
          border: 'border-rose-500/20',
          glow: 'shadow-[0_0_15px_rgba(244,63,94,0.2)]'
        };
      case 'SELL':
        return { 
          label: 'Venda', 
          color: 'text-red-400', 
          bg: 'bg-red-500/10', 
          border: 'border-red-500/20',
          glow: ''
        };
      default:
        return { 
          label: 'Lateral', 
          color: 'text-slate-400', 
          bg: 'bg-slate-500/10', 
          border: 'border-slate-500/20',
          glow: ''
        };
    }
  };

  const config = getSignalConfig();

  return (
    <div className={`p-4 rounded-xl border ${config.border} ${config.bg} ${config.glow} transition-all hover:scale-[1.02]`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-white">{symbol}</h3>
          <p className="text-xs text-slate-400">{name}</p>
        </div>
        <span className="px-2 py-1 rounded bg-slate-800 text-[10px] font-mono text-slate-300 border border-slate-700">
          {timeframe}
        </span>
      </div>

      <div className="mb-4">
        <div className={`text-2xl font-black uppercase tracking-wider ${config.color}`}>
          {config.label}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className={`h-full ${config.color.replace('text', 'bg')} transition-all duration-1000`} 
              style={{ width: `${strength}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-500">{strength}%</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-800/50">
        <div>
          <p className="text-[10px] text-slate-500 uppercase">Preço no Sinal</p>
          <p className="text-sm font-medium text-slate-200">${formatPrice(price)}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-slate-500 uppercase">Última Atualização</p>
          <p className="text-[10px] text-slate-400">
            {new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'UTC' }).format(new Date(lastUpdate))} UTC
          </p>
        </div>
      </div>
    </div>
  );
};
