import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import dotenv from "dotenv";

dotenv.config();

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres:your_secure_password_change_me@localhost:5432/deadmansswitch";

// For migrations, we need to use a different connection
const migrationClient = postgres(connectionString, {
  max: 1,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

const db = drizzle(migrationClient);

async function main() {
  console.log("🔄 Running migrations...");

  try {
    await migrate(db, { migrationsFolder: "./src/db/migrations" });
    console.log("✅ Migrations completed successfully");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }

  await migrationClient.end();
}

main();
