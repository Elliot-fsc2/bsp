require("dotenv/config");

// Port comes from the environment (.env, shell, or CI secret) so the same
// checkout can run on any port. Falls back to 3000 for local use.
const PORT = process.env.PORT ?? "3000";
// One worker is enough for this app; set PM2_INSTANCES=2+ to scale out.
const INSTANCES = Math.max(1, Number(process.env.PM2_INSTANCES) || 1);

module.exports = {
  apps: [
    {
      name: "bsplms",
      script: "node_modules/next/dist/bin/next",
      args: `start -p ${PORT}`,
      cwd: "./",
      instances: INSTANCES,
      exec_mode: "cluster",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT,
        // Anchor the server's wall clock to Philippine time so any Date created
        // in the process matches the app's business timezone.
        TZ: process.env.TZ ?? "Asia/Manila",
      },
    },
  ],
};
