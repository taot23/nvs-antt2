import { 
  users, type User, type InsertUser, 
  customers, type Customer, type InsertCustomer, 
  services, type Service, type InsertService, 
  paymentMethods, type PaymentMethod, type InsertPaymentMethod, 
  serviceTypes, type ServiceType, type InsertServiceType,
  serviceProviders, type ServiceProvider, type InsertServiceProvider,
  sales, type Sale, type InsertSale,
  saleItems, type SaleItem, type InsertSaleItem,
  salesStatusHistory, type SalesStatusHistory, type InsertSalesStatusHistory,
  saleInstallments, type SaleInstallment, type InsertSaleInstallment,
  saleOperationalCosts, type SaleOperationalCost, type InsertSaleOperationalCost,
  salePaymentReceipts, type SalePaymentReceipt, type InsertSalePaymentReceipt,
  costTypes, type CostType, type InsertCostType
} from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { eq, desc } from "drizzle-orm";
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
  getLatestSales(limit: number): Promise<Sale[]>;
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
  
  // Sale Installments methods
  getSaleInstallments(saleId: number): Promise<SaleInstallment[]>;
  getSaleInstallment(id: number): Promise<SaleInstallment | undefined>;
  createSaleInstallment(installment: InsertSaleInstallment): Promise<SaleInstallment>;
  createSaleInstallments(installments: InsertSaleInstallment[]): Promise<SaleInstallment[]>;
  updateSaleInstallment(id: number, installment: Partial<InsertSaleInstallment>): Promise<SaleInstallment | undefined>;
  deleteSaleInstallments(saleId: number): Promise<boolean>;
  
  // Operational Costs methods
  getSaleOperationalCosts(saleId: number): Promise<SaleOperationalCost[]>;
  getSaleOperationalCost(id: number): Promise<SaleOperationalCost | undefined>;
  createSaleOperationalCost(cost: InsertSaleOperationalCost): Promise<SaleOperationalCost>;
  updateSaleOperationalCost(id: number, cost: Partial<InsertSaleOperationalCost>): Promise<SaleOperationalCost | undefined>;
  deleteSaleOperationalCost(id: number): Promise<boolean>;
  
  // Payment Receipt methods
  getSalePaymentReceipts(installmentId: number): Promise<SalePaymentReceipt[]>;
  getSalePaymentReceipt(id: number): Promise<SalePaymentReceipt | undefined>;
  createSalePaymentReceipt(receipt: InsertSalePaymentReceipt): Promise<SalePaymentReceipt>;
  updateSalePaymentReceipt(id: number, receipt: Partial<InsertSalePaymentReceipt>): Promise<SalePaymentReceipt | undefined>;
  deleteSalePaymentReceipt(id: number): Promise<boolean>;
  
  // Cost Types methods
  getCostTypes(): Promise<CostType[]>;
  getCostType(id: number): Promise<CostType | undefined>;
  getCostTypeByName(name: string): Promise<CostType | undefined>;
  createCostType(costType: InsertCostType): Promise<CostType>;
  updateCostType(id: number, costType: Partial<InsertCostType>): Promise<CostType | undefined>;
  deleteCostType(id: number): Promise<boolean>;
  
  // Gerenciar confirmação de pagamentos de parcelas
  confirmInstallmentPayment(
    installmentId: number, 
    userId: number, 
    paymentDate: Date, 
    receiptData?: { type: string, url?: string, data?: any, notes?: string }
  ): Promise<SaleInstallment | undefined>;
  
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

  async getLatestSales(limit: number): Promise<Sale[]> {
    try {
      // Busca as vendas mais recentes com base na data de criação
      const result = await db
        .select()
        .from(sales)
        .orderBy(desc(sales.createdAt))
        .limit(limit);
      
      return result;
    } catch (error) {
      console.error("Erro ao buscar vendas mais recentes:", error);
      return []; // Retorna array vazio em caso de erro
    }
  }

  async createSale(saleData: InsertSale): Promise<Sale> {
    console.log("Criando venda com dados:", JSON.stringify(saleData, null, 2));

    // Verificar se o número da ordem de serviço já existe
    const orderNumberExists = await this.getSaleByOrderNumber(saleData.orderNumber);
    
    if (orderNumberExists) {
      console.log(`🔄 ATENÇÃO: Número de ordem de serviço '${saleData.orderNumber}' já existe. Gerando novo número...`);
      
      try {
        // Buscar as últimas vendas para encontrar o maior número
        const latestSales = await this.getLatestSales(10);
        
        // Tentar encontrar o maior número numérico
        let highestNumber = 0;
        
        for (const sale of latestSales) {
          // Verificar se o número da ordem é numérico
          const numericValue = parseInt(sale.orderNumber);
          if (!isNaN(numericValue) && numericValue > highestNumber) {
            highestNumber = numericValue;
          }
        }
        
        // Gerar novo número incrementando o maior encontrado
        const newOrderNumber = (highestNumber + 1).toString();
        console.log(`🔄 Gerado novo número sequencial: ${newOrderNumber}`);
        
        // Atualizar o número da ordem na venda
        saleData.orderNumber = newOrderNumber;
      } catch (error) {
        console.error("🔄 Erro ao gerar novo número de ordem:", error);
        // Gerar um número baseado em timestamp como fallback
        saleData.orderNumber = `${Date.now()}`;
        console.log(`🔄 Gerado número de emergência baseado em timestamp: ${saleData.orderNumber}`);
      }
    }

    // Precisamos garantir que o totalAmount seja preservado
    // Vamos extrair ele antes da inserção
    const userTotalAmount = saleData.totalAmount;
    
    // Extraímos as datas de instalações se existirem (propriedade customizada)
    // @ts-ignore - Esta propriedade vem do frontend
    const installmentDates = saleData.installmentDates;
    // @ts-ignore - Removemos para não causar erro na inserção
    delete saleData.installmentDates;

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
    
    // 🔄🔄🔄 SUPER-CORREÇÃO V3 (26/04/2025) 🔄🔄🔄
    // OBJETIVO: Garantir ABSOLUTA consistência entre o número de parcelas e as parcelas criadas
    
    // 1. Primeiro, extraímos e validamos o número de parcelas informado
    let requestedInstallments = createdSale.installments;
    
    // Validação extrema do número de parcelas
    if (typeof requestedInstallments !== 'number' || isNaN(requestedInstallments) || requestedInstallments <= 0) {
      console.log(`🔄 ALERTA: Número de parcelas inválido [${requestedInstallments}], tipo: ${typeof requestedInstallments}`);
      requestedInstallments = 1; // Valor padrão seguro
    } else {
      // Garantir que é um inteiro
      requestedInstallments = Math.floor(requestedInstallments);
    }
    
    console.log(`🔄 SUPER CORREÇÃO V3: Processando venda ${createdSale.id} com ${requestedInstallments} parcelas (número validado)`);
    
    // 2. Atualizar o valor na venda (para garantir consistência absoluta)
    try {
      await db
        .update(sales)
        .set({ installments: requestedInstallments })
        .where(eq(sales.id, createdSale.id));
        
      // Atualizar também o objeto em memória
      createdSale.installments = requestedInstallments;
      
      console.log(`🔄 SUPER CORREÇÃO V3: Número de parcelas atualizado para ${requestedInstallments} na venda ${createdSale.id}`);
    } catch (error) {
      console.error("🔄 ERRO ao atualizar número de parcelas:", error);
    }
    
    // 3. Verificar se já existem parcelas e removê-las
    try {
      const existingInstallments = await this.getSaleInstallments(createdSale.id);
      if (existingInstallments.length > 0) {
        console.log(`🔄 SUPER CORREÇÃO V3: Removendo ${existingInstallments.length} parcelas existentes da venda ${createdSale.id}`);
        await this.deleteSaleInstallments(createdSale.id);
      }
    } catch (error) {
      console.error("🔄 ERRO ao verificar/remover parcelas existentes:", error);
    }
    
    // 4. Processar datas de vencimento e criar parcelas
    if (installmentDates && Array.isArray(installmentDates)) {
      try {
        console.log(`⚠️⚠️⚠️ SOLUÇÃO DEFINITIVA (28/04/2025): Usando ${installmentDates.length} datas definidas pelo usuário`);
        
        // Verificar o formato das datas para debug
        installmentDates.forEach((date, idx) => {
          console.log(`⚠️⚠️⚠️ DATA DEFINIDA PELO USUÁRIO #${idx+1}:`, date, "tipo:", typeof date);
        });
        
        // Calcular o valor de cada parcela (valor igual para todas as parcelas)
        const totalAmount = parseFloat(createdSale.totalAmount);
        const installmentAmount = (totalAmount / installmentDates.length).toFixed(2); // Usar o número de datas recebidas
        
        console.log(`⚠️⚠️⚠️ SOLUÇÃO DEFINITIVA: Total ${totalAmount} dividido em ${installmentDates.length} parcelas de ${installmentAmount}`);
        
        // Usar EXATAMENTE as datas fornecidas pelo usuário
        let datesToUse = [...installmentDates];
        
        // Importante: não modificamos as datas escolhidas pelo usuário
        console.log(`⚠️⚠️⚠️ SOLUÇÃO DEFINITIVA: Usando ${datesToUse.length} datas EXATAMENTE como definido pelo usuário`);
        
        // SOLUÇÃO DEFINITIVA: Se o número de datas for diferente do número de parcelas, ajustamos o número de parcelas
        // para corresponder às datas fornecidas pelo usuário
        if (datesToUse.length !== requestedInstallments) {
          console.log(`⚠️⚠️⚠️ SOLUÇÃO DEFINITIVA: Número de datas (${datesToUse.length}) é diferente do número de parcelas (${requestedInstallments})`);
          console.log(`⚠️⚠️⚠️ SOLUÇÃO DEFINITIVA: Ajustando o número de parcelas para ${datesToUse.length} para corresponder às datas fornecidas`);
          
          // Atualizar o número de parcelas na venda para corresponder às datas fornecidas
          requestedInstallments = datesToUse.length;
          
          // Atualizar também no banco de dados
          await db
            .update(sales)
            .set({ installments: requestedInstallments })
            .where(eq(sales.id, createdSale.id));
            
          // E atualizar também o objeto em memória
          createdSale.installments = requestedInstallments;
        }
        
        // REVISÃO FINAL ABSOLUTA (26/04/2025): Garantir formato YYYY-MM-DD sem nenhuma informação de timezone 
        const installmentsToCreate = datesToUse.map((dueDate: string | Date, index: number) => {
          // Verificar se a data já está no formato ISO YYYY-MM-DD
          // Se já estiver nesse formato, usamos diretamente sem conversão adicional
          let formattedDate = '';
          
          console.log(`🚨 REVISÃO FINAL ABSOLUTA - Parcela ${index+1}: Data recebida: [${String(dueDate)}], tipo: ${typeof dueDate}`);
          
          // Tratamento por tipo de dados
          if (typeof dueDate === 'string') {
            // Remover qualquer parte T00:00:00.000Z da data
            if (dueDate.includes('T')) {
              formattedDate = dueDate.split('T')[0];
              console.log(`🚨 REVISÃO FINAL ABSOLUTA - Removido T00:00:00.000Z da data: [${formattedDate}]`);
            } else {
              // Já está no formato desejado
              formattedDate = dueDate;
              console.log(`🚨 REVISÃO FINAL ABSOLUTA - Data já está no formato correto: [${formattedDate}]`);
            }
          } 
          // Se for um objeto Date, converter para YYYY-MM-DD manualmente
          else if (dueDate instanceof Date) {
            formattedDate = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}-${String(dueDate.getDate()).padStart(2, '0')}`;
            console.log(`🚨 REVISÃO FINAL ABSOLUTA - Convertido Date para string: [${formattedDate}]`);
          } 
          // Para outros tipos ou valores inválidos (como undefined/null)
          else {
            // Usar data atual como fallback
            const today = new Date();
            formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            console.log(`🚨 REVISÃO FINAL ABSOLUTA - Usando data atual como fallback: [${formattedDate}]`);
          }
          
          console.log(`🔍 Parcela ${index+1}: Data original: [${dueDate}], Data final: [${formattedDate}]`);
          
          return {
            saleId: createdSale.id,
            installmentNumber: index + 1,
            dueDate: formattedDate, // Usar a data exatamente como recebida (ou com T removido)
            amount: installmentAmount,
            status: 'pending',
            notes: null
          };
        });
        
        // Sempre criamos as parcelas
        await this.createSaleInstallments(installmentsToCreate);
        console.log(`💰 CORREÇÃO V2: ${installmentsToCreate.length} parcelas criadas com sucesso para a venda ${createdSale.id}`);
        
      } catch (error) {
        console.error("💰 CORREÇÃO V2: Erro ao criar parcelas:", error);
      }
    } else {
      // Se não temos datas de vencimento, criamos com datas automáticas
      try {
        console.log(`🔄 SUPER CORREÇÃO V3: Sem datas de vencimento, criando ${requestedInstallments} parcelas automaticamente`);
        
        const totalAmount = parseFloat(createdSale.totalAmount);
        const installmentAmount = (totalAmount / requestedInstallments).toFixed(2);
        
        // Criar parcelas com vencimentos mensais
        const installmentsToCreate = [];
        const baseDate = new Date();
        
        for (let i = 0; i < requestedInstallments; i++) {
          // Criar data de vencimento para a parcela
          const dueDate = new Date(baseDate);
          dueDate.setMonth(baseDate.getMonth() + i);
          
          // Formatar em YYYY-MM-DD sem componente de tempo
          const formattedDate = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}-${String(dueDate.getDate()).padStart(2, '0')}`;
          
          console.log(`🔍 Parcela automática ${i+1}: Data formatada: ${formattedDate}`);
          
          installmentsToCreate.push({
            saleId: createdSale.id,
            installmentNumber: i + 1,
            dueDate: formattedDate,
            amount: installmentAmount,
            status: 'pending',
            notes: null
          });
        }
        
        await this.createSaleInstallments(installmentsToCreate);
        console.log(`🔄 SUPER CORREÇÃO V3: ${installmentsToCreate.length} parcelas automáticas criadas com sucesso para a venda ${createdSale.id}`);
      } catch (error) {
        console.error("🔄 SUPER CORREÇÃO V3: Erro ao criar parcelas automáticas:", error);
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
      
      // Extraímos as datas de instalações se existirem (propriedade customizada)
      // @ts-ignore - Esta propriedade vem do frontend
      const installmentDates = saleData.installmentDates;
      // @ts-ignore - Removemos para não causar erro na inserção
      delete saleData.installmentDates;
      
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
      
      // ⚠️⚠️⚠️ SOLUÇÃO DEFINITIVA (28/04/2025): Se temos datas de parcelas, sempre usamos elas independente de outras condições
      if (installmentDates && Array.isArray(installmentDates)) {
        try {
          // Remover parcelas existentes
          await this.deleteSaleInstallments(id);
          
          console.log(`⚠️⚠️⚠️ SOLUÇÃO DEFINITIVA: Recriando ${installmentDates.length} parcelas para a venda ${id} com as datas definidas pelo usuário`);
          
          // ⚠️⚠️⚠️ SOLUÇÃO DEFINITIVA: Sempre ajustar o número de parcelas para corresponder às datas fornecidas
          if (installmentDates.length !== updatedSale.installments) {
            console.log(`⚠️⚠️⚠️ SOLUÇÃO DEFINITIVA: Número de datas (${installmentDates.length}) é diferente do número de parcelas (${updatedSale.installments})`);
            console.log(`⚠️⚠️⚠️ SOLUÇÃO DEFINITIVA: Ajustando o número de parcelas para ${installmentDates.length} para corresponder às datas fornecidas`);
            
            // Atualizar o número de parcelas na venda para corresponder às datas fornecidas
            await db
              .update(sales)
              .set({ installments: installmentDates.length })
              .where(eq(sales.id, id));
              
            // Atualizar também o objeto em memória para refletir a correção
            updatedSale.installments = installmentDates.length;
          }
          
          // Calcular o valor de cada parcela (valor igual para todas as parcelas)
          const totalAmount = parseFloat(updatedSale.totalAmount);
          const installmentAmount = (totalAmount / installmentDates.length).toFixed(2);
            
          console.log(`⚠️⚠️⚠️ SOLUÇÃO DEFINITIVA: Total ${totalAmount} dividido em ${installmentDates.length} parcelas de ${installmentAmount}`);
          
          console.log(`⚠️⚠️⚠️ SOLUÇÃO DEFINITIVA: Usando ${installmentDates.length} datas EXATAMENTE como definido pelo usuário (atualização)`);
            
          // SOLUÇÃO DEFINITIVA (28/04/2025): Garantir formato YYYY-MM-DD sem nenhuma informação de timezone 
          const installmentsToCreate = installmentDates.map((dueDate: string | Date, index: number) => {
            // Verificar se a data já está no formato ISO YYYY-MM-DD
            let formattedDate = '';
            
            console.log(`⚠️⚠️⚠️ SOLUÇÃO DEFINITIVA - Parcela ${index+1}: Data recebida: [${String(dueDate)}], tipo: ${typeof dueDate}`);
            
            // Tratamento por tipo de dados
            if (typeof dueDate === 'string') {
              // Remover qualquer parte T00:00:00.000Z da data
              if (dueDate.includes('T')) {
                formattedDate = dueDate.split('T')[0];
                console.log(`⚠️⚠️⚠️ SOLUÇÃO DEFINITIVA - Removido T00:00:00.000Z da data: [${formattedDate}]`);
              } else {
                // Já está no formato desejado
                formattedDate = dueDate;
                console.log(`⚠️⚠️⚠️ SOLUÇÃO DEFINITIVA - Data já está no formato correto: [${formattedDate}]`);
              }
            } 
            // Se for um objeto Date, converter para YYYY-MM-DD manualmente
            else if (dueDate instanceof Date) {
              formattedDate = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}-${String(dueDate.getDate()).padStart(2, '0')}`;
              console.log(`⚠️⚠️⚠️ SOLUÇÃO DEFINITIVA - Convertido Date para string: [${formattedDate}]`);
            }
            // Para outros tipos ou valores inválidos (como undefined/null)
            else {
              // Usar data atual como fallback
              const today = new Date();
              formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
              console.log(`⚠️⚠️⚠️ SOLUÇÃO DEFINITIVA - Usando data atual como fallback: [${formattedDate}]`);
            }
            
            console.log(`⚠️⚠️⚠️ SOLUÇÃO DEFINITIVA - Parcela ${index+1} (atualização): Data original: ${dueDate}, Data final: ${formattedDate}`);
            
            return {
              saleId: id,
              installmentNumber: index + 1,
              dueDate: formattedDate, // Usar a data exatamente como formatada
              amount: installmentAmount,
              status: 'pending',
              notes: null
            };
          });
            
          // Criar as parcelas se tiver alguma
          if (installmentsToCreate.length > 0) {
            await this.createSaleInstallments(installmentsToCreate);
            console.log(`⚠️⚠️⚠️ SOLUÇÃO DEFINITIVA: ${installmentsToCreate.length} parcelas recriadas com sucesso para a venda ${id}`);
          }
        } catch (error) {
          console.error(`⚠️⚠️⚠️ ERRO: Falha ao atualizar parcelas da venda #${id}:`, error);
        }
      }
      
      return updatedSale || undefined;
    } catch (error) {
      console.error(`Erro ao atualizar venda #${id}:`, error);
      return undefined;
    }
  }

  async deleteSale(id: number): Promise<boolean> {
    try {
      // Primeiro excluir os itens relacionados
      await db.delete(saleItems).where(eq(saleItems.saleId, id));
      
      // Excluir as parcelas relacionadas
      await this.deleteSaleInstallments(id);
      
      // Depois excluir a venda
      const [deletedSale] = await db
        .delete(sales)
        .where(eq(sales.id, id))
        .returning();
        
      return !!deletedSale;
    } catch (error) {
      console.error(`Erro ao excluir venda #${id}:`, error);
      return false;
    }
  }
  
  async getSalesPaginated(options: {
    page: number;
    limit: number;
    status?: string;
    financialStatus?: string; // Novo parâmetro para filtrar por status financeiro
    sellerId?: number;
    searchTerm?: string;
    sortField?: string;
    sortDirection?: 'asc' | 'desc';
    startDate?: string;
    endDate?: string;
  }): Promise<{
    data: (Sale & { customerName?: string })[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      financialStatus, // Novo parâmetro extraído das opções
      sellerId, 
      searchTerm, 
      sortField = 'createdAt', 
      sortDirection = 'desc',
      startDate,
      endDate
    } = options;
    
    console.log(`Buscando vendas paginadas: página ${page}, limite ${limit}, status operacional: ${status || 'não definido'}, status financeiro: ${financialStatus || 'não definido'}, intervalo de datas: ${startDate || 'não definido'} a ${endDate || 'não definido'}`);
    
    // Usar SQL direto para obter vendas com informações de cliente
    const { pool } = await import('./db');
    
    // Construir a consulta base que inclui o join com clientes
    let queryText = `
      SELECT s.*, c.name as customer_name
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
    `;
    
    const queryParams: any[] = [];
    let whereConditions: string[] = [];
    
    // Adicionar condições de filtro
    if (status) {
      queryParams.push(status);
      whereConditions.push(`s.status = $${queryParams.length}`);
    }
    
    if (financialStatus) {
      queryParams.push(financialStatus);
      whereConditions.push(`s.financial_status = $${queryParams.length}`);
    }
    
    if (sellerId) {
      queryParams.push(sellerId);
      whereConditions.push(`s.seller_id = $${queryParams.length}`);
    }
    
    // Adicionar cláusula WHERE se houver condições
    if (whereConditions.length > 0) {
      queryText += ` WHERE ${whereConditions.join(' AND ')}`;
    }
    
    // Adicionar ordenação
    // Converter nomes de campos camelCase para snake_case para SQL
    const fieldMapping: Record<string, string> = {
      'createdAt': 'created_at',
      'updatedAt': 'updated_at',
      'totalAmount': 'total_amount',
      'orderNumber': 'order_number',
      'customerId': 'customer_id',
      'paymentMethodId': 'payment_method_id',
      'sellerId': 'seller_id',
      'serviceTypeId': 'service_type_id',
      'serviceProviderId': 'service_provider_id',
      'financialStatus': 'financial_status',
      'customerName': 'customer_name'
    };
    
    // Usar o nome do campo mapeado ou o original se não tiver mapeamento
    const sqlFieldName = fieldMapping[sortField] || sortField;
    
    // Tratar campos especiais que não pertencem diretamente à tabela sales
    if (sortField === 'customerName') {
      // customer_name vem da tabela customers
      queryText += ` ORDER BY c.name ${sortDirection.toUpperCase()}`;
    } else {
      queryText += ` ORDER BY s.${sqlFieldName} ${sortDirection.toUpperCase()}`;
    }
    
    // Adicionar paginação
    queryParams.push(limit);
    queryParams.push((page - 1) * limit);
    queryText += ` LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}`;
    
    // Executar a consulta
    const result = await pool.query(queryText, queryParams);
    
    // Obter o total de registros para calcular a paginação
    let countQuery = `
      SELECT COUNT(*) AS total 
      FROM sales s
    `;
    
    if (whereConditions.length > 0) {
      countQuery += ` WHERE ${whereConditions.join(' AND ')}`;
    }
    
    const countResult = await pool.query(countQuery, queryParams.slice(0, whereConditions.length));
    const totalRecords = parseInt(countResult.rows[0].total);
    
    // Mapear os resultados para o formato esperado
    const salesWithCustomerNames = result.rows.map(row => {
      return {
        id: row.id,
        orderNumber: row.order_number,
        customerId: row.customer_id,
        customerName: row.customer_name,
        paymentMethodId: row.payment_method_id,
        sellerId: row.seller_id,
        serviceTypeId: row.service_type_id,
        serviceProviderId: row.service_provider_id,
        totalAmount: row.total_amount,
        installments: row.installments,
        installmentValue: row.installment_value,
        status: row.status,
        financialStatus: row.financial_status,
        notes: row.notes,
        date: row.date,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    });
    
    // Adicionar busca por termo se foi fornecido
    if (searchTerm && searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      
      // Construir condição para WHERE
      whereConditions.push(`(LOWER(s.order_number) LIKE $${queryParams.length + 1} OR LOWER(c.name) LIKE $${queryParams.length + 1})`);
      queryParams.push(`%${term}%`);
      
      // Refazer consulta com pesquisa
      queryText = `
        SELECT s.*, c.name as customer_name
        FROM sales s
        LEFT JOIN customers c ON s.customer_id = c.id
        WHERE ${whereConditions.join(' AND ')}
      `;
      
      // Adicionar ordenação específica para o campo customerName
      if (sortField === 'customerName') {
        queryText += ` ORDER BY c.name ${sortDirection.toUpperCase()}`;
      } else {
        queryText += ` ORDER BY s.${sqlFieldName} ${sortDirection.toUpperCase()}`;
      }
      
      queryText += ` LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
      `;
      
      queryParams.push(limit);
      queryParams.push((page - 1) * limit);
      
      // Executar a consulta com o filtro
      const searchResult = await pool.query(queryText, queryParams);
      
      // Atualizar os resultados
      const filteredSales = searchResult.rows.map(row => ({
        id: row.id,
        orderNumber: row.order_number,
        customerId: row.customer_id,
        customerName: row.customer_name,
        paymentMethodId: row.payment_method_id,
        sellerId: row.seller_id,
        serviceTypeId: row.service_type_id,
        serviceProviderId: row.service_provider_id,
        totalAmount: row.total_amount,
        installments: row.installments,
        installmentValue: row.installment_value,
        status: row.status,
        financialStatus: row.financial_status,
        notes: row.notes,
        date: row.date,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
      
      // Atualizar contagem
      const newCountResult = await pool.query(
        `SELECT COUNT(*) AS total FROM sales s LEFT JOIN customers c ON s.customer_id = c.id WHERE ${whereConditions.join(' AND ')}`,
        queryParams.slice(0, -2)
      );
      
      const filteredTotal = parseInt(newCountResult.rows[0].total);
      
      // Calcular paginação
      const totalPages = Math.ceil(filteredTotal / limit);
      
      console.log(`Retornando ${filteredSales.length} vendas de um total de ${filteredTotal}`);
      
      return {
        data: filteredSales,
        total: filteredTotal,
        page,
        totalPages
      };
    }
    
    // Calcular paginação
    const totalPages = Math.ceil(totalRecords / limit);
    
    console.log(`Retornando ${salesWithCustomerNames.length} vendas de um total de ${totalRecords}`);
    
    return {
      data: salesWithCustomerNames,
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

  // Métodos de gerenciamento de parcelas
  async getSaleInstallments(saleId: number): Promise<SaleInstallment[]> {
    return await db
      .select()
      .from(saleInstallments)
      .where(eq(saleInstallments.saleId, saleId))
      .orderBy(saleInstallments.installmentNumber);
  }
  
  async getSaleInstallment(id: number): Promise<SaleInstallment | undefined> {
    const [installment] = await db
      .select()
      .from(saleInstallments)
      .where(eq(saleInstallments.id, id));
    return installment || undefined;
  }
  
  async createSaleInstallment(installmentData: InsertSaleInstallment): Promise<SaleInstallment> {
    const [createdInstallment] = await db
      .insert(saleInstallments)
      .values(installmentData)
      .returning();
    return createdInstallment;
  }
  
  async createSaleInstallments(installmentsData: InsertSaleInstallment[]): Promise<SaleInstallment[]> {
    try {
      console.log("🔧 CORREÇÃO FINAL: CRIANDO PARCELAS COM DATAS EXATAMENTE PRESERVADAS");
      
      if (installmentsData.length === 0) {
        console.log("⚠️ ERRO: Nenhuma parcela fornecida para criação");
        return [];
      }
      
      // Verificar a venda associada e atualizar o número de parcelas no banco se necessário
      const saleId = installmentsData[0].saleId;
      const numInstallments = installmentsData.length;
      
      console.log(`🔍 Parcelas a criar para venda #${saleId}: ${numInstallments}`);
      
      // Debug das datas para verificar o formato
      installmentsData.forEach((installment, index) => {
        console.log(`📆 Parcela #${index + 1}, data: ${installment.dueDate}, tipo: ${typeof installment.dueDate}`);
      });
      
      // Atualizar o campo de parcelas na venda para garantir consistência
      try {
        await db
          .update(sales)
          .set({ 
            installments: numInstallments,
            updatedAt: new Date()
          })
          .where(eq(sales.id, saleId));
        
        console.log(`✅ Venda #${saleId} atualizada com ${numInstallments} parcelas`);
      } catch (updateError) {
        console.error("❌ ERRO ao atualizar número de parcelas na venda:", updateError);
      }
      
      // SOLUÇÃO FINAL: Usar SQL nativo para garantir 100% que as datas sejam preservadas
      // sem nenhuma conversão automática pelo ORM ou driver de banco
      try {
        // Importar pool para usar SQL nativo
        const { pool } = await import('./db');
        
        // Deletar parcelas existentes
        await pool.query('DELETE FROM sale_installments WHERE sale_id = $1', [saleId]);
        console.log(`🗑️ Parcelas existentes removidas para venda #${saleId}`);
        
        // Preparar query com texto SQL puro para evitar manipulação de tipos
        let insertQuery = `
          INSERT INTO sale_installments 
            (sale_id, installment_number, due_date, amount, status, notes) 
          VALUES 
        `;
        
        const queryParams = [];
        let paramIndex = 1;
        
        // Construir valores para cada parcela
        installmentsData.forEach((installment, index) => {
          if (index > 0) {
            insertQuery += ', ';
          }
          
          insertQuery += `($${paramIndex++}, $${paramIndex++}, $${paramIndex++}::text, $${paramIndex++}, $${paramIndex++}, $${paramIndex++})`;
          
          // Forçar o tipo text para a data para evitar conversões automáticas
          queryParams.push(
            installment.saleId,
            installment.installmentNumber,
            String(installment.dueDate), // Força conversão para texto
            installment.amount,
            installment.status || 'pending',
            installment.notes
          );
        });
        
        insertQuery += ' RETURNING *';
        
        console.log(`🔄 Executando SQL direto: ${installmentsData.length} parcelas`);
        
        // Executar a query diretamente
        const result = await pool.query(insertQuery, queryParams);
        const createdInstallments = result.rows;
        
        console.log(`✅ ${createdInstallments.length} parcelas criadas com sucesso via SQL`);
        console.log(`📅 Datas salvas no banco:`, createdInstallments.map(i => i.due_date));
        
        // Mapear para o formato esperado
        return createdInstallments.map(row => ({
          id: row.id,
          saleId: row.sale_id,
          installmentNumber: row.installment_number,
          dueDate: row.due_date, // A data está exatamente como fornecida pelo usuário
          amount: row.amount,
          status: row.status,
          notes: row.notes,
          createdAt: row.created_at
        }));
      } catch (sqlError) {
        console.error("🛑 ERRO CRÍTICO na abordagem SQL:", sqlError);
        
        // NUNCA voltamos para o ORM, pois ele vai converter as datas
        // Em vez disso, lançamos um erro para que o problema seja visível
        throw new Error(`Falha ao salvar parcelas com datas exatas: ${sqlError.message}`);
      }
    } catch (error) {
      console.error("❌ ERRO ao criar parcelas:", error);
      throw error;
    }
  }
  
  async updateSaleInstallment(id: number, installmentData: Partial<InsertSaleInstallment>): Promise<SaleInstallment | undefined> {
    const [updatedInstallment] = await db
      .update(saleInstallments)
      .set(installmentData)
      .where(eq(saleInstallments.id, id))
      .returning();
    return updatedInstallment || undefined;
  }
  
  async deleteSaleInstallments(saleId: number): Promise<boolean> {
    const result = await db
      .delete(saleInstallments)
      .where(eq(saleInstallments.saleId, saleId))
      .returning();
    return result.length > 0;
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

  // Implementação dos métodos de custos operacionais
  async getSaleOperationalCosts(saleId: number): Promise<SaleOperationalCost[]> {
    return db.select().from(saleOperationalCosts).where(eq(saleOperationalCosts.saleId, saleId));
  }

  async getSaleOperationalCost(id: number): Promise<SaleOperationalCost | undefined> {
    const [cost] = await db.select().from(saleOperationalCosts).where(eq(saleOperationalCosts.id, id));
    return cost || undefined;
  }

  async createSaleOperationalCost(costData: InsertSaleOperationalCost): Promise<SaleOperationalCost> {
    const [createdCost] = await db
      .insert(saleOperationalCosts)
      .values(costData)
      .returning();
    return createdCost;
  }

  async updateSaleOperationalCost(id: number, costData: Partial<InsertSaleOperationalCost>): Promise<SaleOperationalCost | undefined> {
    const [updatedCost] = await db
      .update(saleOperationalCosts)
      .set({
        ...costData,
        updatedAt: new Date()
      })
      .where(eq(saleOperationalCosts.id, id))
      .returning();
    return updatedCost || undefined;
  }

  async deleteSaleOperationalCost(id: number): Promise<boolean> {
    const [deletedCost] = await db
      .delete(saleOperationalCosts)
      .where(eq(saleOperationalCosts.id, id))
      .returning();
    return !!deletedCost;
  }

  // Implementação dos métodos de comprovantes de pagamento
  async getSalePaymentReceipts(installmentId: number): Promise<SalePaymentReceipt[]> {
    return db.select().from(salePaymentReceipts).where(eq(salePaymentReceipts.installmentId, installmentId));
  }

  async getSalePaymentReceipt(id: number): Promise<SalePaymentReceipt | undefined> {
    const [receipt] = await db.select().from(salePaymentReceipts).where(eq(salePaymentReceipts.id, id));
    return receipt || undefined;
  }

  async createSalePaymentReceipt(receiptData: InsertSalePaymentReceipt): Promise<SalePaymentReceipt> {
    const [createdReceipt] = await db
      .insert(salePaymentReceipts)
      .values(receiptData)
      .returning();
    return createdReceipt;
  }

  async updateSalePaymentReceipt(id: number, receiptData: Partial<InsertSalePaymentReceipt>): Promise<SalePaymentReceipt | undefined> {
    const [updatedReceipt] = await db
      .update(salePaymentReceipts)
      .set(receiptData)
      .where(eq(salePaymentReceipts.id, id))
      .returning();
    return updatedReceipt || undefined;
  }

  async deleteSalePaymentReceipt(id: number): Promise<boolean> {
    const [deletedReceipt] = await db
      .delete(salePaymentReceipts)
      .where(eq(salePaymentReceipts.id, id))
      .returning();
    return !!deletedReceipt;
  }

  // Método para confirmar pagamento de parcela
  async confirmInstallmentPayment(
    installmentId: number, 
    userId: number, 
    paymentDate: Date | string, 
    receiptData?: { type: string, url?: string, data?: any, notes?: string }
  ): Promise<SaleInstallment | undefined> {
    // Obter parcela
    const installment = await this.getSaleInstallment(installmentId);
    if (!installment) return undefined;
    
    // Processar a data de pagamento para garantir formato correto
    // Se for um objeto Date, extrair apenas a parte da data no formato YYYY-MM-DD
    // Se for uma string, garantir que está no formato YYYY-MM-DD
    let formattedPaymentDate: string;
    
    if (typeof paymentDate === 'string') {
      // Se já for string, remover qualquer componente de tempo
      formattedPaymentDate = paymentDate.includes('T') 
        ? paymentDate.split('T')[0] 
        : paymentDate;
    } else {
      // Se for Date, extrair apenas a parte da data no formato YYYY-MM-DD
      formattedPaymentDate = `${paymentDate.getFullYear()}-${String(paymentDate.getMonth() + 1).padStart(2, '0')}-${String(paymentDate.getDate()).padStart(2, '0')}`;
    }
    
    console.log(`🔍 Confirmação de pagamento: Data original recebida: ${paymentDate}, Data formatada: ${formattedPaymentDate}`);
    
    // Atualizar status da parcela para paga com a data formatada
    const [updatedInstallment] = await db
      .update(saleInstallments)
      .set({
        status: 'paid',
        paymentDate: formattedPaymentDate, // Usar a data formatada corretamente
        updatedAt: new Date()
      })
      .where(eq(saleInstallments.id, installmentId))
      .returning();
    
    // Se temos dados de comprovante, registrá-lo
    if (receiptData) {
      await this.createSalePaymentReceipt({
        installmentId,
        receiptType: receiptData.type,
        receiptUrl: receiptData.url || null,
        receiptData: receiptData.data ? receiptData.data : null,
        confirmedBy: userId,
        notes: receiptData.notes || null
      });
    }
    
    // Verificar se todas as parcelas desta venda estão pagas
    const saleId = installment.saleId;
    const allInstallments = await this.getSaleInstallments(saleId);
    const allPaid = allInstallments.every(inst => inst.status === 'paid');
    
    // Se todas estiverem pagas, atualizar o status financeiro da venda
    if (allPaid) {
      await this.markSaleAsPaid(saleId, userId);
    } else {
      // Caso contrário, definir como parcialmente pago
      await db
        .update(sales)
        .set({
          financialStatus: 'partial',
          updatedAt: new Date()
        })
        .where(eq(sales.id, saleId));
    }
    
    return updatedInstallment;
  }
  
  // Cost Types methods implementation
  async getCostTypes(): Promise<CostType[]> {
    return await db.select().from(costTypes);
  }

  async getCostType(id: number): Promise<CostType | undefined> {
    const [costType] = await db.select().from(costTypes).where(eq(costTypes.id, id));
    return costType || undefined;
  }
  
  async getCostTypeByName(name: string): Promise<CostType | undefined> {
    // Buscar todos os tipos de custo para verificar (usando lowercase para comparação insensitiva)
    const allCostTypes = await db.select().from(costTypes);
    
    // Encontrar tipo de custo com o mesmo nome (comparação case-insensitive)
    const foundCostType = allCostTypes.find(costType => 
      costType.name.toLowerCase() === name.toLowerCase()
    );
    
    return foundCostType;
  }

  async createCostType(costTypeData: InsertCostType): Promise<CostType> {
    const [createdCostType] = await db
      .insert(costTypes)
      .values({
        name: costTypeData.name,
        description: costTypeData.description,
        active: costTypeData.active
      })
      .returning();
    return createdCostType;
  }

  async updateCostType(id: number, costTypeData: Partial<InsertCostType>): Promise<CostType | undefined> {
    const [updatedCostType] = await db
      .update(costTypes)
      .set(costTypeData)
      .where(eq(costTypes.id, id))
      .returning();
    return updatedCostType || undefined;
  }

  async deleteCostType(id: number): Promise<boolean> {
    const [deletedCostType] = await db
      .delete(costTypes)
      .where(eq(costTypes.id, id))
      .returning();
    return !!deletedCostType;
  }
  
  // Métodos para gerenciar custos operacionais - usando SQL nativo para compatibilidade com o banco de dados
  async getSaleOperationalCosts(saleId: number): Promise<SaleOperationalCost[]> {
    try {
      // Usar SQL puro para lidar com a tabela recém-criada
      const result = await pool.query(
        `SELECT * FROM sale_operational_costs WHERE sale_id = $1 ORDER BY created_at DESC`,
        [saleId]
      );
      
      return result.rows.map(row => ({
        id: row.id,
        saleId: row.sale_id,
        description: row.description,
        costTypeId: row.cost_type_id,
        amount: row.amount,
        date: row.date,  // Mantendo como string para compatibilidade
        responsibleId: row.responsible_id || null,
        serviceProviderId: row.service_provider_id || null,
        notes: row.notes || null,
        paymentReceiptUrl: row.payment_receipt_url || null,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      }));
    } catch (error) {
      console.error("Erro ao buscar custos operacionais:", error);
      return [];
    }
  }
  
  async getSaleOperationalCost(id: number): Promise<SaleOperationalCost | undefined> {
    try {
      const result = await pool.query(
        `SELECT * FROM sale_operational_costs WHERE id = $1`,
        [id]
      );
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      const row = result.rows[0];
      return {
        id: row.id,
        saleId: row.sale_id,
        description: row.description,
        costTypeId: row.cost_type_id,
        amount: row.amount,
        date: row.date,  // Mantendo como string para compatibilidade
        responsibleId: row.responsible_id || null,
        serviceProviderId: row.service_provider_id || null,
        notes: row.notes || null,
        paymentReceiptUrl: row.payment_receipt_url || null,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      };
    } catch (error) {
      console.error("Erro ao buscar custo operacional:", error);
      return undefined;
    }
  }
  
  async createSaleOperationalCost(data: Partial<InsertSaleOperationalCost>): Promise<SaleOperationalCost> {
    try {
      // Garantir que temos o ID do usuário atual (responsável)
      const responsibleId = data.responsibleId || 1; // Usar ID 1 (admin) como fallback
      
      // Garantir que temos uma data
      const date = data.date || new Date().toISOString().split('T')[0];
      
      const result = await pool.query(
        `INSERT INTO sale_operational_costs 
         (sale_id, description, cost_type_id, amount, date, responsible_id, 
          service_provider_id, notes, payment_receipt_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          data.saleId,
          data.description || '',
          data.costTypeId,
          data.amount,
          date,
          responsibleId,
          data.serviceProviderId || null,
          data.notes || null,
          data.paymentReceiptUrl || null
        ]
      );
      
      const row = result.rows[0];
      return {
        id: row.id,
        saleId: row.sale_id,
        description: row.description,
        costTypeId: row.cost_type_id,
        amount: row.amount,
        date: row.date,  // Mantendo como string para compatibilidade
        responsibleId: row.responsible_id,
        serviceProviderId: row.service_provider_id || null,
        notes: row.notes || null,
        paymentReceiptUrl: row.payment_receipt_url || null,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      };
    } catch (error) {
      console.error("Erro ao criar custo operacional:", error);
      throw error;
    }
  }
  
  async updateSaleOperationalCost(id: number, data: Partial<InsertSaleOperationalCost>): Promise<SaleOperationalCost | undefined> {
    try {
      // Construir a query de atualização com base nos campos fornecidos
      const updates = [];
      const values = [];
      let paramIndex = 1;
      
      // Para cada campo que pode ser atualizado
      if (data.description !== undefined) {
        updates.push(`description = $${paramIndex++}`);
        values.push(data.description);
      }
      
      if (data.costTypeId !== undefined) {
        updates.push(`cost_type_id = $${paramIndex++}`);
        values.push(data.costTypeId);
      }
      
      if (data.amount !== undefined) {
        updates.push(`amount = $${paramIndex++}`);
        values.push(data.amount);
      }
      
      if (data.date !== undefined) {
        updates.push(`date = $${paramIndex++}`);
        values.push(data.date);
      }
      
      if (data.responsibleId !== undefined) {
        updates.push(`responsible_id = $${paramIndex++}`);
        values.push(data.responsibleId);
      }
      
      if (data.serviceProviderId !== undefined) {
        updates.push(`service_provider_id = $${paramIndex++}`);
        values.push(data.serviceProviderId);
      }
      
      if (data.notes !== undefined) {
        updates.push(`notes = $${paramIndex++}`);
        values.push(data.notes);
      }
      
      if (data.paymentReceiptUrl !== undefined) {
        updates.push(`payment_receipt_url = $${paramIndex++}`);
        values.push(data.paymentReceiptUrl);
      }
      
      // Sempre atualizar o updated_at
      updates.push(`updated_at = $${paramIndex++}`);
      values.push(new Date());
      
      // Se não há nada para atualizar, retornar undefined
      if (updates.length === 0) {
        return undefined;
      }
      
      // Adicionar o ID ao final dos valores
      values.push(id);
      
      const result = await pool.query(
        `UPDATE sale_operational_costs 
         SET ${updates.join(', ')}
         WHERE id = $${paramIndex}
         RETURNING *`,
        values
      );
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      const row = result.rows[0];
      return {
        id: row.id,
        saleId: row.sale_id,
        description: row.description,
        costTypeId: row.cost_type_id,
        amount: row.amount,
        date: row.date,  // Mantendo como string para compatibilidade
        responsibleId: row.responsible_id,
        serviceProviderId: row.service_provider_id || null,
        notes: row.notes || null,
        paymentReceiptUrl: row.payment_receipt_url || null,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      };
    } catch (error) {
      console.error("Erro ao atualizar custo operacional:", error);
      return undefined;
    }
  }
  
  async deleteSaleOperationalCost(id: number): Promise<boolean> {
    try {
      const result = await pool.query(
        `DELETE FROM sale_operational_costs WHERE id = $1 RETURNING id`,
        [id]
      );
      
      return result.rows.length > 0;
    } catch (error) {
      console.error("Erro ao excluir custo operacional:", error);
      return false;
    }
  }
}

export const storage = new DatabaseStorage();
