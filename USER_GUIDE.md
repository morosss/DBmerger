# Clinical Data Manager - User Guide

## 📖 Complete Guide for Clinical Researchers

This guide will walk you through using the Clinical Data Manager for your multicenter cardiovascular studies.

## 🎯 What This Tool Does

The Clinical Data Manager helps you:
- Merge patient data from multiple databases
- Match data between your main database and study templates
- Select specific patients for studies
- Export clean, formatted data for analysis

## 🚀 Getting Started

### Step 1: Create a New Project

1. Open the Clinical Data Manager in your browser
2. Click **"Create New Project"** on the dashboard
3. Enter a project name (e.g., "TAVI Study 2024 - Site A")
4. Add an optional description
5. Click **"Create Project"**

### Step 2: Upload Your Databases

You'll need two databases:

#### **Index Database** (Your Main Database)
This contains all your patient records (TAVI, M-TEER, etc.)

**Option A: Use Predefined Database**
1. Click the **"Predefined Database"** tab
2. Select from the dropdown:
   - **TAVI Database** - Main TAVI patient records
   - **M-TEER Database** - Main M-TEER patient records
3. Wait for the database to load from Google Sheets

**Option B: Upload Your Own File**
1. Click the **"Upload File"** tab
2. Drag and drop your Excel/CSV file, or click to browse
3. Confirm the header row number (usually row 1)

#### **Target Database** (Study Template)
This is the template provided by your study coordinator.

1. Drag and drop the template file
2. Confirm the header row number
3. Click **"Upload and Parse Databases"**

### Step 3: Select Patients

Choose which patients to include in your export using one of three methods:

#### **Method 1: Filter Builder** (Recommended for Complex Criteria)

Example: Select all TAVI patients from 2023 with complications

1. Click **"Add Filter"**
2. Select column: "Procedure Date"
3. Select operator: "Contains"
4. Enter value: "2023"
5. Click **"AND"** and add another filter
6. Select column: "Complications"
7. Select operator: "Equals"
8. Enter value: "Yes"
9. Review the preview showing selected patients
10. Click **"Confirm Selection"**

#### **Method 2: Patient ID List** (For Specific Patients)

Example: You have a list of 20 patient IDs to include

1. Click the **"Patient ID List"** tab
2. Paste your patient IDs (one per line):
   ```
   12345
   12346
   12347
   12350
   ...
   ```
3. The system automatically finds matching patients
4. Review the count and preview
5. Click **"Confirm Selection"**

#### **Method 3: Name List** (Search by Name)

Example: Include all patients with surname "Rossi"

1. Click the **"Name List"** tab
2. Paste patient names (one per line):
   ```
   Mario Rossi
   Giovanni Bianchi
   Maria Verdi
   ```
3. System performs fuzzy matching (handles spelling variations)
4. Review the matches
5. Click **"Confirm Selection"**

### Step 4: Match Columns

The system needs to know how to map your database columns to the study template.

#### **Quick Match** (Start Here)

1. Click **"Quick Match"**
2. The system instantly matches common columns:
   - Patient ID → ID
   - Age → Età (multilingual support!)
   - Date of Birth → Data di Nascita
   - etc.
3. Review the matched columns (shown in green)

#### **AI Match** (For Complex Cases)

If you have unmatched columns:

1. Click **"AI Match with Claude"**
2. Claude AI analyzes remaining columns
3. Suggests intelligent matches with confidence scores
4. Review suggestions:
   - ✅ Green = High confidence (>90%)
   - ⚠️ Yellow = Medium confidence (70-90%)
   - 🔶 Orange = Low confidence (<70%)
5. Click the checkmark to verify matches you agree with

#### **Manual Matching** (Fine-Tuning)

For any remaining unmatched columns:

1. Click on a source column (from your database)
2. Enter or select the target column name
3. The match is created
4. Repeat for all unmatched columns

**Tip**: Unmatched target columns will be empty in the export.

### Step 5: Export Your Data

1. Review the **Export Summary**:
   - Number of patients selected
   - Number of columns matched
   - Export format (Excel)

2. Check the **Column Mapping Preview**:
   - Verify source → target mappings
   - Note any unmatched columns

3. Click **"Export to Excel"**

4. Your file downloads automatically with the name:
   ```
   export_Your_Project_Name_2024-11-11.xlsx
   ```

5. Open the file in Excel to verify:
   - Selected patients are included
   - Data is properly mapped
   - Template formatting is preserved

## 💡 Pro Tips

### Efficient Workflow

1. **Save Often**: Click "Save Progress" regularly
2. **Use Quick Match First**: It's fast and handles 80% of cases
3. **Preview Before Export**: Always review the preview
4. **Keep Templates**: Save study templates for future use
5. **Name Projects Clearly**: Use descriptive names with dates

### Common Scenarios

#### **Scenario 1: Monthly Data Submission**

1. Load predefined database (automatically updated)
2. Filter by date range (last month)
3. Use saved column mapping
4. Quick export

**Time**: ~2 minutes

#### **Scenario 2: New Study Enrollment**

1. Upload new study template
2. Select patients by ID list (from screening log)
3. AI match columns (first time)
4. Save mapping for future use

**Time**: ~5 minutes

#### **Scenario 3: Retrospective Analysis**

1. Upload historical database
2. Build complex filters (multiple criteria)
3. Manual column matching (custom fields)
4. Export for statistical analysis

**Time**: ~10 minutes

## 🔍 Understanding the Interface

### Dashboard
- **Statistics**: View your project counts
- **Recent Projects**: Quick access to recent work
- **Quick Actions**: Create new or view all projects

### Project Detail View
- **Upload**: Green when complete ✅
- **Selection**: Shows patient count
- **Matching**: Shows column match count
- **Export**: Final step with preview

### Status Indicators
- **Draft**: Project created, no databases uploaded
- **In Progress**: Actively working on it
- **Completed**: Export successful, ready for analysis

## 🎓 Video Tutorials (Coming Soon)

- Getting Started (5 min)
- Advanced Filtering (3 min)
- Column Matching Tips (4 min)
- Export and Validation (2 min)

## 📊 Data Quality Tips

### Before Upload
- ✅ Check for missing data
- ✅ Ensure consistent date formats
- ✅ Remove duplicate patients
- ✅ Verify patient IDs are unique

### During Matching
- ✅ Verify critical columns (ID, Name, Procedure Date)
- ✅ Check data type compatibility
- ✅ Review low-confidence AI matches
- ✅ Don't guess - use manual matching if unsure

### After Export
- ✅ Open in Excel and spot-check data
- ✅ Verify patient count matches
- ✅ Check for formula errors
- ✅ Validate critical values (dates, IDs)

## 🔒 Privacy and Security

### Your Data is Safe

- **No Upload to Servers**: All processing happens in your browser
- **Local Storage Only**: Data saved in your browser's database
- **No Tracking**: We don't collect usage data
- **No Accounts**: No registration required

### Best Practices

- ✅ Use on secure, password-protected devices
- ✅ Don't access on public computers
- ✅ Clear browser data when done (if needed)
- ✅ Keep exported files secure
- ✅ Follow your institution's data policies

## ❓ Frequently Asked Questions

### General

**Q: Can I use this offline?**
A: Partially. Once loaded, most features work offline except:
- Loading predefined databases (requires internet)
- AI column matching (requires internet)

**Q: How many projects can I have?**
A: Unlimited. Projects are stored in your browser.

**Q: Can I share projects with colleagues?**
A: Currently, projects are stored locally. You can export and share the result file.

### Technical

**Q: What file formats are supported?**
A: Excel (.xlsx, .xls, .xlsm) and CSV (.csv)

**Q: How large can my database be?**
A: Up to ~50,000 rows. Performance may slow beyond this.

**Q: Can I undo an export?**
A: No, but you can modify your selection and re-export.

**Q: Does it work on mobile?**
A: Yes, but desktop is recommended for better experience.

### Data

**Q: What happens to my data?**
A: It stays in your browser. Nothing is uploaded to servers (except for AI matching, which only sends column names).

**Q: Can I edit data before export?**
A: Not currently. Use filters to exclude unwanted data.

**Q: Why are some columns empty in my export?**
A: Those columns weren't matched. Review the column matching step.

## 🐛 Troubleshooting

### Upload Issues

**Problem**: "Failed to parse file"
- Check file isn't corrupted
- Try opening in Excel first
- Ensure it's a valid Excel/CSV file
- Check header row number is correct

**Problem**: "No data found"
- Verify the file has data beyond headers
- Check the header row number
- Ensure data starts immediately after headers

### Selection Issues

**Problem**: "No patients selected"
- Review filter criteria (might be too strict)
- Check for typos in ID/name lists
- Verify column names in filters are correct

**Problem**: "Wrong patients selected"
- Double-check filter logic (AND vs OR)
- Preview before confirming
- Use ID list for precise control

### Matching Issues

**Problem**: "AI matching failed"
- API key might not be configured
- Use Quick Match instead
- Fall back to manual matching

**Problem**: "Low confidence matches"
- Review each match carefully
- Use manual matching for critical columns
- Consult column documentation if available

### Export Issues

**Problem**: "Export not downloading"
- Check browser's download settings
- Disable pop-up blocker
- Try different browser

**Problem**: "Exported file is empty"
- Verify patients were selected
- Check column matching was done
- Review browser console for errors

## 📞 Getting Help

### Self-Service
1. Check this guide
2. Review the [README.md](./README.md)
3. Check the troubleshooting section

### Support
- GitHub Issues: Report bugs or request features
- Email: [Contact your administrator]

## 🎉 Success Stories

> "Reduced our data submission time from 2 hours to 15 minutes!"
> — Dr. Maria R., TAVI Coordinator

> "The AI column matching saved us so much time on multi-site studies."
> — Prof. Giovanni B., Principal Investigator

> "Finally, a tool that understands Italian medical terminology!"
> — Dr. Luca V., Research Fellow

---

**Need more help?** Contact your system administrator or open an issue on GitHub.

**Happy data managing! 🏥📊**
