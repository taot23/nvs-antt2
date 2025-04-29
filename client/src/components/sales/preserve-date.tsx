import React, { useEffect, useState, useRef } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useSaleDatePatch } from '@/patches/emergency-patch';

type StaticDateFieldProps = {
  value: Date | string | null;
  onChange: (date: Date) => void;
  placeholderText?: string;
  disabled?: boolean;
  className?: string;
  dayClassName?: string;
  fieldName?: string;
  id?: string;
  label?: string;
  showIcon?: boolean;
  // Compatibilidade com o campo original
  originalDate?: Date | string | null;
  readOnly?: boolean;
};

// Componente especial para datas que preserva seu estado interno e evita problemas
export default function StaticDateField({
  value,
  onChange,
  placeholderText = 'Selecione uma data',
  disabled = false,
  className = '',
  dayClassName = '',
  fieldName = undefined,
  id = '',
  label = '',
  showIcon = true
}: StaticDateFieldProps) {
  // Criar uma referência para rastrear se o componente foi montado
  const componentMounted = useRef(false);
  
  // Estado interno para evitar atualizações desnecessárias  
  const [date, setDate] = useState<Date | null>(null);
  
  // Referência ao input para manipulação direta quando necessário
  const inputRef = useRef<HTMLButtonElement>(null);
  
  // Data atual no formato de string para ajudar na comparação
  const [dateString, setDateString] = useState<string>('');
  
  // Usar o patch de emergência para preservar a data
  const patchedDate = useSaleDatePatch(value);
  
  // Efeito para definir o valor inicial do estado interno
  useEffect(() => {
    // Evita executar mais de uma vez
    if (componentMounted.current) return;
    
    try {
      // Inicialização do componente
      componentMounted.current = true;
      
      // Se já temos uma data no valor, inicializamos com ela
      if (value) {
        let initialDate: Date;
        
        if (typeof value === 'string') {
          // Se é string, converter para Date
          // Tentativa 1: Parse simples
          initialDate = new Date(value);
          
          // Verificar se é uma data válida
          if (isNaN(initialDate.getTime())) {
            // Tentativa 2: Formato ISO (YYYY-MM-DD)
            const parts = value.split('-');
            if (parts.length === 3) {
              initialDate = new Date(
                parseInt(parts[0]), 
                parseInt(parts[1]) - 1, 
                parseInt(parts[2])
              );
            } else {
              // Fallback: data atual
              initialDate = new Date();
            }
          }
        } else {
          // Se já é um objeto Date
          initialDate = value;
        }
        
        // Sempre aplicamos a data inicial, mesmo que seja inválida
        setDate(initialDate);
        setDateString(format(initialDate, 'yyyy-MM-dd'));
        
        console.log("🛡️ StaticDateField INICIALIZADO com:", {
          value,
          initialDate,
          dateString: format(initialDate, 'yyyy-MM-dd')
        });
      } else {
        // Se não temos valor, usar a do patch de emergência
        console.log("🛡️ StaticDateField sem valor inicial, verificando patch...");
        
        // Verificar se temos uma data do patch
        if (patchedDate) {
          console.log("🛡️ StaticDateField RECUPERADO do patch:", patchedDate);
          
          // Converter para Date
          const patchDate = new Date(patchedDate);
          if (!isNaN(patchDate.getTime())) {
            setDate(patchDate);
            setDateString(patchedDate);
          }
        }
      }
    } catch (error) {
      console.error("🛡️ StaticDateField Erro na inicialização:", error);
    }
  }, []);
  
  // Sempre que value mudar externamente, tentar preservar nosso estado interno
  useEffect(() => {
    // Só atualizamos se o componente já foi montado
    if (!componentMounted.current) return;
    
    // Só atualiza se o valor mudou significativamente
    if (value) {
      let newDateString: string;
      
      // Converter para string para comparação
      if (typeof value === 'string') {
        newDateString = value.includes('T') ? value.split('T')[0] : value;
      } else {
        newDateString = format(value, 'yyyy-MM-dd');
      }
      
      // Só atualiza se realmente mudou o valor
      if (newDateString !== dateString) {
        console.log("🛡️ StaticDateField ATUALIZANDO por mudança externa:", {
          oldValue: dateString,
          newValue: newDateString
        });
        
        // Atualizar estado interno
        setDateString(newDateString);
        
        // Converter para Date
        const newDate = typeof value === 'string' ? new Date(value) : value;
        if (!isNaN(newDate.getTime())) {
          setDate(newDate);
        }
      }
    }
  }, [value]);

  // Função para formatar a data para exibição
  const formatDisplayDate = () => {
    if (!date) return placeholderText;
    
    try {
      // Usar formato brasileiro DD/MM/YYYY
      return format(date, 'dd/MM/yyyy');
    } catch (e) {
      console.error("🛡️ StaticDateField Erro ao formatar data:", e);
      return placeholderText;
    }
  };

  // Manipular mudança na data via calendário 
  const handleDateChange = (newDate: Date | undefined) => {
    if (!newDate) return;
    
    try {
      // Atualizar estado interno
      setDate(newDate);
      setDateString(format(newDate, 'yyyy-MM-dd'));
      
      // Registrar para debug
      console.log("🛡️ StaticDateField ALTERADO para:", {
        date: newDate,
        dateString: format(newDate, 'yyyy-MM-dd')
      });
      
      // Propagar mudança para o componente pai
      onChange(newDate);
      
      // Adicionar atributo data-final-date no botão para captura posterior
      if (inputRef.current) {
        inputRef.current.setAttribute(
          'data-final-date', 
          format(newDate, 'yyyy-MM-dd')
        );
      }
    } catch (e) {
      console.error("🛡️ StaticDateField Erro ao alterar data:", e);
    }
  };

  return (
    <div className="relative">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}
      
      <Popover>
        <PopoverTrigger asChild>
          <Button
            ref={inputRef}
            id={id}
            name={fieldName}
            variant="outline"
            disabled={disabled}
            data-final-date={dateString}
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground",
              className
            )}
          >
            {showIcon && <CalendarIcon className="mr-2 h-4 w-4" />}
            {formatDisplayDate()}
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date || undefined}
            onSelect={handleDateChange}
            disabled={disabled}
            initialFocus
            className={dayClassName}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}