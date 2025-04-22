import { pgTable, text, serial, integer, boolean, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").default("user"), // "user" ou "admin"
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
});

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // Nome ou Razão Social
  document: text("document").notNull(), // CPF ou CNPJ
  documentType: text("document_type").notNull().default("cpf"), // 'cpf' ou 'cnpj'
  contactName: text("contact_name"), // Nome do contato (para CNPJ)
  phone: text("phone").notNull(), // Telefone principal
  phone2: text("phone2"), // Telefone secundário
  email: text("email").notNull(), // Email
  userId: integer("user_id").notNull().references(() => users.id),
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  userId: true,
});

// Tabela de serviços
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: text("price").notNull(), // Armazenamos como texto e convertemos para número na aplicação
  duration: integer("duration"), // duração em minutos
  active: boolean("active").default(true).notNull(),
  createdAt: integer("created_at").default(Math.floor(Date.now() / 1000)).notNull() // timestamp em Unix
});

export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
  createdAt: true
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;
export type Service = typeof services.$inferSelect;
