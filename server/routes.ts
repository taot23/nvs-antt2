import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertCustomerSchema, insertUserSchema } from "@shared/schema";
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
      // Verificar o perfil do usuário logado - apenas admins podem criar novos usuários
      const currentUser = req.user;
      if (!currentUser || currentUser.role !== "admin") {
        return res.status(403).json({ error: "Permissão negada. Apenas administradores podem criar usuários." });
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
      // 2. Um administrador pode editar qualquer usuário
      // 3. Um usuário comum não pode alterar seu próprio papel (role)
      const currentUser = req.user;
      if (!currentUser) {
        return res.status(401).json({ error: "Não autorizado" });
      }
      
      if (currentUser.role !== "admin" && currentUser.id !== id) {
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
      
      // Verificar permissões (apenas admins podem excluir usuários)
      const currentUser = req.user;
      if (!currentUser || currentUser.role !== "admin") {
        return res.status(403).json({ error: "Permissão negada. Apenas administradores podem excluir usuários." });
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

  const httpServer = createServer(app);

  return httpServer;
}
