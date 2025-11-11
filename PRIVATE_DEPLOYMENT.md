# Private Deployment Guide

## 🔒 Keeping Your Database URLs Private

Your database URLs contain links to private Google Sheets that should **NOT** be exposed in the public repository.

## How It Works

### For Development (Local)

Database URLs are stored in your **local** `.env` file:

```env
VITE_TAVI_DATABASE_URL=https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/...
VITE_MTEER_DATABASE_URL=https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/...
```

✅ This file is **gitignored** and never committed
✅ Only you have access to these URLs
✅ Works perfectly for local development

### For Production (GitHub Pages)

You have **three options** for production deployment:

## Option 1: Users Configure Their Own (Recommended for Public Sites)

The app will show **no predefined databases** by default. Users can:
1. Upload their own Excel/CSV files
2. Or add custom database URLs in-app (stored in browser localStorage)

**Pros:**
- ✅ No private URLs exposed
- ✅ Each user uses their own data
- ✅ Safe for public deployment

**Cons:**
- ❌ No quick predefined databases

## Option 2: Private Repository Deployment

Keep your repository **private** and use GitHub Actions secrets:

### Step 1: Make Repository Private
1. Go to: https://github.com/morosss/DBmerger/settings
2. Scroll to "Danger Zone"
3. Click "Change visibility" → "Make private"

### Step 2: Add Secrets
1. Go to: https://github.com/morosss/DBmerger/settings/secrets/actions
2. Click "New repository secret"
3. Add each secret:
   - `VITE_TAVI_DATABASE_URL` = your TAVI sheet URL
   - `VITE_MTEER_DATABASE_URL` = your M-TEER sheet URL

### Step 3: Update GitHub Actions Workflow

Edit `.github/workflows/deploy.yml` to include secrets:

```yaml
- name: Build
  env:
    VITE_TAVI_DATABASE_URL: ${{ secrets.VITE_TAVI_DATABASE_URL }}
    VITE_MTEER_DATABASE_URL: ${{ secrets.VITE_MTEER_DATABASE_URL }}
  run: npm run build
```

**Pros:**
- ✅ Database URLs in production
- ✅ URLs never in public code
- ✅ Controlled access

**Cons:**
- ❌ Repository must be private
- ❌ More complex setup

## Option 3: Custom Domain with Server-Side Config

Host on your own server or use services like Netlify/Vercel:

### Netlify Example:

1. Deploy to Netlify
2. Add environment variables in Netlify dashboard
3. Automatic builds with private URLs

**Pros:**
- ✅ Full control
- ✅ Can keep repo public
- ✅ Server-side environment variables

**Cons:**
- ❌ Requires custom deployment
- ❌ Not free (for some services)

## Current Setup (Development Only)

Right now, your database URLs are:
- ✅ Stored in `.env` (local only)
- ✅ Not in repository
- ✅ Work for `npm run dev`
- ❌ **NOT** available on GitHub Pages

This means:
- Local development: ✅ Predefined databases work
- GitHub Pages: ❌ No predefined databases (users upload their own)

## Recommended Approach

For your use case, I recommend **Option 2** (Private Repository):

### Why?
1. You control access to the site
2. Database URLs stay private
3. Team members can use predefined databases
4. Simple to maintain

### Quick Setup:

```bash
# 1. Make repo private (if not already)
# GitHub.com → Settings → Change visibility

# 2. Add secrets
# Settings → Secrets → Actions → New secret

# 3. Update .github/workflows/deploy.yml
# (I'll do this for you)

# 4. Push and deploy!
```

## For Public Deployment

If you want to keep the repository **public**:

1. Remove the predefined database feature, OR
2. Let users configure their own database URLs in-app

The app will still work perfectly for:
- File upload (Excel/CSV)
- All other features
- Users just won't have the dropdown with predefined databases

## Testing

### Test Locally:
```bash
npm run dev
# Should see TAVI and M-TEER in dropdown
```

### Test Production:
```bash
npm run build
npm run preview
# Check if databases appear
```

## Security Checklist

- [x] Database URLs in `.env` (gitignored)
- [x] Database URLs NOT in source code
- [x] `.env` in `.gitignore`
- [x] `.env.example` has no real URLs
- [ ] Choose deployment option (1, 2, or 3)
- [ ] Configure production environment

## Need Help?

Let me know which option you prefer and I'll help you set it up!
