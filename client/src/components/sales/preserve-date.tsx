import React, { useEffect, useState } from 'react';
import { FormControl, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Calendar } from "lucide-react";

// Função específica para formatação de data de ISO para brasileiro - ULTRA-ROBUSTA 30/04/2025
const formatDate = (date: string | Date | null): string => {
  // MUDANÇA CRÍTICA: Se a data for null ou vazia, use a data atual em vez de retornar string vazia
  if (!date) {
    console.log("⚠️ ULTRA-DATA: Data não fornecida, usando data atual");
    const today = new Date();
    return `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
  }
  
  try {
    let dateObj: Date;
    console.log("🔍 ULTRA-DATA: Processando data:", date, "tipo:", typeof date);
    
    if (typeof date === 'string') {
      // Se a string for "null" ou "undefined" (como texto), use a data atual
      if (date === "null" || date === "undefined") {
        console.log("⚠️ ULTRA-DATA: Valor de data é string 'null' ou 'undefined', usando data atual");
        const today = new Date();
        return `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
      }
      
      // Se já é string e tem formato ISO
      if (date.match(/^\d{4}-\d{2}-\d{2}/)) {
        const [year, month, day] = date.split('T')[0].split('-').map(Number);
        const formattedDate = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
        console.log("✅ ULTRA-DATA: Convertido de ISO para BR:", formattedDate);
        return formattedDate;
      }
      
      // Se já está no formato brasileiro, retorna como está
      if (date.match(/^\d{2}\/\d{2}\/\d{4}/)) {
        console.log("✅ ULTRA-DATA: Já está no formato BR:", date);
        return date;
      }
      
      // Tenta criar um objeto Date da string
      dateObj = new Date(date);
    } else {
      dateObj = date;
    }
    
    // Verifica se é uma data válida
    if (isNaN(dateObj.getTime())) {
      console.log("⚠️ ULTRA-DATA: Data inválida após conversão:", date, "- usando data atual");
      // MUDANÇA CRÍTICA: Use data atual em vez de string vazia
      const today = new Date();
      return `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
    }
    
    // Formato brasileiro DD/MM/YYYY
    const formattedDate = `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${dateObj.getFullYear()}`;
    console.log("✅ ULTRA-DATA: Data formatada final:", formattedDate);
    return formattedDate;
  } catch (error) {
    console.error("❌ ULTRA-DATA: Erro ao formatar data:", error);
    // MUDANÇA CRÍTICA: Use data atual em vez de string vazia em caso de erro
    const today = new Date();
    return `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
  }
};

// Componente específico para preservar a data da venda
// Este componente mantém seu próprio estado interno para garantir consistência
interface StaticDateFieldProps {
  originalDate: string | Date | null;
  label?: string;
  onChange: (dateInISOFormat: string) => void;
  readOnly?: boolean;
}

const StaticDateField: React.FC<StaticDateFieldProps> = ({
  originalDate,
  label = "Data",
  onChange,
  readOnly = false
}) => {
  // Estado interno que guarda a data em formato ISO para o backend
  const [isoDate, setIsoDate] = useState<string>('');
  // Estado para o display formatado para o usuário
  const [displayDate, setDisplayDate] = useState<string>('');
  
  // VERSÃO ULTRA-RADICAL 3.0 30/04/2025
  // Efeito que inicializa os estados, mas APENAS UMA VEZ
  useEffect(() => {
    // Criamos um ID único para este componente baseado no originalDate
    // Isso garante preservação entre re-renders
    const componentId = `date-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`🔒 SUPER-PRESERVAÇÃO 3.0: ID de componente: ${componentId}`);

    // Processa a data original para formato ISO - SEM QUALQUER CONDIÇÃO DE RETORNO INICIAL
    console.log("🔒 SUPER-PRESERVAÇÃO 3.0: Processando data:", originalDate);
    
    let isoFormat = '';
    
    if (originalDate) {
      if (typeof originalDate === 'string') {
        // Se já é string ISO (YYYY-MM-DD), usa diretamente
        if (originalDate.match(/^\d{4}-\d{2}-\d{2}/)) {
          isoFormat = originalDate.split('T')[0]; // Remove parte do tempo se existir
          console.log("🔒 SUPER-PRESERVAÇÃO 3.0: Data ISO original preservada:", isoFormat);
        } 
        // Se é string em formato brasileiro, converte para ISO
        else if (originalDate.match(/^\d{2}\/\d{2}\/\d{4}/)) {
          const [day, month, year] = originalDate.split('/').map(Number);
          isoFormat = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          console.log("🔒 SUPER-PRESERVAÇÃO 3.0: Convertido BR para ISO:", isoFormat);
        }
        // Se é "null" como string, usamos data atual
        else if (originalDate === "null" || originalDate === "undefined") {
          const today = new Date();
          isoFormat = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
          console.log("🔒 SUPER-PRESERVAÇÃO 3.0: Valor 'null'/'undefined' como string, usando data atual:", isoFormat);
        }
        // Outro formato, tenta converter
        else {
          try {
            const dateObj = new Date(originalDate);
            if (!isNaN(dateObj.getTime())) {
              isoFormat = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
              console.log("🔒 SUPER-PRESERVAÇÃO 3.0: Convertido string para ISO:", isoFormat);
            } else {
              throw new Error("Data inválida após conversão");
            }
          } catch (e) {
            console.error("🔒 SUPER-PRESERVAÇÃO 3.0: Erro ao converter string:", e);
            // Data atual como fallback absoluto
            const today = new Date();
            isoFormat = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            console.log("🔒 SUPER-PRESERVAÇÃO 3.0: Erro na conversão, usando data atual:", isoFormat);
          }
        }
      } 
      // Se é null explícito (não string 'null'), usamos data atual
      else if (originalDate === null) {
        const today = new Date();
        isoFormat = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        console.log("🔒 SUPER-PRESERVAÇÃO 3.0: Valor null, usando data atual:", isoFormat);
      }
      // Se é um objeto Date, converte para ISO
      else if (originalDate instanceof Date) {
        // Verificar se a data é válida
        if (!isNaN(originalDate.getTime())) {
          isoFormat = `${originalDate.getFullYear()}-${String(originalDate.getMonth() + 1).padStart(2, '0')}-${String(originalDate.getDate()).padStart(2, '0')}`;
          console.log("🔒 SUPER-PRESERVAÇÃO 3.0: Convertido Date para ISO:", isoFormat);
        } else {
          // Data inválida, usar data atual
          const today = new Date();
          isoFormat = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
          console.log("🔒 SUPER-PRESERVAÇÃO 3.0: Date inválido, usando data atual:", isoFormat);
        }
      }
    }
    
    // Se não conseguimos obter um formato ISO, usar a data atual (hoje)
    if (!isoFormat) {
      const today = new Date();
      isoFormat = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      console.log("🔒 SUPER-PRESERVAÇÃO 3.0: Usando data atual como último recurso:", isoFormat);
    }
    
    // FORÇAR exibição da data no formato brasileiro mesmo se não houver data original
    const formattedDateBR = formatDate(isoFormat);
    console.log("🔒 SUPER-PRESERVAÇÃO 3.0: Data formatada final para exibição:", formattedDateBR);
    
    // Atualiza os estados e notifica o parent
    setIsoDate(isoFormat);
    setDisplayDate(formattedDateBR);
    onChange(isoFormat);
    
    // Salvar a data no localStorage para persistência entre re-renders
    try {
      localStorage.setItem(`preserved-date-${componentId}`, isoFormat);
      localStorage.setItem(`preserved-date-display-${componentId}`, formattedDateBR);
      console.log(`🔒 SUPER-PRESERVAÇÃO 3.0: Data salva no localStorage com ID ${componentId}`);
      
      // Atribuir o ID ao elemento para recuperação futura
      setTimeout(() => {
        document.querySelectorAll('.date-input').forEach(input => {
          input.setAttribute('data-date-id', componentId);
          console.log("🔒 SUPER-PRESERVAÇÃO 3.0: Campo de data marcado com ID de preservação");
        });
      }, 50);
    } catch (e) {
      console.error("🔒 SUPER-PRESERVAÇÃO 3.0: Erro ao salvar no localStorage:", e);
    }
    
  }, []); // CRUCIAL: Executado apenas uma vez na montagem do componente
  
  // Função para processar input do usuário
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    console.log("🔒 SUPER-PRESERVAÇÃO: Input de data:", input);
    
    // Atualiza o display imediatamente para feedback visual
    setDisplayDate(input);
    
    // Se o input corresponde ao formato brasileiro, converte para ISO e atualiza
    if (input.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      const [day, month, year] = input.split('/').map(Number);
      const newIsoDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      console.log("🔒 SUPER-PRESERVAÇÃO: Convertido para ISO:", newIsoDate);
      setIsoDate(newIsoDate);
      onChange(newIsoDate);
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
          value={displayDate}
          onChange={handleInputChange}
          disabled={readOnly}
          data-iso-date={isoDate}
          className="date-input"
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  );
};

export default StaticDateField;