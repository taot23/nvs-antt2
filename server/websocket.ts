import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { log } from './vite';

// Tipos de eventos para o WebSocket
export type WSEventType = 'sales_update' | 'user_update' | 'ping';

// Interface para os eventos
export interface WSEvent {
  type: WSEventType;
  payload?: any;
}

// Armazenar as conexões ativas
const connections: WebSocket[] = [];

// Configurar o servidor WebSocket
export function setupWebsocket(httpServer: HttpServer) {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  log('WebSocket configurado no caminho /ws', 'websocket');

  wss.on('connection', (ws) => {
    log('Nova conexão WebSocket estabelecida', 'websocket');
    connections.push(ws);

    // Enviar uma mensagem de boas-vindas quando conectar
    const welcomeEvent: WSEvent = {
      type: 'ping',
      payload: { message: 'Conectado ao servidor em tempo real' }
    };
    ws.send(JSON.stringify(welcomeEvent));

    // Evento para quando o cliente envia uma mensagem
    ws.on('message', (message) => {
      try {
        const event: WSEvent = JSON.parse(message.toString());
        log(`Mensagem recebida: ${event.type}`, 'websocket');
        
        // Processar diferentes tipos de eventos
        if (event.type === 'ping') {
          ws.send(JSON.stringify({ type: 'ping', payload: { timestamp: Date.now() } }));
        }
      } catch (error) {
        log(`Erro ao processar mensagem: ${error}`, 'websocket');
      }
    });

    // Evento para quando a conexão é fechada
    ws.on('close', () => {
      const index = connections.indexOf(ws);
      if (index !== -1) {
        connections.splice(index, 1);
      }
      log('Conexão WebSocket fechada', 'websocket');
    });

    // Verificar periodicamente se a conexão ainda está ativa
    const interval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping', payload: { timestamp: Date.now() } }));
      } else {
        clearInterval(interval);
      }
    }, 30000); // Ping a cada 30 segundos
  });

  return wss;
}

// Função para enviar eventos para todos os clientes conectados
export function broadcastEvent(event: WSEvent) {
  const message = JSON.stringify(event);
  
  log(`Broadcast de evento: ${event.type}`, 'websocket');
  
  connections.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Enviar evento de atualização de vendas
export function notifySalesUpdate() {
  broadcastEvent({
    type: 'sales_update',
    payload: { timestamp: Date.now() }
  });
}