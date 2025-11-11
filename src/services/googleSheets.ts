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

// Predefined databases
export const PREDEFINED_DATABASES: GoogleSheetConfig[] = [
  {
    id: 'tavi_main',
    name: 'TAVI Database',
    url: 'https://docs.google.com/spreadsheets/d/1_uF44XlYa261N_ob2uOJZKWhe6AwbGFXdHvuBvp6-vI/edit?usp=sharing',
    type: 'tavi'
  },
  {
    id: 'mteer_main',
    name: 'M-TEER Database',
    url: 'https://docs.google.com/spreadsheets/d/1D_4mYkNHxYnN0aCROmYMfeO3MfDgROg_/edit?usp=sharing&ouid=117269633109599488176&rtpof=true&sd=true',
    type: 'mteer'
  }
]

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
    // Use a CORS proxy for client-side requests
    // In production, you might want to use your own proxy or configure CORS
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(exportUrl)}`

    const response = await fetch(proxyUrl)

    if (!response.ok) {
      throw new Error(`Failed to fetch Google Sheet: ${response.statusText}`)
    }

    const csvText = await response.text()
    return csvText
  } catch (error) {
    console.error('Google Sheets fetch error:', error)
    throw new Error('Failed to fetch data from Google Sheets. Please ensure the sheet is publicly accessible or shared with the appropriate permissions.')
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
