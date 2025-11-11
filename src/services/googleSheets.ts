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
    // Try multiple CORS proxies for better reliability
    const proxies = [
      `https://api.allorigins.win/raw?url=${encodeURIComponent(exportUrl)}`,
      `https://corsproxy.io/?${encodeURIComponent(exportUrl)}`,
      exportUrl // Try direct access as fallback (works if CORS is configured)
    ]

    let lastError: Error | null = null

    for (const proxyUrl of proxies) {
      try {
        const response = await fetch(proxyUrl, {
          method: 'GET',
          headers: {
            'Accept': 'text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          }
        })

        if (response.ok) {
          const csvText = await response.text()

          // Validate that we got actual CSV data
          if (csvText && csvText.length > 0 && !csvText.includes('<!DOCTYPE html>')) {
            return csvText
          }
        }
      } catch (err) {
        lastError = err as Error
        console.warn(`Failed to fetch with proxy ${proxyUrl}:`, err)
        continue
      }
    }

    throw lastError || new Error('All proxy attempts failed')
  } catch (error) {
    console.error('Google Sheets fetch error:', error)
    throw new Error(`Failed to fetch data from Google Sheets.

Possible solutions:
1. Make sure the sheet is set to "Anyone with the link can view"
2. Check that the sheet URL is correct
3. Try using the direct CSV export URL instead

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
