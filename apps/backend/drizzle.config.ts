import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "../../packages/database/src/schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ||
      "postgresql://postgres:your_secure_password_change_me@localhost:5432/deadmansswitch",
  },
  verbose: true,
  strict: true,
});
