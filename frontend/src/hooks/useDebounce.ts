import { useEffect, useState } from "react";

/**
 * Hook para debouncing de valores.
 * Útil para evitar requisições excessivas em campos de busca enquanto o usuário digita.
 * 
 * @param value Valor a ser debounced
 * @param delay Atraso em milissegundos
 * @returns O valor atrasado
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Configura o timer para atualizar o debouncedValue após o delay
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Limpa o timer se o valor mudar antes do delay expirar (ex: usuário continua digitando)
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
