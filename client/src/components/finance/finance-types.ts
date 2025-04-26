import { Sale } from "@shared/schema";

// Interface segura para usuário para garantir compatibilidade de tipos
export interface SafeUser {
  id: number;
  username: string;
  role: string;
}

// Interface para resumo financeiro de uma venda
export interface FinancialSummary {
  totalAmount: number;
  totalPaid: number;
  totalPending: number;
  totalCosts: number;
  netResult: number;
}

// Interface estendida para venda com dados financeiros
export interface FinanceSale extends Sale {
  sellerName?: string;
  customerName?: string;
  financialSummary?: FinancialSummary;
}

// Helpers para conversão
export function convertToSafeUser(user: any): SafeUser | null {
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    role: user.role || '',
  };
}