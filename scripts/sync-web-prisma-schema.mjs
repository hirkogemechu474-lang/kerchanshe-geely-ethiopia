import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const src = resolve(root, 'admin', 'prisma', 'schema.prisma');
const dest = resolve(root, 'web', 'prisma', 'schema.prisma');

if (!existsSync(src)) {
  console.error(`Schema not found: ${src}`);
  process.exit(1);
}

mkdirSync(dirname(dest), { recursive: true });
copyFileSync(src, dest);

console.log(`Copied Prisma schema to web mirror:`);
console.log(`  ${src}`);
console.log(`  -> ${dest}`);
console.log('Run `npm run db:generate --prefix web` to regenerate the web Prisma client.');
