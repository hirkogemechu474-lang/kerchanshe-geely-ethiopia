# Troubleshooting Guide
## Geely Ethiopia Development Issues

---

## 🔴 Error: Port Already in Use

### **Error Message:**
```
Error: listen EADDRINUSE: address already in use :::3001
```

### **Solution:**

**Option 1: Use the Automated Fix Script**
```powershell
cd d:\geely-ethiopia\geely-ethiopia
.\fix-and-start.ps1
```

**Option 2: Manual Fix**
```powershell
# Find and kill process on port 3001
$proc = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue
if ($proc) {
    Stop-Process -Id $proc.OwningProcess -Force
}

# For port 3000 (if needed)
$proc = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($proc) {
    Stop-Process -Id $proc.OwningProcess -Force
}
```

---

## 🔴 Error: @prisma/client did not initialize

### **Error Message:**
```
Error: @prisma/client did not initialize yet. Please run "prisma generate" and try to import it again.
```

### **Solution:**

Generate Prisma client for all projects:

```powershell
# Root project
cd d:\geely-ethiopia\geely-ethiopia
npm install
node_modules\.bin\prisma generate

# Web application
cd web
npm install
..\node_modules\.bin\prisma generate

# Admin panel
cd ..\admin
npm install
..\node_modules\.bin\prisma generate
```

**Or use the automated script:**
```powershell
cd d:\geely-ethiopia\geely-ethiopia
.\fix-and-start.ps1
```

---

## ⚠️ Warning: Duplicate page detected (middleware)

### **Warning Message:**
```
⚠ Duplicate page detected. pages\middleware.ts and pages\middleware\index.ts both resolve to /middleware.
```

### **Explanation:**
This is a **false warning** from Next.js. The warning appears because:
- There's a `middleware.ts` file in the root
- There's a `middleware/` directory (which is fine)

### **Solution:**
**This warning is HARMLESS and can be ignored.** It doesn't affect functionality.

If you want to suppress it, you can rename the middleware directory:
```powershell
cd d:\geely-ethiopia\geely-ethiopia\web
Rename-Item -Path "middleware" -NewName "_middleware"
```

Then update imports from `@/middleware/*` to `@/_middleware/*`.

---

## 🔴 Error: Database Connection Failed

### **Error Message:**
```
Error: Can't reach database server at `localhost:5432`
```

### **Solution:**

1. **Check if PostgreSQL is running:**
```powershell
Get-Service -Name postgresql*
```

2. **Start PostgreSQL if stopped:**
```powershell
Start-Service -Name postgresql-x64-14
```

3. **Verify database exists:**
```powershell
psql -U postgres -c "\l"
```

4. **Create database if missing:**
```powershell
psql -U postgres -c "CREATE DATABASE geely_ethiopia;"
```

5. **Run migrations:**
```powershell
cd d:\geely-ethiopia\geely-ethiopia
node_modules\.bin\prisma migrate dev
```

---

## 🔴 Error: Module not found

### **Error Message:**
```
Module not found: Can't resolve '@/...'
```

### **Solution:**

Install dependencies:

```powershell
# Root
cd d:\geely-ethiopia\geely-ethiopia
npm install

# Web
cd web
npm install

# Admin
cd admin
npm install
```

---

## 🔴 Zoho CRM Integration Not Working

### **Error Message:**
```
Error: Failed to refresh Zoho access token
```

### **Solution:**

1. **Check environment variables in `web/.env`:**
```env
ZOHO_CRM_CLIENT_ID=1000.W2MOF8TL7W622CHP58XCKH08CQ6BAV
ZOHO_CRM_CLIENT_SECRET=5df34e10e339c3c47a8c6577776229945951344748
ZOHO_CRM_REFRESH_TOKEN=1000.xxxxxxxx.xxxxxxxx
```

2. **Generate refresh token if missing:**
```powershell
cd d:\geely-ethiopia\geely-ethiopia
.\zoho-refresh-token-generator.ps1
```

3. **Test the integration:**
- Submit a test drive form
- Check browser console for errors
- Verify lead appears in Zoho CRM

---

## 🔴 SMTP Email Not Sending

### **Error Message:**
```
Error: Invalid login: 534 5.7.9 Application-specific password required
```

### **Solution:**

1. **Verify Gmail App Password:**
- Go to https://myaccount.google.com/security
- Enable 2-Step Verification
- Generate App Password for "Mail"
- Update in `.env` files:

```env
SMTP_USER=systems@kerchanshe.com
SMTP_PASS=your-16-char-app-password
```

2. **Test SMTP configuration:**
```powershell
# Send test email via API
curl -X POST http://localhost:3000/api/test-email `
  -H "Content-Type: application/json" `
  -d '{"to":"your-email@example.com"}'
```

---

## ⚠️ Build Warnings

### **Warning: Fast Refresh**
```
⚠ Fast Refresh had to perform a full reload
```

**Solution:** This is normal during development. Save the file again to trigger Fast Refresh.

### **Warning: Image Optimization**
```
⚠ Using default ImageOptimization config
```

**Solution:** Add to `next.config.js`:
```javascript
images: {
  domains: ['localhost', 'geelyethiopia.com'],
  formats: ['image/webp', 'image/avif'],
}
```

---

## 🛠️ Quick Fix Commands

### **Complete Reset and Restart:**
```powershell
# Stop all servers
Get-Process node | Stop-Process -Force

# Clean and reinstall
cd d:\geely-ethiopia\geely-ethiopia
Remove-Item node_modules -Recurse -Force
Remove-Item web\node_modules -Recurse -Force
Remove-Item admin\node_modules -Recurse -Force

# Reinstall everything
npm install
cd web && npm install
cd ..\admin && npm install

# Generate Prisma
cd ..
node_modules\.bin\prisma generate

# Run database migrations
node_modules\.bin\prisma migrate dev

# Start servers
cd web
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"
cd ..\admin
npm run dev
```

---

## 📞 Still Having Issues?

### Check these files:
1. **Environment Variables:**
   - `d:\geely-ethiopia\geely-ethiopia\.env`
   - `d:\geely-ethiopia\geely-ethiopia\web\.env`
   - `d:\geely-ethiopia\geely-ethiopia\admin\.env`

2. **Database Schema:**
   - `d:\geely-ethiopia\geely-ethiopia\prisma\schema.prisma`

3. **Package Versions:**
   ```powershell
   npm list --depth=0
   ```

### Common Checklist:
- [ ] PostgreSQL is running
- [ ] Database `geely_ethiopia` exists
- [ ] All `npm install` completed successfully
- [ ] `prisma generate` ran without errors
- [ ] `.env` files have correct values
- [ ] Ports 3000 and 3001 are available
- [ ] Node.js version is 18+ (`node --version`)

---

**Last Updated:** August 10, 2026  
**Project:** Geely Ethiopia Website

