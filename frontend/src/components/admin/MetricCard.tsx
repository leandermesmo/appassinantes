"use client";

import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: Parameters<typeof clsx>) {
  return twMerge(clsx(inputs));
}

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  className?: string;
  valuePrefix?: string;
}

export function MetricCard({ title, value, icon, trend, className, valuePrefix }: MetricCardProps) {
  return (
    <div className={cn("bg-surface/40 border border-border/40 rounded-2xl p-6 relative overflow-hidden group", className)}>
      {/* Background Glow Effect on Hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-purple-500/0 group-hover:from-indigo-500/5 group-hover:to-purple-500/5 transition-colors duration-500" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-text-muted">{title}</h3>
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:scale-110 transition-transform duration-300">
            {icon}
          </div>
        </div>
        
        <div className="flex items-baseline gap-2">
          {valuePrefix && <span className="text-xl font-bold text-text-muted">{valuePrefix}</span>}
          <p className="text-3xl font-bold text-text-main tracking-tight">{value}</p>
        </div>

        {trend && (
          <div className="mt-4 flex items-center gap-2">
            <div className={cn(
              "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
              trend.value >= 0 
                ? "bg-success/10 text-success" 
                : "bg-danger/10 text-danger"
            )}>
              {trend.value > 0 ? "+" : ""}{trend.value}%
            </div>
            <span className="text-xs text-text-muted">{trend.label}</span>
          </div>
        )}
      </div>
    </div>
  );
}
