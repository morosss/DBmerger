/**
 * Google Sheets integration service
 * Allows importing data directly from Google Sheets
 */

export interface GoogleSheetConfig {
  id: string
  name: string
  url: string
  type: 'tavi' | 'mteer'
}

// Predefined databases - URLs are configured via environment variables for security
// Users can also add custom databases in the application settings
export function getPredefinedDatabases(): GoogleSheetConfig[] {
  const databases: GoogleSheetConfig[] = []

  // Load from environment variables (for development/private deployments)
  const taviUrl = import.meta.env.VITE_TAVI_DATABASE_URL
  const mteerUrl = import.meta.env.VITE_MTEER_DATABASE_URL

  if (taviUrl) {
    databases.push({
      id: 'tavi_main',
      name: 'TAVI Database',
      url: taviUrl,
      type: 'tavi'
    })
  }

  if (mteerUrl) {
    databases.push({
      id: 'mteer_main',
      name: 'M-TEER Database',
      url: mteerUrl,
      type: 'mteer'
    })
  }

  // Load from localStorage (user-configured databases)
  try {
    const customDbsJson = localStorage.getItem('custom_predefined_databases')
    if (customDbsJson) {
      const customDbs = JSON.parse(customDbsJson) as GoogleSheetConfig[]
      databases.push(...customDbs)
    }
  } catch (error) {
    console.warn('Failed to load custom databases:', error)
  }

  return databases
}

// For backward compatibility - now returns databases from function
export const PREDEFINED_DATABASES = getPredefinedDatabases()

/**
 * Extract Google Sheets ID from URL
 */
export function extractSheetId(url: string): string | null {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
  return match ? match[1] : null
}

/**
 * Get Google Sheets export URL for CSV format
 */
export function getExportUrl(sheetId: string, gid: string = '0'): string {
  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`
}

/**
 * Fetch data from Google Sheets as CSV
 */
export async function fetchGoogleSheet(url: string): Promise<string> {
  const sheetId = extractSheetId(url)

  if (!sheetId) {
    throw new Error('Invalid Google Sheets URL')
  }

  const exportUrl = getExportUrl(sheetId)

  try {
    // Try multiple methods in order of reliability
    const methods = [
      // Method 1: Direct CSV export (best if sheet is public)
      async () => {
        const response = await fetch(exportUrl, {
          method: 'GET',
          headers: { 'Accept': 'text/csv' }
        })
        if (response.ok) {
          const text = await response.text()
          if (text && !text.includes('<!DOCTYPE html>')) return text
        }
        throw new Error('Direct fetch failed')
      },

      // Method 2: AllOrigins CORS proxy
      async () => {
        const response = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(exportUrl)}`)
        if (response.ok) {
          const text = await response.text()
          if (text && !text.includes('<!DOCTYPE html>')) return text
        }
        throw new Error('AllOrigins proxy failed')
      },

      // Method 3: CorsProxy.io
      async () => {
        const response = await fetch(`https://corsproxy.io/?${encodeURIComponent(exportUrl)}`)
        if (response.ok) {
          const text = await response.text()
          if (text && !text.includes('<!DOCTYPE html>')) return text
        }
        throw new Error('CorsProxy failed')
      },

      // Method 4: cors-anywhere (backup)
      async () => {
        const response = await fetch(`https://cors-anywhere.herokuapp.com/${exportUrl}`)
        if (response.ok) {
          const text = await response.text()
          if (text && !text.includes('<!DOCTYPE html>')) return text
        }
        throw new Error('Cors-anywhere failed')
      }
    ]

    let lastError: Error | null = null

    for (const method of methods) {
      try {
        const result = await method()
        console.log('Successfully fetched Google Sheet data')
        return result
      } catch (err) {
        lastError = err as Error
        console.warn('Fetch method failed:', err)
        continue
      }
    }

    throw lastError || new Error('All fetch methods failed')
  } catch (error) {
    console.error('Google Sheets fetch error:', error)

    // Provide helpful error message with the export URL
    const exportCsvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`

    throw new Error(`Failed to fetch data from Google Sheets.

✅ Direct CSV Export URL (try this manually):
${exportCsvUrl}

📋 Possible solutions:
1. Make sure the sheet is set to "Anyone with the link can view"
2. Download the CSV manually from the URL above and upload it
3. Check Google Sheets sharing settings

Sheet ID: ${sheetId}`)
  }
}

/**
 * Convert CSV text to File object for parsing
 */
export function csvToFile(csvText: string, filename: string): File {
  const blob = new Blob([csvText], { type: 'text/csv' })
  return new File([blob], filename, { type: 'text/csv' })
}

/**
 * Import from predefined database
 */
export async function importPredefinedDatabase(config: GoogleSheetConfig): Promise<File> {
  const csvText = await fetchGoogleSheet(config.url)
  return csvToFile(csvText, `${config.name}.csv`)
}
