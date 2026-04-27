import { defineConfig } from "drizzle-kit";

const CONNECTION_URL = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;

if (!CONNECTION_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: CONNECTION_URL,
  },
});
