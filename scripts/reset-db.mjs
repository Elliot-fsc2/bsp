import "dotenv/config";
import mysql from "mysql2/promise";

const url = process.env.DATABASE_URL;

if (!url) {
  console.error("DATABASE_URL is required. Create a .env file (see .env.example).");
  process.exit(1);
}

const connection = await mysql.createConnection(url);

try {
  const [databaseRows] = await connection.query("SELECT DATABASE() AS name");
  const database = databaseRows[0]?.name;

  if (!database) {
    throw new Error("No database selected. Check the database name in DATABASE_URL.");
  }

  await connection.query(
    `ALTER DATABASE \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci`,
  );
  console.log(`[✓] Database \`${database}\` set to utf8mb4 / utf8mb4_general_ci`);

  const [rows] = await connection.query(
    "SELECT table_name AS name FROM information_schema.tables WHERE table_schema = DATABASE()",
  );
  const tables = rows.map((row) => row.name);

  if (tables.length === 0) {
    console.log("[i] No tables to drop.");
  } else {
    await connection.query("SET FOREIGN_KEY_CHECKS = 0");
    for (const table of tables) {
      await connection.query(`DROP TABLE IF EXISTS \`${table}\``);
    }
    await connection.query("SET FOREIGN_KEY_CHECKS = 1");
    console.log(`[✓] Dropped ${tables.length} table(s): ${tables.join(", ")}`);
  }
} finally {
  await connection.end();
}
