# Google Sheets Setup Guide

## Issue: Failed to Fetch Google Sheets

If you're seeing "Failed to fetch data from Google Sheets", follow these steps:

## Quick Fix

### Step 1: Verify Sheet Sharing Settings

For each Google Sheet (TAVI and M-TEER):

1. Open the Google Sheet
2. Click the **Share** button (top right)
3. Click **"Anyone with the link"**
4. Set permission to **Viewer**
5. Click **Copy link**
6. Click **Done**

### Step 2: Update Sheet URLs (If Needed)

If the current URLs don't work, update them in the code:

1. Open `src/services/googleSheets.ts`
2. Find the `PREDEFINED_DATABASES` array
3. Replace the URLs with your newly copied links

### Step 3: Alternative - Use Direct CSV Export URLs

If CORS proxies are blocked, you can use direct export URLs:

```javascript
// Instead of:
url: 'https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit?usp=sharing'

// Use:
url: 'https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/export?format=csv'
```

## How It Works

The app tries to fetch your Google Sheets in this order:

1. **AllOrigins proxy** - Most reliable
2. **CorsProxy.io** - Backup option  
3. **Direct access** - If sheet allows CORS

## Troubleshooting

### Error: "Invalid Google Sheets URL"
- Make sure the URL contains `/spreadsheets/d/[SHEET_ID]`
- Don't use shortened URLs (goo.gl)

### Error: "All proxy attempts failed"
- Check your internet connection
- Verify sheet is set to "Anyone with the link can view"
- Try using the direct CSV export URL

### Error: "Sheet is empty"
- Make sure the sheet has data
- Check that row 1 contains headers
- Verify the sheet isn't filtered or hidden

## Current Sheet URLs

### TAVI Database
```
https://docs.google.com/spreadsheets/d/1_uF44XlYa261N_ob2uOJZKWhe6AwbGFXdHvuBvp6-vI/edit?usp=sharing
```

**CSV Export:**
```
https://docs.google.com/spreadsheets/d/1_uF44XlYa261N_ob2uOJZKWhe6AwbGFXdHvuBvp6-vI/export?format=csv
```

### M-TEER Database
```
https://docs.google.com/spreadsheets/d/1D_4mYkNHxYnN0aCROmYMfeO3MfDgROg_/edit?usp=sharing&ouid=117269633109599488176&rtpof=true&sd=true
```

**CSV Export:**
```
https://docs.google.com/spreadsheets/d/1D_4mYkNHxYnN0aCROmYMfeO3MfDgROg_/export?format=csv
```

## Testing Locally

Test if the sheet is accessible:

```bash
# Test TAVI database
curl "https://docs.google.com/spreadsheets/d/1_uF44XlYa261N_ob2uOJZKWhe6AwbGFXdHvuBvp6-vI/export?format=csv"

# Test M-TEER database
curl "https://docs.google.com/spreadsheets/d/1D_4mYkNHxYnN0aCROmYMfeO3MfDgROg_/export?format=csv"
```

If you see CSV data, the sheets are accessible!

## Recommended Solution

For best reliability, you have two options:

### Option 1: Keep Using Proxies (Current Setup)
✅ No changes needed to your sheets
✅ Works with any "view only" shared link
❌ Depends on third-party proxies

### Option 2: Use Direct Export URLs
1. Update URLs to use `/export?format=csv` instead of `/edit`
2. Ensure sheets are set to "Anyone with the link can view"
3. More reliable, but requires public sheets

## Need Help?

If issues persist:
1. Check browser console (F12) for detailed errors
2. Try loading sheets manually using the CSV export URLs
3. Verify your network isn't blocking Google Sheets
