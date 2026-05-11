import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import clsx from "clsx";

interface IndicatorCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  description?: string;
  isLoading?: boolean;
}

export function IndicatorCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  description,
  isLoading 
}: IndicatorCardProps) {
  
  if (isLoading) {
    return (
      <div className="glass-panel p-6 animate-pulse border-border/50">
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 w-24 bg-surface-hover rounded"></div>
          <div className="h-8 w-8 bg-surface-hover rounded-lg"></div>
        </div>
        <div className="h-8 w-32 bg-surface-hover rounded mb-2"></div>
        {description && <div className="h-3 w-16 bg-surface-hover rounded"></div>}
      </div>
    );
  }

  return (
    <div className="glass-panel p-6 hover:border-primary/30 transition-all duration-300 group">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-text-muted group-hover:text-text-main transition-colors">{title}</h3>
        <div className="w-8 h-8 rounded-lg bg-surface-hover flex items-center justify-center text-primary border border-border group-hover:bg-primary/10 group-hover:border-primary/30 transition-all">
          <Icon size={18} />
        </div>
      </div>
      
      <div className="flex items-end justify-between">
        <div>
          <span className="text-3xl font-bold tracking-tight text-text-main">{value}</span>
          {description && <p className="text-xs text-text-muted mt-1">{description}</p>}
        </div>
        
        {trend && (
          <div className={clsx(
            "px-2 py-1 rounded text-xs font-semibold border flex items-center",
            {
              "bg-success-bg text-success border-success/20": trend === "up",
              "bg-danger-bg text-danger border-danger/20": trend === "down",
              "bg-surface text-text-muted border-border": trend === "neutral",
            }
          )}>
            {trend === "up" ? "Alta" : trend === "down" ? "Baixa" : "Neutro"}
          </div>
        )}
      </div>
    </div>
  );
}
