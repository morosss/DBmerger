import * as XLSX from 'xlsx'
import Papa from 'papaparse'
import { Database, DatabaseColumn } from '../types'

/**
 * Parse an Excel or CSV file and extract database structure
 */
export async function parseFile(
  file: File,
  type: 'index' | 'target',
  headerRow: number = 1
): Promise<Database> {
  const fileType = file.name.split('.').pop()?.toLowerCase()

  let data: any[][]

  if (fileType === 'csv') {
    data = await parseCSV(file)
  } else if (['xlsx', 'xls', 'xlsm'].includes(fileType || '')) {
    data = await parseExcel(file)
  } else {
    throw new Error('Unsupported file type. Please upload Excel (.xlsx, .xls) or CSV (.csv) files.')
  }

  if (data.length === 0) {
    throw new Error('File is empty')
  }

  // Extract headers and data
  const headers = data[headerRow - 1]
  const dataRows = data.slice(headerRow)

  if (!headers || headers.length === 0) {
    throw new Error('No headers found in the specified row')
  }

  // Create columns
  const columns: DatabaseColumn[] = headers.map((header, index) => {
    const columnData = dataRows.map(row => row[index])
    return {
      name: String(header || `Column ${index + 1}`),
      index,
      dataType: detectDataType(columnData),
      sampleValues: columnData.slice(0, 5)
    }
  })

  // Convert data to objects
  const dataObjects = dataRows.map(row => {
    const obj: Record<string, any> = {}
    headers.forEach((header, index) => {
      obj[String(header || `Column ${index + 1}`)] = row[index]
    })
    return obj
  })

  return {
    id: generateId(),
    name: file.name,
    type,
    columns,
    data: dataObjects,
    headerRow,
    uploadDate: new Date()
  }
}

/**
 * Parse CSV file
 */
async function parseCSV(file: File): Promise<any[][]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      complete: (results) => {
        resolve(results.data as any[][])
      },
      error: (error) => {
        reject(new Error(`Failed to parse CSV: ${error.message}`))
      }
    })
  })
}

/**
 * Parse Excel file
 */
async function parseExcel(file: File): Promise<any[][]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: 'binary' })

        // Get first sheet
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]

        // Convert to array of arrays
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, {
          header: 1,
          defval: null,
          raw: false
        })

        resolve(jsonData as any[][])
      } catch (error) {
        reject(new Error(`Failed to parse Excel: ${error instanceof Error ? error.message : 'Unknown error'}`))
      }
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.readAsBinaryString(file)
  })
}

/**
 * Detect data type of a column based on sample values
 */
function detectDataType(values: any[]): 'string' | 'number' | 'date' | 'boolean' {
  const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '')

  if (nonNullValues.length === 0) {
    return 'string'
  }

  // Check if all values are numbers
  const allNumbers = nonNullValues.every(v => !isNaN(Number(v)))
  if (allNumbers) {
    return 'number'
  }

  // Check if all values are booleans
  const allBooleans = nonNullValues.every(v =>
    v === true || v === false ||
    String(v).toLowerCase() === 'true' ||
    String(v).toLowerCase() === 'false' ||
    String(v).toLowerCase() === 'yes' ||
    String(v).toLowerCase() === 'no'
  )
  if (allBooleans) {
    return 'boolean'
  }

  // Check if values look like dates
  const allDates = nonNullValues.every(v => {
    const date = new Date(v)
    return !isNaN(date.getTime())
  })
  if (allDates) {
    return 'date'
  }

  return 'string'
}

/**
 * Auto-detect header row
 */
export function detectHeaderRow(data: any[][]): number {
  if (data.length === 0) return 1

  // Check if first row looks like headers
  const firstRow = data[0]
  const secondRow = data[1]

  if (!firstRow || !secondRow) return 1

  // Headers are likely to be strings and unique
  const firstRowIsString = firstRow.every(cell => typeof cell === 'string')
  const firstRowIsUnique = new Set(firstRow).size === firstRow.length

  // Second row likely contains data (numbers, dates, etc.)
  const secondRowHasNumbers = secondRow.some(cell => !isNaN(Number(cell)))

  if (firstRowIsString && firstRowIsUnique && secondRowHasNumbers) {
    return 1
  }

  // Check if first two rows are headers (merged header rows)
  if (data.length > 2) {
    const thirdRow = data[2]
    const thirdRowHasNumbers = thirdRow.some(cell => !isNaN(Number(cell)))
    if (thirdRowHasNumbers) {
      return 2
    }
  }

  return 1
}

/**
 * Export data to Excel
 */
export async function exportToExcel(
  data: Record<string, any>[],
  columns: string[],
  fileName: string
): Promise<void> {
  // Create worksheet
  const ws = XLSX.utils.json_to_sheet(data, { header: columns })

  // Create workbook
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Data')

  // Generate Excel file and trigger download
  XLSX.writeFile(wb, fileName)
}

/**
 * Export merged data with formatting preservation
 * Preserves all cell styles, colors, borders, fonts, etc. from target template
 */
export async function exportMergedData(
  targetTemplate: File,
  selectedData: Record<string, any>[],
  columnMapping: Record<string, string>
): Promise<void> {
  const reader = new FileReader()

  return new Promise((resolve, reject) => {
    reader.onload = async (e) => {
      try {
        const data = e.target?.result
        // Read workbook WITH all formatting preserved
        const workbook = XLSX.read(data, {
          type: 'binary',
          cellStyles: true,
          cellNF: true,
          cellHTML: true
        })

        // Get first sheet
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]

        // Get sheet range
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
        const startRow = range.s.r
        const endRow = range.e.r
        const startCol = range.s.c
        const endCol = range.e.c

        // Get header row (assume first row is header)
        const headerRow = startRow
        const dataStartRow = startRow + 1

        // Get column order from header
        const columnOrder: string[] = []
        for (let col = startCol; col <= endCol; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: headerRow, c: col })
          const cell = worksheet[cellAddress]
          if (cell && cell.v) {
            columnOrder.push(String(cell.v))
          }
        }

        // Copy style template from first data row (if exists)
        const styleTemplateRow = dataStartRow < endRow ? dataStartRow : headerRow
        const cellStyleTemplates: any[] = []

        for (let col = startCol; col <= endCol; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: styleTemplateRow, c: col })
          const cell = worksheet[cellAddress]
          if (cell) {
            cellStyleTemplates[col] = {
              s: cell.s ? JSON.parse(JSON.stringify(cell.s)) : undefined, // Deep clone style
              t: cell.t,
              z: cell.z
            }
          }
        }

        // Find the next available row
        let nextRow = endRow + 1

        // Add new data rows with formatting
        selectedData.forEach((row) => {
          columnOrder.forEach((targetCol, colIdx) => {
            const col = startCol + colIdx
            const sourceCol = columnMapping[targetCol]
            const value = sourceCol ? row[sourceCol] : ''

            const cellAddress = XLSX.utils.encode_cell({ r: nextRow, c: col })

            // Create cell with value
            const cell: any = {
              v: value,
              t: typeof value === 'number' ? 'n' : 's'
            }

            // Apply style from template
            if (cellStyleTemplates[col]) {
              if (cellStyleTemplates[col].s) {
                cell.s = JSON.parse(JSON.stringify(cellStyleTemplates[col].s))
              }
              if (cellStyleTemplates[col].z) {
                cell.z = cellStyleTemplates[col].z
              }
            }

            worksheet[cellAddress] = cell
          })
          nextRow++
        })

        // Update sheet range
        range.e.r = nextRow - 1
        worksheet['!ref'] = XLSX.utils.encode_range(range)

        // Generate filename
        const timestamp = new Date().toISOString().split('T')[0]
        const fileName = `merged_${timestamp}_${targetTemplate.name}`

        // Write file with styles preserved
        XLSX.writeFile(workbook, fileName, {
          cellStyles: true,
          bookType: 'xlsx'
        })

        resolve()
      } catch (error) {
        reject(error)
      }
    }

    reader.onerror = () => reject(new Error('Failed to read template file'))
    reader.readAsBinaryString(targetTemplate)
  })
}

function generateId(): string {
  return `db_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}
