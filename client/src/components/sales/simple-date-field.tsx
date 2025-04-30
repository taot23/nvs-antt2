import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Calendar } from 'lucide-react';

/**
 * VERSÃO ULTRA ROBUSTA FINAL - MAIO 2025
 * Componente de data com lógica simplificada e correções para problemas críticos
 * - Mantém o valor original quando vem do backend, INCLUSIVE null
 * - Preserva exatamente o formato do banco mesmo durante edições 
 * - Tratamento especial para valores NULL em vendas retornadas
 * - Logs extensivos para depuração em produção
 */
interface SimpleDateFieldProps {
  value?: string | Date | null;
  onChange: (dateIsoString: string | null) => void; // Modificado para aceitar null explicitamente 
  label?: string;
  readOnly?: boolean;
  preserveNull?: boolean; // Nova prop para indicar que valores null devem ser preservados
}

export function SimpleDateField({ 
  value, 
  onChange, 
  label = 'Data', 
  readOnly = false,
  preserveNull = false // Novo parâmetro para controlar a preservação de valores null
}: SimpleDateFieldProps) {
  // Adicionar flag para rastrear se o valor original era null
  const wasOriginallyNull = useRef<boolean>(value === null);
  // Estado local para manter o valor exibido
  const [displayValue, setDisplayValue] = useState<string>('');
  
  // Referência para controlar se este campo já foi inicializado
  const isInitialized = useRef(false);
  
  // Referência para o valor original para garantir que podemos recuperá-lo
  const originalValue = useRef<any>(null);
  
  // SOLUÇÃO RADICAL - LOG DETALHADO
  console.log(`🔍 SimpleDateField - value:`, {
    type: typeof value,
    isNull: value === null,
    isUndefined: value === undefined,
    stringValue: typeof value === 'string' ? value : 'não é string',
    isDateObject: value && typeof value === 'object' && 'getFullYear' in value
  });
  
  // Ao inicializar ou quando o valor externo mudar, formatar para exibição
  useEffect(() => {
    // Se ainda não temos um valor original, vamos armazenar (até mesmo se for null)
    if (!isInitialized.current) {
      originalValue.current = value;
      wasOriginallyNull.current = value === null;
      isInitialized.current = true;
      console.log('📝 SimpleDateField - Valor original salvo:', {
        value,
        isNull: value === null,
        wasOriginallyNull: wasOriginallyNull.current,
        preserveNull
      });
    }
    
    if (value === null || value === undefined || value === '') {
      // SOLUÇÃO CRÍTICA MAIO 2025 - Tratamento especial para valores nulos
      console.log('⚠️ SimpleDateField - Valor nulo/vazio detectado');
      
      // Se estamos preservando null, manter wasOriginallyNull ativo
      if (preserveNull && value === null) {
        console.log('🔵 PRESERVAÇÃO NULL: Mantendo flag wasOriginallyNull ativa');
        wasOriginallyNull.current = true;
      }
      
      // Em modo de leitura, mostrar vazio
      if (readOnly) {
        console.log('⚠️ SimpleDateField - Modo leitura com valor nulo, exibindo em branco');
        setDisplayValue('');
        return;
      }
      
      // Em modo de edição, exibir data sugerida, mas manter flags para preservar null
      if (!readOnly) {
        // Se preserveNull está habilitado, exibimos vazio para null
        if (preserveNull && value === null) {
          console.log('🔵 PRESERVAÇÃO NULL: Campo preserveNull=true para valor null, exibindo vazio');
          setDisplayValue('');
        } else {
          const today = new Date();
          const day = today.getDate().toString().padStart(2, '0');
          const month = (today.getMonth() + 1).toString().padStart(2, '0');
          const year = today.getFullYear();
          const formatted = `${day}/${month}/${year}`;
          console.log(`✅ SimpleDateField - Valor nulo, sugerindo data atual: ${formatted}`);
          setDisplayValue(formatted);
        }
      }
      
      return;
    }
    
    try {
      // SOLUÇÃO EXTREMA: Log detalhado para debug
      console.log('🔢 SimpleDateField - processando valor:', value);
      
      // Converter Date para string no formato brasileiro
      if (value && typeof value === 'object' && 'getFullYear' in value) {
        try {
          const dateObj = value as Date;
          
          // Verificar se é data válida
          if (isNaN(dateObj.getTime())) {
            throw new Error("Data inválida");
          }
          
          const day = dateObj.getDate().toString().padStart(2, '0');
          const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
          const year = dateObj.getFullYear();
          const formatted = `${day}/${month}/${year}`;
          console.log(`✅ SimpleDateField - Date para DD/MM/YYYY: ${formatted}`);
          setDisplayValue(formatted);
          return;
        } catch (err) {
          console.error('❌ SimpleDateField - Erro ao processar Date:', err);
        }
      }
      
      // Se já estiver no formato DD/MM/AAAA, manter como está
      if (typeof value === 'string' && value.includes('/')) {
        console.log(`✅ SimpleDateField - Já no formato brasileiro: ${value}`);
        setDisplayValue(value);
        return;
      }
      
      // Se for string ISO, converter para DD/MM/AAAA
      if (typeof value === 'string' && (value.includes('-') || value.includes('T'))) {
        // Garantir que estamos tratando somente a parte da data (antes do T se existir)
        const datePart = value.split('T')[0];
        const parts = datePart.split('-');
        
        if (parts.length === 3) {
          const [year, month, day] = parts;
          const formattedDay = day.padStart(2, '0');
          const formattedMonth = month.padStart(2, '0');
          const formatted = `${formattedDay}/${formattedMonth}/${year}`;
          console.log(`✅ SimpleDateField - ISO para DD/MM/YYYY: ${value} -> ${formatted}`);
          setDisplayValue(formatted);
          
          // SOLUÇÃO CRÍTICA: Garantir que o formato ISO é mantido na prop onChange
          // Este é o ponto chave para preservar o valor original
          if (!readOnly) {
            const isoValue = `${year}-${month}-${day}`;
            console.log(`🔄 SimpleDateField - Garantindo formato ISO no onChange: ${isoValue}`);
            onChange(isoValue);
          }
          return;
        }
      }
      
      // Fallback: mostrar como está e logar
      console.log(`⚠️ SimpleDateField - Formato não processado, usando original: ${value}`);
      setDisplayValue(String(value));
    } catch (error) {
      console.error('❌ SimpleDateField - Erro crítico ao formatar data:', error);
      setDisplayValue(String(value));
    }
  }, [value, onChange, readOnly]);
  
  // Função para lidar com mudanças no input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // Sempre atualizar a exibição com o que o usuário digitou
    setDisplayValue(newValue);
    
    // SOLUÇÃO CRÍTICA: Log extensivo para depuração
    console.log(`🔤 SimpleDateField - Input alterado para: "${newValue}"`);
    
    // CASO ESPECIAL MAIO 2025: Se estiver vazio e preserveNull habilitado
    if (newValue.trim() === '' && preserveNull && wasOriginallyNull.current) {
      console.log(`🔵 PRESERVAÇÃO NULL: Campo vazio e preserveNull=true, enviando NULL explícito`);
      // @ts-ignore - Ignorando erro de tipo, queremos explicitamente passar null aqui
      onChange(null);
      return;
    }
    
    // Verificar se corresponde ao formato DD/MM/AAAA
    const datePattern = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    if (datePattern.test(newValue)) {
      const [, day, month, year] = newValue.match(datePattern) || [];
      
      // Converter para formato ISO
      const isoDate = `${year}-${month}-${day}`;
      console.log(`✅ SimpleDateField - Convertido para ISO: ${isoDate}`);
      
      // Se tinha valor originalmente null mas agora tem data, não manter como null
      if (wasOriginallyNull.current) {
        console.log(`🔄 SimpleDateField - Valor original era null, mas foi substituído`);
        wasOriginallyNull.current = false;
      }
      
      onChange(isoDate);
    } else {
      // SOLUÇÃO RADICAL: Verificar formato parcial
      const partialPattern = /^(\d{1,2})[\/]?(\d{0,2})[\/]?(\d{0,4})$/;
      if (partialPattern.test(newValue)) {
        console.log(`⚠️ SimpleDateField - Formato parcial, aguardando completar...`);
        // Não chamar onChange ainda para evitar estragar o valor
      } else {
        // CASO ESPECIAL: Se estiver completamente vazio e originalmente era null
        if (newValue.trim() === '' && wasOriginallyNull.current && preserveNull) {
          console.log(`🔵 PRESERVAÇÃO NULL: Campo limpo, retornando ao valor null original`);
          // @ts-ignore - Ignorando erro de tipo, queremos explicitamente passar null aqui
          onChange(null);
        } else {
          // Passar o valor como está se não corresponder a nenhum padrão conhecido
          console.log(`⚠️ SimpleDateField - Formato desconhecido, passando como está`);
          onChange(newValue);
        }
      }
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
        className={`pl-3 ${readOnly ? 'bg-gray-50' : ''}`}
      />
    </div>
  );
}