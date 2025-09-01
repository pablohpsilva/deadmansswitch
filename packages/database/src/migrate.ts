import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { db } from "./connection";

export async function runMigrations(migrationsFolder: string = "./migrations") {
  console.log("🔄 Running migrations...");

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

  const migrationDb = drizzle(migrationClient);

  try {
    await migrate(migrationDb, { migrationsFolder });
    console.log("✅ Migrations completed successfully");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await migrationClient.end();
  }
}

// Run directly if this file is executed
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations()
    .then(() => {
      console.log("Migration completed. Exiting.");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration failed:", error);
      process.exit(1);
    });
}
