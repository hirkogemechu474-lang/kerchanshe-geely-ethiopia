# Zoho CRM OAuth 2.0 Setup Guide

**Complete Step-by-Step Instructions for Geely Ethiopia**

---

## 🎯 Overview

This guide will help you obtain the three critical Zoho CRM credentials needed for production:

1. **Client ID** - Public identifier for your application
2. **Client Secret** - Private key for authentication
3. **Refresh Token** - Long-lived token that never expires (used to get new access tokens)

**Time Required:** 15-20 minutes  
**Prerequisites:** Zoho CRM account with API access

---

## 📋 Step 1: Access Zoho API Console

1. Open your browser and navigate to: **https://api-console.zoho.com/**
2. Sign in with your Zoho CRM account credentials
3. You should see the Zoho API Console dashboard

---

## 🔧 Step 2: Create Server-Based Application

1. Click the **"Add Client"** button (usually in top-right corner)
2. Select **"Server-based Applications"** from the options
3. You will see a form with the following fields:

### Fill in the Registration Form:

**Client Name:**
```
Geely Ethiopia Website
```

**Homepage URL:**
```
https://geelyethiopia.com
```

**Authorized Redirect URIs:**
```
https://geelyethiopia.com/api/auth/callback
http://localhost:3000/api/auth/callback
```

> ℹ️ **Note:** Add both production and development URLs. The localhost URL is for testing.

4. Click **"Create"** button
5. You will see a success message with your credentials

---

## 📝 Step 3: Copy Client ID and Client Secret

After creating the client, you'll see:

```
Client ID: 1000.XXXXXXXXXXXXXXXXXXXXX
Client Secret: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### ✅ ACTION REQUIRED:
1. **Copy the Client ID** - Save it somewhere safe (e.g., Notepad)
2. **Copy the Client Secret** - Save it somewhere safe
3. Keep this tab open - you'll need these values later

---

## 🔑 Step 4: Generate Refresh Token

This is the most important step. The refresh token allows automatic access token renewal.

### 4.1 Generate Authorization Code

1. Open a new browser tab
2. Copy and paste this URL, **replacing `YOUR_CLIENT_ID`** with your actual Client ID from Step 3:

```
https://accounts.zoho.com/oauth/v2/auth?scope=ZohoCRM.modules.ALL,ZohoCRM.settings.ALL&client_id=YOUR_CLIENT_ID&response_type=code&access_type=offline&redirect_uri=https://geelyethiopia.com/api/auth/callback&prompt=consent
```

**Example (DO NOT copy this, use your own Client ID):**
```
https://accounts.zoho.com/oauth/v2/auth?scope=ZohoCRM.modules.ALL,ZohoCRM.settings.ALL&client_id=1000.ABCD1234EFGH5678&response_type=code&access_type=offline&redirect_uri=https://geelyethiopia.com/api/auth/callback&prompt=consent
```

3. Press **Enter** - You'll be redirected to Zoho's authorization page

### 4.2 Authorize the Application

1. Review the permissions being requested:
   - Read/Write access to CRM Modules
   - Read access to CRM Settings
2. Click **"Accept"** button
3. You will be redirected to: `https://geelyethiopia.com/api/auth/callback?code=...`

### 4.3 Extract the Authorization Code

The URL will look like this:
```
https://geelyethiopia.com/api/auth/callback?code=1000.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx&location=us&accounts-server=https%3A%2F%2Faccounts.zoho.com
```

**Copy everything after `code=` and before `&location`**

Example:
```
1000.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Save this code - **it expires in 60 seconds**, so complete the next step immediately!

---

## 🚀 Step 5: Exchange Code for Refresh Token

You need to make a POST request to exchange the authorization code for a refresh token.

### Option A: Using PowerShell (Windows)

1. Open **PowerShell** (Start → type "PowerShell")
2. Copy and paste this command, **replacing the placeholders**:

```powershell
$body = @{
    code = "YOUR_AUTHORIZATION_CODE"
    client_id = "YOUR_CLIENT_ID"
    client_secret = "YOUR_CLIENT_SECRET"
    redirect_uri = "https://geelyethiopia.com/api/auth/callback"
    grant_type = "authorization_code"
}

$response = Invoke-RestMethod -Uri "https://accounts.zoho.com/oauth/v2/token" -Method Post -Body $body
$response | ConvertTo-Json
```

3. Press **Enter**
4. You'll see a response like this:

```json
{
  "access_token": "1000.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "refresh_token": "1000.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "api_domain": "https://www.zohoapis.com",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

5. **Copy the `refresh_token` value** - This is your long-lived refresh token!

### Option B: Using cURL (Mac/Linux or Git Bash on Windows)

```bash
curl -X POST https://accounts.zoho.com/oauth/v2/token \
  -d "code=YOUR_AUTHORIZATION_CODE" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "redirect_uri=https://geelyethiopia.com/api/auth/callback" \
  -d "grant_type=authorization_code"
```

### Option C: Using Postman

1. Open Postman
2. Create a new **POST** request
3. URL: `https://accounts.zoho.com/oauth/v2/token`
4. Body type: **x-www-form-urlencoded**
5. Add parameters:
   - `code`: YOUR_AUTHORIZATION_CODE
   - `client_id`: YOUR_CLIENT_ID
   - `client_secret`: YOUR_CLIENT_SECRET
   - `redirect_uri`: https://geelyethiopia.com/api/auth/callback
   - `grant_type`: authorization_code
6. Click **Send**
7. Copy the `refresh_token` from the response

---

## 📄 Step 6: Update Environment Files

Now you have all three credentials. Update your `.env` files:

### Step 3: Update Environment File

Once you have the refresh token, update **THE ONLY .env FILE**:

**Location:** `d:\geely-ethiopia\geely-ethiopia\.env`

Find this line:
```env
ZOHO_CRM_REFRESH_TOKEN=1000.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Replace with your actual refresh token:
```env
ZOHO_CRM_REFRESH_TOKEN=1000.your_actual_refresh_token_here
```

**That's it!** Both web and admin will use this same file automatically.

---

## 🌍 Regional Configuration

If your Zoho CRM is hosted in a different region, update the URLs:

### Europe (EU):
```env
ZOHO_ACCOUNTS_URL=https://accounts.zoho.eu
ZOHO_CRM_API_URL=https://www.zohoapis.eu/crm/v3/Leads
```

### India (IN):
```env
ZOHO_ACCOUNTS_URL=https://accounts.zoho.in
ZOHO_CRM_API_URL=https://www.zohoapis.in/crm/v3/Leads
```

### Australia (AU):
```env
ZOHO_ACCOUNTS_URL=https://accounts.zoho.com.au
ZOHO_CRM_API_URL=https://www.zohoapis.com.au/crm/v3/Leads
```

---

## ✅ Step 7: Test the Integration

### Test 1: Verify Token Refresh

1. Open your terminal in the `web` directory
2. Run this test command:

```bash
cd web
npm run dev
```

3. Open browser console and check for Zoho-related logs
4. Submit a test drive form on the website
5. Check if the lead appears in Zoho CRM

### Test 2: Manual API Call

Use this PowerShell script to test:

```powershell
# Get a fresh access token
$body = @{
    refresh_token = "YOUR_REFRESH_TOKEN"
    client_id = "YOUR_CLIENT_ID"
    client_secret = "YOUR_CLIENT_SECRET"
    grant_type = "refresh_token"
}

$tokenResponse = Invoke-RestMethod -Uri "https://accounts.zoho.com/oauth/v2/token" -Method Post -Body $body
$accessToken = $tokenResponse.access_token

# Test API call - Get leads
$headers = @{
    Authorization = "Zoho-oauthtoken $accessToken"
}

Invoke-RestMethod -Uri "https://www.zohoapis.com/crm/v3/Leads" -Headers $headers
```

If you see lead data, the integration is working! ✅

---

## 🔒 Security Best Practices

### ✅ DO:
- Store credentials in `.env` files (never commit to git)
- Use refresh tokens instead of static access tokens
- Restrict API scopes to only what's needed
- Monitor API usage in Zoho console
- Set up IP whitelisting in Zoho if possible

### ❌ DON'T:
- Commit `.env` files to version control
- Share credentials via email or chat
- Use access tokens directly (they expire in 1 hour)
- Grant unnecessary API permissions
- Store credentials in frontend code

---

## 🛠️ Troubleshooting

### Problem: "Invalid Code" Error

**Solution:** The authorization code expires in 60 seconds. Generate a new code and immediately exchange it for a refresh token.

### Problem: "Invalid Client" Error

**Solution:** Verify that your Client ID and Client Secret are correct. Check for extra spaces or missing characters.

### Problem: "Invalid Grant" Error

**Solution:** Make sure the `redirect_uri` in Step 5 **exactly matches** one of the URIs you registered in Step 2.

### Problem: "Insufficient Scope" Error

**Solution:** Regenerate the authorization code using the full scope URL from Step 4.1.

### Problem: Token Refresh Fails in Production

**Solution:** 
1. Check that `ZOHO_ACCOUNTS_URL` matches your region
2. Verify all three credentials are in `web/.env`
3. Check application logs for detailed error messages

---

## 📞 Need Help?

If you encounter issues:

1. **Check Zoho API Console logs:** https://api-console.zoho.com/ → Your Client → Logs
2. **Review Zoho documentation:** https://www.zoho.com/crm/developer/docs/api/v3/
3. **Check application logs:** Look for errors in the web application console

---

## 🎉 Success Checklist

- [ ] Created Zoho API Console client
- [ ] Copied Client ID and Client Secret
- [ ] Generated authorization code
- [ ] Exchanged code for refresh token
- [ ] Updated `web/.env` with all three credentials
- [ ] Updated root `.env` (optional)
- [ ] Tested token refresh mechanism
- [ ] Verified lead submission to Zoho CRM
- [ ] Confirmed leads appear in Zoho CRM dashboard

---

**Last Updated:** August 10, 2026  
**Version:** 1.0  
**Project:** Geely Ethiopia Website

