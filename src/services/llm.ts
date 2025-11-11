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

  const prompt = `You are an expert in clinical cardiovascular research data management, specializing in TAVI (Transcatheter Aortic Valve Implantation) and M-TEER (Mitral Transcatheter Edge-to-Edge Repair) procedures.

Your task is to match column names between two clinical databases with high precision, considering medical terminology, multilingual variations, and common abbreviations used in interventional cardiology.

SOURCE DATABASE COLUMNS:
${request.sourceColumns.map((col, i) => `${i + 1}. ${col}`).join('\n')}

TARGET DATABASE COLUMNS:
${request.targetColumns.map((col, i) => `${i + 1}. ${col}`).join('\n')}

${request.context ? `\nCLINICAL CONTEXT: ${request.context}` : ''}

MATCHING GUIDELINES:
• Patient Identifiers: ID, patient_id, paziente_id, numero_paziente, record_number
• Demographics: age/età, sex/sesso/gender, DOB/data_nascita, weight/peso, height/altezza, BMI
• Dates: procedure_date/data_procedura, admission/ricovero, discharge/dimissione, follow_up dates
• TAVI-specific: valve_type/tipo_valvola (Sapien, Evolut, Navitor, Acurate), valve_size/dimensione, access_site/via_accesso (transfemoral/TF, transapical/TA, transaortic/TAo)
• M-TEER-specific: clip_type/tipo_clip (MitraClip, PASCAL), number_of_clips/numero_clip, leaflet insertion
• Outcomes: mortality/mortalità/morte, stroke/ictus, MI/infarto/IMA, bleeding/sanguinamento, vascular complications/complicanze_vascolari
• Echo parameters: LVEF/FE, gradient/gradiente, AR/rigurgito_aortico, MR/rigurgito_mitralico
• Lab values: creatinine/creatinina, hemoglobin/emoglobina, NT-proBNP, troponin/troponina

CRITICAL RULES:
1. Match EXACT column names from the lists above (preserve case, spaces, underscores)
2. Consider Italian-English translations (età=age, sesso=sex, morte=death)
3. Recognize medical abbreviations (FE=LVEF, IMA=MI, TA=transapical)
4. Only return matches with confidence >70%
5. Prefer exact matches over semantic matches

OUTPUT FORMAT (JSON array only):
[
  {
    "source": "exact_column_name_from_source",
    "target": "exact_column_name_from_target",
    "confidence": 95,
    "reasoning": "Brief reason"
  }
]`

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5',
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
 * Quick column matching using common mappings
 */
export function quickMatchColumns(
  sourceColumns: string[],
  targetColumns: string[]
): Array<{ source: string; target: string; confidence: number; method: 'exact' | 'common' }> {
  const matches: Array<{ source: string; target: string; confidence: number; method: 'exact' | 'common' }> = []

  sourceColumns.forEach(sourceCol => {
    const sourceLower = sourceCol.toLowerCase().trim()

    // Check for exact matches
    const exactMatch = targetColumns.find(targetCol =>
      targetCol.toLowerCase().trim() === sourceLower
    )

    if (exactMatch) {
      matches.push({
        source: sourceCol,
        target: exactMatch,
        confidence: 100,
        method: 'exact'
      })
      return
    }

    // Check common mappings
    for (const [, variations] of Object.entries(COMMON_COLUMN_MAPPINGS)) {
      const sourceMatches = variations.some(v => sourceLower.includes(v.toLowerCase()))

      if (sourceMatches) {
        const targetMatch = targetColumns.find(targetCol => {
          const targetLower = targetCol.toLowerCase().trim()
          return variations.some(v => targetLower.includes(v.toLowerCase()))
        })

        if (targetMatch) {
          matches.push({
            source: sourceCol,
            target: targetMatch,
            confidence: 85,
            method: 'common'
          })
          return
        }
      }
    }
  })

  return matches
}
