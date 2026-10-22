# DeMolay LMS - Local MySQL Installation Guide

This project is a **Next.js** learning-management system (LMS) that uses **MySQL** as its database.
The database layer is written with **Drizzle ORM**. This guide explains how to install and run
everything on your local computer from scratch.

## What you need

| Requirement | Recommended | Notes |
| --- | --- | --- |
| Node.js | 20.17 or newer (`node -v`) | LTS recommended. Comes with `npm`. |
| MySQL | MySQL 8.0 / MariaDB 10.4+ | XAMPP ships MariaDB and is the easiest option on Windows. |
| Git (optional) | - | Only if you pull the code from a repository. |

## Installation steps

### 1. Install and start MySQL

Choose one option:

**Option A - XAMPP (easiest on Windows)**
1. Download XAMPP from <https://www.apachefriends.org> and install it.
2. Open the **XAMPP Control Panel** and click **Start** next to **MySQL**.

**Option B - Standalone MySQL**
1. Install **MySQL Community Server 8.x** from <https://dev.mysql.com/downloads/mysql/>.
   During setup you choose a `root` password.
2. Make sure the **MySQL** service is running.

Verify MySQL is reachable on port **3306**.

### 2. Create the database

Open a MySQL prompt:

- XAMPP: click **Shell** in the XAMPP Control Panel, then run `mysql -u root` (the default XAMPP
  root password is empty).
- Standalone MySQL: run `mysql -u root -p` and enter the root password you chose.

Then run:

```sql
CREATE DATABASE demolay_lms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

> **Important:** the `CHARACTER SET utf8mb4 ...` part is required. XAMPP's MariaDB default charset
> is `latin1`, which **cannot store emoji**; creating the database without this line is the most
> common cause of seeding failures (see Troubleshooting).

### 3. Create the `.env` file

Copy the example environment file:

```bash
copy .env.example .env
```

Edit `.env` and set `DATABASE_URL` to match your MySQL setup:

- **XAMPP** (root, no password):

```
DATABASE_URL=mysql://root@127.0.0.1:3306/demolay_lms
```

- **Standalone MySQL** (root with a password):

```
DATABASE_URL=mysql://root:YOUR_PASSWORD@127.0.0.1:3306/demolay_lms
```

> `drizzle.config.ts` reads the same `DATABASE_URL`, so the database name only lives in one
> place. That database must already exist (step 2). This guide uses `demolay_lms`; if you pick a
> different name, change it in `.env` and create that database instead.

If you also want transactional confirmation e-mails, fill in the `SMTP_*` values. Leaving them
blank is fine for local use - e-mail events are just logged on the server instead.

### 4. Install project dependencies

```bash
npm install
```

### 5. Create the tables (migrations)

Apply the committed baseline migration:

```bash
npm run db:migrate
```

- The table structure is defined in `src/db/schema.ts`. After changing the schema, run
  `npm run db:generate` to create a migration, then `npm run db:migrate` to apply it.
- `npm run db:push` still exists for quick local experiments, but CI and deploys use
  `db:migrate` so the schema change is reproducible.

### 6. Start the app

```bash
npm run dev
```

Open <http://localhost:3000> in your browser.

### 7. First run + seeded demo data

On the very first page visit the app seeds itself automatically (see `ensureSeed()` in
`src/lib/seed.ts`). It creates the levels, lessons, question banks, a settings row, and demo users.

Use these sign-in accounts:

| Role | Email | Password |
| --- | --- | --- |
| Admin / Council | `council@demolaypathway.org` | `Admin123!` |
| Student | `member@demolaypathway.org` | `Member123!` |

Additional demo students use `Member123!` as well (e.g. `marcus@demolaypathway.org`,
`owen@demolaypathway.org` and the seeds in `src/lib/demo-seed.ts`).

## Useful commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the app in development mode |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Lint the code |
| `npm run typecheck` | Type-check with `tsc --noEmit` |
| `npm run db:push` | Sync tables directly from `src/db/schema.ts` |
| `npm run db:generate` | Create a new migration folder under `drizzle/` |
| `npm run db:migrate` | Apply generated migrations |
| `npm run db:studio` | Open Drizzle Studio, a browser database browser |

## Troubleshooting

- **`ECONNREFUSED 127.0.0.1:3306`** - MySQL is not running. Start it in XAMPP or the Windows
  services panel (`services.msc` -> MySQL).
- **`ER_ACCESS_DENIED_ERROR` / Access denied** - Wrong credentials in `DATABASE_URL`. XAMPP's
  default root password is empty (`mysql://root@...`, no `:password`).
- **`ER_BAD_DB_ERROR: Unknown database`** - You forgot step 2. Create the `demolay_lms` database
  first.
- **Port 3306 already in use** - Another MySQL/PostgreSQL service occupies the port. Change the
  port in XAMPP config, or point `DATABASE_URL` at the correct port (e.g. `...:3307/...`).
- **`A table without an explicit charset` warnings** - Only a warning, but check the actual table
  charset. On XAMPP/MariaDB the server default is `latin1`, and `db:push` copies it - so emoji
  insert/seed operations then fail even though the connection itself is `utf8mb4`.
- **`ER_TRUNCATED_WRONG_VALUE_FOR_FIELD Incorrect string value: '\xF0...' for column ...`** -
  The database or table was created with the `latin1` charset. Fix it in place:

  ```sql
  ALTER DATABASE demolay_lms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  ALTER TABLE <table> CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  ```

  Run the `ALTER TABLE ... CONVERT` for every table, then verify with
  `SHOW CREATE TABLE <table>;` (look for `DEFAULT CHARSET=utf8mb4`). The safe alternative is to
  drop the database and re-run step 2 (with the `utf8mb4` clause) plus `npm run db:push`.
- **Missing `drizzle/` folder** - The baseline migration is committed under `drizzle/`. If it is
  missing, run `npm run db:generate` to recreate it from `src/db/schema.ts`.

## Notes about the conversion

The project originally targeted PostgreSQL. It now uses MySQL end to end:

- `src/db/schema.ts` - rewritten with `drizzle-orm/mysql-core` (`mysqlTable`, `int`
  auto-increment primary keys, `json` instead of `jsonb`).
- `src/db/index.ts` - connects through `mysql2/promise` plus `drizzle-orm/mysql2`.
- `drizzle.config.ts` - `dialect: "mysql"`, reading `DATABASE_URL`.
- Queries that were PostgreSQL-specific (`returning()`, `onConflictDoNothing`,
  `count(*) filter (where ...)`) were replaced with MySQL-compatible equivalents
  (`$returningId()`, `onDuplicateKeyUpdate`, `sum(case when ...)`).