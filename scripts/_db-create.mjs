import mysql from "mysql2/promise";

const c = await mysql.createConnection({ host: "127.0.0.1", port: 3306, user: "root", password: "" });
await c.query("CREATE DATABASE IF NOT EXISTS `bsp_lms` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci");
const [rows] = await c.query("SELECT SCHEMA_NAME AS s, DEFAULT_CHARACTER_SET_NAME AS cs FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = 'bsp_lms'");
console.log(rows);
await c.end();
