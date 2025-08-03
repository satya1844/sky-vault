import {drizzle} from "drizzle-orm/neon-http";
import {neon} from "@neondatabase/serverless";

import * as schema from "./schema";

// Lazy initialize database connection
let db: ReturnType<typeof drizzle> | null = null;
let sql: ReturnType<typeof neon> | null = null;

function getDatabase() {
  if (!db) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("No database connection string was provided. Please set DATABASE_URL environment variable.");
    }
    sql = neon(databaseUrl);
    db = drizzle(sql, {schema});
  }
  return db;
}

function getSql() {
  if (!sql) {
    getDatabase(); // This will initialize both sql and db
  }
  return sql!;
}

// Export the lazy-loaded database instance
export { getDatabase as db, getSql as sql };