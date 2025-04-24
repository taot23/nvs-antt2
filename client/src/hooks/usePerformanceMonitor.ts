import { useEffect } from 'react';

/**
 * Hook para monitorar a performance de um componente
 * 
 * @param componentName Nome do componente a ser monitorado
 */
export function usePerformanceMonitor(componentName: string) {
  useEffect(() => {
    const startTime = performance.now();
    console.log(`[Performance] ${componentName} inicializando`);
    
    // Monitorar métricas de performance
    let observer: PerformanceObserver | null = null;
    
    if (window.PerformanceObserver) {
      observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          console.log(`[Performance] ${componentName}: ${entry.name} - ${entry.duration.toFixed(2)}ms`);
        });
      });
      
      observer.observe({ entryTypes: ['measure'] });
    }
    
    return () => {
      const endTime = performance.now();
      console.log(`[Performance] ${componentName} mount-unmount: ${(endTime - startTime).toFixed(2)}ms`);
      
      if (observer) {
        observer.disconnect();
      }
    };
  }, [componentName]);
}

/**
 * Função para medir o tempo de execução de uma função
 * 
 * @param name Nome da medição
 * @param fn Função a ser executada e medida
 * @returns Resultado da função
 */
export function measurePerformance<T>(name: string, fn: () => T): T {
  const startTime = performance.now();
  try {
    return fn();
  } finally {
    const endTime = performance.now();
    console.log(`[Performance] ${name}: ${(endTime - startTime).toFixed(2)}ms`);
  }
}