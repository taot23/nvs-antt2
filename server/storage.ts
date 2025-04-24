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
  
  // Paginação de vendas
  getSalesPaginated(options: {
    page: number;
    limit: number;
    status?: string;
    sellerId?: number;
    searchTerm?: string;
    sortField?: string;
    sortDirection?: 'asc' | 'desc';
  }): Promise<{
    data: Sale[];
    total: number;
    page: number;
    totalPages: number;
  }>;
  
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
  markSaleInProgress(
    saleId: number, 
    operationalId: number, 
    serviceTypeId?: number, 
    serviceProviderId?: number
  ): Promise<Sale | undefined>;
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
    console.log("Criando venda com dados:", JSON.stringify(saleData, null, 2));

    // Precisamos garantir que o totalAmount seja preservado
    // Vamos extrair ele antes da inserção
    const userTotalAmount = saleData.totalAmount;

    const [createdSale] = await db
      .insert(sales)
      .values(saleData)
      .returning();
    
    console.log("Venda criada inicialmente:", JSON.stringify(createdSale, null, 2));
    
    // Se houver um valor total definido, devemos preservá-lo
    // com uma verificação mais rigorosa
    if (userTotalAmount) {
      console.log(`Atualizando o valor total para: ${userTotalAmount}`);
      
      try {
        // Vamos fazer a atualização diretamente via SQL para garantir
        const { pool } = await import('./db');
        await pool.query(
          'UPDATE sales SET total_amount = $1, updated_at = $2 WHERE id = $3',
          [userTotalAmount, new Date(), createdSale.id]
        );
        
        // Atualizar o objeto para refletir o valor correto
        createdSale.totalAmount = userTotalAmount;
        
        console.log("Venda atualizada com valor correto:", JSON.stringify(createdSale, null, 2));
      } catch (error) {
        console.error("Erro ao atualizar valor total:", error);
      }
    }
    
    return createdSale;
  }

  async updateSale(id: number, saleData: Partial<InsertSale>): Promise<Sale | undefined> {
    try {
      // Verificar se a venda existe antes da atualização
      const [existingSale] = await db
        .select()
        .from(sales)
        .where(eq(sales.id, id));
      
      if (!existingSale) {
        return undefined;
      }
      
      // Se estiver tentando atualizar o valor total, garantimos que ele seja preservado
      if (saleData.totalAmount) {
        // Formatar o valor total (substituir vírgula por ponto)
        if (typeof saleData.totalAmount === 'string') {
          saleData.totalAmount = saleData.totalAmount.replace(',', '.');
        }
        
        console.log(`Atualizando valor total da venda #${id} para ${saleData.totalAmount}`);
      }
        
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
      
      // Verificar se a atualização foi bem-sucedida
      if (updatedSale && saleData.totalAmount) {
        // Garantir que o valor total foi atualizado corretamente
        const { pool } = await import('./db');
        const checkResult = await pool.query(
          'SELECT id, total_amount FROM sales WHERE id = $1',
          [id]
        );
        
        if (checkResult.rows.length > 0) {
          console.log(`Valor total após atualização: ${checkResult.rows[0].total_amount}`);
        }
      }
      
      return updatedSale || undefined;
    } catch (error) {
      console.error(`Erro ao atualizar venda #${id}:`, error);
      return undefined;
    }
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
  
  async getSalesPaginated(options: {
    page: number;
    limit: number;
    status?: string;
    sellerId?: number;
    searchTerm?: string;
    sortField?: string;
    sortDirection?: 'asc' | 'desc';
  }): Promise<{
    data: Sale[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      sellerId, 
      searchTerm, 
      sortField = 'createdAt', 
      sortDirection = 'desc' 
    } = options;
    
    console.log(`Buscando vendas paginadas: página ${page}, limite ${limit}`);
    
    // Obter todas as vendas primeiro (depois otimizaremos isso com SQL direto)
    let allSales = await db.select().from(sales);
    let totalRecords = allSales.length;
    
    // Filtrar pelo status, se fornecido
    if (status) {
      allSales = allSales.filter(sale => sale.status === status);
    }
    
    // Filtrar pelo vendedor, se fornecido
    if (sellerId) {
      allSales = allSales.filter(sale => sale.sellerId === sellerId);
    }
    
    // Filtrar por termo de busca, se fornecido
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      allSales = allSales.filter(sale => {
        // Buscar no número do pedido
        return sale.orderNumber.toLowerCase().includes(term);
        // Podemos expandir para outros campos no futuro
      });
    }
    
    // Obter o total após a filtragem
    totalRecords = allSales.length;
    
    // Ordenar os resultados
    allSales.sort((a, b) => {
      // Verificar qual campo usar para ordenação
      const fieldA = a[sortField as keyof Sale];
      const fieldB = b[sortField as keyof Sale];
      
      // Comparar baseado no tipo de campo
      if (typeof fieldA === 'string' && typeof fieldB === 'string') {
        return sortDirection === 'asc' 
          ? fieldA.localeCompare(fieldB) 
          : fieldB.localeCompare(fieldA);
      } else if (fieldA instanceof Date && fieldB instanceof Date) {
        return sortDirection === 'asc' 
          ? fieldA.getTime() - fieldB.getTime() 
          : fieldB.getTime() - fieldA.getTime();
      } else if (typeof fieldA === 'number' && typeof fieldB === 'number') {
        return sortDirection === 'asc' 
          ? fieldA - fieldB 
          : fieldB - fieldA;
      }
      
      // Fallback para string
      return sortDirection === 'asc' 
        ? String(fieldA).localeCompare(String(fieldB)) 
        : String(fieldB).localeCompare(String(fieldA));
    });
    
    // Calcular paginação
    const totalPages = Math.ceil(totalRecords / limit);
    const start = (page - 1) * limit;
    const end = page * limit;
    
    // Pegar apenas os registros da página atual
    const paginatedResults = allSales.slice(start, end);
    
    console.log(`Retornando ${paginatedResults.length} vendas de um total de ${totalRecords}`);
    
    return {
      data: paginatedResults,
      total: totalRecords,
      page,
      totalPages
    };
  }

  // Implementação dos métodos de itens da venda
  async getSaleItems(saleId: number): Promise<SaleItem[]> {
    try {
      // Importar o pool do banco de dados diretamente
      const { pool } = await import('./db');
      
      // Usar SQL puro para obter todas as colunas, incluindo as novas total_price e status
      const result = await pool.query(
        `SELECT * FROM sale_items WHERE sale_id = $1`,
        [saleId]
      );
      
      console.log("Resultado da consulta de itens:", result.rows);
      
      if (!result.rows || result.rows.length === 0) {
        return [];
      }
      
      // Mapeia os resultados para o tipo esperado
      return result.rows.map(row => {
        // Calcular o preço total para cada item se não existir na tabela
        const itemPrice = Number(row.price) || 0;
        const itemQuantity = Number(row.quantity) || 1;
        
        return {
          id: row.id,
          saleId: row.sale_id,
          serviceId: row.service_id,
          serviceTypeId: row.service_type_id,
          quantity: row.quantity,
          price: row.price,
          // Usar o total_price da tabela se existir, senão calcular
          totalPrice: row.total_price || (itemPrice * itemQuantity).toString(),
          notes: row.notes || null,
          // Usar o status da tabela se existir, senão usar "pending"
          status: row.status || "pending",
          createdAt: row.created_at,
        } as unknown as SaleItem;
      });
    } catch (error) {
      console.error("Erro ao buscar itens da venda:", error);
      return []; // Retorna lista vazia em caso de erro para não interromper a execução
    }
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
    console.log(`Este método foi desativado. A venda ${saleId} deve manter seu valor total original.`);
    return; // Não faz nada - preservamos sempre o valor definido pelo usuário
  }

  // Implementação dos métodos de histórico de status
  async getSalesStatusHistory(saleId: number): Promise<SalesStatusHistory[]> {
    try {
      // Buscar o histórico da venda específica (filtro diretamente no SQL)
      const history = await db
        .select()
        .from(salesStatusHistory)
        .where(eq(salesStatusHistory.saleId, saleId));
      
      // Recuperar os usuários relacionados a cada entrada
      const result = [];
      
      for (const entry of history) {
        // Buscar informações do usuário
        const user = await this.getUser(entry.userId);
        
        // Adicionar ao resultado com o nome do usuário
        result.push({
          ...entry,
          userName: user ? user.username : `Usuário #${entry.userId}`
        });
      }
      
      // Ordenar por data de criação (mais recente primeiro)
      return result.sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    } catch (error) {
      console.error("Erro ao buscar histórico:", error);
      return []; // Retorna array vazio em caso de erro
    }
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

  async markSaleInProgress(
    saleId: number, 
    operationalId: number, 
    serviceTypeId?: number, 
    serviceProviderId?: number
  ): Promise<Sale | undefined> {
    const sale = await this.getSale(saleId);
    
    if (!sale) {
      return undefined;
    }
    
    // Verificar se houve mudança no tipo de serviço
    let notesText = 'Execução iniciada';
    
    // Se foi fornecido um tipo de serviço diferente do atual (ou pela primeira vez)
    if (serviceTypeId) {
      if (!sale.serviceTypeId) {
        // Primeira atribuição de tipo de serviço
        const newType = await this.getServiceType(serviceTypeId);
        if (newType) {
          notesText += ` - Tipo de execução definido como ${newType.name}`;
        } else {
          notesText += ' - Tipo de execução definido';
        }
      } else if (serviceTypeId !== sale.serviceTypeId) {
        // Alteração de tipo existente
        const oldType = await this.getServiceType(sale.serviceTypeId);
        const newType = await this.getServiceType(serviceTypeId);
        
        if (oldType && newType) {
          notesText += ` - Tipo de execução alterado de ${oldType.name} para ${newType.name}`;
        } else {
          notesText += ' - Tipo de execução alterado';
        }
      }
    }
    
    // Registrar no histórico
    await this.createSalesStatusHistory({
      saleId,
      fromStatus: sale.status,
      toStatus: 'in_progress',
      userId: operationalId,
      notes: notesText
    });
    
    // Preparar dados para atualização
    const updateData: Partial<InsertSale> = {
      status: 'in_progress',
      executionStatus: 'in_progress',
      responsibleOperationalId: operationalId
    };
    
    // Adicionar o tipo de serviço se fornecido
    if (serviceTypeId) {
      // @ts-ignore - O type está correto mas o TypeScript não reconhece pois foi adicionado dinamicamente
      updateData.serviceTypeId = serviceTypeId;
    }
    
    // Adicionar o prestador de serviço parceiro se fornecido
    if (serviceProviderId) {
      // @ts-ignore - O type está correto mas o TypeScript não reconhece pois foi adicionado dinamicamente
      updateData.serviceProviderId = serviceProviderId;
    }
    
    // Atualizar status da venda
    return await this.updateSale(saleId, updateData);
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
      fromStatus: sale.financialStatus || 'pending',
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
