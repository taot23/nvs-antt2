import { 
  users, type User, type InsertUser, 
  customers, type Customer, type InsertCustomer, 
  services, type Service, type InsertService, 
  paymentMethods, type PaymentMethod, type InsertPaymentMethod, 
  serviceTypes, type ServiceType, type InsertServiceType,
  serviceProviders, type ServiceProvider, type InsertServiceProvider,
  sales, type Sale, type InsertSale,
  saleItems, type SaleItem, type InsertSaleItem,
  salesStatusHistory, type SalesStatusHistory, type InsertSalesStatusHistory
} from "@shared/schema";
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
  
  // Service Type methods
  getServiceTypes(): Promise<ServiceType[]>;
  getServiceType(id: number): Promise<ServiceType | undefined>;
  getServiceTypeByName(name: string): Promise<ServiceType | undefined>;
  createServiceType(serviceType: InsertServiceType): Promise<ServiceType>;
  updateServiceType(id: number, serviceType: Partial<InsertServiceType>): Promise<ServiceType | undefined>;
  deleteServiceType(id: number): Promise<boolean>;
  
  // Service Provider methods
  getServiceProviders(): Promise<ServiceProvider[]>;
  getServiceProvider(id: number): Promise<ServiceProvider | undefined>;
  getServiceProviderByDocument(document: string): Promise<ServiceProvider | undefined>;
  createServiceProvider(serviceProvider: InsertServiceProvider): Promise<ServiceProvider>;
  updateServiceProvider(id: number, serviceProvider: Partial<InsertServiceProvider>): Promise<ServiceProvider | undefined>;
  deleteServiceProvider(id: number): Promise<boolean>;
  
  // Sale methods
  getSales(): Promise<Sale[]>;
  getSalesByStatus(status: string): Promise<Sale[]>;
  getSalesBySellerAndStatus(sellerId: number, status: string): Promise<Sale[]>;
  getSale(id: number): Promise<Sale | undefined>;
  getSaleByOrderNumber(orderNumber: string): Promise<Sale | undefined>;
  createSale(sale: InsertSale): Promise<Sale>;
  updateSale(id: number, sale: Partial<InsertSale>): Promise<Sale | undefined>;
  deleteSale(id: number): Promise<boolean>;
  
  // Sale Items methods
  getSaleItems(saleId: number): Promise<SaleItem[]>;
  getSaleItem(id: number): Promise<SaleItem | undefined>;
  createSaleItem(saleItem: InsertSaleItem): Promise<SaleItem>;
  updateSaleItem(id: number, saleItem: Partial<InsertSaleItem>): Promise<SaleItem | undefined>;
  deleteSaleItem(id: number): Promise<boolean>;
  
  // Sales Status History methods
  getSalesStatusHistory(saleId: number): Promise<SalesStatusHistory[]>;
  createSalesStatusHistory(statusHistory: InsertSalesStatusHistory): Promise<SalesStatusHistory>;
  
  // Special Sale operations
  returnSaleToSeller(saleId: number, userId: number, reason: string): Promise<Sale | undefined>;
  markSaleInProgress(saleId: number, operationalId: number): Promise<Sale | undefined>;
  completeSaleExecution(saleId: number, operationalId: number): Promise<Sale | undefined>;
  markSaleAsPaid(saleId: number, financialId: number): Promise<Sale | undefined>;
  
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

  // Service Type methods implementation
  async getServiceTypes(): Promise<ServiceType[]> {
    return await db.select().from(serviceTypes);
  }

  async getServiceType(id: number): Promise<ServiceType | undefined> {
    const [serviceType] = await db.select().from(serviceTypes).where(eq(serviceTypes.id, id));
    return serviceType || undefined;
  }
  
  async getServiceTypeByName(name: string): Promise<ServiceType | undefined> {
    // Buscar todos os tipos de serviço para verificar (usando lowercase para comparação insensitiva)
    const allServiceTypes = await db.select().from(serviceTypes);
    
    // Encontrar tipo de serviço com o mesmo nome (comparação case-insensitive)
    const foundServiceType = allServiceTypes.find(serviceType => 
      serviceType.name.toLowerCase() === name.toLowerCase()
    );
    
    return foundServiceType;
  }

  async createServiceType(serviceTypeData: InsertServiceType): Promise<ServiceType> {
    const [createdServiceType] = await db
      .insert(serviceTypes)
      .values({
        name: serviceTypeData.name,
        description: serviceTypeData.description,
        active: serviceTypeData.active
      })
      .returning();
    return createdServiceType;
  }

  async updateServiceType(id: number, serviceTypeData: Partial<InsertServiceType>): Promise<ServiceType | undefined> {
    const [updatedServiceType] = await db
      .update(serviceTypes)
      .set(serviceTypeData)
      .where(eq(serviceTypes.id, id))
      .returning();
    return updatedServiceType || undefined;
  }

  async deleteServiceType(id: number): Promise<boolean> {
    const [deletedServiceType] = await db
      .delete(serviceTypes)
      .where(eq(serviceTypes.id, id))
      .returning();
    return !!deletedServiceType;
  }

  // Service Provider methods implementation
  async getServiceProviders(): Promise<ServiceProvider[]> {
    return await db.select().from(serviceProviders);
  }

  async getServiceProvider(id: number): Promise<ServiceProvider | undefined> {
    const [serviceProvider] = await db.select().from(serviceProviders).where(eq(serviceProviders.id, id));
    return serviceProvider || undefined;
  }
  
  async getServiceProviderByDocument(document: string): Promise<ServiceProvider | undefined> {
    // Remover caracteres especiais para comparação
    const normalizedDocument = document.replace(/[^\d]/g, '');
    
    // Buscar todos os prestadores para verificar
    const allServiceProviders = await db.select().from(serviceProviders);
    
    // Encontrar prestador com o mesmo documento (ignorando formatação)
    const foundServiceProvider = allServiceProviders.find(serviceProvider => 
      serviceProvider.document.replace(/[^\d]/g, '') === normalizedDocument
    );
    
    return foundServiceProvider;
  }

  async createServiceProvider(serviceProviderData: InsertServiceProvider): Promise<ServiceProvider> {
    const [createdServiceProvider] = await db
      .insert(serviceProviders)
      .values({
        name: serviceProviderData.name,
        document: serviceProviderData.document,
        documentType: serviceProviderData.documentType,
        contactName: serviceProviderData.contactName,
        phone: serviceProviderData.phone,
        phone2: serviceProviderData.phone2,
        email: serviceProviderData.email,
        address: serviceProviderData.address,
        active: serviceProviderData.active
      })
      .returning();
    return createdServiceProvider;
  }

  async updateServiceProvider(id: number, serviceProviderData: Partial<InsertServiceProvider>): Promise<ServiceProvider | undefined> {
    const [updatedServiceProvider] = await db
      .update(serviceProviders)
      .set(serviceProviderData)
      .where(eq(serviceProviders.id, id))
      .returning();
    return updatedServiceProvider || undefined;
  }

  async deleteServiceProvider(id: number): Promise<boolean> {
    const [deletedServiceProvider] = await db
      .delete(serviceProviders)
      .where(eq(serviceProviders.id, id))
      .returning();
    return !!deletedServiceProvider;
  }

  // Implementação dos métodos de vendas
  async getSales(): Promise<Sale[]> {
    return await db.select().from(sales);
  }

  async getSalesByStatus(status: string): Promise<Sale[]> {
    const allSales = await db.select().from(sales);
    return allSales.filter(sale => sale.status === status);
  }

  async getSalesBySellerAndStatus(sellerId: number, status: string): Promise<Sale[]> {
    const allSales = await db.select().from(sales);
    return allSales.filter(sale => 
      sale.sellerId === sellerId && 
      (status ? sale.status === status : true)
    );
  }

  async getSale(id: number): Promise<Sale | undefined> {
    const [sale] = await db.select().from(sales).where(eq(sales.id, id));
    return sale || undefined;
  }

  async getSaleByOrderNumber(orderNumber: string): Promise<Sale | undefined> {
    const allSales = await db.select().from(sales);
    return allSales.find(sale => sale.orderNumber === orderNumber);
  }

  async createSale(saleData: InsertSale): Promise<Sale> {
    const [createdSale] = await db
      .insert(sales)
      .values(saleData)
      .returning();
    return createdSale;
  }

  async updateSale(id: number, saleData: Partial<InsertSale>): Promise<Sale | undefined> {
    // Atualizar também o updatedAt
    const dataWithTimestamp = {
      ...saleData,
      updatedAt: new Date()
    };
    
    const [updatedSale] = await db
      .update(sales)
      .set(dataWithTimestamp)
      .where(eq(sales.id, id))
      .returning();
    
    return updatedSale || undefined;
  }

  async deleteSale(id: number): Promise<boolean> {
    // Primeiro excluir os itens relacionados
    await db.delete(saleItems).where(eq(saleItems.saleId, id));
    
    // Depois excluir a venda
    const [deletedSale] = await db
      .delete(sales)
      .where(eq(sales.id, id))
      .returning();
      
    return !!deletedSale;
  }

  // Implementação dos métodos de itens da venda
  async getSaleItems(saleId: number): Promise<SaleItem[]> {
    const allItems = await db.select().from(saleItems);
    return allItems.filter(item => item.saleId === saleId);
  }

  async getSaleItem(id: number): Promise<SaleItem | undefined> {
    const [item] = await db.select().from(saleItems).where(eq(saleItems.id, id));
    return item || undefined;
  }

  async createSaleItem(saleItemData: InsertSaleItem): Promise<SaleItem> {
    const [createdItem] = await db
      .insert(saleItems)
      .values(saleItemData)
      .returning();
    
    // Atualizar o valor total da venda
    await this.updateSaleTotalAmount(createdItem.saleId);
    
    return createdItem;
  }

  async updateSaleItem(id: number, saleItemData: Partial<InsertSaleItem>): Promise<SaleItem | undefined> {
    const [updatedItem] = await db
      .update(saleItems)
      .set(saleItemData)
      .where(eq(saleItems.id, id))
      .returning();
    
    if (updatedItem) {
      // Atualizar o valor total da venda
      await this.updateSaleTotalAmount(updatedItem.saleId);
    }
    
    return updatedItem || undefined;
  }

  async deleteSaleItem(id: number): Promise<boolean> {
    // Obter o item antes de excluir para ter o saleId
    const item = await this.getSaleItem(id);
    
    if (!item) {
      return false;
    }
    
    const [deletedItem] = await db
      .delete(saleItems)
      .where(eq(saleItems.id, id))
      .returning();
      
    if (deletedItem) {
      // Atualizar o valor total da venda
      await this.updateSaleTotalAmount(item.saleId);
    }
      
    return !!deletedItem;
  }

  // Método auxiliar para atualizar o valor total da venda
  private async updateSaleTotalAmount(saleId: number): Promise<void> {
    const items = await this.getSaleItems(saleId);
    const totalAmount = items.reduce((total, item) => 
      total + Number(item.totalPrice), 0);
    
    await db
      .update(sales)
      .set({ 
        totalAmount: totalAmount.toString(),
        updatedAt: new Date()
      })
      .where(eq(sales.id, saleId));
  }

  // Implementação dos métodos de histórico de status
  async getSalesStatusHistory(saleId: number): Promise<SalesStatusHistory[]> {
    const allHistory = await db.select().from(salesStatusHistory);
    return allHistory.filter(record => record.saleId === saleId);
  }

  async createSalesStatusHistory(historyData: InsertSalesStatusHistory): Promise<SalesStatusHistory> {
    const [createdHistory] = await db
      .insert(salesStatusHistory)
      .values(historyData)
      .returning();
    return createdHistory;
  }

  // Operações especiais de vendas
  async returnSaleToSeller(saleId: number, userId: number, reason: string): Promise<Sale | undefined> {
    const sale = await this.getSale(saleId);
    
    if (!sale) {
      return undefined;
    }
    
    // Registrar no histórico
    await this.createSalesStatusHistory({
      saleId,
      fromStatus: sale.status,
      toStatus: 'returned',
      userId,
      notes: reason
    });
    
    // Atualizar status da venda
    return await this.updateSale(saleId, {
      status: 'returned',
      returnReason: reason
    });
  }

  async markSaleInProgress(saleId: number, operationalId: number): Promise<Sale | undefined> {
    const sale = await this.getSale(saleId);
    
    if (!sale) {
      return undefined;
    }
    
    // Registrar no histórico
    await this.createSalesStatusHistory({
      saleId,
      fromStatus: sale.status,
      toStatus: 'in_progress',
      userId: operationalId,
      notes: 'Execução iniciada'
    });
    
    // Atualizar status da venda
    return await this.updateSale(saleId, {
      status: 'in_progress',
      executionStatus: 'in_progress',
      responsibleOperationalId: operationalId
    });
  }

  async completeSaleExecution(saleId: number, operationalId: number): Promise<Sale | undefined> {
    const sale = await this.getSale(saleId);
    
    if (!sale) {
      return undefined;
    }
    
    // Registrar no histórico
    await this.createSalesStatusHistory({
      saleId,
      fromStatus: sale.status,
      toStatus: 'completed',
      userId: operationalId,
      notes: 'Execução concluída'
    });
    
    // Atualizar status da venda
    return await this.updateSale(saleId, {
      status: 'completed',
      executionStatus: 'completed',
      responsibleOperationalId: operationalId
    });
  }

  async markSaleAsPaid(saleId: number, financialId: number): Promise<Sale | undefined> {
    const sale = await this.getSale(saleId);
    
    if (!sale) {
      return undefined;
    }
    
    // Registrar no histórico
    await this.createSalesStatusHistory({
      saleId,
      fromStatus: sale.financialStatus,
      toStatus: 'paid',
      userId: financialId,
      notes: 'Pagamento confirmado'
    });
    
    // Atualizar status da venda
    return await this.updateSale(saleId, {
      financialStatus: 'paid',
      responsibleFinancialId: financialId
    });
  }
}

export const storage = new DatabaseStorage();
