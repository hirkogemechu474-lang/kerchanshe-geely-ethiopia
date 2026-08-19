# Prepares two self-contained deployable folders for separate hosting:
#   deploy/web-deploy/    -> GoDaddy (public website)
#   deploy/admin-deploy/  -> 192.168.1.20 LAN server (admin panel + Prisma/DB owner)
#
# Usage:  powershell -ExecutionPolicy Bypass -File scripts/package-deploy.ps1
#
# Uses robocopy with exclusions, so node_modules/.next/.env are never copied.
# Keeps:  .env.example, vendored web/prisma/schema.prisma, source, configs.

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
$Out = Join-Path $Root 'deploy'
$RobocopyExcludedDirs = @('node_modules', '.next', '.git', '.vercel', 'deploy', '.claude')
$RobocopyExcludedFiles = @('.env', '*.tsbuildinfo', 'npm-debug.log*', '*.pem')

function Copy-AppFolder {
  param(
    [string]$App,      # e.g. 'web' or 'admin'
    [string]$DestName  # e.g. 'web-deploy'
  )
  $Src = Join-Path $Root $App
  $Dst = Join-Path $Out $DestName
  if (-not (Test-Path $Src)) { throw "Source app folder not found: $Src" }

  Write-Host "Packaging $App -> $DestName"
  if (Test-Path $Dst) { Remove-Item -LiteralPath $Dst -Recurse -Force }

  # Build an argument array so each /XD /XF value stays a separate token.
  # robocopy accepts bare names/wildcards for /XD and /XF (applies at any level).
  $args = @($Src, $Dst, '/E', '/MT:16', '/NFL', '/NDL', '/NJH', '/NJS', '/NP')
  $args += '/XD'
  foreach ($d in $RobocopyExcludedDirs) { $args += $d }
  $args += '/XF'
  foreach ($f in $RobocopyExcludedFiles) { $args += $f }

  # robocopy exit codes: 0-7 are success, 8+ are errors.
  & robocopy @args | Out-Null
  if ($LASTEXITCODE -gt 7) {
    throw "robocopy failed with exit code $LASTEXITCODE for $App"
  }
  Write-Host "  robocopy exit: $LASTEXITCODE (0-7 = success)"

  # Never ship a real .env anywhere (robustness against variants).
  Get-ChildItem -LiteralPath $Dst -Recurse -Force -Filter '.env*' -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -notlike '*.example' } |
    ForEach-Object { Remove-Item -LiteralPath $_.FullName -Recurse -Force -ErrorAction SilentlyContinue }

  return $Dst
}

function Add-DeployReadme {
  param(
    [string]$Folder,
    [string]$Readme
  )
  $dst = Join-Path $Folder 'DEPLOY.md'
  Copy-Item -LiteralPath $Readme -Destination $dst -Force
  Write-Host "  readme -> $dst"
}

Write-Host "Packaging deploy artifacts to $Out"

$webDst = Copy-AppFolder -App 'web' -DestName 'web-deploy'
Add-DeployReadme -Folder $webDst -Readme (Join-Path $Root 'docs\DEPLOY-WEB-GODADDY.md')

$adminDst = Copy-AppFolder -App 'admin' -DestName 'admin-deploy'
Add-DeployReadme -Folder $adminDst -Readme (Join-Path $Root 'docs\DEPLOY-ADMIN-LAN.md')

# Verify vendored web schema is present in the web package.
$webSchema = Join-Path $webDst 'prisma\schema.prisma'
if (-not (Test-Path $webSchema)) {
  throw "web package missing prisma/schema.prisma - run 'npm run sync:schema' first"
}

Write-Host ""
Write-Host "Done. Two folders ready for separate hosting:"
Write-Host "  $webDst   (send to GoDaddy person)"
Write-Host "  $adminDst (send to 192.168.1.20 server person)"
