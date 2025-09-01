// Export database connection
export { db } from "./connection";

// Export all schema tables and types
export * from "./schema";

// Export utilities
export * from "./seed-pricing";
export * from "./seed";
export * from "./migrate";
export * from "./update-existing-users";

// Re-export common drizzle-orm utilities
export { eq, and, or, not, sql, desc, asc } from "drizzle-orm";
