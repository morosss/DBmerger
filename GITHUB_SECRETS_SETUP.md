# GitHub Secrets Setup - URGENT

## Quick Setup Instructions (Do this after making repo private!)

### Step 1: Go to Repository Settings
Navigate to: **https://github.com/morosss/DBmerger/settings/secrets/actions**

Or:
1. Go to your repository: https://github.com/morosss/DBmerger
2. Click **Settings** (top menu)
3. Click **Secrets and variables** → **Actions** (left sidebar)

### Step 2: Add These 3 Secrets

Click **"New repository secret"** for each of these:

---

#### Secret 1: VITE_ANTHROPIC_API_KEY
- **Name**: `VITE_ANTHROPIC_API_KEY`
- **Value**: Copy the value from your local `.env` file (starts with `sk-ant-api03-...`)
- Click **Add secret**

---

#### Secret 2: VITE_TAVI_DATABASE_URL
- **Name**: `VITE_TAVI_DATABASE_URL`
- **Value**: `https://docs.google.com/spreadsheets/d/1h5YfbBtwnnWZ7Wqq8DjcqKcTlD0E8tnx/edit?usp=sharing&ouid=117269633109599488176&rtpof=true&sd=true`
- Click **Add secret**

---

#### Secret 3: VITE_MTEER_DATABASE_URL
- **Name**: `VITE_MTEER_DATABASE_URL`
- **Value**: `https://docs.google.com/spreadsheets/d/1D_4mYkNHxYnN0aCROmYMfeO3MfDgROg_/edit?usp=sharing&ouid=117269633109599488176&rtpof=true&sd=true`
- Click **Add secret**

---

### Step 3: Merge Your Branch to Main

You need to merge the feature branch to trigger deployment:

1. Go to: https://github.com/morosss/DBmerger/compare/claude/clinical-data-management-site-011CV2dXPw63urrnds21tfza
2. Click **"Create pull request"**
3. Click **"Merge pull request"**
4. Click **"Confirm merge"**

Or use git commands:
```bash
git checkout main
git merge claude/clinical-data-management-site-011CV2dXPw63urrnds21tfza
git push origin main
```

### Step 4: Wait for Deployment

After merging to main:
1. Go to **Actions** tab: https://github.com/morosss/DBmerger/actions
2. Watch the deployment workflow run (takes ~2-3 minutes)
3. Once complete, visit: https://morosss.github.io/DBmerger/
4. **You should now see TAVI and M-TEER databases in the dropdown!**

---

## What This Does

✅ Your environment variables are now stored as **encrypted GitHub Secrets**
✅ GitHub Actions injects them during the build process
✅ They become part of the compiled JavaScript bundle
✅ Your live site will have predefined databases available
✅ URLs are secure in GitHub (private repo + encrypted secrets)

## Security Notes

- ✅ Repository will be private (only you can see it)
- ✅ Secrets are encrypted by GitHub
- ✅ Secrets are never exposed in logs or code
- ✅ Only GitHub Actions can access them during builds

---

## Troubleshooting

### "No predefined databases configured" still showing
- Check that all 3 secrets are added correctly (exact names matter!)
- Verify deployment completed successfully in Actions tab
- Clear browser cache and hard reload (Ctrl+Shift+R)

### Deployment failed
- Check Actions tab for error messages
- Verify secret names exactly match: `VITE_ANTHROPIC_API_KEY`, `VITE_TAVI_DATABASE_URL`, `VITE_MTEER_DATABASE_URL`

---

**Ready to go!** Follow the steps above and your live site will work with predefined databases. 🚀
