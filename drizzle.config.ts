import "dotenv/config";
import type { Config } from "drizzle-kit";

export default {
  dialect: "mysql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "mysql://admin123:admin123@127.0.0.1:3306/bsp_lms",
  },
} satisfies Config;
