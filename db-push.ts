import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { services, serviceTypes } from './shared/schema';
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
  await pool.end();
}

main().catch(e => {
  console.error('Error running migration:', e);
  process.exit(1);
});