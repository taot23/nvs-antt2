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
  // Campo price removido conforme solicitado
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

// Tabela de vendas
export const sales = pgTable("sales", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(), // Número da ordem de serviço
  date: timestamp("date").notNull().defaultNow(), // Data da venda
  customerId: integer("customer_id").notNull().references(() => customers.id), // Cliente
  paymentMethodId: integer("payment_method_id").notNull().references(() => paymentMethods.id), // Forma de pagamento
  sellerId: integer("seller_id").notNull().references(() => users.id), // Vendedor responsável
  serviceTypeId: integer("service_type_id").references(() => serviceTypes.id), // Tipo de execução do serviço
  serviceProviderId: integer("service_provider_id").references(() => serviceProviders.id), // Prestador de serviço parceiro (para SINDICATO)
  totalAmount: numeric("total_amount").notNull().default("0"), // Valor total
  status: text("status").notNull().default("pending"), // Status: pending, in_progress, returned, completed, canceled
  executionStatus: text("execution_status").default("waiting"), // Status de execução: waiting, in_progress, completed
  financialStatus: text("financial_status").default("pending"), // Status financeiro: pending, partial, paid
  notes: text("notes"), // Observações gerais
  returnReason: text("return_reason"), // Motivo de devolução
  responsibleOperationalId: integer("responsible_operational_id").references(() => users.id), // Responsável operacional
  responsibleFinancialId: integer("responsible_financial_id").references(() => users.id), // Responsável financeiro
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Tabela de itens da venda (serviços incluídos)
export const saleItems = pgTable("sale_items", {
  id: serial("id").primaryKey(),
  saleId: integer("sale_id").notNull().references(() => sales.id), // Venda relacionada
  serviceId: integer("service_id").notNull().references(() => services.id), // Serviço
  serviceTypeId: integer("service_type_id").notNull().references(() => serviceTypes.id), // Tipo de serviço
  quantity: integer("quantity").notNull().default(1), // Quantidade
  price: numeric("price").notNull(), // Valor unitário
  totalPrice: numeric("total_price").notNull(), // Valor total (quantidade * preço)
  notes: text("notes"), // Observações específicas do item
  status: text("status").notNull().default("pending"), // Status específico do item
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Schema para inserção de vendas
export const insertSaleSchema = createInsertSchema(sales).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Schema para inserção de itens de venda
export const insertSaleItemSchema = createInsertSchema(saleItems).omit({
  id: true,
  createdAt: true,
});

// Tabela de histórico de status das vendas
export const salesStatusHistory = pgTable("sales_status_history", {
  id: serial("id").primaryKey(),
  saleId: integer("sale_id").notNull().references(() => sales.id), // Venda relacionada
  fromStatus: text("from_status").notNull(), // Status anterior
  toStatus: text("to_status").notNull(), // Novo status
  userId: integer("user_id").notNull().references(() => users.id), // Usuário que alterou
  notes: text("notes"), // Observações
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Schema para inserção no histórico de status
export const insertSalesStatusHistorySchema = createInsertSchema(salesStatusHistory).omit({
  id: true,
  createdAt: true,
});

export type InsertServiceType = z.infer<typeof insertServiceTypeSchema>;
export type ServiceType = typeof serviceTypes.$inferSelect;
export type InsertServiceProvider = z.infer<typeof insertServiceProviderSchema>;
export type ServiceProvider = typeof serviceProviders.$inferSelect;

export type InsertSale = z.infer<typeof insertSaleSchema>;
export type Sale = typeof sales.$inferSelect;
export type InsertSaleItem = z.infer<typeof insertSaleItemSchema>;
export type SaleItem = typeof saleItems.$inferSelect;
export type InsertSalesStatusHistory = z.infer<typeof insertSalesStatusHistorySchema>;
export type SalesStatusHistory = typeof salesStatusHistory.$inferSelect;
