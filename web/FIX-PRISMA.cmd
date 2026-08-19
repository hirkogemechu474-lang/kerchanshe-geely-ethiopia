@echo off
echo Generating Prisma client for web (using web/prisma/schema.prisma)...
cd /d "%~dp0"
call npm run db:generate
if errorlevel 1 (
  echo.
  echo Failed. Make sure Node.js is installed and run: npm install
  pause
  exit /b 1
)
echo.
echo Done! Restart the web dev server: npm run dev
pause
