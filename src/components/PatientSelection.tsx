import { useState, useEffect, useRef } from 'react'
import { Users, Plus, Trash2, Filter, List, ArrowRight, ChevronDown, Check } from 'lucide-react'
import { Project, FilterCondition, PatientSelection as PatientSelectionType } from '../types'

interface PatientSelectionProps {
  project: Project
  onUpdate: (project: Project) => void
  onNext: () => void
}

type SelectionMethod = 'filter' | 'idList' | 'nameList'

export default function PatientSelection({ project, onUpdate, onNext }: PatientSelectionProps) {
  const [method, setMethod] = useState<SelectionMethod>('filter')
  const [filters, setFilters] = useState<FilterCondition[]>([])
  const [idListText, setIdListText] = useState('')
  const [nameListText, setNameListText] = useState('')
  const [selectedCount, setSelectedCount] = useState(0)
  const [previewData, setPreviewData] = useState<any[]>([])

  const indexDb = project.indexDatabase

  useEffect(() => {
    if (project.patientSelection) {
      if (project.patientSelection.method === 'filter' && project.patientSelection.filters) {
        setMethod('filter')
        setFilters(project.patientSelection.filters)
      } else if (project.patientSelection.method === 'idList' && project.patientSelection.idList) {
        setMethod('idList')
        setIdListText(project.patientSelection.idList.join('\n'))
      } else if (project.patientSelection.method === 'nameList' && project.patientSelection.nameList) {
        setMethod('nameList')
        setNameListText(project.patientSelection.nameList.join('\n'))
      }
    }
  }, [project.patientSelection])

  useEffect(() => {
    applySelection()
  }, [filters, idListText, nameListText, method])

  const applySelection = () => {
    if (!indexDb) return

    let selected: any[] = []

    if (method === 'filter') {
      selected = applyFilters(indexDb.data, filters)
    } else if (method === 'idList') {
      const ids = idListText.split('\n').map(s => s.trim()).filter(Boolean)
      const idColumns = findIdColumns(indexDb.columns.map(c => c.name))

      selected = indexDb.data.filter(row => {
        return idColumns.some(col => {
          const value = String(row[col] || '').trim()
          return ids.includes(value)
        })
      })
    } else if (method === 'nameList') {
      const names = nameListText.split('\n').map(s => s.trim().toLowerCase()).filter(Boolean)
      const nameColumns = findNameColumns(indexDb.columns.map(c => c.name))

      selected = indexDb.data.filter(row => {
        return nameColumns.some(col => {
          const value = String(row[col] || '').trim().toLowerCase()
          return names.some(name => value.includes(name) || name.includes(value))
        })
      })
    }

    setSelectedCount(selected.length)
    setPreviewData(selected.slice(0, 10))
  }

  const getUniqueValues = (columnName: string): string[] => {
    if (!indexDb) return []

    const uniqueSet = new Set<string>()
    indexDb.data.forEach(row => {
      const value = row[columnName]
      if (value !== null && value !== undefined && value !== '') {
        uniqueSet.add(String(value))
      }
    })

    return Array.from(uniqueSet).sort()
  }

  const applyFilters = (data: any[], filters: FilterCondition[]): any[] => {
    if (filters.length === 0) return data

    return data.filter(row => {
      let result = true

      for (let i = 0; i < filters.length; i++) {
        const filter = filters[i]
        const value = row[filter.column]
        let matches = false

        switch (filter.operator) {
          case 'equals':
            // Support both single value and array of values
            if (Array.isArray(filter.value)) {
              matches = filter.value.includes(String(value))
            } else {
              matches = String(value) === String(filter.value)
            }
            break
          case 'notEquals':
            // Support both single value and array of values
            if (Array.isArray(filter.value)) {
              matches = !filter.value.includes(String(value))
            } else {
              matches = String(value) !== String(filter.value)
            }
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

  const addFilter = () => {
    const newFilter: FilterCondition = {
      id: `filter_${Date.now()}`,
      column: indexDb?.columns[0]?.name || '',
      operator: 'equals',
      value: '',
      logic: filters.length > 0 ? 'AND' : undefined
    }
    setFilters([...filters, newFilter])
  }

  const removeFilter = (id: string) => {
    setFilters(filters.filter(f => f.id !== id))
  }

  const updateFilter = (id: string, updates: Partial<FilterCondition>) => {
    setFilters(filters.map(f => f.id === id ? { ...f, ...updates } : f))
  }

  const handleConfirmSelection = () => {
    if (selectedCount === 0) {
      alert('No patients selected. Please adjust your selection criteria.')
      return
    }

    let selection: PatientSelectionType

    if (method === 'filter') {
      selection = { method: 'filter', filters }
    } else if (method === 'idList') {
      const ids = idListText.split('\n').map(s => s.trim()).filter(Boolean)
      selection = { method: 'idList', idList: ids }
    } else {
      const names = nameListText.split('\n').map(s => s.trim()).filter(Boolean)
      selection = { method: 'nameList', nameList: names }
    }

    const updatedProject = {
      ...project,
      patientSelection: selection,
      updatedAt: new Date()
    }

    onUpdate(updatedProject)
    onNext()
  }

  // Multi-select dropdown component
  const MultiSelectDropdown = ({ filter }: { filter: FilterCondition }) => {
    const [isOpen, setIsOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const dropdownRef = useRef<HTMLDivElement>(null)

    const uniqueValues = getUniqueValues(filter.column)
    const selectedValues = Array.isArray(filter.value) ? filter.value : (filter.value ? [String(filter.value)] : [])

    const filteredValues = searchTerm
      ? uniqueValues.filter(v => v.toLowerCase().includes(searchTerm.toLowerCase()))
      : uniqueValues

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsOpen(false)
        }
      }

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside)
      }

      return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [isOpen])

    const toggleValue = (value: string) => {
      let newValues: string[]
      if (selectedValues.includes(value)) {
        newValues = selectedValues.filter(v => v !== value)
      } else {
        newValues = [...selectedValues, value]
      }
      updateFilter(filter.id, { value: newValues })
    }

    const selectAll = () => {
      updateFilter(filter.id, { value: filteredValues })
    }

    const clearAll = () => {
      updateFilter(filter.id, { value: [] })
    }

    return (
      <div ref={dropdownRef} className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="input-field w-full text-left flex items-center justify-between"
        >
          <span className="truncate">
            {selectedValues.length === 0
              ? 'Select values...'
              : `${selectedValues.length} selected`}
          </span>
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-hidden">
            {/* Search bar */}
            <div className="p-2 border-b border-gray-200">
              <input
                type="text"
                placeholder="Search values..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field text-sm"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 p-2 border-b border-gray-200 bg-gray-50">
              <button
                type="button"
                onClick={selectAll}
                className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded hover:bg-primary-200"
              >
                Select All {filteredValues.length > 0 && `(${filteredValues.length})`}
              </button>
              <button
                type="button"
                onClick={clearAll}
                className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Clear
              </button>
            </div>

            {/* Values list */}
            <div className="overflow-y-auto max-h-60">
              {filteredValues.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  No values found
                </div>
              ) : (
                filteredValues.map((value) => (
                  <label
                    key={value}
                    className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedValues.includes(value)}
                      onChange={() => toggleValue(value)}
                      className="mr-2 h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                    />
                    <span className="text-sm flex-1 truncate">{value}</span>
                    {selectedValues.includes(value) && (
                      <Check className="h-4 w-4 text-primary-600" />
                    )}
                  </label>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-2 border-t border-gray-200 bg-gray-50 text-xs text-gray-600">
              {uniqueValues.length} unique values in column
            </div>
          </div>
        )}
      </div>
    )
  }

  if (!indexDb) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Please upload databases first</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Patient Selection</h2>
        <p className="text-gray-600">
          Select patients from your index database using filters or manual lists
        </p>
      </div>

      {/* Selection Method */}
      <div>
        <label className="label">Selection Method</label>
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => setMethod('filter')}
            className={`p-4 border-2 rounded-lg transition-colors ${
              method === 'filter'
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Filter className="h-6 w-6 mx-auto mb-2" />
            <p className="font-medium">Filter Builder</p>
            <p className="text-xs text-gray-600 mt-1">Advanced filtering</p>
          </button>
          <button
            onClick={() => setMethod('idList')}
            className={`p-4 border-2 rounded-lg transition-colors ${
              method === 'idList'
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <List className="h-6 w-6 mx-auto mb-2" />
            <p className="font-medium">Patient ID List</p>
            <p className="text-xs text-gray-600 mt-1">Enter IDs manually</p>
          </button>
          <button
            onClick={() => setMethod('nameList')}
            className={`p-4 border-2 rounded-lg transition-colors ${
              method === 'nameList'
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Users className="h-6 w-6 mx-auto mb-2" />
            <p className="font-medium">Name List</p>
            <p className="text-xs text-gray-600 mt-1">Enter names manually</p>
          </button>
        </div>
      </div>

      {/* Filter Builder */}
      {method === 'filter' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Filters</h3>
            <button onClick={addFilter} className="btn-secondary text-sm flex items-center">
              <Plus className="h-4 w-4 mr-1" />
              Add Filter
            </button>
          </div>

          {filters.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
              <Filter className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-3">No filters added yet</p>
              <button onClick={addFilter} className="btn-primary text-sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Your First Filter
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filters.map((filter, index) => (
                <div key={filter.id} className="p-4 border border-gray-200 rounded-lg">
                  {index > 0 && (
                    <div className="mb-3">
                      <select
                        value={filters[index - 1].logic}
                        onChange={(e) => updateFilter(filters[index - 1].id, { logic: e.target.value as 'AND' | 'OR' })}
                        className="input-field w-24 text-sm"
                      >
                        <option value="AND">AND</option>
                        <option value="OR">OR</option>
                      </select>
                    </div>
                  )}
                  <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-4">
                      <select
                        value={filter.column}
                        onChange={(e) => updateFilter(filter.id, { column: e.target.value })}
                        className="input-field"
                      >
                        {indexDb.columns.map(col => (
                          <option key={col.name} value={col.name}>{col.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-3">
                      <select
                        value={filter.operator}
                        onChange={(e) => updateFilter(filter.id, { operator: e.target.value as any })}
                        className="input-field"
                      >
                        <option value="equals">Equals</option>
                        <option value="notEquals">Not Equals</option>
                        <option value="contains">Contains</option>
                        <option value="greaterThan">Greater Than</option>
                        <option value="lessThan">Less Than</option>
                        <option value="in">In List</option>
                      </select>
                    </div>
                    <div className="col-span-4">
                      {(filter.operator === 'equals' || filter.operator === 'notEquals') ? (
                        <MultiSelectDropdown filter={filter} />
                      ) : (
                        <input
                          type="text"
                          value={Array.isArray(filter.value) ? filter.value.join(', ') : filter.value}
                          onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                          placeholder="Value..."
                          className="input-field"
                        />
                      )}
                    </div>
                    <div className="col-span-1">
                      <button
                        onClick={() => removeFilter(filter.id)}
                        className="btn-secondary p-2 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ID List */}
      {method === 'idList' && (
        <div>
          <label className="label">Patient IDs (one per line)</label>
          <textarea
            value={idListText}
            onChange={(e) => setIdListText(e.target.value)}
            placeholder="Enter patient IDs, one per line&#10;Example:&#10;12345&#10;12346&#10;12347"
            rows={10}
            className="input-field font-mono text-sm"
          />
          <p className="text-sm text-gray-600 mt-2">
            Detected ID columns: {findIdColumns(indexDb.columns.map(c => c.name)).join(', ')}
          </p>
        </div>
      )}

      {/* Name List */}
      {method === 'nameList' && (
        <div>
          <label className="label">Patient Names (one per line)</label>
          <textarea
            value={nameListText}
            onChange={(e) => setNameListText(e.target.value)}
            placeholder="Enter patient names, one per line&#10;Example:&#10;John Smith&#10;Jane Doe&#10;Mario Rossi"
            rows={10}
            className="input-field font-mono text-sm"
          />
          <p className="text-sm text-gray-600 mt-2">
            Detected name columns: {findNameColumns(indexDb.columns.map(c => c.name)).join(', ')}
          </p>
        </div>
      )}

      {/* Selection Summary */}
      <div className="card bg-primary-50 border-primary-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-primary-700 font-medium">Selected Patients</p>
            <p className="text-3xl font-bold text-primary-900 mt-1">{selectedCount}</p>
          </div>
          <Users className="h-16 w-16 text-primary-600 opacity-50" />
        </div>
        <p className="text-sm text-primary-700 mt-2">
          out of {indexDb.data.length} total patients
        </p>
      </div>

      {/* Preview */}
      {previewData.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Preview (first 10 patients)</h3>
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {indexDb.columns.slice(0, 5).map(col => (
                    <th key={col.name} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {col.name}
                    </th>
                  ))}
                  {indexDb.columns.length > 5 && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      ...
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {previewData.map((row, idx) => (
                  <tr key={idx}>
                    {indexDb.columns.slice(0, 5).map(col => (
                      <td key={col.name} className="px-4 py-3 text-sm text-gray-900">
                        {String(row[col.name] || '')}
                      </td>
                    ))}
                    {indexDb.columns.length > 5 && (
                      <td className="px-4 py-3 text-sm text-gray-500">...</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleConfirmSelection}
          disabled={selectedCount === 0}
          className="btn-primary flex items-center"
        >
          Confirm Selection
          <ArrowRight className="h-4 w-4 ml-2" />
        </button>
      </div>
    </div>
  )
}

// Helper functions
function findIdColumns(columns: string[]): string[] {
  const idPatterns = ['id', 'patient_id', 'paziente_id', 'patient id', 'pid', 'patient_number']
  return columns.filter(col =>
    idPatterns.some(pattern => col.toLowerCase().includes(pattern))
  )
}

function findNameColumns(columns: string[]): string[] {
  const namePatterns = ['name', 'nome', 'surname', 'cognome', 'patient_name', 'full_name', 'fullname']
  return columns.filter(col =>
    namePatterns.some(pattern => col.toLowerCase().includes(pattern))
  )
}
