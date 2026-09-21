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
