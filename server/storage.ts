import { users, type User, type InsertUser, customers, type Customer, type InsertCustomer, services, type Service, type InsertService, paymentMethods, type PaymentMethod, type InsertPaymentMethod } from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { eq } from "drizzle-orm";
import { db, pool } from "./db";

const PostgresSessionStore = connectPg(session);

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  
  // Customer methods
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: number): Promise<Customer | undefined>;
  getCustomerByDocument(document: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;
  deleteCustomer(id: number): Promise<boolean>;
  
  // Service methods
  getServices(): Promise<Service[]>;
  getService(id: number): Promise<Service | undefined>;
  getServiceByName(name: string): Promise<Service | undefined>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: number, service: Partial<InsertService>): Promise<Service | undefined>;
  deleteService(id: number): Promise<boolean>;
  
  // Payment Method methods
  getPaymentMethods(): Promise<PaymentMethod[]>;
  getPaymentMethod(id: number): Promise<PaymentMethod | undefined>;
  getPaymentMethodByName(name: string): Promise<PaymentMethod | undefined>;
  createPaymentMethod(paymentMethod: InsertPaymentMethod): Promise<PaymentMethod>;
  updatePaymentMethod(id: number, paymentMethod: Partial<InsertPaymentMethod>): Promise<PaymentMethod | undefined>;
  deletePaymentMethod(id: number): Promise<boolean>;
  
  sessionStore: any; // Using any to avoid type errors
}

export class DatabaseStorage implements IStorage {
  sessionStore: any; // Using any to avoid type errors

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser || undefined;
  }

  async deleteUser(id: number): Promise<boolean> {
    const [deletedUser] = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning();
    return !!deletedUser;
  }

  // Customer methods implementation
  async getCustomers(): Promise<Customer[]> {
    return await db.select().from(customers);
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer || undefined;
  }
  
  async getCustomerByDocument(document: string): Promise<Customer | undefined> {
    // Remover caracteres especiais para comparação
    const normalizedDocument = document.replace(/[^\d]/g, '');
    
    // Buscar todos os clientes para verificar
    const allCustomers = await db.select().from(customers);
    
    // Encontrar cliente com o mesmo documento (ignorando formatação)
    const foundCustomer = allCustomers.find(customer => 
      customer.document.replace(/[^\d]/g, '') === normalizedDocument
    );
    
    return foundCustomer;
  }

  async createCustomer(customerData: any): Promise<Customer> {
    // Usando any para evitar problemas de tipo temporariamente
    const [createdCustomer] = await db
      .insert(customers)
      .values([{
        name: customerData.name,
        document: customerData.document,
        phone: customerData.phone,
        email: customerData.email,
        documentType: customerData.documentType,
        userId: customerData.userId,
        contactName: customerData.contactName || null,
        phone2: customerData.phone2 || null
      }])
      .returning();
    return createdCustomer;
  }

  async updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const [updatedCustomer] = await db
      .update(customers)
      .set(customer)
      .where(eq(customers.id, id))
      .returning();
    return updatedCustomer || undefined;
  }

  async deleteCustomer(id: number): Promise<boolean> {
    const [deletedCustomer] = await db
      .delete(customers)
      .where(eq(customers.id, id))
      .returning();
    return !!deletedCustomer;
  }

  // Service methods implementation
  async getServices(): Promise<Service[]> {
    return await db.select().from(services);
  }

  async getService(id: number): Promise<Service | undefined> {
    const [service] = await db.select().from(services).where(eq(services.id, id));
    return service || undefined;
  }
  
  async getServiceByName(name: string): Promise<Service | undefined> {
    // Buscar todos os serviços para verificar (usando lowercase para comparação insensitiva)
    const allServices = await db.select().from(services);
    
    // Encontrar serviço com o mesmo nome (comparação case-insensitive)
    const foundService = allServices.find(service => 
      service.name.toLowerCase() === name.toLowerCase()
    );
    
    return foundService;
  }

  async createService(serviceData: InsertService): Promise<Service> {
    const [createdService] = await db
      .insert(services)
      .values({
        name: serviceData.name,
        description: serviceData.description,
        price: serviceData.price,
        active: serviceData.active
      })
      .returning();
    return createdService;
  }

  async updateService(id: number, serviceData: Partial<InsertService>): Promise<Service | undefined> {
    const [updatedService] = await db
      .update(services)
      .set(serviceData)
      .where(eq(services.id, id))
      .returning();
    return updatedService || undefined;
  }

  async deleteService(id: number): Promise<boolean> {
    const [deletedService] = await db
      .delete(services)
      .where(eq(services.id, id))
      .returning();
    return !!deletedService;
  }

  // Payment Methods methods implementation
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    return await db.select().from(paymentMethods);
  }

  async getPaymentMethod(id: number): Promise<PaymentMethod | undefined> {
    const [paymentMethod] = await db.select().from(paymentMethods).where(eq(paymentMethods.id, id));
    return paymentMethod || undefined;
  }
  
  async getPaymentMethodByName(name: string): Promise<PaymentMethod | undefined> {
    // Buscar todas as formas de pagamento para verificar (usando lowercase para comparação insensitiva)
    const allPaymentMethods = await db.select().from(paymentMethods);
    
    // Encontrar forma de pagamento com o mesmo nome (comparação case-insensitive)
    const foundPaymentMethod = allPaymentMethods.find(paymentMethod => 
      paymentMethod.name.toLowerCase() === name.toLowerCase()
    );
    
    return foundPaymentMethod;
  }

  async createPaymentMethod(paymentMethodData: InsertPaymentMethod): Promise<PaymentMethod> {
    const [createdPaymentMethod] = await db
      .insert(paymentMethods)
      .values({
        name: paymentMethodData.name,
        description: paymentMethodData.description,
        active: paymentMethodData.active
      })
      .returning();
    return createdPaymentMethod;
  }

  async updatePaymentMethod(id: number, paymentMethodData: Partial<InsertPaymentMethod>): Promise<PaymentMethod | undefined> {
    const [updatedPaymentMethod] = await db
      .update(paymentMethods)
      .set(paymentMethodData)
      .where(eq(paymentMethods.id, id))
      .returning();
    return updatedPaymentMethod || undefined;
  }

  async deletePaymentMethod(id: number): Promise<boolean> {
    const [deletedPaymentMethod] = await db
      .delete(paymentMethods)
      .where(eq(paymentMethods.id, id))
      .returning();
    return !!deletedPaymentMethod;
  }
}

export const storage = new DatabaseStorage();
