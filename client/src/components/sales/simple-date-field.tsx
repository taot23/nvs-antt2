import React, { useState, useEffect } from 'react';
import { FormControl, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Calendar } from "lucide-react";

/**
 * Componente de data ultra simples sem qualquer lógica complexa
 * Permite entrada livre pelo usuário e converte para ISO apenas
 * quando detecta o formato DD/MM/AAAA
 */
interface SimpleDateFieldProps {
  value?: string | Date | null;
  onChange: (dateIsoString: string) => void;
  label?: string;
  readOnly?: boolean;
}

export function SimpleDateField({ 
  value, 
  onChange, 
  label = "Data", 
  readOnly = false 
}: SimpleDateFieldProps) {
  // Para exibição ao usuário (formato DD/MM/AAAA)
  const [displayValue, setDisplayValue] = useState("");
  
  // Inicialização
  useEffect(() => {
    if (!value) {
      // Se não tem valor, usar data atual
      const today = new Date();
      const dd = String(today.getDate()).padStart(2, '0');
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const yyyy = today.getFullYear();
      
      setDisplayValue(`${dd}/${mm}/${yyyy}`);
      onChange(`${yyyy}-${mm}-${dd}`);
      return;
    }
    
    // Se valor é string
    if (typeof value === 'string') {
      // Se já é formato brasileiro
      if (value.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        setDisplayValue(value);
        // Converter para ISO
        const [day, month, year] = value.split('/');
        onChange(`${year}-${month}-${day}`);
      }
      // Se é formato ISO
      else if (value.match(/^\d{4}-\d{2}-\d{2}/)) {
        const parts = value.split('T')[0].split('-');
        setDisplayValue(`${parts[2]}/${parts[1]}/${parts[0]}`);
        onChange(value.split('T')[0]);
      }
      // Outra string de data
      else {
        try {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            const dd = String(date.getDate()).padStart(2, '0');
            const mm = String(date.getMonth() + 1).padStart(2, '0');
            const yyyy = date.getFullYear();
            
            setDisplayValue(`${dd}/${mm}/${yyyy}`);
            onChange(`${yyyy}-${mm}-${dd}`);
          }
        } catch (error) {
          console.error("Erro ao processar data:", error);
        }
      }
    }
    // Se valor é objeto Date
    else if (value instanceof Date && !isNaN(value.getTime())) {
      const dd = String(value.getDate()).padStart(2, '0');
      const mm = String(value.getMonth() + 1).padStart(2, '0');
      const yyyy = value.getFullYear();
      
      setDisplayValue(`${dd}/${mm}/${yyyy}`);
      onChange(`${yyyy}-${mm}-${dd}`);
    }
  }, []);
  
  // Handler para mudanças no input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const userInput = e.target.value;
    setDisplayValue(userInput);
    
    // Se o formato é brasileiro válido (DD/MM/AAAA), converter para ISO
    if (userInput.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      try {
        const [day, month, year] = userInput.split('/');
        onChange(`${year}-${month}-${day}`);
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
          className="date-input"
          placeholder="DD/MM/AAAA"
          value={displayValue}
          onChange={handleChange}
          disabled={readOnly}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  );
}