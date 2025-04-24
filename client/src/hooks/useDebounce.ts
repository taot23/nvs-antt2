import { useState, useEffect } from 'react';

/**
 * Hook personalizado para aplicar debounce a um valor
 * 
 * @param value Valor a ser aplicado o debounce
 * @param delay Tempo de espera em milissegundos (padrão: 300ms)
 * @returns Valor após o debounce
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Criar um timer para atualizar o valor após o delay
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Limpar o timer se o valor mudar antes do delay
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}