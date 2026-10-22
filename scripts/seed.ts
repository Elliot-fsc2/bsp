import "dotenv/config";
import { pool } from "../src/db";
import { ensureSeeded } from "../src/db/seed";

async function main() {
  try {
    await ensureSeeded();
    console.log("Seed complete.");
  } catch (error) {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
