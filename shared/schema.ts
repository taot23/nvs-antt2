import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
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

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;
