import mysql from "mysql2/promise";

const tries = [
  ["root", ""],
  ["root", "root"],
  ["root", "admin123"],
];

for (const [user, password] of tries) {
  try {
    const c = await mysql.createConnection({ host: "127.0.0.1", port: 3306, user, password });
    const [v] = await c.query("SELECT VERSION() AS v");
    const [d] = await c.query(
      "SELECT SCHEMA_NAME AS s FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = 'bsp_lms'",
    );
    console.log(`OK user=${user} pass=${JSON.stringify(password)} mysql=${v[0].v} bsp_lms=${d.length > 0}`);
    if (d.length > 0) {
      const [t] = await c.query(
        "SELECT TABLE_NAME AS n, TABLE_ROWS AS r FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'bsp_lms'",
      );
      console.log(`tables=${t.length} -> ${t.map((x) => `${x.n}(${x.r})`).join(", ")}`);
      if (t.length > 0) {
        const [u] = await c.query("SELECT COUNT(*) AS n FROM bsp_lms.users");
        console.log(`users rows=${u[0].n}`);
      }
    }
    await c.end();
    process.exit(0);
  } catch (e) {
    console.log(`FAIL user=${user} pass=${JSON.stringify(password)} code=${e.code}`);
  }
}
process.exit(1);
