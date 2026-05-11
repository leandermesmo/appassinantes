import React from 'react';
import { LucideIcon } from 'lucide-react';

interface FeatureItemProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export const FeatureItem: React.FC<FeatureItemProps> = ({ icon: Icon, title, description }) => {
  return (
    <div className="group p-8 rounded-3xl bg-surface/30 border border-border hover:border-primary/40 transition-all duration-500 hover:bg-surface/50">
      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-500 text-primary">
        <Icon size={28} />
      </div>
      <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
        {title}
      </h3>
      <p className="text-text-muted text-sm leading-relaxed">
        {description}
      </p>
    </div>
  );
};
