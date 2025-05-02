import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";

// Tipo para os relatórios
interface Report {
  id: number;
  name: string;
  description: string;
  type: string;
  permissions: string;
  parameters: Record<string, any>;
}

interface ReportListProps {
  reports: Report[];
  selectedReportId: number | null;
  onSelectReport: (id: number) => void;
}

export function ReportList({ reports, selectedReportId, onSelectReport }: ReportListProps) {
  const { user } = useAuth();
  
  // Função para exibir um badge indicando para qual perfil o relatório está disponível
  const renderPermissionBadges = (permissions: string) => {
    const permissionList = permissions.split(',');
    
    const permissionLabels: Record<string, { label: string, variant: "default" | "secondary" | "outline" | "destructive" }> = {
      admin: { label: "Admin", variant: "default" },
      vendedor: { label: "Vendedor", variant: "secondary" },
      financeiro: { label: "Financeiro", variant: "outline" },
      operacional: { label: "Operacional", variant: "outline" },
      supervisor: { label: "Supervisor", variant: "secondary" }
    };
    
    return (
      <div className="flex flex-wrap gap-1 mt-2">
        {permissionList.map(perm => {
          const config = permissionLabels[perm] || { label: perm, variant: "outline" };
          return (
            <Badge key={perm} variant={config.variant} className="text-xs">
              {config.label}
            </Badge>
          );
        })}
      </div>
    );
  };
  
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Relatórios Disponíveis</CardTitle>
        <CardDescription>
          {reports.length} {reports.length === 1 ? 'relatório disponível' : 'relatórios disponíveis'} para seu perfil
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(100vh-240px)]">
          <div className="space-y-4">
            {reports.map((report) => (
              <div 
                key={report.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedReportId === report.id 
                    ? 'bg-primary text-primary-foreground border-primary' 
                    : 'hover:bg-accent'
                }`}
                onClick={() => onSelectReport(report.id)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start space-x-3">
                    <FileText className={`h-5 w-5 mt-0.5 ${selectedReportId === report.id ? 'text-primary-foreground' : 'text-primary'}`} />
                    <div>
                      <h3 className="font-medium">{report.name}</h3>
                      <p className={`text-sm mt-1 ${selectedReportId === report.id ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                        {report.description}
                      </p>
                      {renderPermissionBadges(report.permissions)}
                    </div>
                  </div>
                  <ChevronRight className={`h-5 w-5 ${selectedReportId === report.id ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        
        {user?.role === "admin" && (
          <Button className="w-full mt-4" variant="outline" onClick={() => alert("Funcionalidade de criação de relatórios em desenvolvimento")}>
            Criar Novo Relatório
          </Button>
        )}
      </CardContent>
    </Card>
  );
}