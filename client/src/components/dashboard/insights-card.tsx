import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Lightbulb, TrendingUp, TrendingDown, AlertCircle, Info } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export interface Insight {
  id: string | number;
  title: string;
  description: string;
  type: "positive" | "negative" | "neutral" | "warning" | "info";
  trend?: {
    direction: "up" | "down" | "stable";
    value?: number;
  };
}

interface InsightsCardProps {
  title: string;
  description?: string;
  insights: Insight[];
  className?: string;
  isLoading?: boolean;
}

export function InsightsCard({
  title,
  description,
  insights,
  className,
  isLoading = false,
}: InsightsCardProps) {
  const getInsightIcon = (type: string, trend?: { direction: string }) => {
    if (trend) {
      if (trend.direction === "up") return <TrendingUp className="h-5 w-5" />;
      if (trend.direction === "down") return <TrendingDown className="h-5 w-5" />;
    }

    switch (type) {
      case "positive":
        return <TrendingUp className="h-5 w-5" />;
      case "negative":
        return <TrendingDown className="h-5 w-5" />;
      case "warning":
        return <AlertCircle className="h-5 w-5" />;
      case "info":
        return <Info className="h-5 w-5" />;
      default:
        return <Lightbulb className="h-5 w-5" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case "positive":
        return "bg-green-50 text-green-700 border-green-200";
      case "negative":
        return "bg-red-50 text-red-700 border-red-200";
      case "warning":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "info":
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getInsightIconContainer = (type: string) => {
    switch (type) {
      case "positive":
        return "bg-green-100";
      case "negative":
        return "bg-red-100";
      case "warning":
        return "bg-yellow-100";
      case "info":
        return "bg-blue-100";
      default:
        return "bg-gray-100";
    }
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-amber-500" />
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="px-6 pb-4">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={`loading-${index}`} className="flex gap-3">
                <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : insights.length === 0 ? (
          <div className="py-4 text-center text-muted-foreground">
            <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Nenhum insight disponível para o período selecionado.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {insights.map((insight) => (
              <div key={insight.id} className="flex gap-3">
                <div
                  className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0",
                    getInsightIconContainer(insight.type)
                  )}
                >
                  {getInsightIcon(insight.type, insight.trend)}
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    {insight.title}
                    {insight.trend && insight.trend.value !== undefined && (
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs",
                          insight.trend.direction === "up"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : insight.trend.direction === "down"
                            ? "bg-red-50 text-red-700 border-red-200"
                            : "bg-gray-50 text-gray-700 border-gray-200"
                        )}
                      >
                        {insight.trend.direction === "up" ? "+" : ""}
                        {insight.trend.value}%
                      </Badge>
                    )}
                  </h4>
                  <p className="text-sm text-muted-foreground mt-0.5">{insight.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}