import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertCustomerSchema, insertUserSchema, insertServiceSchema, insertPaymentMethodSchema, insertServiceTypeSchema } from "@shared/schema";
import { ZodError } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);
  
  // Middleware para verificar se o usuário está autenticado
  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated()) {
      return next();
    }
    return res.status(401).json({ error: "Não autorizado" });
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
  
  // Middleware para verificar se o usuário tem permissão para gerenciar serviços
  const canManageServices = (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Não autorizado" });
    }
    
    const user = req.user;
    if (user.role === "admin" || user.role === "operacional") {
      return next();
    }
    
    return res.status(403).json({ 
      error: "Permissão negada", 
      message: "Apenas administradores e operacionais podem gerenciar serviços."
    });
  };
  
  // Listar todos os serviços
  app.get("/api/services", isAuthenticated, async (req, res) => {
    try {
      const services = await storage.getServices();
      res.json(services);
    } catch (error) {
      console.error("Erro ao buscar serviços:", error);
      res.status(500).json({ error: "Erro ao buscar serviços" });
    }
  });
  
  // Obter um serviço específico
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
  
  // Criar um novo serviço
  app.post("/api/services", canManageServices, async (req, res) => {
    try {
      // Validar os dados enviados
      const validatedData = insertServiceSchema.parse(req.body);
      
      // Verificar se já existe um serviço com este nome
      const existingService = await storage.getServiceByName(validatedData.name);
      if (existingService) {
        return res.status(400).json({ 
          error: "Serviço já cadastrado", 
          message: `Já existe um serviço com o nome "${existingService.name}"`,
          existingService: {
            id: existingService.id,
            name: existingService.name
          }
        });
      }
      
      // Criar o serviço
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
  
  // Atualizar um serviço existente
  app.put("/api/services/:id", canManageServices, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }
      
      // Buscar o serviço atual para verificações
      const currentService = await storage.getService(id);
      if (!currentService) {
        return res.status(404).json({ error: "Serviço não encontrado" });
      }
      
      // Validar os dados parciais
      const serviceData = insertServiceSchema.parse(req.body);
      
      // Se o nome estiver sendo alterado, verifica se já existe
      if (serviceData.name && serviceData.name !== currentService.name) {
        const existingService = await storage.getServiceByName(serviceData.name);
        if (existingService && existingService.id !== id) {
          return res.status(400).json({ 
            error: "Nome já cadastrado", 
            message: `Já existe um serviço com o nome "${existingService.name}"`,
            existingService: {
              id: existingService.id,
              name: existingService.name
            }
          });
        }
      }
      
      // Atualizar o serviço
      const service = await storage.updateService(id, serviceData);
      if (!service) {
        return res.status(404).json({ error: "Serviço não encontrado" });
      }
      
      res.json(service);
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
  
  // Excluir um serviço
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

  // ========== Rotas para gerenciamento de formas de pagamento ==========
  
  // Middleware para verificar se o usuário tem permissão para gerenciar formas de pagamento
  const canManagePaymentMethods = (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Não autorizado" });
    }
    
    const user = req.user;
    if (user.role === "admin" || user.role === "financeiro") {
      return next();
    }
    
    return res.status(403).json({ 
      error: "Permissão negada", 
      message: "Apenas administradores e usuários do setor financeiro podem gerenciar formas de pagamento."
    });
  };
  
  // Listar todas as formas de pagamento
  app.get("/api/payment-methods", isAuthenticated, async (req, res) => {
    try {
      const paymentMethods = await storage.getPaymentMethods();
      res.json(paymentMethods);
    } catch (error) {
      console.error("Erro ao buscar formas de pagamento:", error);
      res.status(500).json({ error: "Erro ao buscar formas de pagamento" });
    }
  });
  
  // Obter uma forma de pagamento específica
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
  
  // Criar nova forma de pagamento
  app.post("/api/payment-methods", canManagePaymentMethods, async (req, res) => {
    try {
      // Validar os dados enviados
      const validatedData = insertPaymentMethodSchema.parse(req.body);
      
      // Verificar se já existe uma forma de pagamento com este nome
      const existingPaymentMethod = await storage.getPaymentMethodByName(validatedData.name);
      if (existingPaymentMethod) {
        return res.status(400).json({ 
          error: "Forma de pagamento já cadastrada", 
          message: `Já existe uma forma de pagamento com o nome "${existingPaymentMethod.name}"`,
          existingPaymentMethod: {
            id: existingPaymentMethod.id,
            name: existingPaymentMethod.name
          }
        });
      }
      
      // Criar a forma de pagamento
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
  
  // Atualizar uma forma de pagamento existente
  app.put("/api/payment-methods/:id", canManagePaymentMethods, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }
      
      // Buscar a forma de pagamento atual para verificações
      const currentPaymentMethod = await storage.getPaymentMethod(id);
      if (!currentPaymentMethod) {
        return res.status(404).json({ error: "Forma de pagamento não encontrada" });
      }
      
      // Validar os dados
      const paymentMethodData = insertPaymentMethodSchema.parse(req.body);
      
      // Se o nome estiver sendo alterado, verifica se já existe
      if (paymentMethodData.name && paymentMethodData.name !== currentPaymentMethod.name) {
        const existingPaymentMethod = await storage.getPaymentMethodByName(paymentMethodData.name);
        if (existingPaymentMethod && existingPaymentMethod.id !== id) {
          return res.status(400).json({ 
            error: "Nome já cadastrado", 
            message: `Já existe uma forma de pagamento com o nome "${existingPaymentMethod.name}"`,
            existingPaymentMethod: {
              id: existingPaymentMethod.id,
              name: existingPaymentMethod.name
            }
          });
        }
      }
      
      // Atualizar a forma de pagamento
      const paymentMethod = await storage.updatePaymentMethod(id, paymentMethodData);
      if (!paymentMethod) {
        return res.status(404).json({ error: "Forma de pagamento não encontrada" });
      }
      
      res.json(paymentMethod);
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
  
  // Excluir uma forma de pagamento
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

  // ========== Rotas para gerenciamento de tipos de execução de serviço ==========
  
  // Middleware para verificar se o usuário tem permissão para gerenciar tipos de execução de serviço
  const canManageServiceTypes = (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Não autorizado" });
    }
    
    const user = req.user;
    if (user.role === "admin" || user.role === "operacional") {
      return next();
    }
    
    return res.status(403).json({ 
      error: "Permissão negada", 
      message: "Apenas administradores e usuários operacionais podem gerenciar tipos de execução de serviço."
    });
  };
  
  // Listar todos os tipos de execução de serviço
  app.get("/api/service-types", isAuthenticated, async (req, res) => {
    try {
      const serviceTypes = await storage.getServiceTypes();
      res.json(serviceTypes);
    } catch (error) {
      console.error("Erro ao buscar tipos de execução de serviço:", error);
      res.status(500).json({ error: "Erro ao buscar tipos de execução de serviço" });
    }
  });
  
  // Obter um tipo de execução de serviço específico
  app.get("/api/service-types/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }
      
      const serviceType = await storage.getServiceType(id);
      if (!serviceType) {
        return res.status(404).json({ error: "Tipo de execução de serviço não encontrado" });
      }
      
      res.json(serviceType);
    } catch (error) {
      console.error("Erro ao buscar tipo de execução de serviço:", error);
      res.status(500).json({ error: "Erro ao buscar tipo de execução de serviço" });
    }
  });
  
  // Criar novo tipo de execução de serviço
  app.post("/api/service-types", canManageServiceTypes, async (req, res) => {
    try {
      // Validar os dados enviados
      const validatedData = insertServiceTypeSchema.parse(req.body);
      
      // Verificar se já existe um tipo de execução de serviço com este nome
      const existingServiceType = await storage.getServiceTypeByName(validatedData.name);
      if (existingServiceType) {
        return res.status(400).json({ 
          error: "Tipo de execução de serviço já cadastrado", 
          message: `Já existe um tipo de execução de serviço com o nome "${existingServiceType.name}"`,
          existingServiceType: {
            id: existingServiceType.id,
            name: existingServiceType.name
          }
        });
      }
      
      // Criar o tipo de execução de serviço
      const serviceType = await storage.createServiceType(validatedData);
      res.status(201).json(serviceType);
    } catch (error) {
      console.error("Erro ao criar tipo de execução de serviço:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          error: "Dados inválidos", 
          details: error.errors 
        });
      }
      res.status(500).json({ error: "Erro ao criar tipo de execução de serviço" });
    }
  });
  
  // Atualizar um tipo de execução de serviço existente
  app.put("/api/service-types/:id", canManageServiceTypes, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }
      
      // Buscar o tipo de execução de serviço atual para verificações
      const currentServiceType = await storage.getServiceType(id);
      if (!currentServiceType) {
        return res.status(404).json({ error: "Tipo de execução de serviço não encontrado" });
      }
      
      // Validar os dados
      const serviceTypeData = insertServiceTypeSchema.parse(req.body);
      
      // Se o nome estiver sendo alterado, verifica se já existe
      if (serviceTypeData.name && serviceTypeData.name !== currentServiceType.name) {
        const existingServiceType = await storage.getServiceTypeByName(serviceTypeData.name);
        if (existingServiceType && existingServiceType.id !== id) {
          return res.status(400).json({ 
            error: "Nome já cadastrado", 
            message: `Já existe um tipo de execução de serviço com o nome "${existingServiceType.name}"`,
            existingServiceType: {
              id: existingServiceType.id,
              name: existingServiceType.name
            }
          });
        }
      }
      
      // Atualizar o tipo de execução de serviço
      const serviceType = await storage.updateServiceType(id, serviceTypeData);
      if (!serviceType) {
        return res.status(404).json({ error: "Tipo de execução de serviço não encontrado" });
      }
      
      res.json(serviceType);
    } catch (error) {
      console.error("Erro ao atualizar tipo de execução de serviço:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          error: "Dados inválidos", 
          details: error.errors 
        });
      }
      res.status(500).json({ error: "Erro ao atualizar tipo de execução de serviço" });
    }
  });
  
  // Excluir um tipo de execução de serviço
  app.delete("/api/service-types/:id", canManageServiceTypes, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }
      
      const success = await storage.deleteServiceType(id);
      if (!success) {
        return res.status(404).json({ error: "Tipo de execução de serviço não encontrado" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Erro ao excluir tipo de execução de serviço:", error);
      res.status(500).json({ error: "Erro ao excluir tipo de execução de serviço" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
