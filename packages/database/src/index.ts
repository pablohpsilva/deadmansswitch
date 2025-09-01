// Export database connection
export { db } from "./connection";

// Export all schema tables and types
export * from "./schema";

// Re-export common drizzle-orm utilities
export { eq, and, or, not, sql, desc, asc } from "drizzle-orm";
