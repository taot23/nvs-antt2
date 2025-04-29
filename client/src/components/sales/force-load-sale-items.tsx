/**
 * force-load-sale-items.tsx - ULTRA-RADICAL FINAL (30/04/2025)
 * 
 * Componente especial que GARANTE o carregamento de itens da venda
 * usando múltiplos mecanismos à prova de falhas
 */

import React, { useEffect, useState, useRef } from 'react';
import { useFieldArray, UseFormReturn } from 'react-hook-form';
import { sanitizeSaleItems } from '@/utils/sale-items-utils';

// Tipo mínimo de item para processamento
type MinimalSaleItem = {
  serviceId: number;
  quantity?: number;
  notes?: string;
};

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
  // Referências para controlar estado interno
  const loadAttempts = useRef(0);
  const maxAttempts = 5;
  const [loadingStatus, setLoadingStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const loadedItemsCount = useRef(0);
  
  // Forçar carregamento em múltiplas abordagens
  useEffect(() => {
    // Não continuar se já carregou com sucesso
    if (loadingStatus === 'success') {
      debug('✅ ULTRA-FORÇADOR: Itens já carregados com sucesso! Ignorando novas tentativas.');
      return;
    }
    
    // Verificar se temos itens originais
    if (!originalItems || !Array.isArray(originalItems) || originalItems.length === 0) {
      debug('⚠️ ULTRA-FORÇADOR: Sem itens originais para carregar.');
      return;
    }
    
    // Verificar se já temos itens no formulário
    const currentValues = form.getValues();
    const currentItems = currentValues?.items || [];
    
    debug(`🔄 ULTRA-FORÇADOR: Tentativa #${loadAttempts.current + 1}. Itens no formulário: ${currentItems.length}, Itens originais: ${originalItems.length}`);
    
    // Se já temos o número correto de itens, não faça nada
    if (currentItems.length === originalItems.length && loadAttempts.current > 0) {
      debug('✅ ULTRA-FORÇADOR: O número de itens já está correto.');
      setLoadingStatus('success');
      return;
    }
    
    // Incrementar contador de tentativas
    loadAttempts.current += 1;
    
    if (loadAttempts.current <= maxAttempts) {
      setLoadingStatus('loading');
      
      try {
        // Sanitizar itens
        const cleanItems = sanitizeSaleItems(originalItems);
        debug(`🧹 ULTRA-FORÇADOR: ${cleanItems.length} itens sanitizados.`);
        
        // Limpar todos os itens existentes
        if (currentItems.length > 0) {
          for (let i = currentItems.length - 1; i >= 0; i--) {
            remove(i);
          }
          debug('🧹 ULTRA-FORÇADOR: Removidos todos os itens existentes.');
        }
        
        // Adicionar itens com um pequeno atraso
        setTimeout(() => {
          try {
            cleanItems.forEach((item: MinimalSaleItem) => {
              append({
                serviceId: item.serviceId,
                quantity: item.quantity || 1,
                notes: item.notes || ''
              });
            });
            
            // Verificar resultado após adição
            const updatedValues = form.getValues();
            const updatedItems = updatedValues?.items || [];
            
            debug(`✅ ULTRA-FORÇADOR: ${updatedItems.length} itens adicionados ao formulário.`);
            
            if (updatedItems.length === cleanItems.length) {
              loadedItemsCount.current = updatedItems.length;
              setLoadingStatus('success');
            } else {
              debug(`⚠️ ULTRA-FORÇADOR: Número inconsistente de itens. Esperados: ${cleanItems.length}, Atuais: ${updatedItems.length}`);
              
              // Agendar nova tentativa com atraso progressivo
              if (loadAttempts.current < maxAttempts) {
                const delay = loadAttempts.current * 200; // Aumentando o atraso a cada tentativa
                setTimeout(() => {
                  // Forçar re-renderização para tentar novamente
                  setLoadingStatus('idle');
                }, delay);
              } else {
                setLoadingStatus('error');
                debug('❌ ULTRA-FORÇADOR: Número máximo de tentativas excedido.');
              }
            }
          } catch (error) {
            debug(`❌ ULTRA-FORÇADOR: Erro ao adicionar itens: ${error}`);
            setLoadingStatus('error');
          }
        }, 100);
      } catch (error) {
        debug(`❌ ULTRA-FORÇADOR: Erro ao processar itens: ${error}`);
        setLoadingStatus('error');
      }
    } else {
      setLoadingStatus('error');
      debug('❌ ULTRA-FORÇADOR: Número máximo de tentativas excedido.');
    }
  }, [originalItems, form, append, remove, loadingStatus]);
  
  // Função helper para debug
  function debug(message: string) {
    if (debugMode) {
      console.log(message);
    }
  }
  
  // Este componente não renderiza nada visível
  return null;
};

export default ForceLoadSaleItems;