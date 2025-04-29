import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Calendar } from 'lucide-react';

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
  label = 'Data', 
  readOnly = false
}: SimpleDateFieldProps) {
  // Estado local para manter o valor exibido
  const [displayValue, setDisplayValue] = useState<string>('');
  
  // Ao inicializar ou quando o valor externo mudar, formatar para exibição
  useEffect(() => {
    if (!value) {
      setDisplayValue('');
      return;
    }
    
    try {
      // Converter Date para string no formato brasileiro
      if (value instanceof Date) {
        const day = value.getDate().toString().padStart(2, '0');
        const month = (value.getMonth() + 1).toString().padStart(2, '0');
        const year = value.getFullYear();
        setDisplayValue(`${day}/${month}/${year}`);
        return;
      }
      
      // Se já estiver no formato DD/MM/AAAA, manter como está
      if (typeof value === 'string' && value.includes('/')) {
        setDisplayValue(value);
        return;
      }
      
      // Se for string ISO, converter para DD/MM/AAAA
      if (typeof value === 'string' && value.includes('-')) {
        const parts = value.split('T')[0].split('-');
        if (parts.length === 3) {
          const [year, month, day] = parts;
          setDisplayValue(`${day}/${month}/${year}`);
          return;
        }
      }
      
      // Fallback: mostrar como está
      setDisplayValue(String(value));
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      setDisplayValue(String(value));
    }
  }, [value]);
  
  // Função para lidar com mudanças no input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setDisplayValue(newValue);
    
    // Verificar se corresponde ao formato DD/MM/AAAA
    const datePattern = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    if (datePattern.test(newValue)) {
      const [, day, month, year] = newValue.match(datePattern) || [];
      // Converter para formato ISO
      const isoDate = `${year}-${month}-${day}`;
      onChange(isoDate);
    } else {
      // Passar o valor como está se não corresponder ao padrão
      onChange(newValue);
    }
  };
  
  return (
    <div className="relative">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
          <Calendar className="h-4 w-4" />
          {label}
        </label>
      )}
      <Input
        type="text"
        placeholder="DD/MM/AAAA"
        value={displayValue}
        onChange={handleInputChange}
        readOnly={readOnly}
        className="pl-3"
      />
    </div>
  );
}