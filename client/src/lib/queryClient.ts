import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Adicionar cabeçalhos anti-cache
  const headers = new Headers({
    'Pragma': 'no-cache',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
  });
  
  // Adicionar Content-Type se houver dados
  if (data) {
    headers.append('Content-Type', 'application/json');
  }

  const res = await fetch(url, {
    method,
    headers: headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    console.log(`[QueryClient] Buscando dados de: ${queryKey[0]}`);
    
    // Construir URL, se tiver um ID e subpath
    let url = queryKey[0] as string;
    if (queryKey.length > 1 && queryKey[1] !== undefined) {
      url = `${url}/${queryKey[1]}`;
      if (queryKey.length > 2 && queryKey[2] !== undefined) {
        url = `${url}/${queryKey[2]}`;
      }
    }
    
    // Adicionar cabeçalhos anti-cache
    const headers = new Headers({
      'Pragma': 'no-cache',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    });
    
    const res = await fetch(url, {
      credentials: "include",
      headers: headers,
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    const data = await res.json();
    console.log(`[QueryClient] Dados recebidos de ${url}:`, Array.isArray(data) ? `${data.length} itens` : 'objeto único');
    return data;
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: 60000, // Refresca a cada 60 segundos
      refetchOnWindowFocus: true, // Refresca quando o usuário volta para a janela
      staleTime: 30000, // Dados ficam stale após 30 segundos
      retry: 1, // Tenta mais uma vez se falhar
      refetchOnMount: true, // Refresca sempre que um componente é montado
    },
    mutations: {
      retry: 1,
    },
  },
});

// Tipo para o usuário atual (simplificado)
type CurrentUser = {
  id: number;
  username: string;
  role: string | null;
};

// Função auxiliar para limpar o cache específico do histórico
export function clearHistoryCache(saleId?: number) {
  console.log(`Limpando cache de histórico para venda ${saleId || 'todas'}`);
  
  if (saleId) {
    // Limpar cache específico para uma venda
    queryClient.invalidateQueries({ queryKey: ["/api/sales", saleId, "history"] });
    queryClient.invalidateQueries({ queryKey: ["/api/sales", saleId, "status-history"] });
  } else {
    // Limpar todos os caches relacionados a vendas
    queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
  }
}

// Disponibilizar o queryClient e o usuário atual globalmente para que o WebSocket possa acessá-los
declare global {
  interface Window {
    queryClient: typeof queryClient;
    currentUser?: CurrentUser;
    clearHistoryCache?: typeof clearHistoryCache;
  }
}

if (typeof window !== 'undefined') {
  window.queryClient = queryClient;
  window.clearHistoryCache = clearHistoryCache;
}
