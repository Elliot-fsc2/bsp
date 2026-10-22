# Boy Scouts of the Philippines — Advancement Portal (BSP)

An advancement portal for the **Boy Scouts of the Philippines (BSP)**. Scouts choose a program,
work through the requirements of each rank and merit badge, and submit their proof — written
answers, quizzes, video or photo recordings (captured in-app or uploaded), and Google Drive links.
Every requirement is confirmed through a **two-step approval**: a Scout Leader first, then a Council
Admin. Once all requirements are met, the Scout submits the badge for final approval and it is
awarded.

Built with Next.js (App Router), Drizzle ORM, and **MySQL / MariaDB** (the database that ships
with XAMPP).

---

## What's inside

- **Roles** — Council Admin, Scout Leader, and Scout, with separate dashboards.
- **Programs → rank ladder → merit badges** — three programs: **KID Scout Program**, **Boy Scout
  Program**, and **Senior Scout Program**. Each program has an ordered ladder of ranks that must be
  earned in sequence:
  - *Boy Scout Program*: Membership Rank → Tenderfoot Scout Rank → Second Class Scout Rank → First Class Scout Rank
  - *Senior Scout Program*: Membership Rank → Senior Scout Rank → Explorer Scout Rank
  - *KID Scout Program*: Membership Rank → KID Scout Rank

  A rank stays **locked** until the previous rank is earned. Rank requirements include tasks such as
  singing **Lupang Hinirang** (submitted as an uploaded video), reciting the Panunumpa ng Katapatan sa
  Watawat and the Panatang Makabayan, and earning specific **merit badges**. When every task in a rank
  is done, the applicant submits that rank for approval.
- **Programs are levels** — programs are ordered, and a Scout climbs them in sequence: **Level 1**
  (KID) → **Level 2** (Boy) → **Level 3** (Senior). A level shows up on the Advancement page but stays
  **greyed out and un-clickable** until the level before it is finished, and the same lock is enforced
  on the program page, the badge/task pages, and in the server actions. A Scout who already has work in
  a level never loses access to it.
- **“What you still need to do” timeline** — My advancement opens with a step-by-step timeline of the
  Scout's current level: every rank in order with its milestone, and every task with a live status
  (*Approved · Waiting for Scout Leader · Waiting for Council Admin · Needs revision · To do · Locked*).
  Each row is clickable and opens that task's details.
- **Merit badges, on their own page** — a dedicated catalogue (`/merit-badges`, in the sidebar) with
  an **A–Z** letter filter, a search box, and a program filter. Merit badges are **not** listed inside
  programs and are not part of a rank ladder: a Scout browses the catalogue and presses
  **“Apply for this badge”** (then **Continue** / **Submit for approval** as it progresses). Cards and
  badge pages also show **“Required by”** the ranks that need them.
- **Merit badges as rank requirements** — in a rank's requirement editor choose *“Earn a merit badge”*
  and pick the badge; that task is met automatically once the badge is awarded.
- **Advancement categories** — group badges (Outdoor Skills, Safety, Citizenship, …). Admins can
  add, edit, and delete categories and assign a category to any badge.
- **Ranks live under Programs** — open a program under *Council office → Programs → Ranks & badges*
  to add, reorder (↑ ↓), edit, or delete its **ranks** only. Merit badges are managed separately on
  the *All badges* page. The Programs page itself is a **list you re-order by dragging** the handle —
  the order is the level order.
- **Moodle-style rich text** — the editor is self-hosted TinyMCE 6 (`public/tinymce/`) configured like
  Moodle's: a full **menu bar** (File, Edit, View, Insert, Format, Tools, Table, Help), a **paragraph
  styles** dropdown, two wrapped toolbar rows with a sticky toolbar, **word count** in the status bar,
  and insert dialogs for **image** (uploads straight to `/api/upload`), **media**, table, emoticons,
  charmap, code sample, and links. Plus custom “upload image/video from this device” buttons.
- **Two-level approval** — a requirement is complete only after a Scout Leader (level 1) and a
  Council Admin (level 2) both approve. Rejections send it back with a comment.
- **Approvals show every answer** — the approval queue renders each candidate's **full submission
  inline**: written answers, the video or photo proof, attached Drive links, and every quiz question
  with the option the Scout picked, marked right or wrong.
- **Google Drive storage** — Scouts can connect their own Google account and upload proof straight
  into their own Drive, so the council server stores only a link. Optional: see
  [Google Drive storage](#google-drive-storage-optional-but-recommended) below.
- **BSP theming** — default "Forest" (Scout green) theme, `⚜️` trefoil branding, and
  *Laging Handa* (Always Prepared) throughout.
- **Popups everywhere** — every add, edit, and delete across the portal (programs, categories,
  badges, requirements, members, news, forum threads, replies, profile) opens in a popup dialog.
  The dashboard's *Coming up* and *Approval tray* are popups too, and the *Latest news* card shows
  only the newest announcement with a **View all news →** link.
- **Works on phones and tablets** — the sidebar collapses to a drawer and a **bottom navigation bar**
  (Home · Ranks · Badges · Progress/Approvals · More) appears below `lg`.
- **Artwork** — self-contained SVG images in `public/images/` (logo, hero, welcome, and a badge
  patch per rank/merit badge). No external image hosts, so it works offline.
- **First-run seed data** — 15 members (1 Council Admin, 4 Scout Leaders, 10 Scouts), 3 programs,
  17 badges (9 ranks + 8 merit badges), 33 requirements, and in-flight submissions/approvals so the
  review queue is populated.

---

## Prerequisites

| Tool | Version | Notes |
| --- | --- | --- |
| [XAMPP](https://www.apachefriends.org/) | 8.0+ | Provides MySQL/MariaDB on port **3306** |
| [Node.js](https://nodejs.org/) | 18.18+ (20 LTS recommended) | Includes `npm` |

> The app runs on the Next.js dev/production server. XAMPP is used for its **MySQL/MariaDB**
> database only — you do **not** need to place the app inside `htdocs` or run it through Apache.

---

## Step 1 — Start MySQL in XAMPP

1. Open the **XAMPP Control Panel**.
2. Click **Start** next to **MySQL** (Apache is optional for this app).
3. Confirm MySQL is running on port `3306` (the default).

## Step 2 — Create the database

You only need an empty database — the app creates all tables for you.

> **Important — the database MUST be `utf8mb4`.**
> XAMPP's MariaDB defaults to `latin1`, and the portal stores `⚜️` and other emoji/Unicode
> (course icons, announcements). If the database is not `utf8mb4`, `npm run db:push` fails with
> *"Invalid default value for 'icon'"* and inserts fail with *"Incorrect string value"*.

**Recommended — SQL tab.** In the XAMPP Control Panel click **Admin** next to MySQL
(opens `http://localhost/phpmyadmin`), open the **SQL** tab, and run:

```sql
CREATE DATABASE IF NOT EXISTS bsp_lms
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_general_ci;
```

**Or via phpMyAdmin UI.** Click **New** in the sidebar → Database name: `bsp_lms` →
**Collation: `utf8mb4_general_ci`** → **Create**. (Do not leave the collation on a `latin1`
option.)

### Already created it with the wrong charset?

The quickest fix is the built-in reset — it sets the database to `utf8mb4` **and** drops any leftover
tables (a partial `db:push` can otherwise cause `Multiple primary key defined`):

```bash
npm run db:reset
npm run db:push
```

Prefer SQL? Run this in the phpMyAdmin **SQL** tab, then drop and recreate the database so the
tables are rebuilt with the right charset:

```sql
ALTER DATABASE bsp_lms CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
DROP DATABASE bsp_lms;
CREATE DATABASE bsp_lms CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
```

Verify with:

```sql
SELECT DEFAULT_CHARACTER_SET_NAME, DEFAULT_COLLATION_NAME
FROM information_schema.SCHEMATA
WHERE SCHEMA_NAME = 'bsp_lms';
```

The result should be `utf8mb4` / `utf8mb4_general_ci`.

## Step 3 — Install dependencies

From the project folder:

```bash
npm install --include=dev
```

> **Why `--include=dev`?** This machine's npm is configured with `omit=dev`, so a plain
> `npm install` would skip the dev tools (`drizzle-kit`, `typescript`, `eslint`) that
> `npm run db:push` needs. The flag forces them in. If your npm does not omit dev
> dependencies, plain `npm install` is fine too.

## Step 4 — Configure the connection

A ready-to-use `.env` is already included for the XAMPP defaults:

```env
DATABASE_URL="mysql://root:@127.0.0.1:3306/bsp_lms"
```

- Format: `mysql://USER:PASSWORD@HOST:PORT/DATABASE`
- XAMPP's default user is `root` with an **empty password** (`root:@...`).
- If you set a root password in XAMPP, update the string, e.g.
  `mysql://root:yourpassword@127.0.0.1:3306/bsp_lms`.
- Copy `.env.example` to `.env` on a fresh checkout if `.env` is missing.

## Step 5 — Create the tables

Push the schema to MySQL:

```bash
npm run db:push
```

This creates every table (programs, badges, requirements, submissions, approvals, and more).

> **Re-running `db:push`:** if the tables already exist, Drizzle's diff can emit
> `ALTER TABLE ... ADD PRIMARY KEY` and fail with `Multiple primary key defined`. If that happens,
> run `npm run db:reset` (sets utf8mb4 + drops the tables) and then `npm run db:push` once more.
> From then on, change `src/db/schema.ts` and push again — or use `npm run db:migrate`, which applies
> the SQL in `./drizzle` deterministically.

## Step 6 — Run the app

```bash
npm run dev
```

Open **http://localhost:3000**. On first load the app seeds demo data automatically.

For a production build:

```bash
npm run build
npm start
```

## Step 7 — Log in

On the login page you can click a **demo account** chip, or type the details manually.
**All demo accounts use the password `laginghanda`.**

| Role | Email | Password |
| --- | --- | --- |
| Council Admin | `admin@bsp.org.ph` | `laginghanda` |
| Scout Leader | `miguel@bsp.org.ph` | `laginghanda` |
| Scout | `paolo@bsp.org.ph` | `laginghanda` |

Other seeded accounts: `rosario@bsp.org.ph`, `ernesto@bsp.org.ph`, `lucia@bsp.org.ph`
(Scout Leaders); `ana@`, `kian@`, `bea@`, `ella@`, `omar@`, `jasmine@`, `noel@`, `tala@`,
`ivan@bsp.org.ph` (Scouts).

---

## Handy scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run db:push` | Create/update MySQL tables from the schema |
| `npm run db:reset` | Set the database to utf8mb4 and drop all tables (clean slate) |
| `npm run db:generate` | Generate migration SQL into `./drizzle` |
| `npm run db:migrate` | Apply the SQL in `./drizzle` to the database |
| `npm run db:studio` | Open Drizzle Studio to browse the database |
| `npm run typecheck` | TypeScript type check |
| `npm run lint` | ESLint |

---

## How the data layer works

- `src/db/schema.ts` — table definitions (Drizzle `mysql-core`): `programs`, `badge_categories`,
  `badges`, `badge_requirements`, `submissions`, `approvals`, `awarded_badges`, plus users,
  sessions, announcements, forums, notifications, calendar events, and settings.
- `src/db/index.ts` — a `mysql2` connection pool. The session time zone is pinned to **UTC** so
  dates are stored and read consistently.
- `src/db/seed.ts` — first-run demo data (accounts, programs, badges, requirements, and sample
  submissions/approvals).
- `drizzle.config.ts` — reads `DATABASE_URL` from `.env` and points at the schema above.
- `src/app/api/upload/route.ts` — authenticated uploads for proof files (saved under
  `public/uploads/`).

### How advancement works

1. A Scout joins a program and sees the **rank ladder**. Only the first rank (the Membership Rank)
   is open — each later rank stays **locked** until the one before it is earned.
2. They open a task inside the current rank, complete it, and press **Proceed** to submit — a written
   answer (TinyMCE), quiz answers, a recorded or uploaded video/photo, and/or a Google Drive link,
   depending on what the task asks for.
3. A **Scout Leader** approves it (level 1), then a **Council Admin** confirms it (level 2). Two
   approvals complete the task; a rejection returns it with a comment.
4. A task of type *"Earn another badge"* is satisfied automatically once that merit badge is awarded
   — this is how a rank requires a merit badge.
5. When every task in the rank is done, the Scout presses **Submit badge for approval** for that
   rank — again two levels — and the rank is awarded, unlocking the next one.

Admins build all of this under **Council office → Programs** (open a program for its ranks and merit
badges), **→ Categories** (badge categories), and **→ All badges** (edit a badge's requirements with
the built-in quiz builder).

### Resetting the demo data

To start over, clear the database and reload:

```bash
npm run db:reset && npm run db:push
```

Then **restart the server** — the first-run seed runs once per server process, so a restart is what
triggers the fresh seed. (Equivalent SQL: `DROP DATABASE bsp_lms;` then recreate it as utf8mb4.)

---

## Google Drive storage (optional but recommended)

By default a Scout's video and photo proof is written to `public/uploads/` on the machine running the
app. You can switch the portal over to **Google Drive** so the file is stored in the Scout's own Drive
and the council server stores nothing but a file id and a link.

**The file never passes through this server.** The browser asks the app for a short-lived Google access
token, then uploads the bytes straight to `googleapis.com`. The server only keeps the id, the link, and
the sharing state.

### How the flow works

1. The Scout opens **Profile → Connect Google Drive** and signs in with their own Google account
   (`/api/google/connect` → Google → `/api/google/callback`).
2. The app stores an **encrypted** refresh token for that Scout — never their password.
3. On a requirement page, the Scout picks a file. The browser:
   - asks the app for a fresh access token (`POST /api/google/token`),
   - creates a resumable upload session and PUTs the bytes **directly to Google**,
   - tells the app the new file id (`POST /api/google/share`).
4. The app grants read access to the **Connected Google accounts of your Scout Leaders and Council
   Admins**, then saves the file id + link on the submission.
5. Reviewers open **Approvals** and see the video or photo embedded straight from Drive.

### Setup

1. Open <https://console.cloud.google.com/> and create a project.
2. **APIs & services → Library →** enable **Google Drive API**.
3. **APIs & services → OAuth consent screen → External**, fill in the app name, then add your Scout
   Leader and Council Admin Google addresses under **Test users** (leave the app in *Testing*).
4. **Credentials → Create credentials → OAuth client ID → Web application.** Add this authorised
   redirect URI: `http://localhost:3000/api/google/callback`
5. Put the two values in `.env` and restart the app:

```env
GOOGLE_CLIENT_ID="xxxxxxxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxxxxxxx"
APP_URL="http://localhost:3000"
DRIVE_TOKEN_SECRET="a-long-random-string"
```

Generate `DRIVE_TOKEN_SECRET` (it encrypts the stored refresh tokens):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Good to know

- **Scope:** the app asks only for `drive.file` plus the account's email. That means it can see and
  manage **only the files it creates** — it can never browse the rest of the Scout's Drive. Google
  treats this scope as *non-sensitive*, so no Google verification review is needed.
- **Sharing:** if a reviewer has not connected Drive yet, the app falls back to an *anyone-with-the-link*
  share so the work can still be reviewed. Connect the reviewers' Google accounts to keep submissions
  restricted to them.
- **Uploads folder:** files land in a `BSP LMS Submissions` folder in the Scout's own Drive.
- **No Drive configured?** The portal simply uses the server uploader instead, and Profile explains it.
- **Disconnecting** is one click on the Profile page; the refresh token is deleted immediately.

> **Scouts under 13.** Google accounts require a minimum age, and children's uploads have extra rules
> under the Data Privacy Act. If your KID Scouts cannot have their own Google accounts, leave Drive
> switched off for them and use the server uploader, or have a unit Google account owned by the
> Council.

---

## Images and mock data

Artwork lives in `public/images/` as plain SVG files (no external hosts needed):

| File | Used by |
| --- | --- |
| `public/images/logo.svg` | Favicon / `⚜️` trefoil emblem |
| `public/images/hero.svg` | Landing page hero |
| `public/images/welcome.svg` | Login page illustration |
| `public/images/badges/*.svg` | One badge patch per rank / merit badge |

### Rank patches

Every rank has its own patch, drawn in the BSP scheme rather than generic shapes:

| Program (section colour) | Rank | File |
| --- | --- | --- |
| **Boy Scouts** (green) | Membership | `membership-badge.svg` |
| | Tenderfoot Scout | `tenderfoot-scout.svg` |
| | Second Class Scout | `second-class-scout.svg` |
| | First Class Scout | `first-class-scout.svg` |
| | Scout Service | `scout-service.svg` |
| | Scout Citizen | `scout-citizen.svg` |
| **Senior Scouts** (red) | Membership | `senior-membership.svg` |
| | Senior Scout | `senior-scout.svg` |
| | Explorer Scout | `explorer-scout.svg` |
| | Pathfinder Scout | `pathfinder-scout.svg` |
| | Outdoor Scout | `outdoor-scout.svg` |
| | Venturer Scout | `venturer-scout.svg` |
| | Eagle Scout | `eagle-scout.svg` |
| **KID Scouts** (light blue) | Membership | `kid-membership.svg` |
| | KID Scout | `kid-scout.svg` |

What is faithful to the real thing:

- the **section colours** — light blue for KID Scouting, green for Boy Scouting, red for Senior
  Scouting (the neckerchief colour of each section);
- the **BSP emblem** on every patch — a trefoil in the colours of the **Philippine flag** (blue, red,
  white, with the golden sun and three stars) over the **green neckerchief**;
- the **rank names, order and rank pips** — the ladder follows the revised BSP Passport scheme
  (Boy Scout Program 2019, Senior Scout Program 2025). The full official ladders are
  **Membership → Tenderfoot → Second Class → First Class → Scout Service → Scout Citizen** for Boy
  Scouts and **Membership → Explorer → Pathfinder → Outdoor → Venturer → Eagle Scout** for Senior
  Scouts; the seed ships the first ranks of each, and the artwork for the rest is already in place.

> These patches are **original illustrations**, not the official BSP insignia — BSP owns that artwork.
> To use the real thing, open **Council office → Badges → (a rank) → Edit** and upload the official
> scan with the **Badge artwork** field, or drop the file into `public/images/badges/` and point the
> badge at it. Uploaded images win over the shipped SVGs.

To re-draw the whole set (colours, devices and pips live in one config):

```bash
node scripts/make-rank-art.mjs
```

The contact sheet build step needs `sharp`, which ships with Next.js; if it is missing the script just
skips the preview.
| `public/tinymce/**` | Self-hosted TinyMCE 6 editor (core, skins, icons, plugins) |

> The `public/tinymce` folder is a copy of the `tinymce` npm package. To update the editor, run
> `npm install tinymce@<version>` and re-copy `node_modules/tinymce` over `public/tinymce`.

Each badge's `imageUrl` points at `/images/badges/<name>.svg`. To use your own pictures, drop a file
into `public/images/badges/` and set it on the badge under **admin → badges** (or in
`src/db/seed.ts`). Uploaded proof files are stored in `public/uploads/`. All mock data lives in
`src/db/seed.ts` and is inserted on first run.

---

## Troubleshooting

| Problem | Fix |
| --- | --- |
| `DATABASE_URL is required` | Create `.env` (copy from `.env.example`) and restart `npm run dev`. |
| `ECONNREFUSED 127.0.0.1:3306` | MySQL is not started in XAMPP, or it is on a different port. Start it / fix the port in `.env`. |
| `ER_ACCESS_DENIED_ERROR` | Wrong user/password in `DATABASE_URL`. Default XAMPP is `root` with an empty password. |
| `ER_BAD_DB_ERROR: Unknown database 'bsp_lms'` | Create the database first (Step 2), then run `npm run db:push`. |
| `Invalid default value for 'icon'` (during `db:push`) | The database charset is not `utf8mb4`. Run the fix in Step 2, then `npm run db:push` again. |
| `Incorrect string value` (during seeding) | Same cause — convert the database (and tables) to `utf8mb4` as shown in Step 2. |
| `Multiple primary key defined` / `ER_MULTIPLE_PRI_KEY` (during `db:push`) | A previous `db:push` stopped halfway and left tables behind, so Drizzle is re-adding keys that already exist. Drop and recreate the database (Step 2 → *Already created it with the wrong charset?*), then `npm run db:push`. |
| Tables missing / `ER_NO_SUCH_TABLE` | Run `npm run db:push`. |
| Port 3000 already in use | Stop the other process or run `npm run dev -- -p 3001`. |
| Dates look shifted | Make sure your MySQL/MariaDB is reachable and the app is using the included pool (UTC session). |

---

## Notes

- XAMPP on Windows bundles **MariaDB**, which supports everything this project uses.
- The app is served by Next.js; XAMPP's **Apache** is not required to run it.
- Change the portal name, tagline, theme, and registration switch any time under
  **Council office → Settings**.
