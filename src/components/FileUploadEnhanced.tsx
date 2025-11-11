import { useState, useRef } from 'react'
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Cloud } from 'lucide-react'
import { Project } from '../types'
import { parseFile } from '../services/parser'
import { getPredefinedDatabases, importPredefinedDatabase } from '../services/googleSheets'

interface FileUploadEnhancedProps {
  project: Project
  onUpdate: (project: Project) => void
}

export default function FileUploadEnhanced({ project, onUpdate }: FileUploadEnhancedProps) {
  const [indexFile, setIndexFile] = useState<File | null>(null)
  const [targetFile, setTargetFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [indexHeaderRow, setIndexHeaderRow] = useState(1)
  const [targetHeaderRow, setTargetHeaderRow] = useState(1)
  const [indexSource, setIndexSource] = useState<'file' | 'predefined'>('file')
  const [selectedPredefined, setSelectedPredefined] = useState<string>('')
  const [loadingPredefined, setLoadingPredefined] = useState(false)

  const indexInputRef = useRef<HTMLInputElement>(null)
  const targetInputRef = useRef<HTMLInputElement>(null)

  const handleIndexFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIndexFile(file)
    setError('')
    setIndexHeaderRow(1)
  }

  const handleTargetFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setTargetFile(file)
    setError('')
    setTargetHeaderRow(1)
  }

  const handlePredefinedSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const dbId = e.target.value
    setSelectedPredefined(dbId)

    if (!dbId) {
      setIndexFile(null)
      return
    }

    const config = getPredefinedDatabases().find(db => db.id === dbId)
    if (!config) return

    setLoadingPredefined(true)
    setError('')

    try {
      const file = await importPredefinedDatabase(config)
      setIndexFile(file)
      setIndexHeaderRow(1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load predefined database')
      setIndexFile(null)
    } finally {
      setLoadingPredefined(false)
    }
  }

  const handleUpload = async () => {
    if (!indexFile || !targetFile) {
      setError('Please select both index and target databases')
      return
    }

    setUploading(true)
    setError('')

    try {
      // Parse index database
      const indexDb = await parseFile(indexFile, 'index', indexHeaderRow)

      // Parse target database
      const targetDb = await parseFile(targetFile, 'target', targetHeaderRow)

      // Update project
      const updatedProject: Project = {
        ...project,
        indexDatabase: indexDb,
        targetDatabase: targetDb,
        status: 'in-progress',
        updatedAt: new Date()
      }

      onUpdate(updatedProject)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload files')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent, type: 'index' | 'target') => {
    e.preventDefault()
    e.stopPropagation()

    const file = e.dataTransfer.files[0]
    if (!file) return

    // Check file type
    const validTypes = ['xlsx', 'xls', 'xlsm', 'csv']
    const fileExt = file.name.split('.').pop()?.toLowerCase()

    if (!fileExt || !validTypes.includes(fileExt)) {
      setError('Please upload Excel (.xlsx, .xls) or CSV (.csv) files')
      return
    }

    if (type === 'index') {
      setIndexFile(file)
      setIndexHeaderRow(1)
      setIndexSource('file')
      setSelectedPredefined('')
    } else {
      setTargetFile(file)
      setTargetHeaderRow(1)
    }

    setError('')
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Upload Databases</h2>
        <p className="text-gray-600">
          Select from predefined databases or upload your own Excel/CSV files
        </p>
      </div>

      {/* Index Database Section */}
      <div className="space-y-4">
        <div>
          <label className="label">
            Index Database (Primary) <span className="text-red-500">*</span>
          </label>

          {/* Source Selection Tabs */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => {
                setIndexSource('predefined')
                setIndexFile(null)
              }}
              className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                indexSource === 'predefined'
                  ? 'border-primary-500 bg-primary-50 text-primary-900'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              <Cloud className="h-5 w-5 mx-auto mb-1" />
              <span className="text-sm font-medium">Predefined Database</span>
            </button>
            <button
              onClick={() => {
                setIndexSource('file')
                setSelectedPredefined('')
              }}
              className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                indexSource === 'file'
                  ? 'border-primary-500 bg-primary-50 text-primary-900'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              <Upload className="h-5 w-5 mx-auto mb-1" />
              <span className="text-sm font-medium">Upload File</span>
            </button>
          </div>

          {/* Predefined Database Dropdown */}
          {indexSource === 'predefined' && (
            <div className="space-y-3">
              <select
                value={selectedPredefined}
                onChange={handlePredefinedSelect}
                disabled={loadingPredefined || !!project.indexDatabase}
                className="input-field"
              >
                <option value="">Select a database...</option>
                {getPredefinedDatabases().map((db) => (
                  <option key={db.id} value={db.id}>
                    {db.name} ({db.type.toUpperCase()})
                  </option>
                ))}
              </select>

              {getPredefinedDatabases().length === 0 && (
                <p className="text-sm text-gray-600 mt-2">
                  No predefined databases configured. You can still upload Excel/CSV files directly.
                </p>
              )}

              {loadingPredefined && (
                <div className="flex items-center justify-center py-8 bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg">
                  <div className="spinner mr-3" />
                  <span className="text-blue-700">Loading database from Google Sheets...</span>
                </div>
              )}

              {indexFile && !loadingPredefined && (
                <div className="flex items-center p-4 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                  <div>
                    <p className="font-medium text-green-900">{indexFile.name}</p>
                    <p className="text-sm text-green-700">Ready to upload</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* File Upload */}
          {indexSource === 'file' && (
            <div
              onDrop={(e) => handleDrop(e, 'index')}
              onDragOver={handleDragOver}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                indexFile || project.indexDatabase
                  ? 'border-green-400 bg-green-50'
                  : 'border-gray-300 hover:border-primary-400 hover:bg-primary-50'
              }`}
              onClick={() => indexInputRef.current?.click()}
            >
              <input
                ref={indexInputRef}
                type="file"
                accept=".xlsx,.xls,.xlsm,.csv"
                onChange={handleIndexFileChange}
                className="hidden"
              />
              {project.indexDatabase ? (
                <div className="flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
                  <div className="text-left">
                    <p className="font-medium text-green-900">{project.indexDatabase.name}</p>
                    <p className="text-sm text-green-700">
                      {project.indexDatabase.data.length} rows, {project.indexDatabase.columns.length} columns
                    </p>
                  </div>
                </div>
              ) : indexFile ? (
                <div className="flex items-center justify-center">
                  <FileSpreadsheet className="h-8 w-8 text-primary-600 mr-3" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">{indexFile.name}</p>
                    <p className="text-sm text-gray-600">Ready to upload</p>
                  </div>
                </div>
              ) : (
                <div>
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-700 font-medium">Drop index database here or click to browse</p>
                  <p className="text-sm text-gray-500 mt-1">Supports Excel (.xlsx, .xls) and CSV files</p>
                </div>
              )}
            </div>
          )}

          {(indexFile || project.indexDatabase) && (
            <div className="mt-2">
              <label className="label text-sm">Header Row</label>
              <input
                type="number"
                min="1"
                value={indexHeaderRow}
                onChange={(e) => setIndexHeaderRow(parseInt(e.target.value) || 1)}
                className="input-field w-24"
                disabled={!!project.indexDatabase}
              />
              <p className="text-xs text-gray-500 mt-1">Specify which row contains column headers (usually row 1)</p>
            </div>
          )}
        </div>

        {/* Target Database */}
        <div>
          <label className="label">
            Target Database Template <span className="text-red-500">*</span>
          </label>
          <div
            onDrop={(e) => handleDrop(e, 'target')}
            onDragOver={handleDragOver}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              targetFile || project.targetDatabase
                ? 'border-green-400 bg-green-50'
                : 'border-gray-300 hover:border-primary-400 hover:bg-primary-50'
            }`}
            onClick={() => targetInputRef.current?.click()}
          >
            <input
              ref={targetInputRef}
              type="file"
              accept=".xlsx,.xls,.xlsm,.csv"
              onChange={handleTargetFileChange}
              className="hidden"
            />
            {project.targetDatabase ? (
              <div className="flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
                <div className="text-left">
                  <p className="font-medium text-green-900">{project.targetDatabase.name}</p>
                  <p className="text-sm text-green-700">
                    {project.targetDatabase.data.length} rows, {project.targetDatabase.columns.length} columns
                  </p>
                </div>
              </div>
            ) : targetFile ? (
              <div className="flex items-center justify-center">
                <FileSpreadsheet className="h-8 w-8 text-primary-600 mr-3" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">{targetFile.name}</p>
                  <p className="text-sm text-gray-600">Ready to upload</p>
                </div>
              </div>
            ) : (
              <div>
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-700 font-medium">Drop target database here or click to browse</p>
                <p className="text-sm text-gray-500 mt-1">Supports Excel (.xlsx, .xls) and CSV files</p>
              </div>
            )}
          </div>
          {(targetFile || project.targetDatabase) && (
            <div className="mt-2">
              <label className="label text-sm">Header Row</label>
              <input
                type="number"
                min="1"
                value={targetHeaderRow}
                onChange={(e) => setTargetHeaderRow(parseInt(e.target.value) || 1)}
                className="input-field w-24"
                disabled={!!project.targetDatabase}
              />
              <p className="text-xs text-gray-500 mt-1">Specify which row contains column headers (usually row 1)</p>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-start p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {!project.indexDatabase || !project.targetDatabase ? (
        <div className="flex gap-3">
          <button
            onClick={handleUpload}
            disabled={!indexFile || !targetFile || uploading || loadingPredefined}
            className="btn-primary"
          >
            {uploading ? (
              <>
                <div className="spinner mr-2" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
                Processing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload and Parse Databases
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
            <div>
              <p className="font-medium text-green-900">Databases uploaded successfully!</p>
              <p className="text-sm text-green-700 mt-1">
                You can now proceed to patient selection in the next step.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Info box */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">About Database Upload</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Predefined Databases:</strong> Quick access to TAVI and M-TEER databases from Google Sheets</li>
          <li>• <strong>Index Database:</strong> Your main database with all patient records</li>
          <li>• <strong>Target Database:</strong> The template provided by the study coordinator</li>
          <li>• All data is processed locally in your browser - nothing is sent to external servers</li>
          <li>• Supported formats: Excel (.xlsx, .xls, .xlsm) and CSV (.csv)</li>
        </ul>
      </div>
    </div>
  )
}
