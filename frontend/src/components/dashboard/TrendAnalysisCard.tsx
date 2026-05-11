import React from "react";
import { TrendingUp, TrendingDown, MoveRight } from "lucide-react";

interface TrendCardProps {
  timeframe: string;
  pair: string;
  label: "Forte Alta" | "Alta" | "Lateral" | "Baixa" | "Forte Baixa";
  score: number;
  confidence: "Alta" | "Média" | "Baixa";
  description: string;
}

export const TrendAnalysisCard: React.FC<TrendCardProps> = ({
  timeframe,
  pair,
  label,
  score,
  confidence,
  description,
}) => {
  // Mapeamento de cores e ícones baseados no label
  const isPositive = label.includes("Alta");
  const isNegative = label.includes("Baixa");
  
  const getStatusColor = () => {
    if (label === "Forte Alta") return "text-emerald-400";
    if (label === "Alta") return "text-emerald-500/80";
    if (label === "Lateral") return "text-amber-400";
    if (label === "Baixa") return "text-rose-500/80";
    if (label === "Forte Baixa") return "text-rose-400";
    return "text-text-muted";
  };

  const getIcon = () => {
    if (isPositive) return <TrendingUp className={getStatusColor()} size={24} />;
    if (isNegative) return <TrendingDown className={getStatusColor()} size={24} />;
    return <MoveRight className={getStatusColor()} size={24} />;
  };

  // Nomes amigáveis para os timeframes
  const timeframeNames: Record<string, string> = {
    "15m": "15 Minutos",
    "1h": "1 Hora",
    "4h": "4 Horas",
    "1d": "1 Dia",
    "1w": "1 Semana",
    "1M": "1 Mês"
  };

  return (
    <div className="bg-gradient-to-br from-[#1a1d23] to-[#0f1115] border border-white/10 rounded-2xl p-4 shadow-lg hover:border-primary/40 hover:scale-[1.02] transition-all duration-300 group cursor-default relative overflow-hidden">
      {/* Glow effect no hover */}
      <div className="absolute -inset-px bg-gradient-to-br from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none" />
      
      {/* Header */}
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1 block">
            {timeframeNames[timeframe] || timeframe}
          </span>
          <h3 className="text-base font-bold text-text-main">{pair}</h3>
        </div>
        <div className="w-16 h-8 opacity-40 group-hover:opacity-100 transition-opacity duration-500">
          <svg viewBox="0 0 100 40" className="w-full h-full">
            <path
              d={isPositive 
                ? "M0 35 Q 25 30, 40 15 T 70 20 T 100 5" 
                : isNegative 
                ? "M0 5 Q 25 10, 40 25 T 70 20 T 100 35" 
                : "M0 20 Q 25 15, 50 25 T 100 20"}
              fill="none"
              stroke={isPositive ? "#10b981" : isNegative ? "#f43f5e" : "#fbbf24"}
              strokeWidth="3"
              strokeLinecap="round"
              className="drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]"
            />
          </svg>
        </div>
      </div>

      {/* Main Trend Indicator */}
      <div className="flex items-center gap-4 mb-4 relative z-10">
        <div className="p-2 rounded-xl bg-white/5 border border-white/10 shadow-inner group-hover:bg-primary/5 group-hover:border-primary/20 transition-colors duration-300">
          {getIcon()}
        </div>
        <div>
          <div className={`text-xl font-black tracking-tighter ${getStatusColor()} group-hover:scale-105 transition-transform duration-300 origin-left uppercase`}>
            {label}
          </div>
          <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-0.5">
            Tendência Atual
          </div>
        </div>
      </div>

      {/* Score and Intensity Bar */}
      <div className="space-y-3 mb-4 relative z-10">
        <div className="flex justify-between items-end">
          <div className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Score Técnico</div>
          <div className="text-lg font-black text-primary">
            {score}
            <span className="text-[10px] text-text-muted font-bold ml-1 tracking-normal italic">/100</span>
          </div>
        </div>

        <div className="relative h-3 w-full bg-black/20 rounded-sm overflow-hidden border border-white/5 flex items-center">
          {/* Background full gradient (dimmed) */}
          <div className="absolute inset-0 bg-gradient-to-r from-rose-500/20 via-amber-500/20 to-emerald-500/20" />
          
          {/* Filled part (bright) */}
          <div 
            className="absolute h-full w-full bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 shadow-[0_0_15px_rgba(251,191,36,0.2)] transition-all duration-1000 ease-out"
            style={{ 
              clipPath: `inset(0 ${100 - score}% 0 0)`
            }}
          />

          {/* Segment Dividers */}
          <div className="absolute inset-0 flex justify-between px-[1%] pointer-events-none">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-full w-[1px] bg-black/40" />
            ))}
          </div>
          
          {/* Vertical Indicator Line */}
          <div 
            className="absolute h-full w-[2px] bg-white shadow-[0_0_8px_white] transition-all duration-1000 ease-out z-20"
            style={{ left: `calc(${score}% - 1px)` }}
          />
        </div>
        
        {/* Labels below bar (optional but present in image) */}
        <div className="flex justify-between items-center text-[9px] font-bold text-text-muted/60 uppercase tracking-tighter mt-1">
          <span>0</span>
          <span className="text-primary/60">{score}/100</span>
          <span>100</span>
        </div>
      </div>

      {/* Confidence and Description */}
      <div className="pt-3 border-t border-white/5 space-y-3 relative z-10">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Confiança</span>
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
              confidence === "Alta" ? "bg-emerald-400" : confidence === "Média" ? "bg-amber-400" : "bg-rose-400"
            }`} />
            <span className={`text-[10px] font-black uppercase ${
              confidence === "Alta" ? "text-emerald-400" : confidence === "Média" ? "text-amber-400" : "text-rose-400"
            }`}>
              {confidence}
            </span>
          </div>
        </div>
        <p className="text-[11px] text-text-muted leading-relaxed italic opacity-80 group-hover:opacity-100 transition-opacity">
          "{description}"
        </p>
      </div>
    </div>
  );
};
