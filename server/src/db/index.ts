import dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { env } from '../lib/env'; // Import validated environment variables

dotenv.config();

console.log('Connecting to database:', env.DATABASE_URL);

// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(env.DATABASE_URL, { prepare: false });
export const db = drizzle(client, { schema });

export type Database = typeof db;
