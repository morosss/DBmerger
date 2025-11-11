# Deployment Guide - Clinical Data Manager

## 🚀 Quick Deploy to GitHub Pages

Your application is already configured for automatic deployment! Follow these steps:

### 1. Enable GitHub Pages

1. Go to your repository: https://github.com/morosss/DBmerger
2. Click **Settings** → **Pages**
3. Under "Source", select **GitHub Actions**
4. Save the changes

### 2. Merge Your Branch

```bash
# The code is already pushed to your branch
# Create a pull request or merge to main:

# Option A: Via GitHub UI
# Go to: https://github.com/morosss/DBmerger/pull/new/claude/clinical-data-management-site-011CV2dXPw63urrnds21tfza
# Click "Create Pull Request" → "Merge"

# Option B: Via Git (if you have permissions)
git checkout main
git merge claude/clinical-data-management-site-011CV2dXPw63urrnds21tfza
git push origin main
```

### 3. Wait for Deployment

1. Go to the **Actions** tab: https://github.com/morosss/DBmerger/actions
2. Wait for the "Deploy to GitHub Pages" workflow to complete (~2-3 minutes)
3. Once complete, your site will be live at: **https://morosss.github.io/DBmerger/**

## 🔧 Local Development

### First Time Setup

```bash
# Clone the repository
git clone https://github.com/morosss/DBmerger.git
cd DBmerger

# Install dependencies
npm install

# Create .env file with your API key
cp .env.example .env
# Edit .env and add your Anthropic API key
```

### Run Development Server

```bash
npm run dev
# Opens at http://localhost:3000/DBmerger/
```

### Build for Production

```bash
npm run build
# Output in ./dist folder

# Preview production build
npm run preview
```

## 🌐 Using the Application

### For Development (Local)

The API key is read from your local `.env` file automatically.

### For Production (GitHub Pages)

**Important**: The `.env` file is NOT deployed to GitHub Pages (it's gitignored for security).

For production use, you have two options:

#### Option 1: Users Enter Their Own API Keys (Recommended)

Each user gets their own Anthropic API key and the app stores it in their browser's localStorage.

**To implement this** (future enhancement):
1. Add a Settings page with an API key input field
2. Store the key in localStorage
3. Use the stored key for LLM requests

#### Option 2: No AI Matching

Users can use the app without AI matching:
- **Quick Match** works without any API key
- Manual matching always available
- All other features work normally

## 📊 Monitoring Deployment

### Check Deployment Status

```bash
# View GitHub Actions logs
# Go to: https://github.com/morosss/DBmerger/actions
```

### Common Deployment Issues

**Issue**: Workflow doesn't run
- **Solution**: Check that GitHub Pages is enabled in Settings → Pages

**Issue**: Build fails
- **Solution**: Check Actions logs for errors. The build was tested locally and should work.

**Issue**: 404 error on deployed site
- **Solution**: Make sure you're accessing https://morosss.github.io/DBmerger/ (with /DBmerger/ at the end)

**Issue**: Blank page on deployed site
- **Solution**: Check browser console for errors. Ensure `base: '/DBmerger/'` is set in vite.config.ts

## 🔐 Security Notes

### API Key Security

- ✅ `.env` file is gitignored and never committed
- ✅ API keys should be user-provided in production
- ✅ Set spending limits on your Anthropic account
- ✅ Rotate API keys regularly

### Data Privacy

- ✅ All patient data is processed client-side
- ✅ No data sent to external servers (except Google Sheets fetch and Anthropic API for column matching)
- ✅ Data stored in browser's IndexedDB only
- ✅ No backend database

## 📱 Testing on Different Devices

### Desktop
- Chrome, Firefox, Safari, Edge (latest versions)

### Mobile
- iOS Safari 14+
- Android Chrome 90+

### Tablet
- iPad Safari
- Android tablets

## 🔄 Updating the Deployed Site

Every push to the `main` branch automatically triggers a new deployment:

```bash
# Make changes
git add .
git commit -m "Your changes"
git push origin main

# Wait 2-3 minutes for automatic deployment
# Check Actions tab for progress
```

## 🎯 Performance Optimization

The production build is optimized with:
- Code splitting
- Tree shaking
- Minification
- Gzip compression

**Build size**: ~717KB JavaScript (230KB gzipped)

## 🐛 Troubleshooting

### Development Server Won't Start

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Build Errors

```bash
# Check TypeScript errors
npm run build

# Fix any TypeScript issues
# Common fixes:
# - Check all imports are correct
# - Ensure types are properly defined
# - Run: npx tsc --noEmit
```

### GitHub Pages Not Working

1. Check repository settings: Settings → Pages → Source = "GitHub Actions"
2. Check Actions tab for failed workflows
3. Ensure branch is `main` (or your default branch)
4. Wait 5-10 minutes after first deployment

## 📞 Support

If you encounter issues:

1. Check the [README.md](./README.md) troubleshooting section
2. Review [GitHub Actions logs](https://github.com/morosss/DBmerger/actions)
3. Open an issue on GitHub

## ✅ Deployment Checklist

- [x] Code committed to git
- [x] Dependencies installed (`npm install`)
- [x] Build tested locally (`npm run build`)
- [x] Environment variables configured (`.env` file)
- [ ] GitHub Pages enabled in repository settings
- [ ] Code merged to main branch
- [ ] GitHub Actions workflow completed successfully
- [ ] Site accessible at https://morosss.github.io/DBmerger/

## 🎉 Next Steps After Deployment

1. **Test the live site** with sample data
2. **Share with colleagues** for feedback
3. **Monitor usage** via Anthropic console (API usage)
4. **Gather user feedback** and iterate
5. **Add more predefined databases** as needed

---

Your Clinical Data Manager is ready to deploy! 🚀
