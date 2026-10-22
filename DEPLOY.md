# Deploying BSPLMS

Production runs on the same VPS as the old Laravel `bsp` app, at the same
`DEPLOY_PATH`. `git reset --hard` removes the Laravel tracked files; untracked
`vendor/` and `storage/` folders stay behind and can be deleted manually.

## One-time server setup

1. Install Node.js 22 and pm2:

   ```sh
   npm i -g pm2
   pm2 startup   # follow the printed command once
   ```

2. Make sure an app directory with a git checkout exists at `DEPLOY_PATH` and
   that `.env` contains the production database:

   ```env
   DATABASE_URL=mysql://USER:PASSWORD@127.0.0.1:3306/demolay_lms
   # optional SMTP_* values
   ```

3. Create the database (`utf8mb4` is required for emoji):

   ```sql
   CREATE DATABASE IF NOT EXISTS demolay_lms
     CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

4. Point the CyberPanel/Apache vhost for the domain at the Node process
   (`http://127.0.0.1:3000`) instead of PHP. The deploy workflow restarts pm2,
   but the first process is created on the first deploy.

5. GitHub repo secrets (already used by the old `bsp` workflow, same repo):

   | Secret | Value |
   | --- | --- |
   | `SSH_HOST` | VPS hostname or IP |
   | `SSH_USER` | SSH user |
   | `SSH_PASSWORD` | SSH password |
   | `SSH_PORT` | optional, defaults to `22` |
   | `DEPLOY_PATH` | absolute path of the app checkout |
   | `PM2_APP` | optional, defaults to `bsplms` |

## Deploy flow

`tests` runs on push to `master`. When it succeeds, `deploy` connects over SSH
and runs: `git fetch/reset` -> `npm ci` -> `npm run build` -> `npm run db:migrate`
-> `pm2 start/restart` -> health check on `127.0.0.1:3000/api/health`.

A push to `master` deploys immediately. Prepare the server first, or push to a
feature branch and use **Run workflow** (`workflow_dispatch`) on `tests` until
the server is ready.

The deploy job runs over non-interactive SSH, which does not read `~/.bashrc`.
Make sure `node`, `npm`, and `pm2` are on the default PATH (for nvm installs,
symlink or export them in the system profile) and that the app listens on
`127.0.0.1:3000`.
