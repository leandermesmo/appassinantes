import React from 'react';
import { Check } from 'lucide-react';

interface PricingCardProps {
  name: string;
  price: string;
  description: string;
  features: string[];
  isPopular?: boolean;
  cta: string;
}

export const PricingCard: React.FC<PricingCardProps> = ({ 
  name, 
  price, 
  description, 
  features, 
  isPopular,
  cta 
}) => {
  return (
    <div className={`relative p-8 rounded-3xl border transition-all duration-300 hover:scale-[1.02] ${
      isPopular 
        ? 'bg-gradient-to-b from-primary/20 to-surface border-primary shadow-[0_0_40px_rgba(99,102,241,0.15)]' 
        : 'bg-surface/50 border-border hover:border-primary/40'
    }`}>
      {isPopular && (
        <span className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">
          Mais Popular
        </span>
      )}
      
      <div className="mb-8">
        <h3 className="text-xl font-bold mb-2">{name}</h3>
        <div className="flex items-baseline gap-1 mb-2">
          <span className="text-4xl font-black">{price}</span>
          <span className="text-text-muted text-sm font-medium">/mês</span>
        </div>
        <p className="text-sm text-text-muted leading-relaxed">
          {description}
        </p>
      </div>

      <ul className="space-y-4 mb-10">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-3 text-sm text-text-muted">
            <div className="mt-1 p-0.5 rounded-full bg-primary/20 text-primary">
              <Check size={12} strokeWidth={3} />
            </div>
            {feature}
          </li>
        ))}
      </ul>

      <button className={`w-full py-4 rounded-xl text-sm font-black transition-all ${
        isPopular 
          ? 'bg-primary text-white shadow-xl shadow-primary/30 hover:bg-primary-hover hover:shadow-primary/40' 
          : 'bg-white/5 text-white border border-white/10 hover:bg-white/10'
      }`}>
        {cta}
      </button>
    </div>
  );
};
