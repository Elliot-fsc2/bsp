import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const globalForDb = globalThis as typeof globalThis & {
  __bspMySqlPool?: mysql.Pool;
};

function createPool() {
  const pool = mysql.createPool({
    uri: databaseUrl,
    connectionLimit: 10,
    charset: "utf8mb4",
    timezone: "Z",
  });

  pool.on("connection", (connection) => {
    connection.query("SET time_zone = '+00:00'");
  });

  return pool;
}

export const pool = globalForDb.__bspMySqlPool ?? createPool();

if (process.env.NODE_ENV !== "production") {
  globalForDb.__bspMySqlPool = pool;
}

export const db = drizzle(pool);
