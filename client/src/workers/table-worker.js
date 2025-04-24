/**
 * Web Worker para processamento pesado de dados da tabela
 * 
 * Responsável por:
 * - Ordenação de dados
 * - Filtragem de dados
 * - Busca de dados
 */

// Identificador de inicialização do worker
self.postMessage({ type: 'init', status: 'ready' });

/**
 * Ordena um array de objetos por um campo específico
 * 
 * @param {Array} array Array a ser ordenado
 * @param {string} field Campo pelo qual ordenar
 * @param {string} direction Direção da ordenação ('asc' ou 'desc')
 * @returns {Array} Array ordenado
 */
function sortArrayByField(array, field, direction) {
  return [...array].sort((a, b) => {
    let valueA = a[field];
    let valueB = b[field];
    
    // Para valores numéricos armazenados como string (ex: totalAmount)
    if (field === 'totalAmount') {
      valueA = parseFloat(valueA);
      valueB = parseFloat(valueB);
    }
    
    // Para datas
    if (field === 'date' || field === 'createdAt' || field === 'updatedAt') {
      valueA = new Date(valueA || 0).getTime();
      valueB = new Date(valueB || 0).getTime();
    }
    
    if (direction === 'asc') {
      return valueA > valueB ? 1 : -1;
    }
    return valueA < valueB ? 1 : -1;
  });
}

/**
 * Filtra um array de objetos com base em uma consulta de texto
 * 
 * @param {Array} array Array a ser filtrado
 * @param {string} query Texto de busca
 * @param {Array} searchFields Campos onde buscar
 * @returns {Array} Array filtrado
 */
function filterArrayByQuery(array, query, searchFields) {
  if (!query) return array;
  
  const normalizedQuery = query.toLowerCase();
  
  return array.filter(item => {
    return searchFields.some(field => {
      const value = item[field];
      if (value === null || value === undefined) return false;
      return String(value).toLowerCase().includes(normalizedQuery);
    });
  });
}

/**
 * Filtra um array de objetos com base em um status específico
 * 
 * @param {Array} array Array a ser filtrado
 * @param {string} status Status a ser filtrado
 * @returns {Array} Array filtrado
 */
function filterArrayByStatus(array, status) {
  if (!status || status === 'all') return array;
  return array.filter(item => item.status === status);
}

// Listener para mensagens do thread principal
self.addEventListener('message', (event) => {
  const { action, data } = event.data;
  
  try {
    switch (action) {
      case 'sort': {
        const { items, field, direction } = data;
        const startTime = performance.now();
        const sortedData = sortArrayByField(items, field, direction);
        const endTime = performance.now();
        
        self.postMessage({ 
          type: 'sort', 
          result: sortedData,
          processingTime: endTime - startTime
        });
        break;
      }
      
      case 'filter': {
        const { items, query, searchFields } = data;
        const startTime = performance.now();
        const filteredData = filterArrayByQuery(items, query, searchFields);
        const endTime = performance.now();
        
        self.postMessage({ 
          type: 'filter', 
          result: filteredData,
          processingTime: endTime - startTime
        });
        break;
      }
      
      case 'statusFilter': {
        const { items, status } = data;
        const startTime = performance.now();
        const filteredData = filterArrayByStatus(items, status);
        const endTime = performance.now();
        
        self.postMessage({ 
          type: 'statusFilter', 
          result: filteredData,
          processingTime: endTime - startTime
        });
        break;
      }
      
      case 'processData': {
        const { items, filters } = data;
        const startTime = performance.now();
        
        // Aplicar todos os filtros em sequência
        let result = [...items];
        
        // 1. Filtrar por status se especificado
        if (filters.status) {
          result = filterArrayByStatus(result, filters.status);
        }
        
        // 2. Filtrar por texto de busca se especificado
        if (filters.query) {
          result = filterArrayByQuery(result, filters.query, filters.searchFields || [
            'orderNumber', 'customerName', 'sellerName'
          ]);
        }
        
        // 3. Ordenar por campo se especificado
        if (filters.sortField) {
          result = sortArrayByField(result, filters.sortField, filters.sortDirection || 'asc');
        }
        
        const endTime = performance.now();
        
        self.postMessage({ 
          type: 'processData', 
          result,
          processingTime: endTime - startTime,
          totalItems: result.length
        });
        break;
      }
      
      default:
        self.postMessage({ type: 'error', message: `Ação desconhecida: ${action}` });
    }
  } catch (error) {
    self.postMessage({ 
      type: 'error', 
      message: error.message || 'Erro desconhecido no worker',
      stack: error.stack
    });
  }
});