// Custom server entry point for hosts (e.g. GoDaddy cPanel "Setup Node.js App" /
// Phusion Passenger) that require the app to bind to a PORT they assign, rather
// than spawning `next start` themselves. Not used by local dev/build/start scripts
// (those still run plain `next dev` / `next start`) — this is only the Passenger
// startup file, wired up in cPanel's Application Startup File field.
const { createServer } = require('http');
const next = require('next');

const port = parseInt(process.env.PORT, 10) || 3002;
const hostname = process.env.HOSTNAME || '0.0.0.0';
const app = next({ dev: false, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => handle(req, res)).listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
