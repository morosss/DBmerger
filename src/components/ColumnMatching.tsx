import { useState, useEffect } from 'react'
import { Zap, Check, X, ArrowRight, AlertCircle, Sparkles } from 'lucide-react'
import { Project, ColumnMatch, ColumnMatchingResult } from '../types'
import { matchColumnsWithLLM, quickMatchColumns } from '../services/llm'

interface ColumnMatchingProps {
  project: Project
  onUpdate: (project: Project) => void
  onNext: () => void
}

const AI_MATCH_LIMIT = 1 // Maximum AI matches per project to control API costs

export default function ColumnMatching({ project, onUpdate, onNext }: ColumnMatchingProps) {
  const [matches, setMatches] = useState<ColumnMatch[]>([])
  const [unmatchedSource, setUnmatchedSource] = useState<string[]>([])
  const [unmatchedTarget, setUnmatchedTarget] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const indexDb = project.indexDatabase
  const targetDb = project.targetDatabase
  const aiUsageCount = project.aiMatchUsageCount || 0
  const aiUsageRemaining = AI_MATCH_LIMIT - aiUsageCount

  useEffect(() => {
    if (project.columnMatching) {
      setMatches(project.columnMatching.matches)
      setUnmatchedSource(project.columnMatching.unmatchedSource)
      setUnmatchedTarget(project.columnMatching.unmatchedTarget)
    } else {
      // Auto-run quick match on mount
      handleQuickMatch()
    }
  }, [])

  const handleQuickMatch = () => {
    if (!indexDb || !targetDb) return

    const sourceColumns = indexDb.columns.map(c => c.name)
    const targetColumns = targetDb.columns.map(c => c.name)

    const quickMatches = quickMatchColumns(sourceColumns, targetColumns)

    const columnMatches: ColumnMatch[] = quickMatches.map(m => ({
      sourceColumn: m.source,
      targetColumn: m.target,
      confidence: m.confidence,
      method: m.method,
      verified: false
    }))

    const matchedSources = new Set(columnMatches.map(m => m.sourceColumn))
    const matchedTargets = new Set(columnMatches.map(m => m.targetColumn))

    setMatches(columnMatches)
    setUnmatchedSource(sourceColumns.filter(c => !matchedSources.has(c)))
    setUnmatchedTarget(targetColumns.filter(c => !matchedTargets.has(c)))
  }

  const handleAIMatch = async () => {
    if (!indexDb || !targetDb) return

    // Check AI usage limit
    if (aiUsageRemaining <= 0) {
      setError(`AI matching limit reached (${AI_MATCH_LIMIT} use${AI_MATCH_LIMIT > 1 ? 's' : ''} per project). This helps control API costs. You can still use Quick Match or add manual matches.`)
      return
    }

    setLoading(true)
    setError('')

    try {
      const sourceColumns = indexDb.columns.map(c => c.name)
      const targetColumns = targetDb.columns.map(c => c.name)

      // First try quick matches
      const quickMatches = quickMatchColumns(sourceColumns, targetColumns)
      const matchedSources = new Set(quickMatches.map(m => m.source))
      const matchedTargets = new Set(quickMatches.map(m => m.target))

      // Get unmatched columns for AI
      const unmatchedSourceCols = sourceColumns.filter(c => !matchedSources.has(c))
      const unmatchedTargetCols = targetColumns.filter(c => !matchedTargets.has(c))

      if (unmatchedSourceCols.length === 0 || unmatchedTargetCols.length === 0) {
        // No need for AI, quick match covered everything
        handleQuickMatch()
        return
      }

      // Use AI for unmatched columns
      const aiResult = await matchColumnsWithLLM({
        sourceColumns: unmatchedSourceCols,
        targetColumns: unmatchedTargetCols,
        context: `Medical database for cardiovascular procedures (TAVI, M-TEER).
                 Source is the index database, target is the study template.`
      })

      // Combine quick matches with AI matches
      const allMatches: ColumnMatch[] = [
        ...quickMatches.map(m => ({
          sourceColumn: m.source,
          targetColumn: m.target,
          confidence: m.confidence,
          method: m.method,
          verified: false
        })),
        ...aiResult.matches.map(m => ({
          sourceColumn: m.source,
          targetColumn: m.target,
          confidence: m.confidence,
          method: 'llm' as const,
          verified: false
        }))
      ]

      const allMatchedSources = new Set(allMatches.map(m => m.sourceColumn))
      const allMatchedTargets = new Set(allMatches.map(m => m.targetColumn))

      setMatches(allMatches)
      setUnmatchedSource(sourceColumns.filter(c => !allMatchedSources.has(c)))
      setUnmatchedTarget(targetColumns.filter(c => !allMatchedTargets.has(c)))

      // Increment AI usage counter
      const updatedProject = {
        ...project,
        aiMatchUsageCount: aiUsageCount + 1,
        updatedAt: new Date()
      }
      onUpdate(updatedProject)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI matching failed')
      // Fall back to quick match
      handleQuickMatch()
    } finally {
      setLoading(false)
    }
  }

  const handleManualMatch = (sourceCol: string, targetCol: string) => {
    // Remove from unmatched
    setUnmatchedSource(unmatchedSource.filter(c => c !== sourceCol))
    setUnmatchedTarget(unmatchedTarget.filter(c => c !== targetCol))

    // Add to matches
    const newMatch: ColumnMatch = {
      sourceColumn: sourceCol,
      targetColumn: targetCol,
      confidence: 100,
      method: 'manual',
      verified: true
    }

    setMatches([...matches, newMatch])
  }

  const handleRemoveMatch = (match: ColumnMatch) => {
    setMatches(matches.filter(m => m.sourceColumn !== match.sourceColumn || m.targetColumn !== match.targetColumn))
    setUnmatchedSource([...unmatchedSource, match.sourceColumn])
    setUnmatchedTarget([...unmatchedTarget, match.targetColumn])
  }

  const handleVerifyMatch = (match: ColumnMatch) => {
    setMatches(matches.map(m =>
      m.sourceColumn === match.sourceColumn && m.targetColumn === match.targetColumn
        ? { ...m, verified: true }
        : m
    ))
  }

  const handleConfirmMatching = () => {
    if (matches.length === 0) {
      alert('No column matches defined. Please match at least one column.')
      return
    }

    const unverifiedMatches = matches.filter(m => !m.verified && m.confidence < 90)
    if (unverifiedMatches.length > 0) {
      const proceed = confirm(
        `You have ${unverifiedMatches.length} unverified matches with low confidence. ` +
        'Do you want to proceed anyway?'
      )
      if (!proceed) return
    }

    const matchingResult: ColumnMatchingResult = {
      matches,
      unmatchedSource,
      unmatchedTarget
    }

    const updatedProject = {
      ...project,
      columnMatching: matchingResult,
      status: 'in-progress' as const,
      updatedAt: new Date()
    }

    onUpdate(updatedProject)
    onNext()
  }

  if (!indexDb || !targetDb) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Please complete previous steps first</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Column Matching</h2>
        <p className="text-gray-600">
          Map columns from your index database to the target database template
        </p>
      </div>

      {/* Matching Controls */}
      <div className="space-y-3">
        <div className="flex gap-3">
          <button
            onClick={handleQuickMatch}
            disabled={loading}
            className="btn-secondary flex items-center"
          >
            <Zap className="h-4 w-4 mr-2" />
            Quick Match
          </button>
          <button
            onClick={handleAIMatch}
            disabled={loading || aiUsageRemaining <= 0}
            className={`btn-primary flex items-center ${aiUsageRemaining <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={aiUsageRemaining <= 0 ? 'AI matching limit reached' : `${aiUsageRemaining} AI match${aiUsageRemaining !== 1 ? 'es' : ''} remaining`}
          >
            {loading ? (
              <>
                <div className="spinner mr-2" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
                AI Matching...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                AI Match with Claude
                {aiUsageRemaining > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-white bg-opacity-30 rounded text-xs">
                    {aiUsageRemaining}/{AI_MATCH_LIMIT}
                  </span>
                )}
              </>
            )}
          </button>
        </div>

        {aiUsageRemaining <= 0 && (
          <div className="flex items-start p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">AI matching limit reached</p>
              <p className="mt-1">You've used your {AI_MATCH_LIMIT} AI match{AI_MATCH_LIMIT > 1 ? 'es' : ''} for this project. You can still use <strong>Quick Match</strong> (free, instant) or add <strong>manual matches</strong> below.</p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-start p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-800 font-medium">{error}</p>
            <p className="text-xs text-red-700 mt-1">Fell back to quick matching. You can still add manual matches below.</p>
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card bg-green-50 border-green-200">
          <p className="text-sm text-green-700 font-medium">Matched Columns</p>
          <p className="text-3xl font-bold text-green-900 mt-1">{matches.length}</p>
        </div>
        <div className="card bg-yellow-50 border-yellow-200">
          <p className="text-sm text-yellow-700 font-medium">Unmatched Source</p>
          <p className="text-3xl font-bold text-yellow-900 mt-1">{unmatchedSource.length}</p>
        </div>
        <div className="card bg-blue-50 border-blue-200">
          <p className="text-sm text-blue-700 font-medium">Unmatched Target</p>
          <p className="text-3xl font-bold text-blue-900 mt-1">{unmatchedTarget.length}</p>
        </div>
      </div>

      {/* Matched Columns */}
      {matches.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Matched Columns</h3>
          <div className="space-y-2">
            {matches.map((match, idx) => (
              <div key={idx} className="p-4 border border-gray-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center flex-1">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{match.sourceColumn}</p>
                    <p className="text-xs text-gray-500">Index Database</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 mx-4" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{match.targetColumn}</p>
                    <p className="text-xs text-gray-500">Target Database</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      match.confidence >= 90 ? 'bg-green-100 text-green-800' :
                      match.confidence >= 70 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {match.confidence}% {match.method}
                    </span>
                    {match.verified && (
                      <div className="flex items-center text-green-600 text-xs mt-1">
                        <Check className="h-3 w-3 mr-1" />
                        Verified
                      </div>
                    )}
                  </div>
                  {!match.verified && match.confidence < 90 && (
                    <button
                      onClick={() => handleVerifyMatch(match)}
                      className="btn-secondary text-sm py-1 px-2"
                      title="Verify this match"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleRemoveMatch(match)}
                    className="btn-secondary text-sm py-1 px-2 text-red-600 hover:bg-red-50"
                    title="Remove this match"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manual Matching */}
      {(unmatchedSource.length > 0 && unmatchedTarget.length > 0) && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Manual Matching</h3>
          <p className="text-sm text-gray-600 mb-3">
            Match remaining columns manually by selecting one from each side
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Source Column (Index DB)</label>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {unmatchedSource.map(col => (
                  <button
                    key={col}
                    onClick={() => {
                      const target = prompt(`Match "${col}" to which target column?`)
                      if (target && unmatchedTarget.includes(target)) {
                        handleManualMatch(col, target)
                      }
                    }}
                    className="w-full text-left p-3 border border-gray-200 rounded hover:border-primary-400 hover:bg-primary-50 transition-colors"
                  >
                    <p className="font-medium text-gray-900">{col}</p>
                    <p className="text-xs text-gray-500">Click to match</p>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Target Column (Target DB)</label>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {unmatchedTarget.map(col => (
                  <div
                    key={col}
                    className="p-3 border border-gray-200 rounded bg-gray-50"
                  >
                    <p className="font-medium text-gray-900">{col}</p>
                    <p className="text-xs text-gray-500">Unmatched</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="card bg-blue-50 border-blue-200">
        <h4 className="font-semibold text-blue-900 mb-2">Column Matching Tips</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Quick Match:</strong> Fast matching using exact names and common patterns</li>
          <li>• <strong>AI Match:</strong> Uses Claude Haiku to intelligently match columns (requires API key)</li>
          <li>• Verify low-confidence matches before proceeding</li>
          <li>• Unmatched columns won't be included in the export</li>
          <li>• You can manually match remaining columns using the interface above</li>
        </ul>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleConfirmMatching}
          disabled={matches.length === 0}
          className="btn-primary flex items-center"
        >
          Confirm Matching
          <ArrowRight className="h-4 w-4 ml-2" />
        </button>
      </div>
    </div>
  )
}
