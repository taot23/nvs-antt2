import { useEffect, useState } from "react";
import { ReportList } from "@/components/reports/report-list";
import { ReportExecution } from "@/components/reports/report-execution";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ReportsPage() {
  const { user } = useAuth();
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  
  // Buscar a lista de relatórios disponíveis para o usuário
  const { data: reports, isLoading, error } = useQuery({
    queryKey: ["/api/reports"],
    enabled: !!user,
  });
  
  // Limpar o relatório selecionado quando mudar a lista de relatórios
  useEffect(() => {
    setSelectedReportId(null);
  }, [reports]);
  
  // Exibir loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Exibir erro
  if (error || !reports) {
    return (
      <Alert variant="destructive" className="mx-auto max-w-4xl mt-4">
        <AlertTitle>Erro ao carregar relatórios</AlertTitle>
        <AlertDescription>
          {error instanceof Error ? error.message : "Não foi possível carregar os relatórios disponíveis."}
        </AlertDescription>
      </Alert>
    );
  }
  
  // Se não houver relatórios disponíveis
  if (reports.length === 0) {
    return (
      <Card className="mx-auto max-w-4xl mt-4">
        <CardHeader>
          <CardTitle>Relatórios</CardTitle>
          <CardDescription>Nenhum relatório disponível para o seu perfil</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Não foram encontrados relatórios disponíveis para o seu perfil de usuário.</p>
          {user?.role === "admin" && (
            <Button className="mt-4" onClick={() => alert("Funcionalidade de criação de relatórios em desenvolvimento")}>
              Criar Novo Relatório
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="container mx-auto py-6 space-y-4">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Painel esquerdo - lista de relatórios */}
        <div className="w-full md:w-1/3">
          <ReportList 
            reports={reports} 
            selectedReportId={selectedReportId}
            onSelectReport={(id) => setSelectedReportId(id)}
          />
        </div>
        
        {/* Painel direito - execução de relatório */}
        <div className="w-full md:w-2/3">
          {selectedReportId ? (
            <ReportExecution 
              reportId={selectedReportId} 
              onBack={() => setSelectedReportId(null)}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Execução de Relatório</CardTitle>
                <CardDescription>Selecione um relatório para começar</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Escolha um relatório da lista à esquerda para visualizar, preencher os parâmetros e executar.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}