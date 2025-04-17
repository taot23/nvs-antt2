import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertCustomerSchema } from "@shared/schema";
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
      // Valida os dados usando o esquema Zod
      const customerData = insertCustomerSchema.parse(req.body);
      
      // Adiciona o ID do usuário logado como proprietário
      customerData.userId = req.user!.id;
      
      const customer = await storage.createCustomer(customerData);
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
      
      // Valida os dados parciais
      const customerData = insertCustomerSchema.partial().parse(req.body);
      
      const customer = await storage.updateCustomer(id, customerData);
      if (!customer) {
        return res.status(404).json({ error: "Cliente não encontrado" });
      }
      
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

  const httpServer = createServer(app);

  return httpServer;
}
