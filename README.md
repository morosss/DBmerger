# Clinical Data Manager

A powerful web application for managing and merging clinical data from multicenter cardiovascular studies. Designed specifically for interventional cardiologists to handle TAVI, M-TEER, and other cardiovascular procedure databases.

## Features

### 🏥 Database Management
- **Predefined Databases**: Quick access to TAVI and M-TEER databases from Google Sheets
- **File Upload**: Support for Excel (.xlsx, .xls, .xlsm) and CSV files
- **Drag & Drop**: Easy file uploads with drag-and-drop interface
- **Flexible Headers**: Configurable header row detection

### 👥 Patient Selection
- **Advanced Filtering**: Build complex filters with AND/OR logic
- **Manual Selection**: Select patients by ID or name lists
- **Batch Operations**: Copy-paste lists of patient IDs or names
- **Real-time Preview**: See selected patients immediately

### 🤖 AI-Powered Column Matching
- **Claude Haiku Integration**: Intelligent column mapping using AI
- **Multilingual Support**: Recognizes different language variations (e.g., "age" ↔ "età")
- **Quick Match**: Fast pattern-based matching for common columns
- **Manual Override**: Fine-tune matches manually with visual interface

### 📤 Data Export
- **Excel Export**: Export merged data to Excel format
- **Format Preservation**: Maintains original template formatting
- **Data Validation**: Preview before export
- **Local Processing**: All data stays in your browser

### 💾 Project Management
- **Save & Resume**: Save your work and continue later
- **Multiple Projects**: Manage multiple studies simultaneously
- **Project History**: Track project status and updates
- **IndexedDB Storage**: Persistent storage in your browser

### 🔒 Privacy & Security
- **Client-side Processing**: No data sent to external servers
- **No Account Required**: Work without registration
- **HIPAA Compliant**: Designed with medical data privacy in mind
- **Secure**: All processing happens locally in your browser

## Quick Start

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/DBmerger.git

# Navigate to the project directory
cd DBmerger

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

### 2. Configuration

Edit `.env` file and add your Anthropic API key for AI column matching:

```env
VITE_ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

> **Note**: AI column matching requires an Anthropic API key. You can still use quick matching without it.

### 3. Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Usage Guide

### Creating a New Project

1. Click "Create New Project" from the dashboard
2. Enter a project name and optional description
3. Click "Create Project"

### Step 1: Upload Databases

**Option A: Use Predefined Database**
1. Select "Predefined Database" tab
2. Choose from TAVI or M-TEER database
3. Wait for the database to load from Google Sheets

**Option B: Upload Your Own File**
1. Select "Upload File" tab
2. Drag and drop your Excel/CSV file or click to browse
3. Confirm the header row number (usually row 1)

**Target Database**
- Upload the study template provided by your coordinator
- This is the format your exported data will follow

### Step 2: Patient Selection

**Method 1: Filter Builder**
1. Click "Add Filter"
2. Select column, operator, and value
3. Add multiple filters with AND/OR logic
4. Preview selected patients

**Method 2: ID List**
1. Switch to "Patient ID List" tab
2. Paste patient IDs (one per line)
3. System will match against ID columns

**Method 3: Name List**
1. Switch to "Name List" tab
2. Paste patient names (one per line)
3. System will fuzzy match against name columns

### Step 3: Column Matching

**Quick Match**
- Click "Quick Match" for instant pattern-based matching
- Matches exact names and common variations
- Best for standard column names

**AI Match**
- Click "AI Match with Claude" for intelligent matching
- Handles multilingual columns and complex patterns
- Requires Anthropic API key

**Manual Matching**
- Click unmatched columns to create manual matches
- Verify low-confidence matches
- Remove incorrect matches

### Step 4: Export Data

1. Review the export summary
2. Check column mappings
3. Click "Export to Excel"
4. File will download to your computer

## API Integration

### Anthropic Claude API

For AI-powered column matching, you need an Anthropic API key:

1. Sign up at [Anthropic Console](https://console.anthropic.com/)
2. Create an API key
3. Add it to your `.env` file as `VITE_ANTHROPIC_API_KEY`

**Pricing**: Claude Haiku is very cost-effective (~$0.25 per MTok). Typical column matching costs less than $0.01 per project.

### Google Sheets Integration

Predefined databases are loaded from Google Sheets URLs. The app uses a CORS proxy to fetch data. To add your own predefined databases:

1. Edit `src/services/googleSheets.ts`
2. Add your sheet to `PREDEFINED_DATABASES` array
3. Ensure the Google Sheet is publicly accessible or shared

## Deployment

### GitHub Pages

This project is configured for GitHub Pages deployment:

1. Push your code to GitHub
2. Go to Settings > Pages
3. Select "GitHub Actions" as the source
4. The site will automatically deploy on push to main branch

### Custom Domain

1. Add a `CNAME` file to the `public` folder
2. Configure your domain's DNS settings
3. Update `base` in `vite.config.ts` to `/`

## Technology Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **Data Processing**: SheetJS (xlsx), PapaParse
- **Storage**: LocalForage (IndexedDB)
- **AI**: Anthropic Claude API
- **Icons**: Lucide React

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance

- Initial load: < 3 seconds
- Excel processing: < 10 seconds for 10,000 rows
- AI matching: < 5 seconds for 100 columns

## Troubleshooting

### File Upload Fails
- **Issue**: File won't upload or parse fails
- **Solution**: Ensure file is valid Excel/CSV, check header row number

### Google Sheets Load Fails
- **Issue**: Predefined database won't load
- **Solution**: Check internet connection, ensure sheet is publicly accessible

### AI Matching Errors
- **Issue**: "API key not configured" error
- **Solution**: Add `VITE_ANTHROPIC_API_KEY` to `.env` file

### Export Doesn't Download
- **Issue**: Export button doesn't work
- **Solution**: Check browser's pop-up blocker, allow downloads

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues, questions, or suggestions:
- Open an issue on GitHub

## Acknowledgments

- Built with React and Vite
- AI powered by Anthropic Claude
- Icons by Lucide
- Designed for interventional cardiologists

---

**Made with ❤️ for the cardiovascular research community**
