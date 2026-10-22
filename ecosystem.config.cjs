require("dotenv/config");

// Port comes from the environment (.env, shell, or CI secret) so the same
// checkout can run on any port. Falls back to 3000 for local use.
const PORT = process.env.PORT ?? "3000";

module.exports = {
  apps: [
    {
      name: "bsplms",
      script: "node_modules/next/dist/bin/next",
      args: `start -p ${PORT}`,
      cwd: "./",
      instances: "max",
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
