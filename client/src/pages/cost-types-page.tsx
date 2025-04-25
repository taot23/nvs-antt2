import React from "react";
import { Helmet } from "react-helmet";
import CostTypeList from "@/components/cost-types/cost-type-list";
import { PageHeader } from "@/components/ui/page-header";

export default function CostTypesPage() {
  return (
    <>
      <Helmet>
        <title>Tipos de Custo | Sistema de Gerenciamento</title>
      </Helmet>
      
      <div className="container py-4 mx-auto max-w-6xl">
        <PageHeader 
          title="Tipos de Custo Operacional" 
          description="Gerencie os tipos padronizados de custo operacional para manter a consistência nos registros financeiros."
        />
        
        <div className="mt-6">
          <CostTypeList />
        </div>
      </div>
    </>
  );
}