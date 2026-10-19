# Running the Laravel app in XAMPP (Windows)

This guide runs the Laravel port of the BSP Advancement Portal on a Windows machine with XAMPP.
XAMPP is used **only for its MySQL/MariaDB server** — the app itself is served by PHP's built-in
server (`php artisan serve`), exactly like the original Next.js app didn't need Apache either.

---

## ⚠️ Read this first: XAMPP's PHP is too old

Laravel 13 requires **PHP 8.3 or newer**.

XAMPP bundles its own PHP, and on this machine that PHP is **8.2.12**:

```powershell
& 'C:\xampp\php\php.exe' -v     # -> PHP 8.2.12  (TOO OLD for this app)
```

That means you **cannot** run the app with `C:\xampp\php\php.exe`, and you cannot run it through
XAMPP's Apache (Apache loads the same 8.2 PHP). You need a PHP 8.3+ binary for anything that touches
the app: `composer`, `php artisan`, and `php artisan serve`.

This machine already has one at **`C:\php83\php.exe`** (PHP 8.3.33), which is what this guide uses.

```powershell
& 'C:\php83\php.exe' -v         # -> PHP 8.3.33  (use THIS one)
```

> Throughout the guide, every `php ...` command means `& 'C:\php83\php.exe' ...`.
> If you put `C:\php83` on your `PATH` before `C:\xampp\php`, you can just type `php`.
> **Do not** swap in `C:\xampp\php\php.exe` — Composer and Artisan will refuse to run.
>
> If you'd rather use one PHP for everything, install the XAMPP build that ships PHP 8.3+ (or a
> standalone PHP 8.3+), then Apache would also work — see [Appendix B](#appendix-b-running-behind-xampps-apache-optional).

---

## What you need

| Tool | Version needed | Status on this PC |
| --- | --- | --- |
| XAMPP (for MySQL/MariaDB) | any recent | ✅ Installed at `C:\xampp` (MariaDB 10.4.32) |
| PHP (standalone, for the app) | **8.3+** | ✅ `C:\php83\php.exe` — PHP 8.3.33 |
| Composer | 2.x | ❌ Not installed — see Step 3 |
| Node.js + npm | 20+ | ✅ Node v24.18.0 |

Required PHP extensions — `C:\php83\php.exe` already has all of them:
`pdo_mysql`, `mbstring`, `openssl`, `tokenizer`, `ctype`, `json`, `bcmath`, `fileinfo`, `curl`, `xml`.

Check them any time with:

```powershell
& 'C:\php83\php.exe' -m | Select-String 'pdo_mysql|mbstring|openssl|tokenizer|bcmath|fileinfo|curl'
```

---

## Quick start (copy-paste)

If everything is already set up (DB created, Composer installed), this is the whole thing:

```powershell
cd C:\Users\AtoZ\Downloads\build-playful-lms-platform\laravel

# 1. Install PHP + front-end dependencies
composer install
npm install --include=dev
npm run build

# 2. Create the schema and demo data (first run only)
php artisan migrate --seed

# 3. Serve the app
php artisan serve
```

Open <http://127.0.0.1:8000> and log in with a demo account (password `laginghanda`):

| Role | Email |
| --- | --- |
| Council Admin | `admin@bsp.org.ph` |
| Scout Leader | `miguel@bsp.org.ph` |
| Scout | `paolo@bsp.org.ph` |

First time? Do Steps 1–8 below.

---

## Step 1 — Start MySQL in XAMPP

1. Open **XAMPP Control Panel** (`C:\xampp\xampp-control.exe`).
2. Click **Start** next to **MySQL**.
   *(Apache is not needed — leave it stopped unless you want the Apache option in Appendix B.)*
3. Confirm it is listening on port **3306** (the default):

```powershell
Get-NetTCPConnection -LocalPort 3306 -State Listen -ErrorAction SilentlyContinue
```

If that prints a row, MySQL is up.

> **Port quirk:** in this XAMPP's `C:\xampp\mysql\bin\my.ini`, the server (`[mysqld]`) uses
> **3306** but the `[client]` section says `port=3307`. The app connects over TCP to 3306, so it is
> unaffected — but if you ever use the bundled `mysql.exe` from the command line, pass `-P 3306`
> (e.g. `C:\xampp\mysql\bin\mysql.exe -P 3306 -u root`), otherwise it will try 3307 and fail.

---

## Step 2 — Create the database

You only need an **empty** database — Laravel creates every table for you.

> **The database MUST be `utf8mb4`.** The portal stores emoji (⚜️, 🌱, 🏕️ …). If it is not
> `utf8mb4`, `php artisan migrate` fails with *"Incorrect string value"*.

**Option A — phpMyAdmin (easiest).** In the XAMPP Control Panel click **Admin** next to MySQL
(opens <http://localhost/phpmyadmin>), open the **SQL** tab and run:

```sql
CREATE DATABASE IF NOT EXISTS bsp_lms
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_general_ci;
```

**Option B — UI.** Click **New** in the sidebar → Database name `bsp_lms` →
**Collation: `utf8mb4_general_ci`** → **Create**. (Don't leave it on a `latin1` option.)

**Option C — command line** (note `-P 3306`):

```powershell
& 'C:\xampp\mysql\bin\mysql.exe' -P 3306 -u root -e "CREATE DATABASE IF NOT EXISTS bsp_lms CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;"
```

Verify the charset:

```sql
SELECT DEFAULT_CHARACTER_SET_NAME, DEFAULT_COLLATION_NAME
FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = 'bsp_lms';
-- expect: utf8mb4 / utf8mb4_general_ci
```

---

## Step 3 — Install Composer

Composer is not installed on this machine. Pick one:

**Option A — local `composer.phar` (no system changes, recommended here):**

```powershell
cd C:\Users\AtoZ\Downloads\build-playful-lms-platform\laravel
Invoke-WebRequest -Uri "https://getcomposer.org/download/latest-stable/composer.phar" -OutFile composer.phar
& 'C:\php83\php.exe' composer.phar -V      # -> Composer version 2.x
```

Then run Composer as `& 'C:\php83\php.exe' composer.phar <command>`.

**Option B — global install.** Download and run
[Composer-Setup.exe](https://getcomposer.org/Composer-Setup.exe) and, when it asks for the PHP
executable, point it at **`C:\php83\php.exe`** (not XAMPP's).

> Under the hood, the global `composer` is just the same `composer.phar` — either way it must run
> under PHP 8.3, or it will error out on this project's `"php": "^8.3"` requirement.

---

## Step 4 — Install the PHP dependencies

From the project's `laravel` folder:

```powershell
cd C:\Users\AtoZ\Downloads\build-playful-lms-platform\laravel
composer install        # or:  & 'C:\php83\php.exe' composer.phar install
```

This pulls Laravel 13, Livewire, and the dev tools (PHPUnit, Pint) into `vendor/`.

---

## Step 5 — Configure the connection (`.env`)

A ready-to-use `.env` is already included and points at the XAMPP defaults. Open
`laravel\.env` and check the database block:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=bsp_lms
DB_USERNAME=root
DB_PASSWORD=
DB_CHARSET=utf8mb4
DB_COLLATION=utf8mb4_general_ci
```

- A fresh XAMPP has **user `root` with an empty password**, so `DB_PASSWORD=` stays blank.
- **If you set a MySQL root password in XAMPP**, put it after the `=`:
  `DB_PASSWORD=yourpassword`. Wrong credentials show up as
  `SQLSTATE[HY000] [1045] Access denied for user 'root'@'localhost'`.
- If you did not copy `.env` (it is git-ignored), create it first:
  `Copy-Item .env.example .env`.

Also make sure the app key exists (the included `.env` already has one):

```powershell
php artisan key:generate      # only if APP_KEY is empty
```

---

## Step 6 — Install front-end deps and build the CSS/JS

The Blade pages load Tailwind + Livewire assets through Vite, so you must build them once
(and again whenever views change).

```powershell
npm install --include=dev
npm run build
```

> **Why `--include=dev`?** This machine's npm is configured with `omit=dev`, so a plain
> `npm install` silently skips Vite/Tailwind and `npm run build` fails with
> *"'vite' is not recognized"*. The flag forces the dev tools in.
> If your npm doesn't omit dev dependencies, plain `npm install` is fine.

---

## Step 7 — Create the tables and load the demo data

```powershell
php artisan migrate --seed
```

- `migrate` creates all 15 tables (`users`, `sessions`, `programs`, `badges`,
  `badge_requirements`, `submissions`, `approvals`, `awarded_badges`, …).
- `--seed` inserts the first-run demo data: 15 members, 3 programs, 17 badges,
  33 requirements, and sample submissions/approvals so the review queue is populated.

The seeder only runs on an **empty** database, so re-running it is safe (it does nothing if
users already exist).

> **Already created `bsp_lms` for the Next.js app?** That database already contains tables with the
> same names (created by Drizzle), so `php artisan migrate` will stop with
> *"table 'users' already exists"*. Either drop and recreate the database first (Appendix A), or
> point `DB_DATABASE` at a fresh name such as `bsp_lms_laravel` (create it in Step 2).

Handy extras:

```powershell
php artisan migrate:fresh --seed   # wipe and rebuild everything (destructive)
php artisan db:seed                # run the seeder only
```

---

## Step 8 — Run the app

```powershell
php artisan serve
```

It prints `Server running on [http://127.0.0.1:8000]`. Open that in your browser.

- Log in with any demo account (password `laginghanda`).
- To use a different port: `php artisan serve --port=8080`.
- Stop the server with **Ctrl + C**.
- `APP_URL` in `.env` should match (it is `http://localhost:8000` by default); if you change the
  port, update `APP_URL` too so Livewire's asset URLs stay correct.

> `artisan serve` runs under **whichever PHP invoked it**. Always invoke it with
> `C:\php83\php.exe` (or `php` once `C:\php83` is earlier on `PATH`) — never XAMPP's 8.2 binary.

---

## Everyday commands

| Task | Command |
| --- | --- |
| Start the app | `php artisan serve` |
| Rebuild CSS/JS after editing views | `npm run build` |
| Watch assets while developing | `npm run dev` |
| Create/update tables | `php artisan migrate` |
| Reset + reseed the demo data | `php artisan migrate:fresh --seed` |
| Run the test suite (in-memory SQLite, no MySQL needed) | `php artisan test` |
| Check code style | `php vendor\bin\pint` |
| Clear cached views/config | `php artisan view:clear` · `php artisan config:clear` |
| Open a REPL | `php artisan tinker` |

---

## Troubleshooting

| Problem | Fix |
| --- | --- |
| `Your requirements could not be resolved` / `php is ^8.3` during `composer install` | Composer ran under XAMPP's PHP 8.2. Run it with `& 'C:\php83\php.exe' composer.phar install`. |
| `could not find driver` (`PDOException`) | You're using a PHP without `pdo_mysql`. Use `C:\php83\php.exe` (it has it). |
| `SQLSTATE[HY000] [2002] ... actively refused` | MySQL isn't started (Step 1), or it's on another port. Start it in the XAMPP Control Panel. |
| `SQLSTATE[HY000] [1045] Access denied` | Wrong `DB_USERNAME`/`DB_PASSWORD` in `.env` (Step 5). Blank password for a fresh XAMPP root. |
| `Unknown database 'bsp_lms'` | The database doesn't exist yet — run Step 2, then `php artisan migrate --seed`. |
| `Base table or view already exists: 1050 Table 'users' already exists` | `bsp_lms` already holds the Next.js app's tables. Drop and recreate it (Appendix A) or use a fresh `DB_DATABASE` name. |
| `Incorrect string value: '\xE2\x9A\x9C...'` during migrate/seed | The database isn't `utf8mb4`. Recreate it (Step 2) and migrate again. |
| `npm run build` says `'vite' is not recognized` | Run `npm install --include=dev` (see Step 6). |
| `Vite manifest not found at .../public/build/manifest.json` | Assets weren't built. Run `npm run build`. |
| Page renders unstyled | Same as above — the CSS bundle is missing; run `npm run build`. |
| `500` on every page, log mentions `storage/framework/views` or `bootstrap/cache` | Cache dirs aren't writable. Run `php artisan optimize:clear`, or ensure the `storage` and `bootstrap\cache` folders aren't read-only. |
| Port 8000 already in use | `php artisan serve --port=8081` (and update `APP_URL`). |
| Bundled `mysql.exe` can't connect | Its `[client]` port is 3307; pass `-P 3306`. |
| Dates look shifted | The app stores timestamps in UTC (Laravel's default), same as the original Next.js app. |

Logs live in `laravel\storage\logs\laravel.log`. Set `APP_DEBUG=true` (the default in `.env`) to
see full error pages while developing.

---

## What works today (build status)

- ✅ **Phase 1 — Foundation:** auth (login/register/logout), the full schema, seed data, dashboard.
- ✅ **Phase 2 — Advancement:** programs → rank ladders → merit badges → requirements, the lock
  chains, submissions with proof/quiz, and the two-level Scout Leader → Council Admin approvals.
- ⏳ **Phase 3 — Admin CRUD** (Council office: programs, ranks, badges, requirement editor, users,
  settings, reports) — *not built yet, so those admin routes don't exist*.
- ⏳ **Phase 4 — Community** (announcements, forums, calendar, people) — *not built yet*.
- ⏳ **Phase 5 — Media & polish** (Google Drive uploads, TinyMCE rich-text editor, mobile nav) —
  *not built yet; proof uploads currently save to the council server under `public\uploads`*.

So the pages available after this guide are: `/`, `/login`, `/register`, `/dashboard`,
`/advancement`, `/advancement/{program}`, `/advancement/badge/{id}`,
`/advancement/requirement/{id}`, `/merit-badges`, `/my-advancement`, `/approvals`,
`/approvals/{id}`.

---

## Appendix A — Reset the database from scratch

In the phpMyAdmin **SQL** tab:

```sql
DROP DATABASE bsp_lms;
CREATE DATABASE bsp_lms CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
```

Or, keeping the database but clearing the tables:

```powershell
php artisan migrate:fresh --seed
```

---

## Appendix B — Running behind XAMPP's Apache (optional)

You don't need Apache, but if you want a pretty URL or a shared machine:

1. **First solve the PHP version.** Apache loads XAMPP's PHP (8.2 here), which is too old for this
   app. Either install an XAMPP build that ships PHP 8.3+, or drop a PHP 8.3 that provides
   `php8apache2_4.dll` into Apache's config. Until you do, keeping `php artisan serve` is simpler
   and correct.
2. Point a virtual host at the app's **`public`** folder (never the project root):

```apache
# C:\xampp\apache\conf\extra\httpd-vhosts.conf
<VirtualHost *:80>
    ServerName bsp.local
    DocumentRoot "C:/Users/AtoZ/Downloads/build-playful-lms-platform/laravel/public"
    <Directory "C:/Users/AtoZ/Downloads/build-playful-lms-platform/laravel/public">
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

3. Add `127.0.0.1  bsp.local` to `C:\Windows\System32\drivers\etc\hosts`, restart Apache, then visit
   <http://bsp.local>.
4. Set `APP_URL=http://bsp.local` in `.env` and run `php artisan config:clear`.

> Serving the Laravel project **root** through Apache exposes `.env` and source files. Always
> point the `DocumentRoot` at `.../laravel/public`.
