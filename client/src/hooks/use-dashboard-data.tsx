import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";

// Interfaces para os dados do dashboard
export interface FinancialOverview {
  totalSales: number;
  totalInstallments: number;
  paidInstallments: number;
  pendingInstallments: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  trend?: number;
}

export interface SalesBySeller {
  sellerId: number;
  sellerName: string;
  count: number;
  amount: number;
}

export interface SalesSummary {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  canceled: number;
  byStatus: { [key: string]: number };
  byDate: Array<{ date: string; count: number; amount: number }>;
}

export interface RecentActivity {
  id: number;
  type: string;
  description: string;
  status: string;
  date: string;
  amount?: number;
  user?: string;
}

export function useDashboardData(dateRange?: DateRange) {
  // Formatar o intervalo de datas para a query string
  const dateParams = dateRange
    ? `startDate=${format(dateRange.from || new Date(), "yyyy-MM-dd")}&endDate=${
        dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd")
      }`
    : "";

  // Visão geral financeira
  const {
    data: financialOverview,
    isLoading: isLoadingFinancial,
    error: financialError,
  } = useQuery<FinancialOverview>({
    queryKey: [`/api/analytics/financial-overview${dateParams ? `?${dateParams}` : ""}`],
    refetchOnWindowFocus: false,
  });

  // Desempenho dos vendedores
  const {
    data: sellerPerformance,
    isLoading: isLoadingSellerPerformance,
    error: sellerPerformanceError,
  } = useQuery<SalesBySeller[]>({
    queryKey: [`/api/analytics/seller-performance${dateParams ? `?${dateParams}` : ""}`],
    refetchOnWindowFocus: false,
  });

  // Resumo de vendas
  const {
    data: salesSummary,
    isLoading: isLoadingSalesSummary,
    error: salesSummaryError,
  } = useQuery<SalesSummary>({
    queryKey: [`/api/analytics/sales-summary${dateParams ? `?${dateParams}` : ""}`],
    refetchOnWindowFocus: false,
  });

  // Atividades recentes
  const {
    data: recentActivities,
    isLoading: isLoadingRecentActivities,
    error: recentActivitiesError,
  } = useQuery<RecentActivity[]>({
    queryKey: [`/api/recent-executions${dateParams ? `?${dateParams}` : ""}`],
    refetchOnWindowFocus: false,
  });

  // Estado para rastrear insights baseados nos dados
  const [insights, setInsights] = useState<any[]>([]);

  // Gerar insights baseados nos dados recebidos
  useEffect(() => {
    const newInsights = [];
    
    // Insights baseados nos dados financeiros
    if (financialOverview) {
      // Pagamentos pendentes
      if (financialOverview.pendingAmount > 0) {
        newInsights.push({
          id: "pending-payments",
          title: "Pagamentos pendentes",
          description: `Há R$ ${financialOverview.pendingAmount.toLocaleString("pt-BR", { 
            minimumFractionDigits: 2 
          })} em parcelas a receber.`,
          type: "info",
        });
      }
      
      // Taxa de conversão de pagamentos
      if (financialOverview.totalInstallments > 0) {
        const paymentRate = (financialOverview.paidInstallments / financialOverview.totalInstallments) * 100;
        newInsights.push({
          id: "payment-rate",
          title: "Taxa de conversão de pagamentos",
          description: `${paymentRate.toFixed(1)}% das parcelas foram pagas até o momento.`,
          type: paymentRate > 80 ? "positive" : paymentRate > 50 ? "neutral" : "warning",
          trend: {
            direction: paymentRate > 70 ? "up" : "down",
            value: Number(paymentRate.toFixed(1)),
          },
        });
      }
    }
    
    // Insights baseados no resumo de vendas
    if (salesSummary) {
      // Vendas em progresso
      if (salesSummary.inProgress > 0) {
        newInsights.push({
          id: "in-progress-sales",
          title: "Vendas em andamento",
          description: `Existem ${salesSummary.inProgress} vendas em andamento que precisam de atenção.`,
          type: "warning",
        });
      }
      
      // Taxa de conclusão
      if (salesSummary.total > 0) {
        const completionRate = (salesSummary.completed / salesSummary.total) * 100;
        if (completionRate < 100) {
          newInsights.push({
            id: "completion-rate",
            title: "Taxa de conclusão",
            description: `${completionRate.toFixed(1)}% das vendas foram concluídas com sucesso.`,
            type: completionRate > 80 ? "positive" : "warning",
            trend: {
              direction: completionRate > 80 ? "up" : "down",
              value: Number(completionRate.toFixed(1)),
            },
          });
        }
      }
    }
    
    // Insights baseados no desempenho dos vendedores
    if (sellerPerformance && sellerPerformance.length > 0) {
      // Vendedor destaque
      const topSeller = [...sellerPerformance].sort((a, b) => b.amount - a.amount)[0];
      if (topSeller) {
        newInsights.push({
          id: "top-seller",
          title: "Vendedor destaque",
          description: `${topSeller.sellerName} lidera as vendas com R$ ${topSeller.amount.toLocaleString(
            "pt-BR",
            { minimumFractionDigits: 2 }
          )}.`,
          type: "positive",
        });
      }
    }
    
    setInsights(newInsights);
  }, [financialOverview, salesSummary, sellerPerformance]);

  return {
    financialOverview,
    sellerPerformance,
    salesSummary,
    recentActivities,
    insights,
    isLoading: isLoadingFinancial || isLoadingSellerPerformance || isLoadingSalesSummary || isLoadingRecentActivities,
    errors: {
      financialError,
      sellerPerformanceError,
      salesSummaryError,
      recentActivitiesError,
    },
  };
}