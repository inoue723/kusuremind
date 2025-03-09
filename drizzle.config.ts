import type { Config } from 'drizzle-kit';

export default {
  schema: './utils/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  driver: 'expo',
} satisfies Config;