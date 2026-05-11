import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: Parameters<typeof clsx>) {
  return twMerge(clsx(inputs));
}

interface PlanBadgeProps {
  planName?: string | null;
  className?: string;
}

export function PlanBadge({ planName, className }: PlanBadgeProps) {
  const isPremium = planName && planName.toLowerCase().includes("premium");
  
  if (isPremium) {
    return (
      <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 bg-amber-500/10 text-amber-400 border border-amber-500/20", className)}>
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
        {planName}
      </span>
    );
  }

  return (
    <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 bg-surface-hover text-text-muted border border-border/40", className)}>
      <span className="w-1.5 h-1.5 rounded-full bg-text-muted" />
      {planName || "Free"}
    </span>
  );
}
