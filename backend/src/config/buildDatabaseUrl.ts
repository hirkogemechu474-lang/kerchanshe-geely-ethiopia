export function buildDatabaseUrl(): string {
  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT || '5432';
  const name = process.env.DB_NAME || 'geely_ethiopia';
  const user = encodeURIComponent(process.env.DB_USER || 'postgres');
  const password = encodeURIComponent(process.env.DB_PASSWORD || '');

  return `postgresql://${user}:${password}@${host}:${port}/${name}?schema=public&connection_limit=6&pool_timeout=5&connect_timeout=10&statement_timeout=30`;
}
