import React, { useEffect, useState } from 'react';
import { FormControl, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Calendar } from "lucide-react";

// Função específica para formatação de data de ISO para brasileiro
const formatDate = (date: string | Date | null): string => {
  if (!date) return '';
  
  try {
    let dateObj: Date;
    
    if (typeof date === 'string') {
      // Se já é string e tem formato ISO
      if (date.match(/^\d{4}-\d{2}-\d{2}/)) {
        const [year, month, day] = date.split('T')[0].split('-').map(Number);
        return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
      }
      
      // Se já está no formato brasileiro, retorna como está
      if (date.match(/^\d{2}\/\d{2}\/\d{4}/)) {
        return date;
      }
      
      // Tenta criar um objeto Date da string
      dateObj = new Date(date);
    } else {
      dateObj = date;
    }
    
    // Verifica se é uma data válida
    if (isNaN(dateObj.getTime())) {
      console.log("⚠️ Data inválida:", date);
      return '';
    }
    
    // Formato brasileiro DD/MM/YYYY
    return `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${dateObj.getFullYear()}`;
  } catch (error) {
    console.error("⚠️ Erro ao formatar data:", error);
    return '';
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
  
  // Inicializa os estados APENAS quando o componente monta (usando []) para evitar mudanças automáticas
  // Removemos originalDate da dependência do useEffect para evitar que a data seja recalculada quando originalDate muda
  useEffect(() => {
    console.log("🔒 SUPER-PRESERVAÇÃO-FINAL: Inicializando com data:", originalDate);
    
    // Processa a data original para formato ISO
    let isoFormat = '';
    
    if (originalDate) {
      if (typeof originalDate === 'string') {
        // Se já é string ISO (YYYY-MM-DD), usa diretamente
        if (originalDate.match(/^\d{4}-\d{2}-\d{2}/)) {
          isoFormat = originalDate.split('T')[0]; // Remove parte do tempo se existir
          console.log("🔒 SUPER-PRESERVAÇÃO-FINAL: Data ISO original preservada:", isoFormat);
        } 
        // Se é string em formato brasileiro, converte para ISO
        else if (originalDate.match(/^\d{2}\/\d{2}\/\d{4}/)) {
          const [day, month, year] = originalDate.split('/').map(Number);
          isoFormat = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          console.log("🔒 SUPER-PRESERVAÇÃO-FINAL: Convertido BR para ISO:", isoFormat);
        }
        // Outro formato, tenta converter
        else {
          try {
            const dateObj = new Date(originalDate);
            if (!isNaN(dateObj.getTime())) {
              isoFormat = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
              console.log("🔒 SUPER-PRESERVAÇÃO-FINAL: Convertido string para ISO:", isoFormat);
            }
          } catch (e) {
            console.error("🔒 SUPER-PRESERVAÇÃO-FINAL: Erro ao converter string:", e);
          }
        }
      } 
      // Se é um objeto Date, converte para ISO
      else if (originalDate instanceof Date) {
        isoFormat = `${originalDate.getFullYear()}-${String(originalDate.getMonth() + 1).padStart(2, '0')}-${String(originalDate.getDate()).padStart(2, '0')}`;
        console.log("🔒 SUPER-PRESERVAÇÃO-FINAL: Convertido Date para ISO:", isoFormat);
      }
    }
    
    // Se não conseguimos obter um formato ISO, use a data atual
    if (!isoFormat) {
      const today = new Date();
      isoFormat = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      console.log("🔒 SUPER-PRESERVAÇÃO-FINAL: Usando data atual:", isoFormat);
    }
    
    // Atualiza os estados e notifica o parent APENAS na inicialização
    setIsoDate(isoFormat);
    setDisplayDate(formatDate(isoFormat));
    onChange(isoFormat);
    
    // FIXAÇÃO CRÍTICA: Adicionamos um atributo data-locked ao elemento para marcar que já foi inicializado
    document.querySelectorAll('.date-input').forEach(input => {
      input.setAttribute('data-locked', 'true');
    });
    
    console.log("🔒 SUPER-PRESERVAÇÃO-FINAL: Data fixada e bloqueada contra alterações automáticas");
  }, []); // ⚠️ Array de dependências vazio = executa apenas na montagem
  
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