import { useState, useEffect, useRef } from 'react';
import { useTableWorker } from './useTableWorker';
import { useDebounce } from './useDebounce';

/**
 * Hook especializado para processar dados de tabela com optimização avançada
 * Gerencia automaticamente o uso de workers e cache de dados.
 */
export function useTableProcessor<T>(
  data: T[],  
  options: {
    sortField: string;
    sortDirection: string;
    searchTerm: string;
    statusFilter: string;
    enabled?: boolean;
  }
) {
  const [displayData, setDisplayData] = useState<T[]>([]);
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderMetrics, setRenderMetrics] = useState({
    timeToFirstItem: 0,
    totalRenderTime: 0,
    itemsPerSecond: 0
  });
  
  // Referências para métricas de performance
  const startTimeRef = useRef(0);
  const processingStartedRef = useRef(false);
  
  // Worker para processamento pesado
  const {
    processData,
    result,
    count,
    processingTime,
    isLoading: workerLoading,
    error: workerError
  } = useTableWorker();
  
  // Debounce dos filtros para evitar processamento excessivo
  const debouncedOptions = useDebounce(options, 300);
  const { sortField, sortDirection, searchTerm, statusFilter, enabled = true } = debouncedOptions;
  
  // Iniciar o processamento quando os dados ou opções mudarem
  useEffect(() => {
    if (!data.length || !enabled) return;
    
    // Registrar o tempo de início
    if (!processingStartedRef.current) {
      startTimeRef.current = performance.now();
      processingStartedRef.current = true;
      setRenderProgress(10); // Indicar que o processamento começou
    }
    
    try {
      // Tentar usar o worker para processamento pesado fora da thread principal
      processData(data, {
        sortField,
        sortDirection,
        searchTerm,
        statusFilter
      });
      
      setRenderProgress(50); // Indicar progresso de processamento
    } catch (error) {
      console.error('Erro ao processar dados:', error);
      
      // Fallback: processamento síncrono caso o worker falhe
      const startTime = performance.now();
      
      // Filtrar por status
      let filteredData = [...data];
      if (statusFilter) {
        filteredData = filteredData.filter((item: any) => 
          item.status === statusFilter
        );
      }
      
      // Filtrar por termo de busca
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filteredData = filteredData.filter((item: any) => {
          // Buscar em diversos campos
          return (
            (item.orderNumber && item.orderNumber.toLowerCase().includes(term)) ||
            (item.customerName && item.customerName.toLowerCase().includes(term)) ||
            (item.sellerName && item.sellerName.toLowerCase().includes(term))
          );
        });
      }
      
      // Ordenar os dados
      filteredData.sort((a: any, b: any) => {
        const aValue = a[sortField as keyof typeof a];
        const bValue = b[sortField as keyof typeof b];
        
        // Comparação segura
        if (aValue === bValue) {
          return sortDirection === 'asc' ? a.id - b.id : b.id - a.id;
        }
        
        // Ordenação específica para campos numéricos
        if (sortField === 'totalAmount') {
          return sortDirection === 'asc'
            ? parseFloat(aValue || '0') - parseFloat(bValue || '0')
            : parseFloat(bValue || '0') - parseFloat(aValue || '0');
        }
        
        // Ordenação padrão para strings
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortDirection === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        
        // Fallback
        return sortDirection === 'asc'
          ? (aValue > bValue ? 1 : -1)
          : (bValue > aValue ? 1 : -1);
      });
      
      // Calcular métricas
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      setDisplayData(filteredData);
      setRenderProgress(100);
      
      setRenderMetrics({
        timeToFirstItem: renderTime,
        totalRenderTime: renderTime,
        itemsPerSecond: Math.round(filteredData.length / (renderTime / 1000))
      });
      
      processingStartedRef.current = false;
    }
  }, [data, debouncedOptions, enabled, processData]);
  
  // Atualizar os dados de exibição quando o worker retornar resultados
  useEffect(() => {
    if (result && result.length > 0) {
      setDisplayData(result as T[]);
      setRenderProgress(100);
      
      const endTime = performance.now();
      const totalTime = endTime - startTimeRef.current;
      
      // Calcular e armazenar métricas
      setRenderMetrics({
        timeToFirstItem: processingTime,
        totalRenderTime: totalTime,
        itemsPerSecond: Math.round(count / (totalTime / 1000))
      });
      
      console.log(`[TableProcessor] Renderização completa: ${count} items em ${totalTime.toFixed(2)}ms - ${Math.round(count / (totalTime / 1000))} items/s`);
      
      processingStartedRef.current = false;
    }
  }, [result, count, processingTime]);
  
  return {
    data: displayData,
    count: count || displayData.length,
    isLoading: workerLoading || renderProgress < 100,
    error: workerError,
    renderProgress,
    metrics: renderMetrics
  };
}