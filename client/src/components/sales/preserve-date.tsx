import React, { useEffect, useState } from 'react';
import { FormControl, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Calendar } from "lucide-react";

/**
 * COMPONENTE ULTRA-SIMPLIFICADO - VERSÃO FINAL (30/04/2025)
 * 
 * Esta versão foi completamente refatorada para eliminar problemas de edição
 * e formatação automática de datas. Agora o componente:
 * 
 * 1. Permite edição livre do campo de data
 * 2. Apenas converte para o formato ISO quando detecta um formato brasileiro válido
 * 3. Inicializa com a data atual por padrão
 * 4. Prioriza a experiência do usuário acima de tudo
 */

// Função simples para formatar uma data como DD/MM/AAAA
function formatToBrazilianDate(date: Date): string {
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
}

// Componente simplificado de campo de data
const StaticDateField = ({
  originalDate,
  label = "Data",
  onChange,
  readOnly = false
}: { 
  originalDate: any,
  label?: string,
  onChange: (value: string) => void,
  readOnly?: boolean
}) => {
  // Estados locais - inicialização mais simples
  const [displayValue, setDisplayValue] = useState("");
  
  // Efeito para inicialização única na montagem
  useEffect(() => {
    try {
      let initialDisplay = "";
      let initialIsoValue = "";
      
      // Tentar extrair uma data válida do valor original
      if (originalDate) {
        if (typeof originalDate === 'string') {
          // Se é formato brasileiro (DD/MM/AAAA)
          if (originalDate.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
            initialDisplay = originalDate;
            
            // Converter para ISO para o backend
            const [day, month, year] = originalDate.split('/').map(Number);
            initialIsoValue = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          }
          // Se é formato ISO (YYYY-MM-DD)
          else if (originalDate.match(/^\d{4}-\d{2}-\d{2}/)) {
            const datePart = originalDate.split('T')[0];
            const [year, month, day] = datePart.split('-').map(Number);
            
            // Formato brasileiro
            initialDisplay = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
            initialIsoValue = datePart;
          }
          // Outra string de data - tentar parse
          else {
            const date = new Date(originalDate);
            if (!isNaN(date.getTime())) {
              initialDisplay = formatToBrazilianDate(date);
              initialIsoValue = date.toISOString().split('T')[0];
            }
          }
        }
        // Se é objeto Date
        else if (originalDate instanceof Date && !isNaN(originalDate.getTime())) {
          initialDisplay = formatToBrazilianDate(originalDate);
          initialIsoValue = originalDate.toISOString().split('T')[0];
        }
      }
      
      // Se não conseguimos determinar a data, usar data atual
      if (!initialDisplay || !initialIsoValue) {
        const today = new Date();
        initialDisplay = formatToBrazilianDate(today);
        initialIsoValue = today.toISOString().split('T')[0];
      }
      
      // Definir valores iniciais
      setDisplayValue(initialDisplay);
      onChange(initialIsoValue);
      
    } catch (error) {
      // Em caso de erro, usar a data atual
      const today = new Date();
      setDisplayValue(formatToBrazilianDate(today));
      onChange(today.toISOString().split('T')[0]);
    }
  }, []); // Executar apenas uma vez
  
  // Função para tratar entrada do usuário
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const userInput = e.target.value;
    
    // Atualizar o display imediatamente para feedback visual
    setDisplayValue(userInput);
    
    // Se o formato é brasileiro válido (DD/MM/AAAA), converter para ISO para o backend
    if (userInput.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      try {
        const [day, month, year] = userInput.split('/').map(Number);
        const isoDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        onChange(isoDate);
      } catch (error) {
        console.error("Erro ao converter data:", error);
      }
    }
  };
  
  return (
    <FormItem className="flex flex-col">
      <FormLabel className="flex items-center gap-2">
        <Calendar className="h-4 w-4" />
        {label}
      </FormLabel>
      <FormControl>
        <Input
          type="text"
          placeholder="DD/MM/AAAA"
          value={displayValue}
          onChange={handleChange}
          disabled={readOnly}
          className="date-input"
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  );
};

export default StaticDateField;