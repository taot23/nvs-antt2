import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { services, serviceTypes, serviceProviders, sales, saleItems, salesStatusHistory, costTypes } from './shared/schema';
import ws from 'ws';

// Configure o WebSocket para Neon
neonConfig.webSocketConstructor = ws;

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  console.log('Connecting to database...');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle({ client: pool });

  console.log('Creating services table...');
  
  // Criar tabela services com SQL direto para evitar problemas com drizzle-kit push
  await pool.query(`
    CREATE TABLE IF NOT EXISTS services (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      price TEXT NOT NULL,
      duration INTEGER,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at INTEGER NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()))
    );
  `);

  console.log('Services table created successfully!');
  
  console.log('Creating service_types table...');
  
  // Criar tabela service_types com SQL direto para evitar problemas com drizzle-kit push
  await pool.query(`
    CREATE TABLE IF NOT EXISTS service_types (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at INTEGER NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()))
    );
  `);

  console.log('Service Types table created successfully!');
  
  console.log('Creating service_providers table...');
  
  // Criar tabela service_providers com SQL direto para evitar problemas com drizzle-kit push
  await pool.query(`
    CREATE TABLE IF NOT EXISTS service_providers (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      document TEXT NOT NULL,
      document_type TEXT NOT NULL DEFAULT 'cpf',
      contact_name TEXT,
      phone TEXT NOT NULL,
      phone2 TEXT,
      email TEXT NOT NULL,
      address TEXT,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
  `);

  console.log('Service Providers table created successfully!');
  
  console.log('Creating sales table...');
  
  // Criar tabela sales
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sales (
      id SERIAL PRIMARY KEY,
      order_number TEXT NOT NULL,
      date DATE NOT NULL,
      customer_id INTEGER NOT NULL,
      payment_method_id INTEGER NOT NULL,
      seller_id INTEGER NOT NULL,
      total_amount TEXT NOT NULL DEFAULT '0',
      status TEXT NOT NULL DEFAULT 'pending',
      execution_status TEXT NOT NULL DEFAULT 'pending',
      financial_status TEXT NOT NULL DEFAULT 'pending',
      notes TEXT,
      return_reason TEXT,
      responsible_operational_id INTEGER,
      responsible_financial_id INTEGER,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
  `);

  console.log('Sales table created successfully!');
  
  console.log('Creating sale_items table...');
  
  // Criar tabela sale_items
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sale_items (
      id SERIAL PRIMARY KEY,
      sale_id INTEGER NOT NULL,
      service_id INTEGER NOT NULL,
      service_type_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      price TEXT NOT NULL,
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
  `);

  console.log('Sale Items table created successfully!');
  
  console.log('Creating sales_status_history table...');
  
  // Criar tabela sales_status_history
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sales_status_history (
      id SERIAL PRIMARY KEY,
      sale_id INTEGER NOT NULL,
      from_status TEXT NOT NULL,
      to_status TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
  `);

  console.log('Sales Status History table created successfully!');
  
  console.log('Creating cost_types table...');
  
  // Criar tabela cost_types
  await pool.query(`
    CREATE TABLE IF NOT EXISTS cost_types (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
  `);

  console.log('Cost Types table created successfully!');
  
  await pool.end();
}

main().catch(e => {
  console.error('Error running migration:', e);
  process.exit(1);
});