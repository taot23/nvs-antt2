import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import CustomersPage from "@/pages/customers-page";
import UsersPage from "@/pages/users-page";
import ServicesPage from "@/pages/services-page";
import PaymentMethodsPage from "@/pages/payment-methods-page";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";
import { AppLayout } from "@/components/layout/app-layout";

// Componente que envolve as rotas protegidas com o layout 
const ProtectedApp = ({ children }: { children: React.ReactNode }) => {
  console.log("Renderizando ProtectedApp");
  return <AppLayout>{children}</AppLayout>;
};

// Componentes específicos para cada rota
const ProtectedHome = () => {
  console.log("Renderizando ProtectedHome");
  return (
    <ProtectedApp>
      <HomePage />
    </ProtectedApp>
  );
};

const ProtectedCustomers = () => {
  console.log("Renderizando ProtectedCustomers");
  return (
    <ProtectedApp>
      <CustomersPage />
    </ProtectedApp>
  );
};

const ProtectedUsers = () => {
  console.log("Renderizando ProtectedUsers");
  return (
    <ProtectedApp>
      <UsersPage />
    </ProtectedApp>
  );
};

const ProtectedServices = () => {
  // Adiciona log para depuração
  console.log("Renderizando ProtectedServices");
  console.log("ServicesPage:", ServicesPage);
  // Fim dos logs de depuração
  
  return (
    <ProtectedApp>
      <ServicesPage />
    </ProtectedApp>
  );
};

const ProtectedPaymentMethods = () => {
  console.log("Renderizando ProtectedPaymentMethods");
  return (
    <ProtectedApp>
      <PaymentMethodsPage />
    </ProtectedApp>
  );
};

function Router() {
  console.log("Renderizando Router");
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={ProtectedHome} />
      <ProtectedRoute path="/customers" component={ProtectedCustomers} />
      <ProtectedRoute path="/users" component={ProtectedUsers} />
      <ProtectedRoute path="/services" component={ProtectedServices} />
      <ProtectedRoute path="/payment-methods" component={ProtectedPaymentMethods} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
