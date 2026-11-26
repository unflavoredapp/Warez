module.exports = {
  apps: [
    {
      name: "warez-skin",
      script: "index.js",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        HOST: "127.0.0.1",
        PORT: 3000,
        SITE_NAME: "sentry.mba",
        WAREZ_DATA: "/opt/warez.skin/data",
      },
    },
  ],
};
