import "dotenv/config";
import crypto from "node:crypto";
import fs from "node:fs";
import mysql from "mysql2/promise";

// The bsp production database already has this schema from the Laravel port.
// Drizzle has no history there, so `migrate` would try to re-create every table
// and abort. Record the existing migrations once, then let drizzle take over.
const url = process.env.DATABASE_URL;
if (!url) {
  console.log("No DATABASE_URL; skipping baseline.");
  process.exit(0);
}

const journal = JSON.parse(fs.readFileSync("drizzle/meta/_journal.json", "utf8"));

async function hasTable(connection, table) {
  const [rows] = await connection.query(
    "SELECT COUNT(*) AS n FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?",
    [table],
  );
  return rows[0].n > 0;
}

const connection = await mysql.createConnection(url);
try {
  if (!(await hasTable(connection, "users"))) {
    console.log("Fresh database; migrations will create the schema.");
  } else if (await hasTable(connection, "__drizzle_migrations")) {
    console.log("Drizzle migration history already present.");
  } else {
    await connection.query(
      "CREATE TABLE `__drizzle_migrations` (id serial primary key, hash text not null, created_at bigint)",
    );
    for (const entry of journal.entries) {
      const sql = fs.readFileSync(`drizzle/${entry.tag}.sql`, "utf8");
      const hash = crypto.createHash("sha256").update(sql).digest("hex");
      await connection.query(
        "INSERT INTO `__drizzle_migrations` (hash, created_at) VALUES (?, ?)",
        [hash, entry.when],
      );
    }
    console.log(`Baselined ${journal.entries.length} migration(s) at the existing schema.`);
  }
} finally {
  await connection.end();
}
