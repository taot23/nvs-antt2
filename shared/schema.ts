import { pgTable, text, serial, integer, boolean, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").default("user"), // "user", "admin", "supervisor", "operacional", "vendedor", "financeiro"
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
  active: boolean("active").default(true).notNull(),
  createdAt: integer("created_at").default(Math.floor(Date.now() / 1000)).notNull() // timestamp em Unix
});

export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
  createdAt: true
});

// Tabela de formas de pagamento
export const paymentMethods = pgTable("payment_methods", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  active: boolean("active").default(true).notNull(),
  createdAt: integer("created_at").default(Math.floor(Date.now() / 1000)).notNull() // timestamp em Unix
});

export const insertPaymentMethodSchema = createInsertSchema(paymentMethods).omit({
  id: true,
  createdAt: true
});

// Definição da tabela de tipos de execução de serviço
export const serviceTypes = pgTable("service_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Schema para inserção de tipo de execução de serviço
export const insertServiceTypeSchema = createInsertSchema(serviceTypes).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;
export type Service = typeof services.$inferSelect;
export type InsertPaymentMethod = z.infer<typeof insertPaymentMethodSchema>;
export type PaymentMethod = typeof paymentMethods.$inferSelect;
// Definição da tabela de prestadores de serviço parceiros
export const serviceProviders = pgTable("service_providers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  document: text("document").notNull(), // CPF ou CNPJ
  documentType: text("document_type").notNull().default("cpf"), // 'cpf' ou 'cnpj'
  contactName: text("contact_name"), // Nome do contato (para CNPJ)
  phone: text("phone").notNull(), // Telefone principal
  phone2: text("phone2"), // Telefone secundário
  email: text("email").notNull(), // Email
  address: text("address"), // Endereço completo
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Schema para inserção de prestadores de serviço parceiros
export const insertServiceProviderSchema = createInsertSchema(serviceProviders).omit({
  id: true,
  createdAt: true,
});

export type InsertServiceType = z.infer<typeof insertServiceTypeSchema>;
export type ServiceType = typeof serviceTypes.$inferSelect;
export type InsertServiceProvider = z.infer<typeof insertServiceProviderSchema>;
export type ServiceProvider = typeof serviceProviders.$inferSelect;
