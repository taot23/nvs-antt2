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
  
  // Efeito que inicializa os estados, mas APENAS SE necessário
  useEffect(() => {
    // Verificar se já temos um valor de data definido
    const dataElement = document.querySelector('.date-input[data-locked="true"]');
    if (dataElement) {
      console.log("🔒 SUPER-PRESERVAÇÃO-FINAL: Campo de data já inicializado, ignorando");
      return;
    }

    console.log("🔒 SUPER-PRESERVAÇÃO-FINAL v2: Inicializando com data:", originalDate);
    
    // Processa a data original para formato ISO
    let isoFormat = '';
    
    if (originalDate) {
      if (typeof originalDate === 'string') {
        // Se já é string ISO (YYYY-MM-DD), usa diretamente
        if (originalDate.match(/^\d{4}-\d{2}-\d{2}/)) {
          isoFormat = originalDate.split('T')[0]; // Remove parte do tempo se existir
          console.log("🔒 SUPER-PRESERVAÇÃO-FINAL v2: Data ISO original preservada:", isoFormat);
        } 
        // Se é string em formato brasileiro, converte para ISO
        else if (originalDate.match(/^\d{2}\/\d{2}\/\d{4}/)) {
          const [day, month, year] = originalDate.split('/').map(Number);
          isoFormat = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          console.log("🔒 SUPER-PRESERVAÇÃO-FINAL v2: Convertido BR para ISO:", isoFormat);
        }
        // Outro formato, tenta converter
        else {
          try {
            const dateObj = new Date(originalDate);
            if (!isNaN(dateObj.getTime())) {
              isoFormat = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
              console.log("🔒 SUPER-PRESERVAÇÃO-FINAL v2: Convertido string para ISO:", isoFormat);
            }
          } catch (e) {
            console.error("🔒 SUPER-PRESERVAÇÃO-FINAL v2: Erro ao converter string:", e);
          }
        }
      } 
      // Se é um objeto Date, converte para ISO
      else if (originalDate instanceof Date) {
        isoFormat = `${originalDate.getFullYear()}-${String(originalDate.getMonth() + 1).padStart(2, '0')}-${String(originalDate.getDate()).padStart(2, '0')}`;
        console.log("🔒 SUPER-PRESERVAÇÃO-FINAL v2: Convertido Date para ISO:", isoFormat);
      }
    }
    
    // Se não conseguimos obter um formato ISO, usar a data atual (hoje)
    if (!isoFormat) {
      const today = new Date();
      isoFormat = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      console.log("🔒 SUPER-PRESERVAÇÃO-FINAL v2: Usando data atual:", isoFormat);
    }
    
    // FORÇAR exibição da data no formato brasileiro mesmo se não houver data original
    const formattedDateBR = formatDate(isoFormat);
    console.log("🔒 SUPER-PRESERVAÇÃO-FINAL v2: Data formatada para exibição:", formattedDateBR);
    
    // Atualiza os estados e notifica o parent
    setIsoDate(isoFormat);
    setDisplayDate(formattedDateBR);
    onChange(isoFormat);
    
    // FIXAÇÃO CRÍTICA: Adicionamos um atributo data-locked ao elemento para marcar que já foi inicializado
    // Usamos timeout para garantir que o DOM esteja atualizado
    setTimeout(() => {
      document.querySelectorAll('.date-input').forEach(input => {
        input.setAttribute('data-locked', 'true');
        console.log("🔒 SUPER-PRESERVAÇÃO-FINAL v2: Campo de data marcado como bloqueado");
      });
    }, 100);
    
  }, [originalDate]); // Tem originalDate como dependência, mas a lógica interna evita atualizações desnecessárias
  
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