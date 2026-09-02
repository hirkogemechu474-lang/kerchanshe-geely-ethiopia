# Backend restructuring: Express.js API server
# Run this from the project root

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$backend = Join-Path $root "backend"

Write-Host "🔧 Setting up Express.js backend..." -ForegroundColor Cyan

# Navigate to backend
Set-Location $backend

# Install dependencies
Write-Host "📦 Installing backend dependencies..." -ForegroundColor Yellow
npm install

# Generate Prisma client
Write-Host "🗄️ Generating Prisma client..." -ForegroundColor Yellow
npx prisma generate

# Copy .env.example to .env if not exists
$envFile = Join-Path $backend ".env"
$envExample = Join-Path $backend ".env.example"
if (-not (Test-Path $envFile)) {
    Copy-Item $envExample $envFile
    Write-Host "✅ Created .env from .env.example" -ForegroundColor Green
    Write-Host "⚠️  Please update .env with your database credentials" -ForegroundColor Yellow
}

# Create uploads directory
$uploadsDir = Join-Path $backend "uploads"
if (-not (Test-Path $uploadsDir)) {
    New-Item -ItemType Directory -Path $uploadsDir | Out-Null
    Write-Host "✅ Created uploads directory" -ForegroundColor Green
}

Write-Host ""
Write-Host "✅ Backend setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Update backend/.env with your DATABASE_URL" -ForegroundColor White
Write-Host "  2. Run: cd backend && npm run db:migrate" -ForegroundColor White
Write-Host "  3. Run: cd backend && npm run db:seed" -ForegroundColor White
Write-Host "  4. Run: cd backend && npm run dev" -ForegroundColor White
