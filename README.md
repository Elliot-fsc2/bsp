# BSP Advancement Portal — Laravel

A Laravel 13 + Livewire port of the **Boy Scouts of the Philippines (BSP)** advancement portal.
The domain, database schema and seed data are ported 1:1 from the original Next.js + Drizzle app.

> The Next.js app still lives in the parent directory. This Laravel app lives in `laravel/` so the
> two can coexist while the conversion proceeds phase by phase.

> **Running on Windows with XAMPP?** Follow **[XAMPP-GUIDE.md](XAMPP-GUIDE.md)** — it covers the
> one real catch up front: XAMPP's bundled PHP is 8.2, but this app needs PHP 8.3+.

## How the port maps

| Original (Next.js) | This app (Laravel) |
| --- | --- |
| `src/db/schema.ts` (Drizzle, MySQL) | `database/migrations/*` — same tables/columns |
| `src/db/seed.ts` | `database/seeders/BspSeeder.php` |
| `src/lib/auth.ts` (bcrypt + `sessions` table) | `app/Auth/SessionTokenGuard.php` + `config/bsp.php` |
| `src/lib/settings.ts` | `app/Support/SiteSettings.php` |
| `src/lib/richtext.ts` | `app\Support/RichText.php` |
| `src/db/schema.ts` inferred types | `app/Models/*` (Eloquent) |
| Server actions (`src/actions/*`) | Livewire components / controllers *(phases 2–5)* |

## Requirements

- PHP 8.3+ with `pdo_mysql`, `mbstring`, `openssl`, `tokenizer`, `bcmath`, `fileinfo`, `curl`
- Composer
- Node.js (for the Vite/Tailwind asset build)
- MySQL / MariaDB (XAMPP) or SQLite for a zero-setup run

## Setup

```bash
cd laravel
composer install
npm install --include=dev   # this machine's npm omits dev deps by default
npm run build
```

Create the database (must be `utf8mb4` — the portal stores emoji):

```sql
CREATE DATABASE IF NOT EXISTS bsp_lms
  CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
```

Configure `.env` (a ready-to-use file is included for the XAMPP/MariaDB defaults):

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=bsp_lms
DB_USERNAME=admin123
DB_PASSWORD=admin123
```

> **No MySQL running?** Set `DB_CONNECTION=sqlite` and `DB_DATABASE=database/database.sqlite`
> for a quick local run.

Migrate and seed (the seeder only runs on an empty database):

```bash
php artisan migrate
php artisan db:seed
php artisan serve
```

## Log in

All demo accounts use the password `laginghanda`.

| Role | Email |
| --- | --- |
| Council Admin | `admin@bsp.org.ph` |
| Scout Leader | `miguel@bsp.org.ph` |
| Scout | `paolo@bsp.org.ph` |

## Testing

```bash
php artisan test     # runs on in-memory SQLite (see phpunit.xml)
```

## Conversion status

- [x] **Phase 1 — Foundation:** migrations, Eloquent models, custom session-token auth, settings/rich-text helpers, seed data, landing/login/register/dashboard, tests
- [x] **Phase 2 — Advancement:** programs, ranks, merit badges, lock chains, submissions, two-level approvals
- [ ] **Phase 3 — Admin CRUD:** programs/ranks/badges/requirements, categories, users, settings, reports
- [ ] **Phase 4 — Community:** announcements, forums, calendar, people, notifications
- [ ] **Phase 5 — Media & polish:** Google Drive flow, uploads, TinyMCE, app shell, BSP theming
