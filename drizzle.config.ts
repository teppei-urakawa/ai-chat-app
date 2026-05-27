import { defineConfig } from 'drizzle-kit'
import { loadEnvConfig } from '@next/env'

// .env.local を読み込む
loadEnvConfig(process.cwd())

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
