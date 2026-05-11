import React, { useState, useEffect } from "react";
import { Search, X, Star, Loader2 } from "lucide-react";
import { api } from "../../services/api";

interface SymbolData {
  symbol: string;
  name: string;
  baseAsset: string;
}

interface AddFavoriteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (symbol: string) => Promise<void>;
  existingFavorites: string[];
}

export const AddFavoriteModal: React.FC<AddFavoriteModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  existingFavorites,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [symbols, setSymbols] = useState<SymbolData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchSymbols();
    }
  }, [isOpen]);

  const fetchSymbols = async () => {
    try {
      setIsLoading(true);
      const response = await api.get<{ success: boolean; data: SymbolData[] }>("market/symbols");
      if (response.data.success) {
        setSymbols(response.data.data);
      }
    } catch (error) {
      console.error("Erro ao buscar símbolos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSymbols = symbols.filter(
    (s) =>
      s.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.name.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 50); // Limitar para performance

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-surface border border-border w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-4 border-b border-border flex justify-between items-center bg-surface-dark">
          <h3 className="font-bold text-text-main">Adicionar Ativo</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-main transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input
              type="text"
              placeholder="Buscar símbolo (ex: BTC, ETH...)"
              className="w-full bg-background border border-border rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="max-h-[350px] overflow-y-auto custom-scrollbar space-y-1">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-10 text-text-muted">
                <Loader2 className="animate-spin mb-2" size={24} />
                <p className="text-xs">Carregando ativos...</p>
              </div>
            ) : filteredSymbols.length > 0 ? (
              filteredSymbols.map((s) => {
                const isFavorite = existingFavorites.includes(s.symbol);
                return (
                  <div
                    key={s.symbol}
                    className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                      isFavorite ? "bg-primary/5 opacity-60" : "hover:bg-surface-dark cursor-pointer group"
                    }`}
                    onClick={() => !isFavorite && !isSubmitting && (async () => {
                      setIsSubmitting(s.symbol);
                      try {
                        await onSelect(s.symbol);
                        onClose();
                      } catch (e) {
                        // Erro tratado no componente pai
                      } finally {
                        setIsSubmitting(null);
                      }
                    })()}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-border/40 flex items-center justify-center text-[10px] font-bold group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        {s.baseAsset.substring(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-text-main">{s.symbol}</p>
                        <p className="text-[10px] text-text-muted">{s.name}</p>
                      </div>
                    </div>
                    {isSubmitting === s.symbol ? (
                      <Loader2 className="animate-spin text-primary" size={18} />
                    ) : isFavorite ? (
                      <Star size={18} className="text-primary fill-primary" />
                    ) : (
                      <Star size={18} className="text-text-muted group-hover:text-primary transition-colors" />
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10 text-text-muted">
                <p className="text-sm italic">Nenhum ativo encontrado.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
