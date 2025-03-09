import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import * as schema from './schema';

// Open the SQLite database
const expoSqliteDb = openDatabaseSync('kusuremind.db');

// Create the drizzle database instance
export const db = drizzle(expoSqliteDb, { schema });

// Export the schema
export * from './schema';