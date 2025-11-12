import Anthropic from '@anthropic-ai/sdk'
import { LLMColumnMatchRequest, LLMColumnMatchResponse } from '../types'

// Initialize Anthropic client
let anthropicClient: Anthropic | null = null

function getClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error('Anthropic API key not configured. Please add VITE_ANTHROPIC_API_KEY to your .env file.')
    }
    anthropicClient = new Anthropic({
      apiKey,
      dangerouslyAllowBrowser: true // Required for browser usage
    })
  }
  return anthropicClient
}

/**
 * Use Claude Haiku to match columns between source and target databases (optimized for token usage)
 * @param confidenceThreshold - Only send matches below this confidence to LLM for refinement (0-100)
 */
export async function matchColumnsWithLLM(
  request: LLMColumnMatchRequest,
  confidenceThreshold: number = 100
): Promise<LLMColumnMatchResponse> {
  const client = getClient()

  // OPTIMIZATION 1: Pre-filter using quick matching to reduce LLM workload
  const quickMatches = quickMatchColumns(request.sourceColumns, request.targetColumns)

  // Separate high-confidence matches (keep as-is) from low-confidence matches (refine with LLM)
  const highConfidenceMatches = quickMatches.filter(m => m.confidence >= confidenceThreshold)
  const lowConfidenceMatches = quickMatches.filter(m => m.confidence < confidenceThreshold)

  const quickMatchedSources = new Set(highConfidenceMatches.map(m => m.source))
  const quickMatchedTargets = new Set(highConfidenceMatches.map(m => m.target))

  // Send to LLM: unmatched columns + low-confidence matches for refinement
  const unmatchedSource = request.sourceColumns.filter(col => !quickMatchedSources.has(col))
  const unmatchedTarget = request.targetColumns.filter(col => !quickMatchedTargets.has(col))

  console.log(`Quick matching: ${quickMatches.length} total (${highConfidenceMatches.length} high-confidence ≥${confidenceThreshold}%, ${lowConfidenceMatches.length} low-confidence)`)
  console.log(`Sending to LLM for refinement: ${unmatchedSource.length} source, ${unmatchedTarget.length} target`)

  // If no columns need LLM processing, return quick matches
  if (unmatchedSource.length === 0 || unmatchedTarget.length === 0) {
    return {
      matches: quickMatches.map(m => ({
        source: m.source,
        target: m.target,
        confidence: m.confidence,
        reasoning: m.method === 'exact' ? 'Exact match' : 'Common pattern'
      }))
    }
  }

  // OPTIMIZATION 2: Batch processing for very large column lists
  const BATCH_SIZE = 100
  const allLLMMatches: Array<{ source: string; target: string; confidence: number }> = []

  for (let i = 0; i < unmatchedSource.length; i += BATCH_SIZE) {
    const sourceBatch = unmatchedSource.slice(i, i + BATCH_SIZE)

    // OPTIMIZATION 3: Compact prompt with minimal examples
    const prompt = `Match medical database columns. Consider Italian/English terms and abbreviations.

SOURCE: ${sourceBatch.join(', ')}
TARGET: ${unmatchedTarget.join(', ')}

Common patterns: age/età, sex/sesso, ID/paziente_id, LVEF/FE, mortality/morte, TAVI valve types, M-TEER clips.

Return ONLY JSON array (no markdown). Match exact names. Min confidence: 70.

[{"source":"col_name","target":"col_name","confidence":85}]`

    try {
      const message = await client.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 50000, // Reduced from 100K since we're batching
        messages: [{
          role: 'user',
          content: prompt
        }]
      })

      const responseText = message.content[0].type === 'text' ? message.content[0].text : ''
      console.log(`LLM Response for batch ${Math.floor(i / BATCH_SIZE) + 1}:`, responseText.substring(0, 200))

      if (message.stop_reason === 'max_tokens') {
        console.warn(`Batch ${Math.floor(i / BATCH_SIZE) + 1} truncated - consider smaller batch size`)
      }

      // Extract JSON
      let jsonText = ''
      const codeBlockMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
      if (codeBlockMatch) {
        jsonText = codeBlockMatch[1].trim()
      } else {
        const firstBracket = responseText.indexOf('[')
        const lastBracket = responseText.lastIndexOf(']')
        if (firstBracket !== -1 && lastBracket !== -1) {
          jsonText = responseText.substring(firstBracket, lastBracket + 1)
        }
      }

      if (jsonText) {
        const parsed = JSON.parse(jsonText)
        const batchMatches = Array.isArray(parsed) ? parsed : (parsed.matches || [])
        allLLMMatches.push(...batchMatches)
      }
    } catch (error) {
      console.error(`Batch ${Math.floor(i / BATCH_SIZE) + 1} failed:`, error)
      // Continue with next batch instead of failing completely
    }
  }

  // Combine high-confidence quick matches with LLM results (which may improve low-confidence matches)
  const combinedMatches = [
    ...highConfidenceMatches.map(m => ({
      source: m.source,
      target: m.target,
      confidence: m.confidence,
      reasoning: m.method === 'exact' ? 'Exact match' : 'Common pattern'
    })),
    ...allLLMMatches.map((m: any) => ({
      source: m.source,
      target: m.target,
      confidence: m.confidence,
      reasoning: m.reasoning || 'AI refined'
    }))
  ]

  console.log(`Total matches: ${combinedMatches.length} (${highConfidenceMatches.length} high-confidence quick + ${allLLMMatches.length} AI refined)`)

  return { matches: combinedMatches }
}

/**
 * Common column mappings for quick matching without LLM
 */
export const COMMON_COLUMN_MAPPINGS: Record<string, string[]> = {
  // Patient identifiers
  'patient_id': ['patient_id', 'id', 'patient id', 'id paziente', 'paziente_id', 'pid', 'patient_number', 'numero_paziente'],
  'name': ['name', 'patient_name', 'nome', 'nome_paziente', 'patient name', 'full_name'],
  'surname': ['surname', 'last_name', 'cognome', 'lastname', 'family_name'],
  'first_name': ['first_name', 'nome', 'firstname', 'given_name'],

  // Demographics
  'age': ['age', 'età', 'patient_age', 'age_years', 'anni'],
  'sex': ['sex', 'gender', 'sesso', 'genere', 'm/f', 'male/female'],
  'date_of_birth': ['dob', 'birth_date', 'date_of_birth', 'data_nascita', 'birthdate', 'data di nascita'],

  // Dates
  'procedure_date': ['procedure_date', 'date', 'data_procedura', 'intervention_date', 'data_intervento', 'surgery_date'],
  'admission_date': ['admission_date', 'data_ricovero', 'admission', 'ricovero', 'hospital_admission'],
  'discharge_date': ['discharge_date', 'data_dimissione', 'discharge', 'dimissione'],

  // TAVI specific
  'valve_type': ['valve_type', 'tipo_valvola', 'prosthesis', 'protesi', 'valve'],
  'valve_size': ['valve_size', 'dimensione_valvola', 'size', 'dimensione', 'mm'],
  'access_site': ['access_site', 'via_accesso', 'access', 'accesso', 'approach'],

  // M-TEER specific
  'clip_type': ['clip_type', 'tipo_clip', 'device', 'dispositivo'],
  'number_of_clips': ['number_of_clips', 'numero_clip', 'clips', 'n_clips'],

  // Clinical outcomes
  'mortality': ['mortality', 'mortalità', 'death', 'morte', 'deceased', 'exitus'],
  'complications': ['complications', 'complicanze', 'adverse_events', 'eventi_avversi'],
  'bleeding': ['bleeding', 'sanguinamento', 'hemorrhage', 'emorragia'],
  'stroke': ['stroke', 'ictus', 'cva', 'cerebrovascular_accident'],
  'mi': ['mi', 'myocardial_infarction', 'infarto', 'heart_attack', 'ima'],

  // Follow-up
  'follow_up_date': ['follow_up_date', 'data_follow_up', 'followup_date', 'fu_date'],
  'follow_up_status': ['follow_up_status', 'stato_follow_up', 'fu_status', 'status'],
}

/**
 * Quick column matching using common mappings (optimized with fuzzy matching)
 */
export function quickMatchColumns(
  sourceColumns: string[],
  targetColumns: string[]
): Array<{ source: string; target: string; confidence: number; method: 'exact' | 'common' }> {
  const matches: Array<{ source: string; target: string; confidence: number; method: 'exact' | 'common' }> = []
  const matchedTargets = new Set<string>()

  sourceColumns.forEach(sourceCol => {
    const sourceLower = sourceCol.toLowerCase().trim()

    // Strategy 1: Exact match (case-insensitive)
    const exactMatch = targetColumns.find(targetCol =>
      !matchedTargets.has(targetCol) && targetCol.toLowerCase().trim() === sourceLower
    )

    if (exactMatch) {
      matches.push({ source: sourceCol, target: exactMatch, confidence: 100, method: 'exact' })
      matchedTargets.add(exactMatch)
      return
    }

    // Strategy 2: Normalized exact match (remove special chars, spaces)
    const sourceNorm = sourceLower.replace(/[_\s-]/g, '')
    const normMatch = targetColumns.find(targetCol => {
      if (matchedTargets.has(targetCol)) return false
      const targetNorm = targetCol.toLowerCase().trim().replace(/[_\s-]/g, '')
      return targetNorm === sourceNorm
    })

    if (normMatch) {
      matches.push({ source: sourceCol, target: normMatch, confidence: 95, method: 'exact' })
      matchedTargets.add(normMatch)
      return
    }

    // Strategy 3: Common medical term mappings
    for (const [, variations] of Object.entries(COMMON_COLUMN_MAPPINGS)) {
      if (variations.some(v => sourceLower.includes(v.toLowerCase()))) {
        const targetMatch = targetColumns.find(targetCol => {
          if (matchedTargets.has(targetCol)) return false
          const targetLower = targetCol.toLowerCase().trim()
          return variations.some(v => targetLower.includes(v.toLowerCase()))
        })

        if (targetMatch) {
          matches.push({ source: sourceCol, target: targetMatch, confidence: 85, method: 'common' })
          matchedTargets.add(targetMatch)
          return
        }
      }
    }

    // Strategy 4: High similarity fuzzy match (>85% similar)
    const bestMatch = targetColumns
      .filter(t => !matchedTargets.has(t))
      .map(targetCol => ({
        col: targetCol,
        similarity: calculateSimilarity(sourceLower, targetCol.toLowerCase())
      }))
      .filter(m => m.similarity > 0.85)
      .sort((a, b) => b.similarity - a.similarity)[0]

    if (bestMatch) {
      matches.push({
        source: sourceCol,
        target: bestMatch.col,
        confidence: Math.round(bestMatch.similarity * 100),
        method: 'common'
      })
      matchedTargets.add(bestMatch.col)
    }
  })

  return matches
}

/**
 * Calculate string similarity using Levenshtein distance
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim()
  const s2 = str2.toLowerCase().trim()

  if (s1 === s2) return 1.0
  if (s1.includes(s2) || s2.includes(s1)) {
    return Math.max(s2.length / s1.length, s1.length / s2.length) * 0.95
  }

  const longer = s1.length > s2.length ? s1 : s2
  const shorter = s1.length > s2.length ? s2 : s1

  if (longer.length === 0) return 1.0

  const editDistance = levenshteinDistance(longer, shorter)
  return (longer.length - editDistance) / longer.length
}

/**
 * Compute Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = []

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        )
      }
    }
  }

  return matrix[str2.length][str1.length]
}
