import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  user: process.env.PGUSER || 'postgres',
  database: process.env.PGDATABASE || 'kaveri',
  password: process.env.PGPASSWORD || 'postgres',
  port: parseInt(process.env.PGPORT || '5432', 10),
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const pgDb = {
  query: (text: string, params?: any[]) => pool.query(text, params),
  
  async queryAll<T = any>(text: string, params?: any[]): Promise<T[]> {
    const res = await pool.query(text, params);
    return res.rows as T[];
  },
  
  async queryGet<T = any>(text: string, params?: any[]): Promise<T | undefined> {
    const res = await pool.query(text, params);
    return res.rows[0] as T | undefined;
  },

  getPool: () => pool,
};

pool.on('error', (err: any) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
});
