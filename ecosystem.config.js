// SUPERSEDED 2026-09-21 — no longer how this app is started in production.
// This server runs every other system (DMS, SSO, GMS, KCMS, Chatbot, etc.)
// as a plain `npm run start`/`start:prod` in its own console window,
// launched via C:\Users\Administrator\Desktop\production-start.bat (a
// scheduled task run at Administrator logon). Geely used to be the one
// exception, on PM2 — the theory was that pm2-windows-startup had it
// registered to resurrect independently of that script, but that was
// never actually true (pm2-windows-startup was installed globally but its
// install step was never run — no PM2 Windows service ever existed). Geely
// has been moved onto the same console-window model as everything else;
// see the GEELY ETHIOPIA block in production-start.bat.
//
// Do not `pm2 start` this file — its ports (4000/7500/7501) are now owned
// by the console-window processes production-start.bat starts, and a
// second copy would just lose the race for those same ports. Kept only as
// a record of the port mapping in case PM2 is ever reintroduced.
module.exports = {
  apps: [
    {
      name: 'geely-backend',
      cwd: __dirname + '/backend',
      script: 'dist/index.js',
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
    },
    {
      name: 'geely-web',
      cwd: __dirname + '/apps/web',
      script: 'node_modules/next/dist/bin/next',
      // Port 7501 matches the existing, already-verified Apache ProxyPass
      // rule for "/geely" in httpd-ssl.conf — do not change without updating
      // that rule too.
      args: 'start -p 7501',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'geely-admin',
      cwd: __dirname + '/apps/admin',
      script: 'node_modules/next/dist/bin/next',
      // Port 7500 matches the existing, already-verified Apache ProxyPass
      // rule for "/geely/admin" in httpd-ssl.conf — do not change without
      // updating that rule too.
      args: 'start -p 7500',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
