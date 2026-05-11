import React from "react";
import { Sidebar } from "../../components/dashboard/Sidebar";
import { Header } from "../../components/dashboard/Header";
import { Footer } from "../../components/dashboard/Footer";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-background overflow-hidden selection:bg-primary/20 selection:text-primary">
      {/* Sidebar Modular */}
      <Sidebar />

      {/* Conteúdo Principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Efeito de luz de fundo sutil */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        
        {/* Header Modular */}
        <Header />

        {/* Viewport de Conteúdo */}
        <main className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
          <div className="flex-1 p-6 lg:p-10">
            <div className="max-w-[1600px] mx-auto">
              {children}
            </div>
          </div>
          
          {/* Footer Modular */}
          <Footer />
        </main>
      </div>
    </div>
  );
}
