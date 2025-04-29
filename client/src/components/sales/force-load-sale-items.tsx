/**
 * force-load-sale-items.tsx - ULTRA-RADICAL FINAL (30/04/2025)
 * 
 * Componente especial que GARANTE o carregamento de itens da venda
 * usando múltiplos mecanismos à prova de falhas
 */
import React, { useEffect, useState, useRef } from 'react';
import { UseFormReturn } from "react-hook-form";

// Definimos um tipo mínimo para os itens da venda que precisamos para o carregamento
type MinimalSaleItem = {
  serviceId: number;
  quantity?: number;
  notes?: string;
};

// Interface do componente ForceLoadSaleItems
interface ForceLoadSaleItemsProps {
  saleId: number | undefined;
  originalItems: any[] | undefined;
  form: UseFormReturn<any>;
  append: (value: any) => void;
  remove: (index: number) => void;
  debugMode?: boolean;
}

/**
 * Forçador Ultra-Radical de carregamento de itens
 * Este componente isolado e invisível tenta TODAS as abordagens possíveis para
 * garantir que itens sejam carregados em múltiplas tentativas
 */
const ForceLoadSaleItems: React.FC<ForceLoadSaleItemsProps> = ({
  saleId,
  originalItems,
  form,
  append,
  remove,
  debugMode = false
}) => {
  // Estado para controlar quais abordagens de carregamento já foram tentadas
  const [loadAttempts, setLoadAttempts] = useState(0);
  
  // Referências para controle de estado
  const itemsLoaded = useRef(false);
  const directApiCallMade = useRef(false);
  const formInjectionDone = useRef(false);
  
  // Função auxiliar para log condicional
  function debug(message: string) {
    if (debugMode) {
      console.log(`📦 FORCELOAD: ${message}`);
    }
  }
  
  // ESTRATÉGIA 1: Carregamento direto dos itens originais
  useEffect(() => {
    // Verifica se já carregamos itens, se os campos do formulário já estão preenchidos,
    // ou se não temos o ID da venda para carregar
    if (itemsLoaded.current || !saleId) {
      return;
    }
    
    // Primeiro, verificamos se já temos os itens originais
    if (originalItems && originalItems.length > 0) {
      debug(`Tentando carregar ${originalItems.length} itens originais...`);
      
      try {
        // Limpar campos existentes se necessário
        const fields = form.getValues().items || [];
        if (fields.length > 0) {
          debug(`Limpando ${fields.length} campos existentes...`);
          for (let i = fields.length - 1; i >= 0; i--) {
            remove(i);
          }
        }
        
        // Adicionar cada item ao formulário
        originalItems.forEach((item: MinimalSaleItem) => {
          debug(`Adicionando item ${item.serviceId}...`);
          append({
            serviceId: item.serviceId,
            quantity: item.quantity || 1,
            notes: item.notes || ""
          });
        });
        
        // Marcar que os itens foram carregados com sucesso
        itemsLoaded.current = true;
        debug(`✅ ${originalItems.length} itens carregados com sucesso`);
      } catch (error) {
        debug(`❌ Erro ao adicionar itens originais: ${error}`);
        // Incrementar contagem de tentativas para tentar outra abordagem
        setLoadAttempts(prev => prev + 1);
      }
    } else {
      debug("Sem itens originais disponíveis, tentando API...");
      setLoadAttempts(prev => prev + 1);
    }
  }, [saleId, originalItems, form, append, remove, debugMode]);
  
  // ESTRATÉGIA 2: Chamada direta à API para buscar os itens
  useEffect(() => {
    // Só executamos esta estratégia se:
    // - A primeira tentativa falhou (loadAttempts > 0)
    // - Ainda não carregamos os itens com sucesso
    // - Ainda não fizemos uma chamada direta à API antes
    // - Temos um ID de venda válido
    if (loadAttempts === 0 || itemsLoaded.current || directApiCallMade.current || !saleId) {
      return;
    }
    
    debug(`Tentativa ${loadAttempts}: Chamando API diretamente para venda ${saleId}...`);
    directApiCallMade.current = true; // Marca que já fizemos uma chamada à API
    
    // Chamar a API diretamente
    fetch(`/api/sales/${saleId}/items`)
      .then(response => {
        if (!response.ok) throw new Error("Falha ao carregar itens da API");
        return response.json();
      })
      .then(items => {
        if (!items || !Array.isArray(items) || items.length === 0) {
          debug("API não retornou itens");
          throw new Error("Nenhum item retornado pela API");
        }
        
        debug(`API retornou ${items.length} itens`);
        
        try {
          // Limpar campos existentes se necessário
          const fields = form.getValues().items || [];
          if (fields.length > 0) {
            debug(`Limpando ${fields.length} campos existentes...`);
            for (let i = fields.length - 1; i >= 0; i--) {
              remove(i);
            }
          }
          
          // Extrair apenas as propriedades mínimas necessárias
          const cleanItems = items.map((item: any) => ({
            serviceId: item.serviceId,
            quantity: item.quantity || 1,
            notes: item.notes || ""
          }));
          
          // Adicionar cada item ao formulário
          cleanItems.forEach((item: MinimalSaleItem) => {
            append({
              serviceId: item.serviceId,
              quantity: item.quantity || 1,
              notes: item.notes || ""
            });
          });
          
          // Marcar que os itens foram carregados com sucesso
          itemsLoaded.current = true;
          debug(`✅ ${items.length} itens carregados com sucesso via API`);
        } catch (error) {
          debug(`❌ Erro ao processar itens da API: ${error}`);
          // Incrementar contagem de tentativas
          setLoadAttempts(prev => prev + 1);
        }
      })
      .catch(error => {
        debug(`❌ Erro na chamada à API: ${error}`);
        // Incrementar contagem de tentativas
        setLoadAttempts(prev => prev + 1);
      });
  }, [saleId, loadAttempts, form, append, remove, debugMode]);
  
  // ESTRATÉGIA 3: Injeção direta no formulário via DOM
  useEffect(() => {
    // Só executamos esta estratégia se:
    // - As duas primeiras tentativas falharam (loadAttempts > 1)
    // - Ainda não carregamos os itens com sucesso
    // - Ainda não tentamos a injeção direta no formulário antes
    // - Temos um ID de venda válido
    if (loadAttempts <= 1 || itemsLoaded.current || formInjectionDone.current || !saleId) {
      return;
    }
    
    debug(`Tentativa ${loadAttempts}: Tentando injeção direta no formulário para venda ${saleId}...`);
    formInjectionDone.current = true; // Marca que já tentamos a injeção no formulário
    
    // Usar uma abordagem baseada em setTimeout para garantir que o DOM está pronto
    setTimeout(() => {
      try {
        // Buscar itens diretamente do DOM, se possível
        const itemElements = document.querySelectorAll('[data-sale-item]');
        if (itemElements.length > 0) {
          debug(`DOM: Encontrados ${itemElements.length} elementos de item`);
          
          // Extrair dados dos elementos
          const extractedItems = Array.from(itemElements).map((element, index) => {
            const serviceId = element.getAttribute('data-service-id');
            const quantity = element.getAttribute('data-quantity');
            const notes = element.getAttribute('data-notes');
            
            return {
              serviceId: serviceId ? parseInt(serviceId) : 0,
              quantity: quantity ? parseInt(quantity) : 1,
              notes: notes || ""
            };
          }).filter(item => item.serviceId > 0);
          
          if (extractedItems.length > 0) {
            debug(`DOM: Extraídos ${extractedItems.length} itens válidos`);
            
            // Limpar campos existentes se necessário
            const fields = form.getValues().items || [];
            if (fields.length > 0) {
              debug(`Limpando ${fields.length} campos existentes...`);
              for (let i = fields.length - 1; i >= 0; i--) {
                remove(i);
              }
            }
            
            // Adicionar cada item ao formulário
            extractedItems.forEach((item: MinimalSaleItem) => {
              append({
                serviceId: item.serviceId,
                quantity: item.quantity || 1,
                notes: item.notes || ""
              });
            });
            
            // Marcar que os itens foram carregados com sucesso
            itemsLoaded.current = true;
            debug(`✅ ${extractedItems.length} itens carregados com sucesso via DOM`);
          } else {
            debug("DOM: Não foi possível extrair dados válidos dos elementos");
            setLoadAttempts(prev => prev + 1);
          }
        } else {
          debug("DOM: Nenhum elemento de item encontrado");
          setLoadAttempts(prev => prev + 1);
        }
      } catch (error) {
        debug(`❌ Erro na injeção via DOM: ${error}`);
        setLoadAttempts(prev => prev + 1);
      }
    }, 300); // Aguarda um pouco para tentar garantir que o DOM está pronto
  }, [saleId, loadAttempts, form, append, remove, debugMode]);
  
  // ESTRATÉGIA FINAL: Desistência controlada após várias tentativas
  useEffect(() => {
    // Após várias tentativas sem sucesso, registramos o problema e paramos
    if (loadAttempts > 3 && !itemsLoaded.current) {
      console.error(`⚠️ FORCELOAD-CRÍTICO: Falha em todas as ${loadAttempts} tentativas de carregar itens da venda ${saleId}`);
      
      // Adicionar pelo menos um item vazio para evitar problemas de validação
      if (form.getValues().items?.length === 0) {
        debug("Adicionando um item vazio de emergência...");
        append({
          serviceId: 0,
          quantity: 1,
          notes: "Item adicionado automaticamente - favor substituir"
        });
      }
    }
  }, [loadAttempts, saleId, form, append, debugMode]);
  
  // Este componente não renderiza nada visível
  return null;
};

export default ForceLoadSaleItems;