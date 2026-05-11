import React from "react";

type IndicatorType = "strong_buy" | "buy" | "neutral" | "sell" | "strong_sell";

interface IndicatorBadgeProps {
  type: IndicatorType;
}

export const IndicatorBadge: React.FC<IndicatorBadgeProps> = ({ type }) => {
  const configs = {
    strong_buy: {
      label: "Forte Compra",
      classes: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    },
    buy: {
      label: "Compra",
      classes: "bg-success-bg text-success border-success/20",
    },
    neutral: {
      label: "Neutro",
      classes: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    },
    sell: {
      label: "Venda",
      classes: "bg-danger-bg text-danger border-danger/20",
    },
    strong_sell: {
      label: "Forte Venda",
      classes: "bg-rose-600/10 text-rose-600 border-rose-600/20",
    },
  };

  const current = configs[type];

  return (
    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${current.classes} transition-all duration-300 hover:scale-105`}>
      {current.label}
    </span>
  );
};
