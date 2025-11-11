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
 * Use Claude Haiku to match columns between source and target databases
 */
export async function matchColumnsWithLLM(
  request: LLMColumnMatchRequest
): Promise<LLMColumnMatchResponse> {
  const client = getClient()

  const prompt = `You are a medical data expert helping to match column names between two clinical databases.
Your task is to identify which columns in the source database correspond to columns in the target database.

Source Database Columns:
${request.sourceColumns.map((col, i) => `${i + 1}. ${col}`).join('\n')}

Target Database Columns:
${request.targetColumns.map((col, i) => `${i + 1}. ${col}`).join('\n')}

${request.context ? `\nAdditional Context: ${request.context}` : ''}

Please analyze these columns and provide matches. Consider:
- Exact matches (same name)
- Semantic matches (different names but same meaning)
- Multilingual matches (e.g., "age" and "età" in Italian)
- Common medical abbreviations and terminology
- Date fields, ID fields, demographic data, procedure data

For each match, provide:
1. The source column name (exact match)
2. The target column name (exact match)
3. A confidence score (0-100)
4. A brief reasoning for the match

Format your response as a JSON array:
[
  {
    "source": "column name from source",
    "target": "column name from target",
    "confidence": 95,
    "reasoning": "Brief explanation"
  }
]

Only include matches where you have reasonable confidence (>60). Return only the JSON array, no additional text.`

  try {
    const message = await client.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: prompt
      }]
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

    // Extract JSON from response
    const jsonMatch = responseText.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      throw new Error('Failed to parse LLM response')
    }

    const matches = JSON.parse(jsonMatch[0])

    return {
      matches: matches.map((m: any) => ({
        source: m.source,
        target: m.target,
        confidence: m.confidence,
        reasoning: m.reasoning
      }))
    }
  } catch (error) {
    console.error('LLM column matching failed:', error)
    throw new Error(`Failed to match columns with AI: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
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
 * Calculate similarity between two strings (0-1, higher is better)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim()
  const s2 = str2.toLowerCase().trim()

  // Exact match
  if (s1 === s2) return 1.0

  // One contains the other
  if (s1.includes(s2) || s2.includes(s1)) {
    return 0.9
  }

  // Levenshtein distance for fuzzy matching
  const longer = s1.length > s2.length ? s1 : s2
  const shorter = s1.length > s2.length ? s2 : s1

  if (longer.length === 0) return 1.0

  const editDistance = levenshteinDistance(longer, shorter)
  return (longer.length - editDistance) / longer.length
}

/**
 * Calculate Levenshtein distance between two strings
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

/**
 * Quick column matching using common mappings and fuzzy matching
 */
export function quickMatchColumns(
  sourceColumns: string[],
  targetColumns: string[]
): Array<{ source: string; target: string; confidence: number; method: 'exact' | 'common' }> {
  const matches: Array<{ source: string; target: string; confidence: number; method: 'exact' | 'common' }> = []
  const usedTargets = new Set<string>()

  sourceColumns.forEach(sourceCol => {
    const sourceLower = sourceCol.toLowerCase().trim()
    let bestMatch: { target: string; confidence: number; method: 'exact' | 'common' } | null = null

    // 1. Check for exact matches first
    const exactMatch = targetColumns.find(targetCol =>
      !usedTargets.has(targetCol) && targetCol.toLowerCase().trim() === sourceLower
    )

    if (exactMatch) {
      bestMatch = {
        target: exactMatch,
        confidence: 100,
        method: 'exact'
      }
    }

    // 2. Check common mappings
    if (!bestMatch) {
      for (const [, variations] of Object.entries(COMMON_COLUMN_MAPPINGS)) {
        const sourceMatches = variations.some(v => sourceLower.includes(v.toLowerCase()))

        if (sourceMatches) {
          const targetMatch = targetColumns.find(targetCol => {
            if (usedTargets.has(targetCol)) return false
            const targetLower = targetCol.toLowerCase().trim()
            return variations.some(v => targetLower.includes(v.toLowerCase()))
          })

          if (targetMatch) {
            bestMatch = {
              target: targetMatch,
              confidence: 90,
              method: 'common'
            }
            break
          }
        }
      }
    }

    // 3. Fuzzy string matching for high similarity (threshold: 0.8)
    if (!bestMatch) {
      let maxSimilarity = 0
      let similarTarget: string | null = null

      targetColumns.forEach(targetCol => {
        if (usedTargets.has(targetCol)) return

        const similarity = calculateSimilarity(sourceLower, targetCol)
        if (similarity > maxSimilarity && similarity >= 0.8) {
          maxSimilarity = similarity
          similarTarget = targetCol
        }
      })

      if (similarTarget && maxSimilarity >= 0.8) {
        bestMatch = {
          target: similarTarget,
          confidence: Math.round(maxSimilarity * 100),
          method: 'common'
        }
      }
    }

    // Add the best match if found
    if (bestMatch) {
      matches.push({
        source: sourceCol,
        target: bestMatch.target,
        confidence: bestMatch.confidence,
        method: bestMatch.method
      })
      usedTargets.add(bestMatch.target)
    }
  })

  return matches
}
