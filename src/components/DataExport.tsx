import { useState } from 'react'
import { Download, CheckCircle, AlertCircle } from 'lucide-react'
import { Project } from '../types'
import { exportToExcel } from '../services/parser'

interface DataExportProps {
  project: Project
}

export default function DataExport({ project }: DataExportProps) {
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')
  const [exportComplete, setExportComplete] = useState(false)

  const indexDb = project.indexDatabase
  const targetDb = project.targetDatabase
  const patientSelection = project.patientSelection
  const columnMatching = project.columnMatching

  const handleExport = async () => {
    if (!indexDb || !targetDb || !patientSelection || !columnMatching) {
      setError('Missing required data. Please complete all previous steps.')
      return
    }

    setExporting(true)
    setError('')
    setExportComplete(false)

    try {
      // Filter selected patients
      const selectedPatients = filterSelectedPatients(indexDb.data, patientSelection)

      if (selectedPatients.length === 0) {
        throw new Error('No patients selected for export')
      }

      // Create column mapping
      const columnMapping: Record<string, string> = {}
      columnMatching.matches.forEach(match => {
        columnMapping[match.targetColumn] = match.sourceColumn
      })

      // Map data to target structure
      const mappedData = selectedPatients.map(patient => {
        const mappedRow: Record<string, any> = {}

        // Map matched columns
        columnMatching.matches.forEach(match => {
          mappedRow[match.targetColumn] = patient[match.sourceColumn] || ''
        })

        // Fill in unmatched target columns with empty values
        targetDb.columns.forEach(col => {
          if (!(col.name in mappedRow)) {
            mappedRow[col.name] = ''
          }
        })

        return mappedRow
      })

      // Get column order from target database
      const columnOrder = targetDb.columns.map(c => c.name)

      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0]
      const fileName = `export_${project.name.replace(/\s+/g, '_')}_${timestamp}.xlsx`

      // Export to Excel
      await exportToExcel(mappedData, columnOrder, fileName)

      setExportComplete(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  const getSelectedCount = () => {
    if (!indexDb || !patientSelection) return 0

    const selected = filterSelectedPatients(indexDb.data, patientSelection)
    return selected.length
  }

  const getMappedColumnsCount = () => {
    return columnMatching?.matches.length || 0
  }

  if (!indexDb || !targetDb || !patientSelection || !columnMatching) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-3" />
        <p className="text-gray-600 mb-4">Please complete all previous steps before exporting</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Export Data</h2>
        <p className="text-gray-600">
          Review your selections and export the merged database
        </p>
      </div>

      {/* Export Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-blue-50 border-blue-200">
          <p className="text-sm text-blue-700 font-medium">Selected Patients</p>
          <p className="text-3xl font-bold text-blue-900 mt-1">{getSelectedCount()}</p>
          <p className="text-xs text-blue-600 mt-1">from {indexDb.data.length} total</p>
        </div>
        <div className="card bg-green-50 border-green-200">
          <p className="text-sm text-green-700 font-medium">Mapped Columns</p>
          <p className="text-3xl font-bold text-green-900 mt-1">{getMappedColumnsCount()}</p>
          <p className="text-xs text-green-600 mt-1">out of {targetDb.columns.length} target columns</p>
        </div>
        <div className="card bg-purple-50 border-purple-200">
          <p className="text-sm text-purple-700 font-medium">Export Format</p>
          <p className="text-3xl font-bold text-purple-900 mt-1">XLSX</p>
          <p className="text-xs text-purple-600 mt-1">Excel format</p>
        </div>
      </div>

      {/* Review Details */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">Export Details</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="text-sm text-gray-600">Project Name</span>
            <span className="font-medium text-gray-900">{project.name}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="text-sm text-gray-600">Index Database</span>
            <span className="font-medium text-gray-900">{indexDb.name}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="text-sm text-gray-600">Target Database</span>
            <span className="font-medium text-gray-900">{targetDb.name}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="text-sm text-gray-600">Selection Method</span>
            <span className="font-medium text-gray-900 capitalize">{patientSelection.method}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-gray-600">Rows to Export</span>
            <span className="font-medium text-gray-900">{getSelectedCount()}</span>
          </div>
        </div>
      </div>

      {/* Column Mapping Preview */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">Column Mapping Preview</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Source → Target</p>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {columnMatching.matches.slice(0, 10).map((match, idx) => (
                <div key={idx} className="text-sm text-gray-600 py-1 border-b border-gray-100">
                  <span className="font-medium">{match.sourceColumn}</span>
                  <span className="text-gray-400 mx-2">→</span>
                  <span>{match.targetColumn}</span>
                </div>
              ))}
              {columnMatching.matches.length > 10 && (
                <p className="text-xs text-gray-500 italic pt-2">
                  ...and {columnMatching.matches.length - 10} more
                </p>
              )}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Unmatched Columns</p>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {columnMatching.unmatchedTarget.length === 0 ? (
                <p className="text-sm text-green-600">All target columns are matched!</p>
              ) : (
                <>
                  {columnMatching.unmatchedTarget.slice(0, 10).map((col, idx) => (
                    <div key={idx} className="text-sm text-orange-600 py-1 border-b border-orange-100">
                      {col} <span className="text-xs">(will be empty)</span>
                    </div>
                  ))}
                  {columnMatching.unmatchedTarget.length > 10 && (
                    <p className="text-xs text-gray-500 italic pt-2">
                      ...and {columnMatching.unmatchedTarget.length - 10} more
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-start p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-800 font-medium">Export Failed</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {exportComplete && (
        <div className="flex items-start p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-green-800 font-medium">Export Successful!</p>
            <p className="text-sm text-green-700 mt-1">
              Your merged database has been downloaded. Check your Downloads folder.
            </p>
          </div>
        </div>
      )}

      {/* Export Button */}
      <div className="flex gap-3">
        <button
          onClick={handleExport}
          disabled={exporting || getSelectedCount() === 0}
          className="btn-primary flex items-center"
        >
          {exporting ? (
            <>
              <div className="spinner mr-2" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
              Exporting...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Export to Excel
            </>
          )}
        </button>
      </div>

      {/* Info Box */}
      <div className="card bg-blue-50 border-blue-200">
        <h4 className="font-semibold text-blue-900 mb-2">Export Information</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• The exported file will contain only the selected patients</li>
          <li>• Data will be mapped according to the column matching you configured</li>
          <li>• Unmatched target columns will be included but left empty</li>
          <li>• The file will be downloaded as an Excel (.xlsx) file</li>
          <li>• All processing happens locally - your data is never sent to external servers</li>
        </ul>
      </div>

      {/* Additional Actions */}
      <div className="card bg-gray-50">
        <h4 className="font-semibold text-gray-900 mb-3">What's Next?</h4>
        <p className="text-sm text-gray-700 mb-3">
          After exporting your data, you can:
        </p>
        <ul className="text-sm text-gray-700 space-y-2">
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Review the exported file to ensure data quality</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Share the file with your study coordinator</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Make adjustments to your selection or column matching and re-export</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Mark this project as completed in the project settings</span>
          </li>
        </ul>
      </div>
    </div>
  )
}

// Helper function to filter selected patients
function filterSelectedPatients(data: any[], patientSelection: any): any[] {
  if (patientSelection.method === 'filter' && patientSelection.filters) {
    return applyFilters(data, patientSelection.filters)
  } else if (patientSelection.method === 'idList' && patientSelection.idList) {
    const ids = patientSelection.idList
    const idColumns = findIdColumns(Object.keys(data[0] || {}))
    return data.filter(row => {
      return idColumns.some(col => {
        const value = String(row[col] || '').trim()
        return ids.includes(value)
      })
    })
  } else if (patientSelection.method === 'nameList' && patientSelection.nameList) {
    const names = patientSelection.nameList.map((n: any) => String(n).toLowerCase())
    const nameColumns = findNameColumns(Object.keys(data[0] || {}))
    return data.filter(row => {
      return nameColumns.some(col => {
        const value = String(row[col] || '').trim().toLowerCase()
        return names.some((name: string) => value.includes(name) || name.includes(value))
      })
    })
  }
  return []
}

function applyFilters(data: any[], filters: any[]): any[] {
  if (filters.length === 0) return data

  return data.filter(row => {
    let result = true

    for (let i = 0; i < filters.length; i++) {
      const filter = filters[i]
      const value = row[filter.column]
      let matches = false

      switch (filter.operator) {
        case 'equals':
          matches = String(value) === String(filter.value)
          break
        case 'notEquals':
          matches = String(value) !== String(filter.value)
          break
        case 'contains':
          matches = String(value).toLowerCase().includes(String(filter.value).toLowerCase())
          break
        case 'greaterThan':
          matches = Number(value) > Number(filter.value)
          break
        case 'lessThan':
          matches = Number(value) < Number(filter.value)
          break
        case 'in':
          const values = String(filter.value).split(',').map(v => v.trim())
          matches = values.includes(String(value))
          break
      }

      if (i === 0) {
        result = matches
      } else {
        const logic = filters[i - 1].logic || 'AND'
        result = logic === 'AND' ? result && matches : result || matches
      }
    }

    return result
  })
}

function findIdColumns(columns: string[]): string[] {
  const idPatterns = ['id', 'patient_id', 'paziente_id', 'patient id', 'pid']
  return columns.filter(col =>
    idPatterns.some(pattern => col.toLowerCase().includes(pattern))
  )
}

function findNameColumns(columns: string[]): string[] {
  const namePatterns = ['name', 'nome', 'surname', 'cognome', 'patient_name']
  return columns.filter(col =>
    namePatterns.some(pattern => col.toLowerCase().includes(pattern))
  )
}
