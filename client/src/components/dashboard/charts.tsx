import React from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Cores para gráficos
const COLORS = [
  "#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", 
  "#82CA9D", "#A4DE6C", "#D0ED57", "#FFC658", "#FF7C43"
];

interface ChartCardProps {
  title: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
  isLoading?: boolean;
}

export function ChartCard({
  title,
  description,
  className,
  children,
  isLoading = false,
}: ChartCardProps) {
  return (
    <Card className={cn(className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="p-4">
        {isLoading ? (
          <div className="animate-pulse w-full h-64 bg-gray-200 rounded-md"></div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

interface SalesAreaChartProps {
  data: Array<{
    date: string;
    value: number;
  }>;
  className?: string;
  isLoading?: boolean;
}

export function SalesAreaChart({ data, className, isLoading = false }: SalesAreaChartProps) {
  return (
    <ChartCard 
      title="Volume de Vendas"
      description="Evolução de vendas no período"
      className={className}
      isLoading={isLoading}
    >
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart
          data={data}
          margin={{
            top: 10,
            right: 10,
            left: 0,
            bottom: 10,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip 
            formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Valor']}
            labelFormatter={(label) => `Data: ${label}`}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#8884d8"
            fill="#8884d8"
            fillOpacity={0.2}
            name="Vendas"
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

interface PerformanceBarChartProps {
  data: Array<{
    name: string;
    value: number;
  }>;
  nameKey?: string;
  valueKey?: string;
  className?: string;
  isLoading?: boolean;
}

export function PerformanceBarChart({ 
  data, 
  nameKey = "name", 
  valueKey = "value", 
  className,
  isLoading = false
}: PerformanceBarChartProps) {
  return (
    <ChartCard 
      title="Desempenho"
      description="Comparativo de performance"
      className={className}
      isLoading={isLoading}
    >
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          margin={{
            top: 10,
            right: 10,
            left: 0,
            bottom: 10,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={nameKey} />
          <YAxis />
          <Tooltip 
            formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Valor']}
          />
          <Legend />
          <Bar 
            dataKey={valueKey} 
            fill="#8884d8" 
            radius={[4, 4, 0, 0]}
            name="Valor"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

interface StatusPieChartProps {
  data: Array<{
    name: string;
    value: number;
  }>;
  className?: string;
  isLoading?: boolean;
}

export function StatusPieChart({ data, className, isLoading = false }: StatusPieChartProps) {
  return (
    <ChartCard 
      title="Distribuição por Status"
      description="Status das vendas no período"
      className={className}
      isLoading={isLoading}
    >
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number) => [`${value} registro(s)`, 'Quantidade']}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}