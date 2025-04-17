import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);
  
  // put application routes here
  // prefix all routes with /api

  const httpServer = createServer(app);

  return httpServer;
}
