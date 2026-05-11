import React from "react";
import { formatPrice } from "@/lib/formatters";
import { ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface TrendCardProps {
  symbol: string;
  name: string;
  price: number | string;
  change: string;
  isPositive: boolean;
  trend: "up" | "down" | "neutral";
  isLoading?: boolean;
}

export const TrendCard: React.FC<TrendCardProps> = ({ 
  symbol, 
  name, 
  price, 
  change, 
  isPositive, 
  trend,
  isLoading 
}) => {
  if (isLoading) {
    return (
      <div className="glass-panel p-4 animate-pulse shimmer">
        <div className="flex justify-between items-start mb-4">

          <div className="w-10 h-10 bg-border/40 rounded-full" />
          <div className="w-16 h-4 bg-border/40 rounded" />
        </div>
        <div className="w-24 h-6 bg-border/40 rounded mb-2" />
        <div className="w-16 h-4 bg-border/40 rounded" />
      </div>
    );
  }

  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const ChangeIcon = isPositive ? ArrowUpRight : ArrowDownRight;

  return (
    <div className="glass-panel p-5 group hover:border-primary/40 transition-all duration-300 cursor-pointer">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-text-main text-lg group-hover:text-primary transition-colors">{symbol}</h3>
          <p className="text-text-muted text-xs">{name}</p>
        </div>
        <div className={`p-2 rounded-lg ${isPositive ? 'bg-success-bg text-success' : 'bg-danger-bg text-danger'}`}>
          <TrendIcon size={18} />
        </div>
      </div>
      
      <div className="space-y-1">
        <div className="text-2xl font-bold tracking-tight">${formatPrice(price)}</div>
        <div className={`flex items-center text-xs font-medium ${isPositive ? 'text-success' : 'text-danger'}`}>
          <ChangeIcon size={14} className="mr-1" />
          {change}
          <span className="text-text-muted ml-2 font-normal">24h</span>
        </div>
      </div>
    </div>
  );
};
