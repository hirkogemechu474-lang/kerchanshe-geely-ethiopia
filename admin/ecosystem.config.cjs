// PM2 process file for running the admin app resiliently on 192.168.1.20.
// Optional convenience only — `npm run start:lan` still works standalone
// without PM2. Usage: pm2 start ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: 'geely-admin',
      cwd: __dirname,
      script: 'npm',
      args: 'run start:lan',
      env: {
        NODE_ENV: 'production',
      },
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
    },
  ],
};
