# Migration script: Move existing frontend code to apps/ directory
# Run this from the project root AFTER setting up the backend

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "🚀 Migrating frontend apps to apps/ directory..." -ForegroundColor Cyan

# ── Migrate Web App ─────────────────────────────────────────────────────
Write-Host ""
Write-Host "📱 Migrating web app..." -ForegroundColor Yellow

$webSource = Join-Path $root "web"
$webDest = Join-Path $root "apps\web"

# Copy frontend-only files (exclude API routes, repositories, lib services)
$webDirs = @("app", "components", "features", "hooks", "providers", "public", "types", "utils", "constants", "config", "schemas", "models", "services")
$webFiles = @("next.config.ts", "tailwind.config.ts", "tsconfig.json", "postcss.config.mjs", "middleware.ts", "server.js", ".eslintrc.json", "package.json")

foreach ($dir in $webDirs) {
    $src = Join-Path $webSource $dir
    $dst = Join-Path $webDest $dir
    if (Test-Path $src) {
        if (-not (Test-Path $dst)) { New-Item -ItemType Directory -Path $dst -Force | Out-Null }
        Copy-Item -Path "$src\*" -Destination $dst -Recurse -Force
        Write-Host "  ✅ Copied $dir/" -ForegroundColor Green
    }
}

foreach ($file in $webFiles) {
    $src = Join-Path $webSource $file
    $dst = Join-Path $webDest $file
    if (Test-Path $src) {
        Copy-Item -Path $src -Destination $dst -Force
        Write-Host "  ✅ Copied $file" -ForegroundColor Green
    }
}

# Remove API routes from web app (backend owns these now)
$webApiDir = Join-Path $webDest "app\api"
if (Test-Path $webApiDir) {
    Remove-Item -Path $webApiDir -Recurse -Force
    Write-Host "  🗑️ Removed app/api/ (backend handles API now)" -ForegroundColor Red
}

# Remove repositories and lib services from web app
$webRemoveDirs = @("repositories", "lib\auth", "lib\services", "lib\prisma.ts")
foreach ($dir in $webRemoveDirs) {
    $path = Join-Path $webDest $dir
    if (Test-Path $path) {
        Remove-Item -Path $path -Recurse -Force
        Write-Host "  🗑️ Removed $dir" -ForegroundColor Red
    }
}

# ── Migrate Admin App ───────────────────────────────────────────────────
Write-Host ""
Write-Host "🔧 Migrating admin app..." -ForegroundColor Yellow

$adminSource = Join-Path $root "admin"
$adminDest = Join-Path $root "apps\admin"

$adminDirs = @("app", "components", "features", "hooks", "providers", "public", "types", "utils", "constants", "config", "schemas", "models", "services")
$adminFiles = @("next.config.ts", "tailwind.config.ts", "tsconfig.json", "postcss.config.mjs", "middleware.ts", ".eslintrc.json", "ecosystem.config.cjs", "package.json")

foreach ($dir in $adminDirs) {
    $src = Join-Path $adminSource $dir
    $dst = Join-Path $adminDest $dir
    if (Test-Path $src) {
        if (-not (Test-Path $dst)) { New-Item -ItemType Directory -Path $dst -Force | Out-Null }
        Copy-Item -Path "$src\*" -Destination $dst -Recurse -Force
        Write-Host "  ✅ Copied $dir/" -ForegroundColor Green
    }
}

foreach ($file in $adminFiles) {
    $src = Join-Path $adminSource $file
    $dst = Join-Path $adminDest $file
    if (Test-Path $src) {
        Copy-Item -Path $src -Destination $dst -Force
        Write-Host "  ✅ Copied $file" -ForegroundColor Green
    }
}

# Remove API routes from admin app
$adminApiDir = Join-Path $adminDest "app\api"
if (Test-Path $adminApiDir) {
    Remove-Item -Path $adminApiDir -Recurse -Force
    Write-Host "  🗑️ Removed app/api/ (backend handles API now)" -ForegroundColor Red
}

# Remove repositories and lib services from admin app
$adminRemoveDirs = @("repositories", "lib\auth", "lib\services", "lib\prisma.ts")
foreach ($dir in $adminRemoveDirs) {
    $path = Join-Path $adminDest $dir
    if (Test-Path $path) {
        Remove-Item -Path $path -Recurse -Force
        Write-Host "  🗑️ Removed $dir" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "✅ Frontend migration complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Structure:" -ForegroundColor Cyan
Write-Host "  apps/web/    → Public website (Next.js, frontend only)" -ForegroundColor White
Write-Host "  apps/admin/  → Admin panel (Next.js, frontend only)" -ForegroundColor White
Write-Host "  backend/     → API server (Express.js)" -ForegroundColor White
Write-Host "  packages/    → Shared code (types, config)" -ForegroundColor White
