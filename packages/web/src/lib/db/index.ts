import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const sql = neon(process.env.DATABASE_URL!);

/** Drizzle ORM database client configured for Neon serverless PostgreSQL. */
export const db = drizzle(sql, { schema });

/** Type alias for the Drizzle database instance. */
export type DB = typeof db;
