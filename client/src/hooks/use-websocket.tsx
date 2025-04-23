import { useState, useEffect, useCallback } from 'react';

// Tipos de evento para o WebSocket
export type WSEventType = 'sales_update' | 'user_update' | 'ping';

// Interface para os eventos
export interface WSEvent {
  type: WSEventType;
  payload?: any;
}

export function useWebSocket() {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<WSEvent | null>(null);
  
  // Inicializar a conexão WebSocket
  useEffect(() => {
    // Configurar a conexão WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    console.log('Tentando conectar ao WebSocket:', wsUrl);
    
    const ws = new WebSocket(wsUrl);
    
    // Manipulador para quando a conexão é aberta
    ws.onopen = () => {
      console.log('Conexão WebSocket estabelecida');
      setIsConnected(true);
      // Enviar um ping para testar a conexão
      ws.send(JSON.stringify({ type: 'ping' }));
    };
    
    // Manipulador para quando uma mensagem é recebida
    ws.onmessage = (event) => {
      try {
        const data: WSEvent = JSON.parse(event.data);
        console.log('Evento WebSocket recebido:', data);
        setLastEvent(data);
      } catch (error) {
        console.error('Erro ao processar mensagem do WebSocket:', error);
      }
    };
    
    // Manipulador para quando a conexão é fechada
    ws.onclose = () => {
      console.log('Conexão WebSocket fechada');
      setIsConnected(false);
      
      // Tentar reconectar após 5 segundos
      setTimeout(() => {
        console.log('Tentando reconectar...');
      }, 5000);
    };
    
    // Manipulador para erros
    ws.onerror = (error) => {
      console.error('Erro na conexão WebSocket:', error);
    };
    
    // Salvar a referência ao socket
    setSocket(ws);
    
    // Limpar ao desmontar
    return () => {
      console.log('Fechando conexão WebSocket');
      ws.close();
    };
  }, []);
  
  // Função para enviar mensagens
  const sendMessage = useCallback((type: WSEventType, payload?: any) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type, payload }));
    } else {
      console.warn('WebSocket não está conectado. Não foi possível enviar mensagem.');
    }
  }, [socket]);
  
  return { isConnected, lastEvent, sendMessage };
}