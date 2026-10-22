import mysql from "mysql2/promise";

const c = await mysql.createConnection({
  host: "127.0.0.1",
  port: 3306,
  user: "root",
  password: "",
  database: "bsp_lms",
});

const [tables] = await c.query(
  "SELECT TABLE_NAME AS n FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'bsp_lms' ORDER BY TABLE_NAME",
);

for (const { n } of tables) {
  const [rows] = await c.query(`SELECT COUNT(*) AS c FROM \`${n}\``);
  console.log(`${n.padEnd(22)} ${rows[0].c}`);
}

const [cols] = await c.query(
  "SELECT COLUMN_NAME AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='bsp_lms' AND TABLE_NAME='users' ORDER BY ORDINAL_POSITION",
);
console.log("\nusers columns: " + cols.map((x) => x.c).join(", "));

const [sample] = await c.query(
  "SELECT email, role, google_email IS NULL AS no_gdrive FROM bsp_lms.users ORDER BY role, email LIMIT 20",
);
console.table(sample);

await c.end();
