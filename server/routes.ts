import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { setupWebsocket, notifySalesUpdate, broadcastEvent } from "./websocket";
import { registerCustomRoutes } from "./routes-custom";
import { 
  insertCustomerSchema, 
  insertUserSchema, 
  insertServiceSchema, 
  insertPaymentMethodSchema, 
  insertServiceTypeSchema,
  insertServiceProviderSchema,
  insertSaleSchema,
  insertSaleItemSchema,
  insertSalesStatusHistorySchema,
  insertSaleOperationalCostSchema,
  InsertSale,
  InsertSaleOperationalCost,
  InsertSalePaymentReceipt,
  sales
} from "@shared/schema";
import { ZodError } from "zod";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { eq } from "drizzle-orm";
import { db } from "./db";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);
  
  // Função auxiliar para gerar hash de senha
  const scryptAsync = promisify(scrypt);
  
  async function hashPassword(password: string) {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
  }
  
  // Middleware para verificar se o usuário está autenticado
  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated()) {
      return next();
    }
    return res.status(401).json({ error: "Não autorizado" });
  };
  
  // Middleware para verificar permissões - gerenciamento de serviços
  const canManageServices = (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Não autorizado" });
    }
    // Apenas administradores e operacionais podem gerenciar serviços
    if (req.user?.role === "admin" || req.user?.role === "operacional") {
      return next();
    }
    return res.status(403).json({ error: "Permissão negada" });
  };
  
  // Middleware para verificar permissões - gerenciamento de formas de pagamento
  const canManagePaymentMethods = (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Não autorizado" });
    }
    // Apenas administradores e financeiros podem gerenciar formas de pagamento
    if (req.user?.role === "admin" || req.user?.role === "financeiro") {
      return next();
    }
    return res.status(403).json({ error: "Permissão negada" });
  };
  
  // Middleware para verificar permissões - gerenciamento financeiro (tipos de custo, etc)
  const canManageFinance = (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Não autorizado" });
    }
    // Apenas administradores e financeiros podem gerenciar aspectos financeiros
    if (req.user?.role === "admin" || req.user?.role === "financeiro") {
      return next();
    }
    return res.status(403).json({ error: "Permissão negada" });
  };
  
  // Middleware para verificar permissões - gerenciamento de tipos de serviço
  const canManageServiceTypes = (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Não autorizado" });
    }
    // Apenas administradores e operacionais podem gerenciar tipos de serviço
    if (req.user?.role === "admin" || req.user?.role === "operacional") {
      return next();
    }
    return res.status(403).json({ error: "Permissão negada" });
  };
  
  // Middleware para verificar permissões - gerenciamento de prestadores de serviço
  const canManageServiceProviders = (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Não autorizado" });
    }
    // Apenas administradores e operacionais podem gerenciar prestadores de serviço
    if (req.user?.role === "admin" || req.user?.role === "operacional") {
      return next();
    }
    return res.status(403).json({ error: "Permissão negada" });
  };
  
  // Middleware para verificar permissões - operações operacionais em vendas
  const canManageSaleOperations = (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Não autorizado" });
    }
    // Administradores, operacionais, financeiros e supervisores podem gerenciar operações em vendas
    if (req.user?.role === "admin" || req.user?.role === "operacional" || req.user?.role === "supervisor" || req.user?.role === "financeiro") {
      console.log("Permissão para operações de venda concedida ao usuário:", req.user.username, "perfil:", req.user.role);
      return next();
    }
    console.log("Permissão para operações de venda negada ao usuário:", req.user?.username, "perfil:", req.user?.role);
    return res.status(403).json({ error: "Permissão negada" });
  };
  
  // Middleware para verificar permissões - operações financeiras em vendas
  const canManageSaleFinancials = (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Não autorizado" });
    }
    // Apenas administradores e financeiros podem gerenciar operações financeiras em vendas
    if (req.user?.role === "admin" || req.user?.role === "financeiro") {
      return next();
    }
    return res.status(403).json({ error: "Permissão negada" });
  };
  
  // Middleware para verificar se usuário pode ver todas as vendas da empresa
  const canViewAllSales = (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Não autorizado" });
    }
    // Admins, supervisores, operacionais e financeiros podem ver todas as vendas
    if (["admin", "supervisor", "operacional", "financeiro"].includes(req.user?.role || "")) {
      return next();
    }
    return res.status(403).json({ error: "Permissão negada" });
  };
  
  // Rotas para gerenciamento de clientes
  app.get("/api/customers", isAuthenticated, async (req, res) => {
    try {
      const customers = await storage.getCustomers();
      res.json(customers);
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
      res.status(500).json({ error: "Erro ao buscar clientes" });
    }
  });

  app.get("/api/customers/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }
      
      const customer = await storage.getCustomer(id);
      if (!customer) {
        return res.status(404).json({ error: "Cliente não encontrado" });
      }
      
      res.json(customer);
    } catch (error) {
      console.error("Erro ao buscar cliente:", error);
      res.status(500).json({ error: "Erro ao buscar cliente" });
    }
  });

  app.post("/api/customers", isAuthenticated, async (req, res) => {
    try {
      // Valida os dados enviados pelo cliente
      const validatedData = insertCustomerSchema.parse(req.body);
      
      // Verificar se já existe um cliente com este documento
      const existingCustomer = await storage.getCustomerByDocument(validatedData.document);
      if (existingCustomer) {
        // Limitar os dados retornados para evitar exposição desnecessária
        return res.status(400).json({ 
          error: "Cliente já cadastrado", 
          message: `Este ${existingCustomer.documentType === 'cpf' ? 'CPF' : 'CNPJ'} já está cadastrado no sistema para o cliente "${existingCustomer.name}"`, 
          existingCustomer: {
            id: existingCustomer.id,
            name: existingCustomer.name,
            document: existingCustomer.document,
            documentType: existingCustomer.documentType
          }
        });
      }
      
      // Adiciona o ID do usuário logado como proprietário
      const customerData = {
        ...validatedData,
        userId: req.user!.id
      };
      
      console.log("Dados para criação do cliente:", customerData);
      
      const customer = await storage.createCustomer(customerData);
      console.log("Cliente criado com sucesso:", customer);
      res.status(201).json(customer);
    } catch (error) {
      console.error("Erro ao criar cliente:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          error: "Dados inválidos", 
          details: error.errors 
        });
      }
      res.status(500).json({ error: "Erro ao criar cliente" });
    }
  });

  app.put("/api/customers/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }
      
      // Buscar o cliente atual para verificações
      const currentCustomer = await storage.getCustomer(id);
      if (!currentCustomer) {
        return res.status(404).json({ error: "Cliente não encontrado" });
      }
      
      // Valida os dados parciais
      const customerData = insertCustomerSchema.partial().parse(req.body);
      
      // Se o documento estiver sendo alterado, verifica se já existe
      if (customerData.document && customerData.document !== currentCustomer.document) {
        const existingCustomer = await storage.getCustomerByDocument(customerData.document);
        if (existingCustomer && existingCustomer.id !== id) {
          return res.status(400).json({ 
            error: "Documento já cadastrado", 
            message: `Este ${existingCustomer.documentType === 'cpf' ? 'CPF' : 'CNPJ'} já está sendo utilizado pelo cliente "${existingCustomer.name}". Não é possível atualizar para um documento já cadastrado.`,
            existingCustomer: {
              id: existingCustomer.id,
              name: existingCustomer.name,
              document: existingCustomer.document,
              documentType: existingCustomer.documentType
            }
          });
        }
      }
      
      // Garantir que o usuário não está tentando modificar o userId
      if ('userId' in customerData) {
        delete customerData.userId;
      }
      
      console.log("Dados para atualização do cliente:", id, customerData);
      
      const customer = await storage.updateCustomer(id, customerData);
      if (!customer) {
        return res.status(404).json({ error: "Cliente não encontrado" });
      }
      
      console.log("Cliente atualizado com sucesso:", customer);
      res.json(customer);
    } catch (error) {
      console.error("Erro ao atualizar cliente:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          error: "Dados inválidos", 
          details: error.errors 
        });
      }
      res.status(500).json({ error: "Erro ao atualizar cliente" });
    }
  });

  app.delete("/api/customers/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }
      
      const success = await storage.deleteCustomer(id);
      if (!success) {
        return res.status(404).json({ error: "Cliente não encontrado" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Erro ao excluir cliente:", error);
      res.status(500).json({ error: "Erro ao excluir cliente" });
    }
  });

  // ========== Rotas para gerenciamento de usuários ==========
  app.get("/api/users", isAuthenticated, async (req, res) => {
    try {
      const users = await storage.getUsers();
      
      // Não enviar as senhas para o frontend
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      res.status(500).json({ error: "Erro ao buscar usuários" });
    }
  });

  app.get("/api/users/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }
      
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }
      
      // Não enviar a senha para o frontend
      const { password, ...userWithoutPassword } = user;
      
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Erro ao buscar usuário:", error);
      res.status(500).json({ error: "Erro ao buscar usuário" });
    }
  });

  app.post("/api/users", isAuthenticated, async (req, res) => {
    try {
      // Verificar o perfil do usuário logado - apenas admins e supervisores podem criar novos usuários
      const currentUser = req.user;
      if (!currentUser || (currentUser.role !== "admin" && currentUser.role !== "supervisor")) {
        return res.status(403).json({ error: "Permissão negada. Apenas administradores e supervisores podem criar usuários." });
      }
      
      // Validar os dados enviados
      const validatedData = insertUserSchema.parse(req.body);
      
      // Verificar se já existe um usuário com este nome de usuário
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({ 
          error: "Nome de usuário já cadastrado", 
          message: "Este nome de usuário já está em uso. Escolha outro nome de usuário."
        });
      }
      
      // Criar o usuário
      const user = await storage.createUser(validatedData);
      
      // Não enviar a senha para o frontend
      const { password, ...userWithoutPassword } = user;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Erro ao criar usuário:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          error: "Dados inválidos", 
          details: error.errors 
        });
      }
      res.status(500).json({ error: "Erro ao criar usuário" });
    }
  });

  app.patch("/api/users/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }
      
      // Verificar se o usuário existe
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }
      
      // Regras de permissão:
      // 1. Um usuário comum só pode editar a si mesmo
      // 2. Administradores e supervisores podem editar qualquer usuário
      // 3. Um usuário comum não pode alterar seu próprio papel (role)
      const currentUser = req.user;
      if (!currentUser) {
        return res.status(401).json({ error: "Não autorizado" });
      }
      
      if (currentUser.role !== "admin" && currentUser.role !== "supervisor" && currentUser.id !== id) {
        return res.status(403).json({ error: "Permissão negada" });
      }
      
      // Validar dados parciais
      const userData = insertUserSchema.partial().parse(req.body);
      
      // Se estiver alterando username, verificar se já existe
      if (userData.username && userData.username !== user.username) {
        const existingUser = await storage.getUserByUsername(userData.username);
        if (existingUser && existingUser.id !== id) {
          return res.status(400).json({ 
            error: "Nome de usuário já cadastrado", 
            message: "Este nome de usuário já está sendo utilizado por outro usuário."
          });
        }
      }
      
      // Verificar se usuário comum está tentando alterar seu próprio papel
      if (currentUser.role !== "admin" && userData.role && userData.role !== user.role) {
        return res.status(403).json({ 
          error: "Permissão negada", 
          message: "Você não pode alterar seu próprio perfil de acesso."
        });
      }
      
      // Se estiver mudando a senha, fazer hash dela
      if (userData.password) {
        userData.password = await hashPassword(userData.password);
      }
      
      // Atualizar usuário
      const updatedUser = await storage.updateUser(id, userData);
      if (!updatedUser) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }
      
      // Não enviar a senha para o frontend
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          error: "Dados inválidos", 
          details: error.errors 
        });
      }
      res.status(500).json({ error: "Erro ao atualizar usuário" });
    }
  });

  app.delete("/api/users/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }
      
      // Verificar permissões (apenas admins e supervisores podem excluir usuários)
      const currentUser = req.user;
      if (!currentUser || (currentUser.role !== "admin" && currentUser.role !== "supervisor")) {
        return res.status(403).json({ error: "Permissão negada. Apenas administradores e supervisores podem excluir usuários." });
      }
      
      // Não permitir excluir o próprio usuário
      if (currentUser.id === id) {
        return res.status(400).json({ error: "Você não pode excluir seu próprio usuário." });
      }
      
      const success = await storage.deleteUser(id);
      if (!success) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Erro ao excluir usuário:", error);
      res.status(500).json({ error: "Erro ao excluir usuário" });
    }
  });

  // ========== Rotas para gerenciamento de serviços ==========
  
  app.get("/api/services", isAuthenticated, async (req, res) => {
    try {
      const services = await storage.getServices();
      res.json(services);
    } catch (error) {
      console.error("Erro ao buscar serviços:", error);
      res.status(500).json({ error: "Erro ao buscar serviços" });
    }
  });

  app.get("/api/services/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }
      
      const service = await storage.getService(id);
      if (!service) {
        return res.status(404).json({ error: "Serviço não encontrado" });
      }
      
      res.json(service);
    } catch (error) {
      console.error("Erro ao buscar serviço:", error);
      res.status(500).json({ error: "Erro ao buscar serviço" });
    }
  });

  app.post("/api/services", canManageServices, async (req, res) => {
    try {
      // Validar os dados enviados
      const validatedData = insertServiceSchema.parse(req.body);
      
      // Verificar se já existe um serviço com esse nome
      const existingService = await storage.getServiceByName(validatedData.name);
      if (existingService) {
        return res.status(400).json({ 
          error: "Serviço já cadastrado", 
          message: "Já existe um serviço com este nome. Por favor, escolha outro nome para o serviço."
        });
      }
      
      const service = await storage.createService(validatedData);
      res.status(201).json(service);
    } catch (error) {
      console.error("Erro ao criar serviço:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          error: "Dados inválidos", 
          details: error.errors 
        });
      }
      res.status(500).json({ error: "Erro ao criar serviço" });
    }
  });

  app.put("/api/services/:id", canManageServices, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }
      
      // Verificar se o serviço existe
      const service = await storage.getService(id);
      if (!service) {
        return res.status(404).json({ error: "Serviço não encontrado" });
      }
      
      // Validar os dados enviados
      const validatedData = insertServiceSchema.parse(req.body);
      
      // Verificar se já existe outro serviço com esse nome
      if (validatedData.name !== service.name) {
        const existingService = await storage.getServiceByName(validatedData.name);
        if (existingService && existingService.id !== id) {
          return res.status(400).json({ 
            error: "Nome de serviço já utilizado", 
            message: "Já existe um serviço com este nome. Por favor, escolha outro nome para o serviço."
          });
        }
      }
      
      const updatedService = await storage.updateService(id, validatedData);
      if (!updatedService) {
        return res.status(404).json({ error: "Serviço não encontrado" });
      }
      
      res.json(updatedService);
    } catch (error) {
      console.error("Erro ao atualizar serviço:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          error: "Dados inválidos", 
          details: error.errors 
        });
      }
      res.status(500).json({ error: "Erro ao atualizar serviço" });
    }
  });

  app.delete("/api/services/:id", canManageServices, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }
      
      const success = await storage.deleteService(id);
      if (!success) {
        return res.status(404).json({ error: "Serviço não encontrado" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Erro ao excluir serviço:", error);
      res.status(500).json({ error: "Erro ao excluir serviço" });
    }
  });

  // Rota especial para redefinir senha de usuário
  app.post("/api/reset-password", isAuthenticated, async (req, res) => {
    try {
      // Verificar o perfil do usuário logado - apenas admins podem redefinir senhas
      const currentUser = req.user;
      if (!currentUser || currentUser.role !== "admin") {
        return res.status(403).json({ error: "Permissão negada. Apenas administradores podem redefinir senhas." });
      }
      
      const { username, newPassword } = req.body;
      
      if (!username || !newPassword) {
        return res.status(400).json({ error: "Nome de usuário e nova senha são obrigatórios" });
      }
      
      // Buscar usuário pelo nome de usuário
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }
      
      // Hash a nova senha
      const hashedPassword = await hashPassword(newPassword);
      
      // Atualizar a senha do usuário
      const updatedUser = await storage.updateUser(user.id, { password: hashedPassword });
      if (!updatedUser) {
        return res.status(500).json({ error: "Falha ao atualizar senha do usuário" });
      }
      
      res.json({ message: "Senha redefinida com sucesso" });
    } catch (error) {
      console.error("Erro ao redefinir senha:", error);
      res.status(500).json({ error: "Erro ao redefinir senha" });
    }
  });
  
  // ========== Rotas para gerenciamento de formas de pagamento ==========
  
  app.get("/api/payment-methods", isAuthenticated, async (req, res) => {
    try {
      const paymentMethods = await storage.getPaymentMethods();
      res.json(paymentMethods);
    } catch (error) {
      console.error("Erro ao buscar formas de pagamento:", error);
      res.status(500).json({ error: "Erro ao buscar formas de pagamento" });
    }
  });

  app.get("/api/payment-methods/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }
      
      const paymentMethod = await storage.getPaymentMethod(id);
      if (!paymentMethod) {
        return res.status(404).json({ error: "Forma de pagamento não encontrada" });
      }
      
      res.json(paymentMethod);
    } catch (error) {
      console.error("Erro ao buscar forma de pagamento:", error);
      res.status(500).json({ error: "Erro ao buscar forma de pagamento" });
    }
  });

  app.post("/api/payment-methods", canManagePaymentMethods, async (req, res) => {
    try {
      // Validar os dados enviados
      const validatedData = insertPaymentMethodSchema.parse(req.body);
      
      // Verificar se já existe uma forma de pagamento com esse nome
      const existingPaymentMethod = await storage.getPaymentMethodByName(validatedData.name);
      if (existingPaymentMethod) {
        return res.status(400).json({ 
          error: "Forma de pagamento já cadastrada", 
          message: "Já existe uma forma de pagamento com este nome. Por favor, escolha outro nome."
        });
      }
      
      const paymentMethod = await storage.createPaymentMethod(validatedData);
      res.status(201).json(paymentMethod);
    } catch (error) {
      console.error("Erro ao criar forma de pagamento:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          error: "Dados inválidos", 
          details: error.errors 
        });
      }
      res.status(500).json({ error: "Erro ao criar forma de pagamento" });
    }
  });

  app.put("/api/payment-methods/:id", canManagePaymentMethods, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }
      
      // Verificar se a forma de pagamento existe
      const paymentMethod = await storage.getPaymentMethod(id);
      if (!paymentMethod) {
        return res.status(404).json({ error: "Forma de pagamento não encontrada" });
      }
      
      // Validar os dados enviados
      const validatedData = insertPaymentMethodSchema.parse(req.body);
      
      // Verificar se já existe outra forma de pagamento com esse nome
      if (validatedData.name !== paymentMethod.name) {
        const existingPaymentMethod = await storage.getPaymentMethodByName(validatedData.name);
        if (existingPaymentMethod && existingPaymentMethod.id !== id) {
          return res.status(400).json({ 
            error: "Nome já utilizado", 
            message: "Já existe uma forma de pagamento com este nome. Por favor, escolha outro nome."
          });
        }
      }
      
      const updatedPaymentMethod = await storage.updatePaymentMethod(id, validatedData);
      if (!updatedPaymentMethod) {
        return res.status(404).json({ error: "Forma de pagamento não encontrada" });
      }
      
      res.json(updatedPaymentMethod);
    } catch (error) {
      console.error("Erro ao atualizar forma de pagamento:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          error: "Dados inválidos", 
          details: error.errors 
        });
      }
      res.status(500).json({ error: "Erro ao atualizar forma de pagamento" });
    }
  });

  app.delete("/api/payment-methods/:id", canManagePaymentMethods, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }
      
      const success = await storage.deletePaymentMethod(id);
      if (!success) {
        return res.status(404).json({ error: "Forma de pagamento não encontrada" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Erro ao excluir forma de pagamento:", error);
      res.status(500).json({ error: "Erro ao excluir forma de pagamento" });
    }
  });

  // ========== Rotas para gerenciamento de tipos de serviço ==========
  
  app.get("/api/service-types", isAuthenticated, async (req, res) => {
    try {
      const serviceTypes = await storage.getServiceTypes();
      res.json(serviceTypes);
    } catch (error) {
      console.error("Erro ao buscar tipos de serviço:", error);
      res.status(500).json({ error: "Erro ao buscar tipos de serviço" });
    }
  });

  app.get("/api/service-types/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }
      
      const serviceType = await storage.getServiceType(id);
      if (!serviceType) {
        return res.status(404).json({ error: "Tipo de serviço não encontrado" });
      }
      
      res.json(serviceType);
    } catch (error) {
      console.error("Erro ao buscar tipo de serviço:", error);
      res.status(500).json({ error: "Erro ao buscar tipo de serviço" });
    }
  });

  app.post("/api/service-types", canManageServiceTypes, async (req, res) => {
    try {
      // Validar os dados enviados
      const validatedData = insertServiceTypeSchema.parse(req.body);
      
      // Verificar se já existe um tipo de serviço com esse nome
      const existingServiceType = await storage.getServiceTypeByName(validatedData.name);
      if (existingServiceType) {
        return res.status(400).json({ 
          error: "Tipo de serviço já cadastrado", 
          message: "Já existe um tipo de serviço com este nome. Por favor, escolha outro nome."
        });
      }
      
      const serviceType = await storage.createServiceType(validatedData);
      res.status(201).json(serviceType);
    } catch (error) {
      console.error("Erro ao criar tipo de serviço:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          error: "Dados inválidos", 
          details: error.errors 
        });
      }
      res.status(500).json({ error: "Erro ao criar tipo de serviço" });
    }
  });

  app.put("/api/service-types/:id", canManageServiceTypes, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }
      
      // Verificar se o tipo de serviço existe
      const serviceType = await storage.getServiceType(id);
      if (!serviceType) {
        return res.status(404).json({ error: "Tipo de serviço não encontrado" });
      }
      
      // Validar os dados enviados
      const validatedData = insertServiceTypeSchema.parse(req.body);
      
      // Verificar se já existe outro tipo de serviço com esse nome
      if (validatedData.name !== serviceType.name) {
        const existingServiceType = await storage.getServiceTypeByName(validatedData.name);
        if (existingServiceType && existingServiceType.id !== id) {
          return res.status(400).json({ 
            error: "Nome já utilizado", 
            message: "Já existe um tipo de serviço com este nome. Por favor, escolha outro nome."
          });
        }
      }
      
      const updatedServiceType = await storage.updateServiceType(id, validatedData);
      if (!updatedServiceType) {
        return res.status(404).json({ error: "Tipo de serviço não encontrado" });
      }
      
      res.json(updatedServiceType);
    } catch (error) {
      console.error("Erro ao atualizar tipo de serviço:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          error: "Dados inválidos", 
          details: error.errors 
        });
      }
      res.status(500).json({ error: "Erro ao atualizar tipo de serviço" });
    }
  });

  app.delete("/api/service-types/:id", canManageServiceTypes, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }
      
      const success = await storage.deleteServiceType(id);
      if (!success) {
        return res.status(404).json({ error: "Tipo de serviço não encontrado" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Erro ao excluir tipo de serviço:", error);
      res.status(500).json({ error: "Erro ao excluir tipo de serviço" });
    }
  });

  // ========== Rotas para gerenciamento de prestadores de serviço ==========
  
  app.get("/api/service-providers", isAuthenticated, async (req, res) => {
    try {
      const serviceProviders = await storage.getServiceProviders();
      res.json(serviceProviders);
    } catch (error) {
      console.error("Erro ao buscar prestadores de serviço:", error);
      res.status(500).json({ error: "Erro ao buscar prestadores de serviço" });
    }
  });

  app.get("/api/service-providers/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }
      
      const serviceProvider = await storage.getServiceProvider(id);
      if (!serviceProvider) {
        return res.status(404).json({ error: "Prestador de serviço não encontrado" });
      }
      
      res.json(serviceProvider);
    } catch (error) {
      console.error("Erro ao buscar prestador de serviço:", error);
      res.status(500).json({ error: "Erro ao buscar prestador de serviço" });
    }
  });

  app.post("/api/service-providers", canManageServiceProviders, async (req, res) => {
    try {
      // Validar os dados enviados
      const validatedData = insertServiceProviderSchema.parse(req.body);
      
      // Verificar se já existe um prestador com esse documento
      const existingServiceProvider = await storage.getServiceProviderByDocument(validatedData.document);
      if (existingServiceProvider) {
        return res.status(400).json({ 
          error: "Prestador já cadastrado", 
          message: `Este ${existingServiceProvider.documentType === 'cpf' ? 'CPF' : 'CNPJ'} já está cadastrado no sistema para o prestador "${existingServiceProvider.name}"`, 
          existingServiceProvider: {
            id: existingServiceProvider.id,
            name: existingServiceProvider.name,
            document: existingServiceProvider.document,
            documentType: existingServiceProvider.documentType
          }
        });
      }
      
      const serviceProvider = await storage.createServiceProvider(validatedData);
      res.status(201).json(serviceProvider);
    } catch (error) {
      console.error("Erro ao criar prestador de serviço:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          error: "Dados inválidos", 
          details: error.errors 
        });
      }
      res.status(500).json({ error: "Erro ao criar prestador de serviço" });
    }
  });

  app.put("/api/service-providers/:id", canManageServiceProviders, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }
      
      // Verificar se o prestador existe
      const serviceProvider = await storage.getServiceProvider(id);
      if (!serviceProvider) {
        return res.status(404).json({ error: "Prestador de serviço não encontrado" });
      }
      
      // Validar os dados enviados
      const validatedData = insertServiceProviderSchema.parse(req.body);
      
      // Verificar se já existe outro prestador com esse documento
      if (validatedData.document !== serviceProvider.document) {
        const existingServiceProvider = await storage.getServiceProviderByDocument(validatedData.document);
        if (existingServiceProvider && existingServiceProvider.id !== id) {
          return res.status(400).json({ 
            error: "Documento já cadastrado", 
            message: `Este ${existingServiceProvider.documentType === 'cpf' ? 'CPF' : 'CNPJ'} já está cadastrado no sistema para o prestador "${existingServiceProvider.name}"`, 
            existingServiceProvider: {
              id: existingServiceProvider.id,
              name: existingServiceProvider.name,
              document: existingServiceProvider.document,
              documentType: existingServiceProvider.documentType
            }
          });
        }
      }
      
      const updatedServiceProvider = await storage.updateServiceProvider(id, validatedData);
      if (!updatedServiceProvider) {
        return res.status(404).json({ error: "Prestador de serviço não encontrado" });
      }
      
      res.json(updatedServiceProvider);
    } catch (error) {
      console.error("Erro ao atualizar prestador de serviço:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          error: "Dados inválidos", 
          details: error.errors 
        });
      }
      res.status(500).json({ error: "Erro ao atualizar prestador de serviço" });
    }
  });

  app.delete("/api/service-providers/:id", canManageServiceProviders, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }
      
      const success = await storage.deleteServiceProvider(id);
      if (!success) {
        return res.status(404).json({ error: "Prestador de serviço não encontrado" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Erro ao excluir prestador de serviço:", error);
      res.status(500).json({ error: "Erro ao excluir prestador de serviço" });
    }
  });

  // ========== Rotas para gerenciamento de vendas ==========
  
  // Rota para listar todas as vendas (com base na permissão do usuário) - com suporte a paginação
  app.get("/api/sales", isAuthenticated, async (req, res) => {
    try {
      // Parâmetros de paginação e filtros opcionais
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const status = req.query.status as string || undefined;
      const financialStatus = req.query.financialStatus as string || undefined;
      const searchTerm = req.query.searchTerm as string || undefined;
      const sortField = req.query.sortField as string || 'createdAt';
      const sortDirection = req.query.sortDirection as 'asc' | 'desc' || 'desc';
      const startDate = req.query.startDate as string || undefined;
      const endDate = req.query.endDate as string || undefined;
      
      // Verificar se existe um parâmetro sellerId na query
      let sellerId = req.query.sellerId ? parseInt(req.query.sellerId as string) : undefined;
      
      // Se não for admin/supervisor/etc, forçar filtro pelo ID do próprio vendedor
      if (!["admin", "supervisor", "operacional", "financeiro"].includes(req.user?.role || "")) {
        sellerId = req.user!.id;
        console.log(`Vendedor ${req.user!.id} visualizando apenas suas vendas`);
      } else {
        console.log(`Usuário com perfil ${req.user?.role} buscando vendas paginadas`);
      }
      
      // Iniciar consulta SQL básica
      const { pool } = await import("./db");
      
      let query = `
        SELECT 
          s.*, 
          c.name as customer_name,
          (
            SELECT COALESCE(SUM(amount::numeric), 0)
            FROM sale_installments
            WHERE sale_id = s.id AND status = 'paid'
          ) as total_paid,
          (
            SELECT COALESCE(SUM(amount::numeric), 0)
            FROM sale_operational_costs
            WHERE sale_id = s.id
          ) as total_costs
        FROM sales s
        LEFT JOIN customers c ON s.customer_id = c.id
        WHERE 1=1
      `;
      
      const params: any[] = [];
      
      // Adicionar filtros à consulta
      if (status) {
        params.push(status);
        query += ` AND s.status = $${params.length}`;
      }
      
      if (financialStatus && financialStatus !== 'all') {
        params.push(financialStatus);
        query += ` AND s.financial_status = $${params.length}`;
      }
      
      if (sellerId) {
        params.push(sellerId);
        query += ` AND s.seller_id = $${params.length}`;
      }
      
      // Busca por termo (número da ordem ou nome do cliente)
      if (searchTerm && searchTerm.trim()) {
        const term = `%${searchTerm.trim().toLowerCase()}%`;
        params.push(term);
        params.push(term);
        query += ` AND (LOWER(s.order_number) LIKE $${params.length-1} OR LOWER(c.name) LIKE $${params.length})`;
      }
      
      // Contar total antes de aplicar paginação
      const countQuery = `SELECT COUNT(*) FROM (${query}) AS count_query`;
      const countResult = await pool.query(countQuery, params);
      const total = parseInt(countResult.rows[0].count);
      
      // Adicionar ordenação à consulta principal
      const fieldMap: Record<string, string> = {
        createdAt: "s.created_at",
        updatedAt: "s.updated_at",
        totalAmount: "s.total_amount",
        orderNumber: "s.order_number",
        customerId: "s.customer_id",
        paymentMethodId: "s.payment_method_id",
        sellerId: "s.seller_id",
        serviceTypeId: "s.service_type_id",
        serviceProviderId: "s.service_provider_id",
        financialStatus: "s.financial_status",
        customerName: "c.name",
        date: "s.date",
        id: "s.id"
      };
      
      const orderField = fieldMap[sortField] || "s.created_at";
      query += ` ORDER BY ${orderField} ${sortDirection.toUpperCase()}`;
      
      // Adicionar paginação
      params.push(limit);
      params.push((page - 1) * limit);
      query += ` LIMIT $${params.length-1} OFFSET $${params.length}`;
      
      // Executar consulta principal
      const result = await pool.query(query, params);
      
      // Mapear resultados para o formato esperado
      const sales = result.rows.map(row => {
        // Converter os valores para números
        const totalAmount = parseFloat(row.total_amount || "0");
        const totalPaid = parseFloat(row.total_paid || "0");
        const totalCosts = parseFloat(row.total_costs || "0");
        
        // Calcular o resultado líquido
        const netResult = totalAmount - totalCosts;
        
        return {
          id: row.id,
          orderNumber: row.order_number,
          customerId: row.customer_id,
          customerName: row.customer_name,
          paymentMethodId: row.payment_method_id,
          sellerId: row.seller_id,
          serviceTypeId: row.service_type_id,
          serviceProviderId: row.service_provider_id,
          totalAmount: row.total_amount,
          installments: row.installments,
          installmentValue: row.installment_value,
          status: row.status,
          financialStatus: row.financial_status,
          notes: row.notes,
          date: row.date,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          // Adicionar resumo financeiro apenas quando solicitado pelo financeiro
          financialSummary: financialStatus !== undefined ? {
            totalPaid,
            totalCosts,
            netResult
          } : undefined
        };
      });
      
      // Calcular total de páginas
      const totalPages = Math.ceil(total / limit) || 1;
      
      console.log(`Retornando ${sales.length} vendas de um total de ${total}`);
      
      // Retornar resultados
      res.json({
        data: sales,
        total,
        page,
        totalPages
      });
    } catch (error) {
      console.error("Erro ao buscar vendas:", error);
      res.status(500).json({ error: "Erro ao buscar vendas" });
    }
  });
  
  // Rota para obter todas as vendas sem paginação (para casos específicos)
  app.get("/api/sales/all", isAuthenticated, async (req, res) => {
    try {
      let sales = [];
      
      // Verificar se existe um parâmetro sellerId na query
      const sellerId = req.query.sellerId ? parseInt(req.query.sellerId as string) : null;
      
      // Se for admin, supervisor, operacional ou financeiro, pode ver todas as vendas
      // OU filtrar por vendedor específico se o sellerId for fornecido
      if (["admin", "supervisor", "operacional", "financeiro"].includes(req.user?.role || "")) {
        if (sellerId) {
          console.log("Filtrando vendas por vendedor específico:", sellerId);
          sales = await storage.getSalesBySellerAndStatus(sellerId, "");
        } else {
          console.log("Buscando todas as vendas - usuário tem permissão total");
          sales = await storage.getSales();
        }
      } else {
        // Se for vendedor, só vê as próprias vendas
        console.log("Vendedor visualizando apenas suas vendas:", req.user!.id);
        sales = await storage.getSalesBySellerAndStatus(req.user!.id, "");
      }
      
      res.json(sales);
    } catch (error) {
      console.error("Erro ao buscar todas as vendas:", error);
      res.status(500).json({ error: "Erro ao buscar todas as vendas" });
    }
  });

  // Rota para obter uma venda específica pelo ID
  app.get("/api/sales/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }
      
      const sale = await storage.getSale(id);
      if (!sale) {
        return res.status(404).json({ error: "Venda não encontrada" });
      }
      
      // Verificar permissão: apenas admin, supervisor, operacional, financeiro ou o próprio vendedor pode ver
      if (!["admin", "supervisor", "operacional", "financeiro"].includes(req.user?.role || "") && 
          sale.sellerId !== req.user!.id) {
        return res.status(403).json({ error: "Permissão negada" });
      }
      
      // Adicionando log para depuração
      console.log(`Usuário ${req.user?.username} (${req.user?.role}) acessando venda #${id} com status: ${sale.status}`);
      
      res.json(sale);
    } catch (error) {
      console.error("Erro ao buscar venda:", error);
      res.status(500).json({ error: "Erro ao buscar venda" });
    }
  });

  // Rota para listar itens de uma venda
  app.get("/api/sales/:id/items", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }
      
      const sale = await storage.getSale(id);
      if (!sale) {
        return res.status(404).json({ error: "Venda não encontrada" });
      }
      
      // Verificar permissão: apenas admin, supervisor, operacional, financeiro ou o próprio vendedor pode ver
      if (!["admin", "supervisor", "operacional", "financeiro"].includes(req.user?.role || "") && 
          sale.sellerId !== req.user!.id) {
        return res.status(403).json({ error: "Permissão negada" });
      }
      
      const items = await storage.getSaleItems(id);
      res.json(items);
    } catch (error) {
      console.error("Erro ao buscar itens da venda:", error);
      res.status(500).json({ error: "Erro ao buscar itens da venda" });
    }
  });

  // Rota para criar uma nova venda
  app.post("/api/sales", isAuthenticated, async (req, res) => {
    try {
      // IMPLEMENTAÇÃO RADICAL DO ZERO (27/04/2025)
      console.log("🔄 IMPLEMENTAÇÃO RADICAL: Iniciando cadastro de venda simplificado");
      
      // 1. Dados essenciais para a venda (usamos diretamente o req.body)
      const { 
        orderNumber, 
        customerId,
        paymentMethodId,
        serviceTypeId,
        sellerId,
        totalAmount,
        installments = 1, // Padrão: 1 parcela
        installmentDates = [], // Array de datas de vencimento (formato string: YYYY-MM-DD)
        notes,
        items = []
      } = req.body;

      console.log("🔄 IMPLEMENTAÇÃO RADICAL: Dados de venda recebidos:", {
        orderNumber,
        customerId,
        installments,
        installmentDates
      });

      // 2. Validar dados mínimos necessários
      if (!customerId || !serviceTypeId) {
        return res.status(400).json({ 
          error: "Dados incompletos", 
          message: "Cliente e tipo de serviço são obrigatórios" 
        });
      }

      // 3. Determinar o vendedor (atual ou especificado)
      const effectiveSellerId = (
        (["admin", "supervisor", "operacional", "financeiro"].includes(req.user?.role || "") && sellerId) 
          ? sellerId 
          : req.user!.id
      );

      // 4. Preparar o objeto para inserção no banco (SEM ZOD)
      const saleData = {
        orderNumber: orderNumber || `OS-${Date.now()}`, // Gerar número de ordem se não fornecido
        date: new Date(), // Usar sempre um objeto Date para a data da venda
        customerId,
        paymentMethodId: paymentMethodId || 1, // Valor padrão
        serviceTypeId,
        sellerId: effectiveSellerId,
        installments: Number(installments),
        totalAmount: totalAmount ? String(totalAmount).replace(',', '.') : "0",
        status: "pending",
        financialStatus: "pending",
        notes: notes || ""
      };

      console.log("🔄 IMPLEMENTAÇÃO RADICAL: Objeto de venda preparado:", saleData);

      // 5. INSERÇÃO MANUAL DIRETO NO BANCO para evitar problemas com tipos
      let createdSale;
      try {
        const { pool } = await import('./db');
        const insertResult = await pool.query(`
          INSERT INTO sales (
            order_number, date, customer_id, payment_method_id, service_type_id, 
            seller_id, installments, total_amount, status, financial_status, notes, 
            created_at, updated_at
          ) 
          VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW()
          )
          RETURNING *
        `, [
          saleData.orderNumber,
          saleData.date,
          saleData.customerId,
          saleData.paymentMethodId,
          saleData.serviceTypeId,
          saleData.sellerId,
          saleData.installments,
          saleData.totalAmount,
          saleData.status,
          saleData.financialStatus,
          saleData.notes
        ]);

        createdSale = insertResult.rows[0];
        console.log("🔄 IMPLEMENTAÇÃO RADICAL: Venda criada via SQL direto:", createdSale);
      } catch (dbError) {
        console.error("🔄 IMPLEMENTAÇÃO RADICAL: Erro ao inserir venda:", dbError);
        return res.status(500).json({ error: "Erro ao salvar venda no banco de dados" });
      }

      // 6. Criar itens da venda
      if (items && Array.isArray(items) && items.length > 0) {
        for (const item of items) {
          try {
            const { pool } = await import('./db');
            await pool.query(`
              INSERT INTO sale_items (
                sale_id, service_id, service_type_id, quantity, price, 
                total_price, notes, status, created_at
              ) 
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
            `, [
              createdSale.id,
              item.serviceId,
              item.serviceTypeId || saleData.serviceTypeId,
              item.quantity || 1,
              item.price || "0",
              item.totalPrice || item.price || "0",
              item.notes || null,
              "pending"
            ]);
          } catch (itemError) {
            console.error("🔄 IMPLEMENTAÇÃO RADICAL: Erro ao criar item:", itemError);
          }
        }
      }

      // 7. CRIAÇÃO RADICAL DE PARCELAS - simplicidade máxima
      try {
        const { pool } = await import('./db');
        
        // Determinar número real de parcelas
        const numInstallments = Math.max(1, Number(installments));
        console.log(`🔄 IMPLEMENTAÇÃO RADICAL: Criando ${numInstallments} parcelas`);
        
        // Calcular valor por parcela (dividir igualmente)
        const totalValue = parseFloat(saleData.totalAmount);
        const installmentValue = (totalValue / numInstallments).toFixed(2);
        
        // Usar as datas fornecidas ou gerar automaticamente
        let installmentDatesToUse = [];
        
        if (installmentDates && Array.isArray(installmentDates) && installmentDates.length === numInstallments) {
          // Usar as datas fornecidas pelo frontend
          installmentDatesToUse = installmentDates;
          console.log("🔄 IMPLEMENTAÇÃO RADICAL: Usando datas fornecidas pelo usuário:", installmentDatesToUse);
        } else {
          // Gerar datas mensais a partir de hoje
          const baseDate = new Date();
          for (let i = 0; i < numInstallments; i++) {
            const dueDate = new Date(baseDate);
            dueDate.setMonth(baseDate.getMonth() + i);
            
            // Formatar como YYYY-MM-DD
            const isoDate = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}-${String(dueDate.getDate()).padStart(2, '0')}`;
            installmentDatesToUse.push(isoDate);
          }
          console.log("🔄 IMPLEMENTAÇÃO RADICAL: Datas geradas automaticamente:", installmentDatesToUse);
        }
        
        // Criar cada parcela diretamente usando SQL
        for (let i = 0; i < numInstallments; i++) {
          await pool.query(`
            INSERT INTO sale_installments (
              sale_id, installment_number, due_date, amount, 
              status, notes, created_at, updated_at
            ) 
            VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
          `, [
            createdSale.id,
            i + 1, // Número da parcela (começando em 1)
            installmentDatesToUse[i], // Data de vencimento
            installmentValue, // Valor da parcela
            "pending", // Status inicial
            null // Sem observações iniciais
          ]);
        }
        
        console.log(`🔄 IMPLEMENTAÇÃO RADICAL: ${numInstallments} parcelas criadas com sucesso`);
      } catch (installmentError) {
        console.error("🔄 IMPLEMENTAÇÃO RADICAL: Erro ao criar parcelas:", installmentError);
      }

      // 8. Registrar no histórico
      try {
        const { pool } = await import('./db');
        await pool.query(`
          INSERT INTO sales_status_history (
            sale_id, from_status, to_status, user_id, notes, created_at
          )
          VALUES ($1, $2, $3, $4, $5, NOW())
        `, [
          createdSale.id,
          "",
          "pending",
          req.user!.id,
          "Venda criada"
        ]);
      } catch (historyError) {
        console.error("🔄 IMPLEMENTAÇÃO RADICAL: Erro ao registrar histórico:", historyError);
      }

      // 9. Notificar todos os clientes sobre a atualização da venda
      notifySalesUpdate();
      
      // 10. Retornar a venda completa
      // Buscar a venda com todas as informações atualizadas
      try {
        const { pool } = await import('./db');
        const result = await pool.query(`SELECT * FROM sales WHERE id = $1`, [createdSale.id]);
        if (result.rows.length > 0) {
          res.status(201).json(result.rows[0]);
        } else {
          res.status(201).json(createdSale); // Fallback para o objeto original
        }
      } catch (finalError) {
        // Se der erro ao buscar a venda atualizada, retorna a original mesmo
        res.status(201).json(createdSale);
      }
    } catch (error) {
      console.error("🔄 IMPLEMENTAÇÃO RADICAL: Erro geral ao criar venda:", error);
      
      // TRATAMENTO ULTRA-RADICAL PARA ERROS DE VALIDAÇÃO ZOD (27/04/2025)
      if (error instanceof ZodError) {
        console.log("🚀 ULTRA-RADICAL: Detectado erro Zod, analisando erro específico...");
        
        // Verificar se é um erro de tipo de data
        const dateErrors = error.errors.filter(err => 
          err.path.includes('date') && 
          err.code === 'invalid_type' && 
          err.expected === 'date' && 
          err.received === 'string'
        );
        
        if (dateErrors.length > 0) {
          console.log("🚀 ULTRA-RADICAL: Erro de tipo de data detectado! Tentando correção de emergência...");
          
          try {
            // Fazer uma inserção completamente manual via SQL, ignorando o Zod e o storage
            const { pool } = await import('./db');
            
            // Pegar os dados do corpo original
            const userData = req.body;
            
            // Preparar dados básicos
            const orderNumber = userData.orderNumber || `OS-${Date.now()}`;
            const customerId = userData.customerId;
            const serviceTypeId = userData.serviceTypeId;
            const sellerId = (["admin", "supervisor", "operacional", "financeiro"].includes(req.user?.role || "") && userData.sellerId) 
              ? userData.sellerId 
              : req.user!.id;
            const totalAmount = userData.totalAmount ? String(userData.totalAmount).replace(',', '.') : "0";
            const installments = Number(userData.installments || 1);
            const notes = userData.notes || "";
            
            // SQL ULTRA-DIRETO - Sem absolutamente nenhuma validação
            const insertResult = await pool.query(`
              INSERT INTO sales (
                order_number, date, customer_id, payment_method_id, service_type_id, 
                seller_id, installments, total_amount, status, financial_status, notes, 
                created_at, updated_at
              ) 
              VALUES (
                $1, NOW(), $2, $3, $4, $5, $6, $7, 'pending', 'pending', $8, NOW(), NOW()
              )
              RETURNING *
            `, [
              orderNumber,
              customerId,
              userData.paymentMethodId || 1,
              serviceTypeId,
              sellerId,
              installments,
              totalAmount,
              notes
            ]);
            
            if (insertResult.rows.length > 0) {
              const createdSale = insertResult.rows[0];
              console.log("🚀 ULTRA-RADICAL: Venda criada com sucesso via SQL de emergência:", createdSale);
              
              // Criar parcelas
              if (installments > 1) {
                // Calcular valor da parcela
                const totalValue = parseFloat(totalAmount);
                const installmentValue = (totalValue / installments).toFixed(2);
                
                // Usar as datas fornecidas ou gerar automaticamente
                const installmentDates = userData.installmentDates && 
                  Array.isArray(userData.installmentDates) && 
                  userData.installmentDates.length === installments 
                    ? userData.installmentDates 
                    : Array.from({ length: installments }, (_, i) => {
                        const date = new Date();
                        date.setMonth(date.getMonth() + i);
                        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                      });
                
                // Criar parcelas uma a uma
                for (let i = 0; i < installments; i++) {
                  await pool.query(`
                    INSERT INTO sale_installments (
                      sale_id, installment_number, due_date, amount, 
                      status, notes, created_at, updated_at
                    ) 
                    VALUES ($1, $2, $3, $4, 'pending', NULL, NOW(), NOW())
                  `, [
                    createdSale.id,
                    i + 1,
                    installmentDates[i],
                    installmentValue
                  ]);
                }
                
                console.log(`🚀 ULTRA-RADICAL: ${installments} parcelas criadas com sucesso`);
              }
              
              // Criar itens
              if (userData.items && Array.isArray(userData.items)) {
                for (const item of userData.items) {
                  if (item.serviceId) {
                    await pool.query(`
                      INSERT INTO sale_items (
                        sale_id, service_id, service_type_id, quantity, price, 
                        total_price, notes, status, created_at
                      ) 
                      VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', NOW())
                    `, [
                      createdSale.id,
                      item.serviceId,
                      item.serviceTypeId || serviceTypeId,
                      item.quantity || 1,
                      item.price || "0",
                      item.totalPrice || item.price || "0",
                      item.notes || null
                    ]);
                  }
                }
              }
              
              // Histórico
              await pool.query(`
                INSERT INTO sales_status_history (
                  sale_id, from_status, to_status, user_id, notes, created_at
                )
                VALUES ($1, '', 'pending', $2, 'Venda criada (emergência)', NOW())
              `, [
                createdSale.id,
                req.user!.id
              ]);
              
              // Notificar
              notifySalesUpdate();
              
              // Retornar sucesso
              return res.status(201).json(createdSale);
            }
          } catch (emergencyError) {
            console.error("🚀 ULTRA-RADICAL: Erro na correção de emergência:", emergencyError);
          }
        }
      }
      
      // Resposta padrão se nenhuma correção específica funcionou
      res.status(500).json({ error: "Erro ao criar venda" });
    }
  });

  // Rota para adicionar um item à venda
  app.post("/api/sales/:id/items", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }
      
      const sale = await storage.getSale(id);
      if (!sale) {
        return res.status(404).json({ error: "Venda não encontrada" });
      }
      
      // Verificar permissão: apenas admin, supervisor, operacional, financeiro ou o próprio vendedor pode adicionar itens
      if (!["admin", "supervisor", "operacional", "financeiro"].includes(req.user?.role || "") && 
          sale.sellerId !== req.user!.id) {
        return res.status(403).json({ error: "Permissão negada" });
      }
      
      // Não permitir adicionar itens a vendas que não estão em status pendente ou devolvida
      if (sale.status !== "pending" && sale.status !== "returned") {
        return res.status(400).json({ 
          error: "Não é possível adicionar itens", 
          message: "Só é possível adicionar itens a vendas com status pendente ou devolvida."
        });
      }
      
      // Validação básica dos dados do item
      const itemData = req.body;
      if (!itemData.serviceId || !itemData.serviceTypeId || !itemData.price) {
        return res.status(400).json({ error: "Dados do item inválidos" });
      }
      
      // Calcular o preço total do item
      const quantity = itemData.quantity || 1;
      const totalPrice = Number(itemData.price) * quantity;
      
      // Criar o item
      const createdItem = await storage.createSaleItem({
        saleId: id,
        serviceId: itemData.serviceId,
        serviceTypeId: itemData.serviceTypeId,
        quantity,
        price: itemData.price.toString(),
        totalPrice: totalPrice.toString(),
        notes: itemData.notes || null,
        status: "pending"
      });
      
      res.status(201).json(createdItem);
    } catch (error) {
      console.error("Erro ao adicionar item à venda:", error);
      res.status(500).json({ error: "Erro ao adicionar item à venda" });
    }
  });

  // Rota especial para atualizar apenas o valor total da venda - solução de emergência
  app.post("/api/sales/:id/update-total", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }
      
      // Verificar se o usuário tem permissão para atualizar vendas
      if (!["admin", "supervisor", "operacional", "financeiro", "vendedor"].includes(req.user?.role || "")) {
        return res.status(403).json({ error: "Permissão negada" });
      }
      
      // Obter o novo valor total
      const { totalAmount } = req.body;
      if (!totalAmount) {
        return res.status(400).json({ error: "Valor total não informado" });
      }
      
      // Formatar o valor para garantir que esteja no formato correto
      const formattedTotal = typeof totalAmount === 'string' 
        ? totalAmount.replace(',', '.') 
        : String(totalAmount);
      
      console.log(`### ATUALIZANDO VALOR TOTAL DA VENDA #${id} para ${formattedTotal} ###`);
      
      // Usar SQL puro para atualizar diretamente o banco de dados
      const { pool } = await import('./db');
      
      // Executar a atualização direta
      const updateResult = await pool.query(
        'UPDATE sales SET total_amount = $1, updated_at = $2 WHERE id = $3 RETURNING *',
        [formattedTotal, new Date(), id]
      );
      
      if (updateResult.rows.length === 0) {
        return res.status(404).json({ error: "Venda não encontrada" });
      }
      
      console.log("Venda após atualização do valor total:", updateResult.rows[0]);
      
      // Notificar todos os clientes sobre a atualização da venda
      notifySalesUpdate();
      
      // Retornar a venda atualizada
      res.json(updateResult.rows[0]);
    } catch (error) {
      console.error("Erro ao atualizar valor total da venda:", error);
      res.status(500).json({ error: "Erro ao atualizar valor total da venda" });
    }
  });
  
  // Rota para atualizar uma venda
  app.patch("/api/sales/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }
      
      const sale = await storage.getSale(id);
      if (!sale) {
        return res.status(404).json({ error: "Venda não encontrada" });
      }
      
      // Verificar permissão: apenas admin, supervisor, operacional, financeiro ou o próprio vendedor pode atualizar
      if (!["admin", "supervisor", "operacional", "financeiro"].includes(req.user?.role || "") && 
          sale.sellerId !== req.user!.id) {
        return res.status(403).json({ error: "Permissão negada" });
      }
      
      // Lógica de permissão para edição baseada no status e no perfil
      if (req.user?.role !== "admin") {
        // Vendedor só pode editar vendas pendentes ou devolvidas para ele
        if (req.user?.role === "vendedor") {
          if (sale.status !== "pending" && sale.status !== "returned") {
            return res.status(400).json({ 
              error: "Não é possível atualizar", 
              message: "Vendedor só pode atualizar vendas pendentes ou devolvidas."
            });
          }
        }
        // Operacional pode editar vendas pendentes e em andamento, mas não concluídas
        else if (req.user?.role === "operacional") {
          if (sale.status === "completed" || sale.status === "canceled") {
            return res.status(400).json({ 
              error: "Não é possível atualizar", 
              message: "Operacional não pode modificar vendas concluídas ou canceladas."
            });
          }
        }
        // Outros perfis (supervisor, financeiro) não podem editar vendas concluídas
        else if (sale.status === "completed") {
          return res.status(400).json({ 
            error: "Não é possível atualizar", 
            message: "Esta venda não pode ser atualizada pois já está concluída."
          });
        }
      }
      
      // Validação dos dados para atualização
      const today = new Date(); // Obter a data atual
      
      // Processamento da data
      let saleDate = today; // Por padrão, usamos a data de hoje
      
      if (req.body.date) {
        if (typeof req.body.date === 'string') {
          // Se for string, convertemos para Date
          saleDate = new Date(req.body.date);
          
          // Verificamos se a data é válida
          if (isNaN(saleDate.getTime())) {
            saleDate = today; // Se for inválida, usamos hoje
          }
        } else {
          // Se já for um objeto Date, usamos diretamente
          saleDate = req.body.date;
        }
      }
      
      // Validação robusta de installments na atualização
      if (req.body.installments !== undefined) {
        const rawInstallmentsValue = req.body.installments;
        let parsedInstallments = 1; // Valor padrão seguro
        
        console.log(`⚠️ PATCH - Valor bruto de parcelas: [${rawInstallmentsValue}], tipo: ${typeof rawInstallmentsValue}`);
        
        if (rawInstallmentsValue !== null) {
          if (typeof rawInstallmentsValue === 'number') {
            parsedInstallments = Math.floor(rawInstallmentsValue); // Garantir que seja um inteiro
          } else if (typeof rawInstallmentsValue === 'string') {
            const parsed = parseInt(rawInstallmentsValue, 10);
            if (!isNaN(parsed)) {
              parsedInstallments = parsed;
            }
          }
        }
        
        // Garantir valor válido
        if (parsedInstallments < 1) {
          parsedInstallments = 1;
        }
        
        console.log(`⚠️ PATCH - Valor final validado para installments: ${parsedInstallments}`);
        req.body.installments = parsedInstallments;
      }
      
      // Se a data for null ou undefined, usar a data processada
      const dataToValidate = {
        ...req.body,
        date: saleDate
      };
      
      const saleData = insertSaleSchema.partial().parse(dataToValidate);
      
      // Se estiver tentando alterar o número da ordem de serviço, verificar se já não existe outro
      if (saleData.orderNumber && saleData.orderNumber !== sale.orderNumber) {
        const existingSale = await storage.getSaleByOrderNumber(saleData.orderNumber);
        if (existingSale && existingSale.id !== id) {
          return res.status(400).json({
            error: "Número de ordem de serviço já utilizado",
            message: "Este número de ordem de serviço já está cadastrado no sistema."
          });
        }
      }
      
      // Registrar no histórico se houver mudança de status
      if (saleData.status && saleData.status !== sale.status) {
        await storage.createSalesStatusHistory({
          saleId: id,
          fromStatus: sale.status,
          toStatus: saleData.status,
          userId: req.user!.id,
          notes: req.body.notes || "Status atualizado"
        });
      }
      
      // Atualizar a venda
      const updatedSale = await storage.updateSale(id, saleData);
      if (!updatedSale) {
        return res.status(404).json({ error: "Venda não encontrada" });
      }
      
      // Notificar todos os clientes sobre a atualização da venda
      notifySalesUpdate();
      
      res.json(updatedSale);
    } catch (error) {
      console.error("Erro ao atualizar venda:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          error: "Dados inválidos", 
          details: error.errors 
        });
      }
      res.status(500).json({ error: "Erro ao atualizar venda" });
    }
  });

  // Rota especial para administração - limpar todas as vendas
  app.delete("/api/admin/clear-sales", isAuthenticated, async (req, res) => {
    try {
      // Verificar se é um administrador
      if (req.user?.role !== "admin" && req.user?.role !== "operacional") {
        return res.status(403).json({ error: "Permissão negada. Apenas administradores podem executar esta operação." });
      }
      
      console.log("⚠️ ATENÇÃO: Excluindo todas as vendas do banco de dados...");
      
      // Usar SQL puro para maior eficiência
      const { pool } = await import('./db');
      
      // Limpar um por um, em ordem para evitar problemas de chave estrangeira
      console.log("1. Excluindo comprovantes de pagamento...");
      await pool.query('DELETE FROM sale_payment_receipts');
      
      console.log("2. Excluindo custos operacionais...");
      await pool.query('DELETE FROM sale_operational_costs');
      
      console.log("3. Excluindo itens de vendas...");
      await pool.query('DELETE FROM sale_items');
      
      console.log("4. Excluindo histórico de status...");
      await pool.query('DELETE FROM sales_status_history');
      
      console.log("5. Excluindo parcelas...");
      await pool.query('DELETE FROM sale_installments');
      
      console.log("6. Excluindo vendas...");
      // Remover as vendas
      const result = await pool.query('DELETE FROM sales RETURNING *');
      
      console.log(`Exclusão finalizada com sucesso: ${result.rowCount} vendas removidas.`);
      
      // Notificar todos os clientes sobre a atualização da venda
      notifySalesUpdate();
      
      return res.status(200).json({ 
        message: "Todas as vendas foram excluídas com sucesso",
        count: result.rowCount
      });
    } catch (error) {
      console.error("Erro ao limpar vendas:", error);
      return res.status(500).json({ error: "Erro ao limpar vendas" });
    }
  });
  
  // Rota para popular o banco com 30 vendas (apenas admin)
  app.post("/api/populate-sales", isAuthenticated, async (req, res) => {
    try {
      // Verificar se o usuário é administrador
      if (req.user.role !== 'admin') {
        return res.status(403).json({ 
          error: "Permissão negada", 
          message: "Apenas administradores podem executar esta operação"
        });
      }
      
      const { populateSales } = await import("../populate-sales");
      const result = await populateSales();
      
      // Notificar todos os clientes sobre a atualização das vendas
      notifySalesUpdate();
      
      return res.status(200).json(result);
    } catch (error) {
      console.error("Erro ao popular vendas:", error);
      return res.status(500).json({ error: "Erro ao popular vendas", details: error.message });
    }
  });

  // Rota para excluir uma venda
  app.delete("/api/sales/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }
      
      const sale = await storage.getSale(id);
      if (!sale) {
        return res.status(404).json({ error: "Venda não encontrada" });
      }
      
      // Apenas admin pode excluir vendas
      if (req.user?.role !== "admin") {
        return res.status(403).json({ error: "Permissão negada. Apenas administradores podem excluir vendas." });
      }
      
      const success = await storage.deleteSale(id);
      if (!success) {
        return res.status(404).json({ error: "Venda não encontrada" });
      }
      
      // Notificar todos os clientes sobre a atualização da venda
      notifySalesUpdate();
      
      res.status(204).end();
    } catch (error) {
      console.error("Erro ao excluir venda:", error);
      res.status(500).json({ error: "Erro ao excluir venda" });
    }
  });

  // Rota para atualizar o tipo de execução quando a venda estiver em andamento
  app.post("/api/sales/:id/update-execution-type", canManageSaleOperations, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }
      
      const sale = await storage.getSale(id);
      if (!sale) {
        return res.status(404).json({ error: "Venda não encontrada" });
      }
      
      // Verificar se a venda está no status correto para atualizar tipo de execução
      if (sale.status !== "in_progress") {
        return res.status(400).json({ 
          error: "Não é possível atualizar tipo de execução", 
          message: "Só é possível atualizar o tipo de execução de vendas com status em andamento."
        });
      }
      
      // Extrair informações do corpo da requisição
      const { serviceTypeId, serviceProviderId } = req.body;
      
      // Validar tipo de serviço se fornecido
      if (serviceTypeId !== undefined) {
        const serviceTypeIdNum = parseInt(serviceTypeId);
        if (isNaN(serviceTypeIdNum)) {
          return res.status(400).json({ error: "ID do tipo de serviço inválido" });
        }
        
        // Verificar se o tipo de serviço existe
        const serviceType = await storage.getServiceType(serviceTypeIdNum);
        if (!serviceType) {
          return res.status(400).json({ error: "Tipo de serviço não encontrado" });
        }
        
        // Se o tipo de serviço for SINDICATO, é obrigatório informar o prestador parceiro
        if (serviceType.name === "SINDICATO" && !serviceProviderId) {
          return res.status(400).json({ 
            error: "Prestador parceiro obrigatório", 
            message: "Para execução via SINDICATO, é necessário informar o prestador parceiro"
          });
        }
      }
      
      // Validar prestador de serviço se fornecido
      if (serviceProviderId !== undefined) {
        const serviceProviderIdNum = parseInt(serviceProviderId);
        if (isNaN(serviceProviderIdNum)) {
          return res.status(400).json({ error: "ID do prestador de serviço inválido" });
        }
        
        // Verificar se o prestador de serviço existe
        const serviceProvider = await storage.getServiceProvider(serviceProviderIdNum);
        if (!serviceProvider) {
          return res.status(400).json({ error: "Prestador de serviço não encontrado" });
        }
        
        if (!serviceProvider.active) {
          return res.status(400).json({ 
            error: "Prestador inativo", 
            message: "O prestador de serviço selecionado está inativo"
          });
        }
      }
      
      // Preparar dados para atualização
      const updateData: Partial<InsertSale> = {};
      
      // Adicionar o tipo de serviço se fornecido
      if (serviceTypeId) {
        // @ts-ignore - O type está correto mas o TypeScript não reconhece pois foi adicionado dinamicamente
        updateData.serviceTypeId = parseInt(serviceTypeId);
      }
      
      // Adicionar o prestador de serviço parceiro se fornecido
      if (serviceProviderId) {
        // @ts-ignore - O type está correto mas o TypeScript não reconhece pois foi adicionado dinamicamente
        updateData.serviceProviderId = parseInt(serviceProviderId);
      }
      
      // Atualizar a venda
      const updatedSale = await storage.updateSale(id, updateData);
      
      if (!updatedSale) {
        return res.status(404).json({ error: "Venda não encontrada" });
      }
      
      // Registrar no histórico a atualização do tipo de execução
      let notesText = "Atualização do tipo de execução";
      if (serviceTypeId) {
        const serviceType = await storage.getServiceType(parseInt(serviceTypeId));
        if (serviceType) {
          notesText += ` para ${serviceType.name}`;
        }
      }
      
      await storage.createSalesStatusHistory({
        saleId: id,
        fromStatus: sale.status,
        toStatus: sale.status, // Mantém o mesmo status
        userId: req.user!.id,
        notes: notesText
      });
      
      // Notificar todos os clientes sobre a atualização da venda
      notifySalesUpdate();
      
      res.json(updatedSale);
    } catch (error) {
      console.error("Erro ao atualizar tipo de execução da venda:", error);
      res.status(500).json({ error: "Erro ao atualizar tipo de execução da venda" });
    }
  });

  // Rota para iniciar a execução de uma venda (setor operacional)
  app.post("/api/sales/:id/start-execution", canManageSaleOperations, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }
      
      const sale = await storage.getSale(id);
      if (!sale) {
        return res.status(404).json({ error: "Venda não encontrada" });
      }
      
      // Verificar se a venda está no status correto para iniciar execução
      if (sale.status !== "pending" && sale.status !== "corrected") {
        return res.status(400).json({ 
          error: "Não é possível iniciar execução", 
          message: "Só é possível iniciar a execução de vendas com status pendente ou corrigidas."
        });
      }
      
      // Extrair informações do corpo da requisição
      const { serviceTypeId, serviceProviderId } = req.body;
      
      // Validar tipo de serviço se fornecido
      if (serviceTypeId !== undefined) {
        const serviceTypeIdNum = parseInt(serviceTypeId);
        if (isNaN(serviceTypeIdNum)) {
          return res.status(400).json({ error: "ID do tipo de serviço inválido" });
        }
        
        // Verificar se o tipo de serviço existe
        const serviceType = await storage.getServiceType(serviceTypeIdNum);
        if (!serviceType) {
          return res.status(400).json({ error: "Tipo de serviço não encontrado" });
        }
        
        // Se o tipo de serviço for SINDICATO, é obrigatório informar o prestador parceiro
        if (serviceType.name === "SINDICATO" && !serviceProviderId) {
          return res.status(400).json({ 
            error: "Prestador parceiro obrigatório", 
            message: "Para execução via SINDICATO, é necessário informar o prestador parceiro"
          });
        }
      }
      
      // Validar prestador de serviço se fornecido
      if (serviceProviderId !== undefined) {
        const serviceProviderIdNum = parseInt(serviceProviderId);
        if (isNaN(serviceProviderIdNum)) {
          return res.status(400).json({ error: "ID do prestador de serviço inválido" });
        }
        
        // Verificar se o prestador de serviço existe
        const serviceProvider = await storage.getServiceProvider(serviceProviderIdNum);
        if (!serviceProvider) {
          return res.status(400).json({ error: "Prestador de serviço não encontrado" });
        }
        
        if (!serviceProvider.active) {
          return res.status(400).json({ 
            error: "Prestador inativo", 
            message: "O prestador de serviço selecionado está inativo"
          });
        }
      }
      
      // Iniciar execução da venda com os possíveis novos valores
      const updatedSale = await storage.markSaleInProgress(
        id, 
        req.user!.id,
        serviceTypeId ? parseInt(serviceTypeId) : undefined,
        serviceProviderId ? parseInt(serviceProviderId) : undefined
      );
      
      if (!updatedSale) {
        return res.status(404).json({ error: "Venda não encontrada" });
      }
      
      // Notificar todos os clientes sobre a atualização da venda
      notifySalesUpdate();
      
      res.json(updatedSale);
    } catch (error) {
      console.error("Erro ao iniciar execução da venda:", error);
      res.status(500).json({ error: "Erro ao iniciar execução da venda" });
    }
  });

  // Rota para concluir a execução de uma venda (setor operacional)
  app.post("/api/sales/:id/complete-execution", canManageSaleOperations, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }
      
      const sale = await storage.getSale(id);
      if (!sale) {
        return res.status(404).json({ error: "Venda não encontrada" });
      }
      
      // Verificar se a venda está no status correto para concluir execução
      if (sale.status !== "in_progress") {
        return res.status(400).json({ 
          error: "Não é possível concluir execução", 
          message: "Só é possível concluir a execução de vendas que estão em andamento."
        });
      }
      
      // Concluir execução da venda
      const updatedSale = await storage.completeSaleExecution(id, req.user!.id);
      if (!updatedSale) {
        return res.status(404).json({ error: "Venda não encontrada" });
      }
      
      // Notificar todos os clientes sobre a atualização da venda
      notifySalesUpdate();
      
      res.json(updatedSale);
    } catch (error) {
      console.error("Erro ao concluir execução da venda:", error);
      res.status(500).json({ error: "Erro ao concluir execução da venda" });
    }
  });

  // Rota para devolver uma venda para correção (operacional para vendedor)
  app.post("/api/sales/:id/return", canManageSaleOperations, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }
      
      // Verificar se foi informado o motivo da devolução
      const { reason } = req.body;
      if (!reason) {
        return res.status(400).json({ error: "É necessário informar o motivo da devolução" });
      }
      
      const sale = await storage.getSale(id);
      if (!sale) {
        return res.status(404).json({ error: "Venda não encontrada" });
      }
      
      // Verificar se a venda está no status correto para ser devolvida
      if (sale.status !== "pending" && sale.status !== "in_progress" && sale.status !== "corrected") {
        return res.status(400).json({ 
          error: "Não é possível devolver a venda", 
          message: "Só é possível devolver vendas que estão pendentes, em andamento ou corrigidas aguardando operacional."
        });
      }
      
      // Devolver a venda
      const updatedSale = await storage.returnSaleToSeller(id, req.user!.id, reason);
      if (!updatedSale) {
        return res.status(404).json({ error: "Venda não encontrada" });
      }
      
      // Notificar todos os clientes sobre a atualização da venda
      notifySalesUpdate();
      
      res.json(updatedSale);
    } catch (error) {
      console.error("Erro ao devolver venda:", error);
      res.status(500).json({ error: "Erro ao devolver venda" });
    }
  });

  // Rota para marcar uma venda devolvida como corrigida (supervisor)
  app.post("/api/sales/:id/mark-as-corrected", canManageSaleOperations, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }
      
      // Verificar se a venda existe
      const sale = await storage.getSale(id);
      if (!sale) {
        return res.status(404).json({ error: "Venda não encontrada" });
      }
      
      // Verificar se a venda está no status 'returned'
      if (sale.status !== "returned") {
        return res.status(400).json({ 
          error: "Status inválido", 
          message: "Apenas vendas que foram devolvidas podem ser marcadas como corrigidas"
        });
      }
      
      // Atualizar o status para 'corrected'
      const updatedSale = await storage.updateSale(id, {
        status: "corrected",
      });
      
      if (!updatedSale) {
        return res.status(404).json({ error: "Venda não encontrada" });
      }
      
      // Registrar no histórico de status
      await storage.createSalesStatusHistory({
        saleId: id,
        userId: req.user!.id,
        fromStatus: "returned",
        toStatus: "corrected",
        notes: "Venda marcada como corrigida pelo supervisor"
      });
      
      // Notificar todos os clientes sobre a atualização da venda
      notifySalesUpdate();
      
      res.json(updatedSale);
    } catch (error) {
      console.error("Erro ao marcar venda como corrigida:", error);
      res.status(500).json({ error: "Erro ao marcar venda como corrigida" });
    }
  });

  // Rota para reenviar uma venda corrigida (de vendedor para operacional)
  app.post("/api/sales/:id/resend", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }
      
      const sale = await storage.getSale(id);
      if (!sale) {
        return res.status(404).json({ error: "Venda não encontrada" });
      }
      
      // Verificar permissão: vendedor responsável, admin ou supervisor podem reenviar
      if (req.user?.role !== "admin" && req.user?.role !== "supervisor" && sale.sellerId !== req.user!.id) {
        return res.status(403).json({ 
          error: "Permissão negada", 
          message: "Apenas o vendedor responsável, administradores ou supervisores podem reenviar a venda."
        });
      }
      
      // Verificar se a venda está no status devolvida
      if (sale.status !== "returned") {
        return res.status(400).json({ 
          error: "Não é possível reenviar", 
          message: "Só é possível reenviar vendas que foram devolvidas para correção."
        });
      }
      
      // Obter mensagem de correção (para vendedor é obrigatório)
      const { notes } = req.body;
      
      // Se for vendedor, a mensagem é obrigatória
      if (req.user!.role === "vendedor" && (!notes || notes.trim() === "")) {
        return res.status(400).json({ 
          error: "Dados inválidos", 
          message: "É necessário informar as correções realizadas ao reenviar a venda."
        });
      }
      
      const notesMessage = notes || "Venda corrigida e reenviada para operacional";
      
      // Função para formatar a data atual
      const dataAtual = format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR });
      
      // Formatar o histórico de correções
      let notesWithHistory = notesMessage;
      if (sale.notes) {
        if (sale.notes.includes('Histórico de correções:')) {
          // Já existe um histórico, vamos adicionar a nova correção
          notesWithHistory = `${sale.notes}\n\n[${dataAtual}] ${notesMessage}`;
        } else {
          // Ainda não há histórico formatado, vamos criá-lo
          notesWithHistory = `${sale.notes}\n\n==== Histórico de correções: ====\n[${dataAtual}] ${notesMessage}`;
        }
      } else {
        // Primeira correção
        notesWithHistory = `==== Histórico de correções: ====\n[${dataAtual}] ${notesMessage}`;
      }
      
      // Atualizar status para "corrigida aguardando operacional"
      const updatedSale = await storage.updateSale(id, { 
        status: "corrected",
        returnReason: null,
        notes: notesWithHistory
      });
      
      if (!updatedSale) {
        return res.status(404).json({ error: "Venda não encontrada" });
      }
      
      // Registrar no histórico de status
      await storage.createSalesStatusHistory({
        saleId: id,
        fromStatus: "returned",
        toStatus: "corrected",
        userId: req.user!.id,
        notes: notesMessage
      });
      
      // Notificar todos os clientes sobre a atualização da venda
      notifySalesUpdate();
      
      res.json(updatedSale);
    } catch (error) {
      console.error("Erro ao reenviar venda:", error);
      res.status(500).json({ error: "Erro ao reenviar venda" });
    }
  });

  // Rota para marcar uma venda como paga (setor financeiro)
  app.post("/api/sales/:id/mark-paid", canManageSaleFinancials, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }
      
      const sale = await storage.getSale(id);
      if (!sale) {
        return res.status(404).json({ error: "Venda não encontrada" });
      }
      
      // Verificar se a venda já foi concluída
      if (sale.status !== "completed") {
        return res.status(400).json({ 
          error: "Não é possível marcar como paga", 
          message: "Só é possível marcar como paga vendas que já foram concluídas."
        });
      }
      
      // Marcar como paga
      const updatedSale = await storage.markSaleAsPaid(id, req.user!.id);
      if (!updatedSale) {
        return res.status(404).json({ error: "Venda não encontrada" });
      }
      
      // Notificar todos os clientes sobre a atualização da venda
      notifySalesUpdate();
      
      res.json(updatedSale);
    } catch (error) {
      console.error("Erro ao marcar venda como paga:", error);
      res.status(500).json({ error: "Erro ao marcar venda como paga" });
    }
  });

  // Rota para obter o histórico de status de uma venda
  app.get("/api/sales/:id/history", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }
      
      const sale = await storage.getSale(id);
      if (!sale) {
        return res.status(404).json({ error: "Venda não encontrada" });
      }
      
      // Todos os usuários autenticados podem ver o histórico de qualquer venda
      // A verificação de autenticação já é feita pelo middleware isAuthenticated
      
      const history = await storage.getSalesStatusHistory(id);
      console.log(`Retornando histórico da venda #${id}: ${history.length} registros`);
      res.json(history);
    } catch (error) {
      console.error("Erro ao buscar histórico da venda:", error);
    }
  });
  
  // Rota de compatibilidade para a API antiga - redireciona para a nova rota
  app.get("/api/sales/:id/status-history", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }
      
      console.log(`Recebida solicitação na rota legada /status-history para venda #${id}, redirecionando para /history`);
      const sale = await storage.getSale(id);
      if (!sale) {
        return res.status(404).json({ error: "Venda não encontrada" });
      }
      
      const history = await storage.getSalesStatusHistory(id);
      res.json(history);
    } catch (error) {
      console.error("Erro ao buscar histórico da venda:", error);
      res.status(500).json({ error: "Erro ao buscar histórico da venda" });
    }
  });
  
  // Rota para buscar as parcelas de uma venda
  app.get("/api/sales/:id/installments", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }
      
      const sale = await storage.getSale(id);
      if (!sale) {
        return res.status(404).json({ error: "Venda não encontrada" });
      }
      
      console.log(`Buscando parcelas para venda #${id}, número de parcelas na venda: ${sale.installments}`);
      
      // SOLUÇÃO DEFINITIVA SIMPLIFICADA: Buscar direto do banco com SQL puro
      try {
        const { pool } = await import('./db');
        
        // Query SQL simples que recupera todas as parcelas para a venda
        const sql = `
          SELECT 
            id, 
            sale_id AS "saleId", 
            installment_number AS "installmentNumber", 
            amount, 
            due_date AS "dueDate", 
            payment_date AS "paymentDate", 
            status, 
            notes, 
            created_at AS "createdAt", 
            updated_at AS "updatedAt"
          FROM 
            sale_installments 
          WHERE 
            sale_id = $1 
          ORDER BY 
            installment_number
        `;
        
        console.log(`🔵 Buscando parcelas via SQL direto para venda #${id}`);
        const result = await pool.query(sql, [id]);
        const installments = result.rows;
        
        console.log(`🔵 Encontradas ${installments.length} parcelas para a venda #${id}`);
        
        // Se encontrou parcelas, retorna elas
        if (installments.length > 0) {
          console.log("🔵 Retornando parcelas encontradas no banco");
          return res.json(installments);
        }
        
        // Se não encontrou parcelas, criar conforme necessário
        if (sale.installments > 1) {
          console.log(`🔵 Venda #${id} deveria ter ${sale.installments} parcelas, mas não tem parcelas no banco. Criando parcelas.`);
          
          // Calcular o valor de cada parcela
          const totalAmount = parseFloat(sale.totalAmount);
          const numInstallments = sale.installments;
          const installmentValue = (totalAmount / numInstallments).toFixed(2);
          
          // Criar parcelas para essa venda
          const today = new Date();
          const installmentsToCreate = [];
          
          for (let i = 1; i <= numInstallments; i++) {
            // Definir data de vencimento (30 dias após o mês anterior)
            const dueDate = new Date(today);
            dueDate.setMonth(today.getMonth() + (i - 1));
            const formattedDueDate = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}-${String(dueDate.getDate()).padStart(2, '0')}`;
            
            installmentsToCreate.push({
              saleId: id,
              installmentNumber: i,
              amount: installmentValue,
              dueDate: formattedDueDate,
              status: "pending",
              paymentDate: null
            });
          }
          
          console.log(`🔵 Criando ${installmentsToCreate.length} parcelas automaticamente`);
          
          // Inserir direto no banco via SQL
          let insertQuery = 'INSERT INTO sale_installments (sale_id, installment_number, amount, due_date, status) VALUES ';
          const queryParams = [];
          let paramCount = 1;
          
          installmentsToCreate.forEach((installment, index) => {
            if (index > 0) {
              insertQuery += ", ";
            }
            
            insertQuery += `($${paramCount++}, $${paramCount++}, $${paramCount++}, $${paramCount++}, $${paramCount++})`;
            
            queryParams.push(
              installment.saleId,
              installment.installmentNumber,
              installment.amount,
              installment.dueDate,
              installment.status
            );
          });
          
          insertQuery += ' RETURNING *';
          
          console.log(`🔵 Executando query SQL para criar parcelas`);
          const createResult = await pool.query(insertQuery, queryParams);
          const createdInstallments = createResult.rows;
          
          console.log(`🔵 ${createdInstallments.length} parcelas criadas com sucesso`);
          
          // Transformar os resultados para o formato esperado
          const formattedInstallments = createdInstallments.map(row => ({
            id: row.id,
            saleId: row.sale_id,
            installmentNumber: row.installment_number,
            amount: row.amount,
            dueDate: row.due_date || null, // Preservar exatamente como está no banco
            paymentDate: row.payment_date || null, // Preservar exatamente como está no banco
            status: row.status,
            notes: row.notes,
            createdAt: row.created_at,
            updatedAt: row.updated_at
          }));
          
          return res.json(formattedInstallments);
        } 
        // Se a venda for à vista (1 parcela) e não tiver parcelas no banco, criar uma parcela
        else if (sale.installments <= 1) {
          console.log(`🔵 Venda #${id} é à vista e não tem parcelas no banco. Criando parcela única.`);
          
          // Inserir direto no banco via SQL
          // Usamos string fixa para evitar conversões automáticas de data
          // Formato: "YYYY-MM-DD" sem qualquer conversão de timezone
          const formattedDate = new Date().toISOString().split('T')[0];
          
          const insertQuery = `
            INSERT INTO sale_installments (sale_id, installment_number, amount, due_date, status) 
            VALUES ($1, $2, $3, $4, $5) 
            RETURNING *
          `;
          
          const result = await pool.query(insertQuery, [
            id,
            1,
            sale.totalAmount || "0",
            formattedDate,
            "pending"
          ]);
          
          if (result.rows.length > 0) {
            console.log(`🔵 Parcela única criada com sucesso para a venda à vista #${id}`);
            
            // Transformar para o formato esperado
            const installment = {
              id: result.rows[0].id,
              saleId: result.rows[0].sale_id,
              installmentNumber: result.rows[0].installment_number,
              amount: result.rows[0].amount,
              dueDate: formattedDate,
              paymentDate: null,
              status: result.rows[0].status,
              notes: result.rows[0].notes,
              createdAt: result.rows[0].created_at,
              updatedAt: result.rows[0].updated_at
            };
            
            return res.json([installment]);
          }
        }
        
        // Se chegou aqui é porque não conseguiu criar as parcelas
        console.error(`🔵 Não foi possível criar parcelas para a venda #${id}`);
        return res.json([]);
      } 
      catch (error) {
        console.error(`🔵 ERRO ao processar parcelas: ${error}`);
        res.status(500).json({ error: "Erro ao processar parcelas da venda" });
      }
    } catch (error) {
      console.error("Erro ao buscar parcelas da venda:", error);
      res.status(500).json({ error: "Erro ao buscar parcelas da venda" });
    }
  });
  
  // Rota para criar parcelas para uma venda
  app.post("/api/sales/:id/installments", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }
      
      const sale = await storage.getSale(id);
      if (!sale) {
        return res.status(404).json({ error: "Venda não encontrada" });
      }
      
      // Validar os dados das parcelas
      if (!Array.isArray(req.body)) {
        return res.status(400).json({ error: "O corpo da requisição deve ser um array de parcelas" });
      }
      
      // Remove parcelas existentes, se houver
      await storage.deleteSaleInstallments(id);
      
      // Prepara os dados das parcelas com o ID da venda
      const installmentsData = req.body.map(item => ({
        saleId: id,
        installmentNumber: item.number || item.installmentNumber,
        amount: item.amount,
        dueDate: item.dueDate,
        status: item.status || 'pending',
        notes: item.notes || null
      }));
      
      console.log(`Criando ${installmentsData.length} parcelas para a venda #${id}`);
      
      // Cria as novas parcelas
      const installments = await storage.createSaleInstallments(installmentsData);
      
      // Emitir evento de atualização
      notifySalesUpdate();
      
      res.status(201).json(installments);
    } catch (error) {
      console.error("Erro ao criar parcelas da venda:", error);
      res.status(500).json({ error: "Erro ao criar parcelas da venda" });
    }
  });

  // === MÓDULO FINANCEIRO ===

  // Rota para buscar custos operacionais de uma venda
  app.get("/api/sales/:id/operational-costs", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }
      
      const sale = await storage.getSale(id);
      if (!sale) {
        return res.status(404).json({ error: "Venda não encontrada" });
      }
      
      const costs = await storage.getSaleOperationalCosts(id);
      res.json(costs);
    } catch (error) {
      console.error("Erro ao buscar custos operacionais:", error);
      res.status(500).json({ error: "Erro ao buscar custos operacionais" });
    }
  });

  // Rota para adicionar um custo operacional a uma venda
  app.post("/api/sales/:id/operational-costs", canManageSaleOperations, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }
      
      const sale = await storage.getSale(id);
      if (!sale) {
        return res.status(404).json({ error: "Venda não encontrada" });
      }
      
      // Extrair dados do corpo da requisição
      const { description, amount, date, notes, serviceProviderId, costTypeId } = req.body;
      
      // A descrição não é mais obrigatória, já que pode ser vazia
      // Apenas garantir que seja uma string no restante do código
      const descriptionText = description || " "; // Usando espaço em branco para evitar NULL no banco
      
      if (!amount || isNaN(parseFloat(amount))) {
        return res.status(400).json({ error: "Valor inválido" });
      }
      
      // Obter o tipo de serviço associado à venda
      let isSindicatoType = false;
      if (sale.serviceTypeId) {
        const serviceType = await storage.getServiceType(sale.serviceTypeId);
        isSindicatoType = serviceType?.name?.toUpperCase() === "SINDICATO";
      }
      
      // Preparar dados do custo
      const costData: any = {
        saleId: id,
        description: descriptionText, // Usando a variável com valor padrão definido acima
        amount: amount.toString(),
        date: date ? date : new Date().toISOString(),
        responsibleId: req.user!.id,
        notes: notes || null,
        costTypeId: costTypeId || null // Incluindo o tipo de custo, pode ser null se não especificado
      };
      
      // Adicionar prestador de serviço se for SINDICATO
      if (isSindicatoType && serviceProviderId) {
        const serviceProviderIdNum = parseInt(serviceProviderId);
        if (!isNaN(serviceProviderIdNum)) {
          costData.serviceProviderId = serviceProviderIdNum;
        }
      }
      
      console.log("Criando custo operacional com dados:", JSON.stringify(costData));
      
      // Criar o custo operacional
      const cost = await storage.createSaleOperationalCost(costData);
      
      // Emitir evento de atualização
      notifySalesUpdate();
      
      res.status(201).json(cost);
    } catch (error) {
      console.error("Erro ao adicionar custo operacional:", error);
      res.status(500).json({ error: "Erro ao adicionar custo operacional" });
    }
  });

  // Rota para atualizar um custo operacional
  app.patch("/api/operational-costs/:id", canManageSaleOperations, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }
      
      const cost = await storage.getSaleOperationalCost(id);
      if (!cost) {
        return res.status(404).json({ error: "Custo operacional não encontrado" });
      }
      
      // Extrair dados do corpo da requisição
      const { description, amount, date, notes } = req.body;
      
      // Preparar dados para atualização
      const updateData: Partial<InsertSaleOperationalCost> = {};
      
      if (description !== undefined) updateData.description = description || " "; // Usando espaço em branco para evitar null
      if (amount !== undefined) updateData.amount = amount.toString();
      if (date !== undefined) updateData.date = date;
      if (notes !== undefined) updateData.notes = notes;
      
      // Atualizar o custo operacional
      const updatedCost = await storage.updateSaleOperationalCost(id, updateData);
      
      // Emitir evento de atualização
      notifySalesUpdate();
      
      res.json(updatedCost);
    } catch (error) {
      console.error("Erro ao atualizar custo operacional:", error);
      res.status(500).json({ error: "Erro ao atualizar custo operacional" });
    }
  });

  // Rota para excluir um custo operacional
  app.delete("/api/operational-costs/:id", canManageSaleOperations, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }
      
      const cost = await storage.getSaleOperationalCost(id);
      if (!cost) {
        return res.status(404).json({ error: "Custo operacional não encontrado" });
      }
      
      const success = await storage.deleteSaleOperationalCost(id);
      
      // Emitir evento de atualização
      notifySalesUpdate();
      
      res.json({ success });
    } catch (error) {
      console.error("Erro ao excluir custo operacional:", error);
      res.status(500).json({ error: "Erro ao excluir custo operacional" });
    }
  });

  // Rota para confirmar pagamento de uma parcela
  app.post("/api/installments/:id/confirm-payment", canManageSaleFinancials, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }
      
      const installment = await storage.getSaleInstallment(id);
      if (!installment) {
        return res.status(404).json({ error: "Parcela não encontrada" });
      }
      
      // Extrair dados do corpo da requisição
      const { paymentDate, receiptType, receiptUrl, receiptData, notes } = req.body;
      
      // Validar data de pagamento
      if (!paymentDate) {
        return res.status(400).json({ error: "Data de pagamento é obrigatória" });
      }
      
      // Validar tipo de comprovante
      if (!receiptType) {
        return res.status(400).json({ error: "Tipo de comprovante é obrigatório" });
      }
      
      // Confirmar pagamento da parcela
      // Enviar a data de pagamento exatamente como recebida do cliente
      // O método confirmInstallmentPayment vai lidar com a formatação correta
      console.log(`🔍 Rota de confirmação de pagamento: Data recebida do cliente: ${paymentDate}`);
      
      const updatedInstallment = await storage.confirmInstallmentPayment(
        id,
        req.user!.id,
        paymentDate, // Passar a data sem conversão adicional
        {
          type: receiptType,
          url: receiptUrl,
          data: receiptData,
          notes
        }
      );
      
      // Emitir evento de atualização
      notifySalesUpdate();
      
      res.json(updatedInstallment);
    } catch (error) {
      console.error("Erro ao confirmar pagamento de parcela:", error);
      res.status(500).json({ error: "Erro ao confirmar pagamento de parcela" });
    }
  });

  // Rota para buscar comprovantes de pagamento de uma parcela
  app.get("/api/installments/:id/payment-receipts", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }
      
      const installment = await storage.getSaleInstallment(id);
      if (!installment) {
        return res.status(404).json({ error: "Parcela não encontrada" });
      }
      
      const receipts = await storage.getSalePaymentReceipts(id);
      res.json(receipts);
    } catch (error) {
      console.error("Erro ao buscar comprovantes de pagamento:", error);
      res.status(500).json({ error: "Erro ao buscar comprovantes de pagamento" });
    }
  });
  
  // Rota para iniciar o processamento financeiro de uma venda
  app.post("/api/sales/:id/process-financial", isAuthenticated, canManageSaleFinancials, async (req, res) => {
    try {
      const saleId = parseInt(req.params.id);
      const { financialId } = req.body;
      
      // Verificar se a venda existe
      const sale = await storage.getSale(saleId);
      if (!sale) {
        return res.status(404).json({ error: "Venda não encontrada" });
      }
      
      // Verificar se a venda já está em processo financeiro
      if (sale.financialStatus !== 'pending') {
        return res.status(400).json({ error: "Esta venda não está no status financeiro pendente" });
      }
      
      // Atualizar o status financeiro e o responsável financeiro
      const updatedSale = await storage.updateSale(saleId, {
        financialStatus: 'in_progress',
        responsibleFinancialId: financialId
      });
      
      // Registrar a atualização no histórico de status
      await storage.createSalesStatusHistory({
        saleId,
        userId: financialId,
        fromStatus: 'pending',
        toStatus: 'in_progress',
        notes: "Iniciada tratativa financeira"
      });
      
      // Notificar via WebSocket sobre a mudança
      notifySalesUpdate();
      
      res.json(updatedSale);
    } catch (error) {
      console.error("Erro ao iniciar processamento financeiro:", error);
      res.status(500).json({ error: "Erro ao iniciar processamento financeiro" });
    }
  });
  
  // Rota para finalizar o processamento financeiro de uma venda
  app.post("/api/sales/:id/complete-financial", isAuthenticated, canManageSaleFinancials, async (req, res) => {
    try {
      const saleId = parseInt(req.params.id);
      const { financialId } = req.body;
      
      // Verificar se a venda existe
      const sale = await storage.getSale(saleId);
      if (!sale) {
        return res.status(404).json({ error: "Venda não encontrada" });
      }
      
      // Verificar se a venda está em processo financeiro
      if (sale.financialStatus !== 'in_progress') {
        return res.status(400).json({ error: "Esta venda não está em processamento financeiro" });
      }
      
      // Verificar se todas as parcelas estão pagas
      const installments = await storage.getSaleInstallments(saleId);
      const allPaid = installments.length > 0 && installments.every(inst => inst.status === 'paid');
      
      if (!allPaid) {
        return res.status(400).json({ error: "Não é possível finalizar - existem parcelas pendentes" });
      }
      
      // Atualizar o status financeiro da venda
      const updatedSale = await storage.updateSale(saleId, {
        financialStatus: 'completed'
      });
      
      // Registrar a atualização no histórico de status
      await storage.createSalesStatusHistory({
        saleId,
        userId: financialId,
        fromStatus: 'in_progress',
        toStatus: 'completed',
        notes: "Finalizada tratativa financeira"
      });
      
      // Notificar via WebSocket sobre a mudança
      notifySalesUpdate();
      
      res.json(updatedSale);
    } catch (error) {
      console.error("Erro ao finalizar processamento financeiro:", error);
      res.status(500).json({ error: "Erro ao finalizar processamento financeiro" });
    }
  });

  // Rotas para tipos de custo operacional
  // GET - Listar todos os tipos de custo
  app.get("/api/cost-types", isAuthenticated, async (req, res) => {
    try {
      const costTypes = await storage.getCostTypes();
      res.json(costTypes);
    } catch (error) {
      console.error("Erro ao buscar tipos de custo:", error);
      res.status(500).json({ error: "Erro ao buscar tipos de custo" });
    }
  });

  // GET - Obter um tipo de custo específico
  app.get("/api/cost-types/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }
      
      const costType = await storage.getCostType(id);
      if (!costType) {
        return res.status(404).json({ error: "Tipo de custo não encontrado" });
      }
      
      res.json(costType);
    } catch (error) {
      console.error("Erro ao buscar tipo de custo:", error);
      res.status(500).json({ error: "Erro ao buscar tipo de custo" });
    }
  });

  // POST - Criar um novo tipo de custo
  app.post("/api/cost-types", canManageFinance, async (req, res) => {
    try {
      const { name, description, active = true } = req.body;
      
      // Validar dados
      if (!name) {
        return res.status(400).json({ error: "Nome é obrigatório" });
      }
      
      // Verificar se já existe um tipo de custo com o mesmo nome
      const existingCostType = await storage.getCostTypeByName(name);
      if (existingCostType) {
        return res.status(400).json({ error: "Já existe um tipo de custo com este nome" });
      }
      
      // Criar o tipo de custo
      const costType = await storage.createCostType({
        name,
        description,
        active
      });
      
      res.status(201).json(costType);
    } catch (error) {
      console.error("Erro ao criar tipo de custo:", error);
      res.status(500).json({ error: "Erro ao criar tipo de custo" });
    }
  });

  // PATCH - Atualizar um tipo de custo existente
  app.patch("/api/cost-types/:id", canManageFinance, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }
      
      const { name, description, active } = req.body;
      
      // Validar dados
      if (!name) {
        return res.status(400).json({ error: "Nome é obrigatório" });
      }
      
      // Verificar se o tipo de custo existe
      const costType = await storage.getCostType(id);
      if (!costType) {
        return res.status(404).json({ error: "Tipo de custo não encontrado" });
      }
      
      // Verificar se já existe outro tipo de custo com o mesmo nome
      if (name !== costType.name) {
        const existingCostType = await storage.getCostTypeByName(name);
        if (existingCostType && existingCostType.id !== id) {
          return res.status(400).json({ error: "Já existe outro tipo de custo com este nome" });
        }
      }
      
      // Atualizar o tipo de custo
      const updatedCostType = await storage.updateCostType(id, {
        name,
        description,
        active
      });
      
      res.json(updatedCostType);
    } catch (error) {
      console.error("Erro ao atualizar tipo de custo:", error);
      res.status(500).json({ error: "Erro ao atualizar tipo de custo" });
    }
  });

  // DELETE - Remover um tipo de custo
  app.delete("/api/cost-types/:id", canManageFinance, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }
      
      // Verificar se o tipo de custo existe
      const costType = await storage.getCostType(id);
      if (!costType) {
        return res.status(404).json({ error: "Tipo de custo não encontrado" });
      }
      
      // Remover o tipo de custo
      await storage.deleteCostType(id);
      
      res.status(204).end();
    } catch (error) {
      console.error("Erro ao remover tipo de custo:", error);
      res.status(500).json({ error: "Erro ao remover tipo de custo" });
    }
  });

  // Rotas para CRUD de custos operacionais
  // Obter custos operacionais de uma venda
  app.get("/api/sales/:id/operational-costs", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }
      
      // Verificar se a venda existe
      const sale = await storage.getSale(id);
      if (!sale) {
        return res.status(404).json({ error: "Venda não encontrada" });
      }
      
      const operationalCosts = await storage.getSaleOperationalCosts(id);
      res.json(operationalCosts);
    } catch (error) {
      console.error("Erro ao buscar custos operacionais:", error);
      res.status(500).json({ error: "Erro ao buscar custos operacionais" });
    }
  });
  
  // Obter um custo operacional específico
  app.get("/api/sales/:saleId/operational-costs/:id", isAuthenticated, async (req, res) => {
    try {
      const saleId = parseInt(req.params.saleId);
      const id = parseInt(req.params.id);
      
      if (isNaN(saleId) || isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }
      
      // Verificar se a venda existe
      const sale = await storage.getSale(saleId);
      if (!sale) {
        return res.status(404).json({ error: "Venda não encontrada" });
      }
      
      const operationalCost = await storage.getSaleOperationalCost(id);
      if (!operationalCost || operationalCost.saleId !== saleId) {
        return res.status(404).json({ error: "Custo operacional não encontrado" });
      }
      
      res.json(operationalCost);
    } catch (error) {
      console.error("Erro ao buscar custo operacional:", error);
      res.status(500).json({ error: "Erro ao buscar custo operacional" });
    }
  });
  
  // Rota para criar custo operacional já está definida na linha 2733
  
  // Atualizar um custo operacional
  app.put("/api/sales/:saleId/operational-costs/:id", canManageSaleOperations, async (req, res) => {
    try {
      const saleId = parseInt(req.params.saleId);
      const id = parseInt(req.params.id);
      
      if (isNaN(saleId) || isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }
      
      // Verificar se a venda existe
      const sale = await storage.getSale(saleId);
      if (!sale) {
        return res.status(404).json({ error: "Venda não encontrada" });
      }
      
      // Verificar se o custo operacional existe
      const operationalCost = await storage.getSaleOperationalCost(id);
      if (!operationalCost || operationalCost.saleId !== saleId) {
        return res.status(404).json({ error: "Custo operacional não encontrado" });
      }
      
      // Garantir que description tenha ao menos um valor texto (não pode ser null)
      // Usando " " (espaço em branco) para evitar erro de validação no banco 
      const updateData = {
        ...req.body,
        description: req.body.description || " "
      };
      
      // Atualizar o custo operacional
      const updatedOperationalCost = await storage.updateSaleOperationalCost(id, updateData);
      if (!updatedOperationalCost) {
        return res.status(404).json({ error: "Custo operacional não encontrado" });
      }
      
      // Notificar via WebSocket
      broadcastEvent({ 
        type: 'sales_update', 
        payload: { action: 'operational-cost-updated', saleId, operationalCost: updatedOperationalCost } 
      });
      
      res.json(updatedOperationalCost);
    } catch (error) {
      console.error("Erro ao atualizar custo operacional:", error);
      res.status(500).json({ error: "Erro ao atualizar custo operacional" });
    }
  });
  
  // Excluir um custo operacional
  app.delete("/api/sales/:saleId/operational-costs/:id", canManageSaleOperations, async (req, res) => {
    try {
      const saleId = parseInt(req.params.saleId);
      const id = parseInt(req.params.id);
      
      if (isNaN(saleId) || isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }
      
      // Verificar se a venda existe
      const sale = await storage.getSale(saleId);
      if (!sale) {
        return res.status(404).json({ error: "Venda não encontrada" });
      }
      
      // Verificar se o custo operacional existe
      const operationalCost = await storage.getSaleOperationalCost(id);
      if (!operationalCost || operationalCost.saleId !== saleId) {
        return res.status(404).json({ error: "Custo operacional não encontrado" });
      }
      
      // Excluir o custo operacional
      const deleted = await storage.deleteSaleOperationalCost(id);
      if (!deleted) {
        return res.status(404).json({ error: "Custo operacional não encontrado" });
      }
      
      // Notificar via WebSocket
      broadcastEvent({ 
        type: 'sales_update', 
        payload: { action: 'operational-cost-deleted', saleId, operationalCostId: id } 
      });
      
      res.status(204).end();
    } catch (error) {
      console.error("Erro ao excluir custo operacional:", error);
      res.status(500).json({ error: "Erro ao excluir custo operacional" });
    }
  });

  // NOVA ROTA: Solução definitiva para forçar a criação de parcelas para uma venda
  app.post("/api/sales/:id/recreate-installments", isAuthenticated, async (req, res) => {
    try {
      console.log("🔄 INICIANDO RECRIAÇÃO DE PARCELAS");
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        console.log("🔄 ERRO: ID inválido");
        return res.status(400).json({ error: "ID inválido" });
      }
      
      // Verificar se o usuário tem permissão
      if (!["admin", "supervisor", "operacional", "financeiro"].includes(req.user?.role || "")) {
        console.log("🔄 ERRO: Permissão negada para usuário " + req.user?.username);
        return res.status(403).json({ error: "Permissão negada" });
      }
      
      // Buscar a venda
      const sale = await storage.getSale(id);
      if (!sale) {
        console.log("🔄 ERRO: Venda não encontrada");
        return res.status(404).json({ error: "Venda não encontrada" });
      }
      
      console.log(`🔄 Recriando parcelas para venda #${id}`);
      console.log(`🔄 Detalhes da venda: orderNumber=${sale.orderNumber}, totalAmount=${sale.totalAmount}, installments=${sale.installments}`);
      
      // Parâmetros do request
      const { numInstallments, installmentValue } = req.body;
      
      // Número de parcelas (usar o valor da venda se não fornecido)
      let installments = sale.installments;
      
      if (numInstallments) {
        installments = parseInt(String(numInstallments));
        console.log(`🔄 Usando número de parcelas da requisição: ${installments}`);
        
        // Atualizar o número de parcelas na venda
        console.log(`🔄 Atualizando número de parcelas na venda para ${installments}`);
        await db
          .update(sales)
          .set({ installments })
          .where(eq(sales.id, id));
      }
      
      // Verificar se o número de parcelas é válido
      if (installments < 1) {
        console.log("🔄 ERRO: Número de parcelas inválido");
        return res.status(400).json({ error: "Número de parcelas inválido" });
      }
      
      // Remover parcelas existentes
      console.log("🔄 Removendo parcelas existentes");
      await storage.deleteSaleInstallments(id);
      
      // Valor total
      const totalAmount = parseFloat(sale.totalAmount);
      
      // Valor das parcelas
      let parsedInstallmentValue = null;
      if (installmentValue) {
        parsedInstallmentValue = parseFloat(String(installmentValue).replace(',', '.'));
        console.log(`🔄 Valor de parcela fornecido: ${parsedInstallmentValue}`);
      }
      
      // Calcular valor da parcela se não fornecido
      const calculatedInstallmentValue = parseFloat((totalAmount / installments).toFixed(2));
      const lastInstallmentValue = totalAmount - (calculatedInstallmentValue * (installments - 1));
      
      console.log(`🔄 Valor calculado por parcela: ${calculatedInstallmentValue}`);
      console.log(`🔄 Valor calculado para última parcela: ${lastInstallmentValue}`);
      
      // Criar as parcelas
      console.log(`🔄 Criando ${installments} parcelas`);
      const hoje = new Date();
      const createdInstallments = [];
      
      for (let i = 1; i <= installments; i++) {
        // Data de vencimento (um mês após o anterior)
        const dueDate = new Date(hoje);
        dueDate.setMonth(hoje.getMonth() + (i - 1));
        
        // Valor da parcela
        const amount = parsedInstallmentValue || 
                      (i === installments ? lastInstallmentValue : calculatedInstallmentValue);
        
        // Criar parcela
        console.log(`🔄 Criando parcela #${i} com valor ${amount} e vencimento ${dueDate.toISOString().split('T')[0]}`);
        
        const installment = await storage.createSaleInstallment({
          saleId: id,
          installmentNumber: i,
          amount: amount.toString(),
          dueDate: dueDate.toISOString().split('T')[0],
          status: "pending",
          paymentDate: null
        });
        
        createdInstallments.push(installment);
      }
      
      // Notificar todos os clientes sobre a atualização
      notifySalesUpdate();
      
      console.log(`🔄 ${createdInstallments.length} parcelas criadas com sucesso`);
      
      // Retornar as parcelas criadas
      res.status(200).json({
        success: true,
        message: `${createdInstallments.length} parcelas criadas com sucesso`,
        installments: createdInstallments
      });
    } catch (error) {
      console.error("🔄 ERRO ao recriar parcelas:", error);
      res.status(500).json({ error: "Erro ao recriar parcelas" });
    }
  });

  // Registrar rotas personalizadas para manipulação de datas exatas
  registerCustomRoutes(app);
  
  // Criar o servidor HTTP
  const httpServer = createServer(app);
  
  // Configurar o WebSocket
  const wss = setupWebsocket(httpServer);
  
  return httpServer;
}
