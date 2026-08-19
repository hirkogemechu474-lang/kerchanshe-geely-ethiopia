# Local development

## Applications

- Public web: http://localhost:3002
- Admin panel: http://localhost:3001
- Shared database: PostgreSQL `localhost:5432`, database `geely_ethiopia`

The local `.env` files are already configured for these ports and use development-only settings. Keep real production credentials out of source control and rotate any credentials that have previously been shared.

## Start

Open two terminals:

```powershell
cd D:\geely-ethiopia\geely-ethiopia\admin
npm.cmd run dev
```

```powershell
cd D:\geely-ethiopia\geely-ethiopia\web
npm.cmd run dev
```

## Database

The local PostgreSQL database was checked against the Prisma schema and has no schema difference. The two existing migrations are now baselined as applied:

```powershell
cd D:\geely-ethiopia\geely-ethiopia\admin
npx.cmd prisma migrate status
```

Expected result: `Database schema is up to date!`

## Checks

```powershell
cd D:\geely-ethiopia\geely-ethiopia\admin
npx.cmd tsc --noEmit --pretty false

cd ..\web
npx.cmd tsc --noEmit --pretty false
```

Both currently pass. Prisma client regeneration and the complete Next production build should be run after stopping existing Node/Next processes if Windows reports an engine-file lock. Local seed execution also requires sufficient available memory.
