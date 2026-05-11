import React from "react";
import { ShieldCheck, Info } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="mt-auto py-6 px-8 border-t border-border/40 bg-[#0f1115]/30 backdrop-blur-sm">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.15em]">
            © {currentYear} AppCrypto Platform
          </p>
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md bg-surface/50 border border-border/40">
            <ShieldCheck size={12} className="text-success" />
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Dados Criptografados</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <FooterLink href="#">Termos</FooterLink>
            <FooterLink href="#">Privacidade</FooterLink>
            <FooterLink href="#">Suporte</FooterLink>
          </div>
          
          <div className="flex items-center gap-2 text-text-muted/40 pl-6 border-l border-border/40">
            <Info size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest">v2.4.0-pro</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a 
      href={href} 
      className="text-[10px] font-bold text-text-muted uppercase tracking-widest hover:text-primary transition-colors"
    >
      {children}
    </a>
  );
}
