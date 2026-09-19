import type { ClaudeAnalysis, CoverLetters } from '../types'
import { emptyAnalysis } from '../lib/factories'
import { coerceIsoDate, nowIso } from '../utils/dates'
import { unique } from '../utils/text'

export interface RawCompany {
  name: string
  sector: string
  location: string
  website: string
  careersUrl: string
  description: string
  compatibilityReasons: string[]
  sources: string[]
  notes: string
}

export interface RawJob {
  companyName: string
  title: string
  url: string
  location: string
  contractType: string
  description: string
  requirements: string[]
  skills: string[]
  salary: string
  publishedAt: string | null
  source: string
  analysis: ClaudeAnalysis | null
  coverLetters: CoverLetters | null
}

export interface ParsedPayload {
  companies: RawCompany[]
  jobs: RawJob[]
  /** Analyse / lettres fournies sans offre (cible = offre depuis laquelle l'import est lancé). */
  loneAnalysis: ClaudeAnalysis | null
  loneLetters: CoverLetters | null
  /** Index de l'offre "singulière" (clé `job`) dans `jobs`, si présente. */
  primaryJobIndex: number | null
  warnings: string[]
}

export type ParseResult = { ok: true; payload: ParsedPayload } | { ok: false; error: string }

type Obj = Record<string, unknown>

const KNOWN_KEYS = ['companies', 'jobs', 'company', 'job', 'analysis', 'coverLetters']

function isObj(v: unknown): v is Obj {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function str(v: unknown): string {
  if (typeof v === 'string') return v.trim()
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  return ''
}

function strList(v: unknown): string[] {
  if (Array.isArray(v)) return unique(v.map((x) => (isObj(x) ? str(x.url ?? x.name ?? x.title) : str(x))).filter(Boolean))
  const s = str(v)
  return s ? unique(s.split(/[,;\n]/).map((x) => x.trim())) : []
}

/** Extrait tous les objets JSON candidats d'un texte : texte entier, blocs ```json, puis accolades équilibrées. */
export function extractJsonCandidates(text: string): { values: unknown[]; lastError: string } {
  const values: unknown[] = []
  let lastError = ''
  const tryParse = (s: string): boolean => {
    try {
      values.push(JSON.parse(s))
      return true
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e)
      return false
    }
  }

  const trimmed = text.trim()
  if (tryParse(trimmed)) return { values, lastError }

  const fence = /```(?:json|JSON)?\s*([\s\S]*?)```/g
  let m: RegExpExecArray | null
  while ((m = fence.exec(text)) !== null) {
    const body = (m[1] ?? '').trim()
    if (body.startsWith('{') || body.startsWith('[')) tryParse(body)
  }
  if (values.length) return { values, lastError }

  // Balayage des accolades équilibrées (en ignorant celles des chaînes).
  let i = 0
  while (i < text.length) {
    if (text[i] !== '{') {
      i++
      continue
    }
    let depth = 0
    let inString = false
    let end = -1
    for (let j = i; j < text.length; j++) {
      const c = text[j]
      if (inString) {
        if (c === '\\') j++
        else if (c === '"') inString = false
      } else if (c === '"') inString = true
      else if (c === '{') depth++
      else if (c === '}' && --depth === 0) {
        end = j
        break
      }
    }
    if (end === -1) break
    if (tryParse(text.slice(i, end + 1))) i = end + 1
    else i++
  }
  return { values, lastError }
}

function normalizeAnalysis(raw: unknown, warnings: string[], label: string): ClaudeAnalysis | null {
  if (!isObj(raw)) return null
  const a = emptyAnalysis()
  const scoreRaw = raw.compatibilityScore ?? raw.score
  if (scoreRaw !== null && scoreRaw !== undefined && scoreRaw !== '') {
    const n = typeof scoreRaw === 'number' ? scoreRaw : Number(String(scoreRaw).replace(',', '.').replace('%', ''))
    if (Number.isFinite(n)) {
      if (n < 0 || n > 100) warnings.push(`${label} : score ${n} hors de 0-100, borné automatiquement.`)
      a.compatibilityScore = Math.round(Math.min(100, Math.max(0, n)))
    } else {
      warnings.push(`${label} : score "${str(scoreRaw)}" illisible, ignoré.`)
    }
  }
  a.scoreExplanation = str(raw.scoreExplanation ?? raw.explanation)
  a.matchingSkills = strList(raw.matchingSkills)
  a.missingSkills = strList(raw.missingSkills)
  a.strengths = strList(raw.strengths)
  a.weaknesses = strList(raw.weaknesses)
  a.keyPoints = strList(raw.keyPoints ?? raw.keyPointsToHighlight)
  a.applicationArguments = strList(raw.applicationArguments ?? raw.arguments)
  a.recommendation = str(raw.recommendation)
  a.sources = strList(raw.sources)
  const ci = isObj(raw.companyInsights) ? raw.companyInsights : {}
  a.companyInsights = {
    activities: str(ci.activities),
    products: str(ci.products),
    recentProjects: str(ci.recentProjects),
    careersUrl: str(ci.careersUrl),
  }
  a.analyzedAt = nowIso()
  return a
}

function normalizeLetters(raw: unknown): CoverLetters | null {
  if (!isObj(raw)) return null
  const email = isObj(raw.email) ? raw.email : null
  const letters: CoverLetters = {
    full: str(raw.full ?? raw.letter),
    short: str(raw.short),
    emailSubject: str(raw.emailSubject ?? email?.subject),
    email: str(email ? email.body : raw.email),
    linkedin: str(raw.linkedin ?? raw.linkedinMessage),
    generatedAt: nowIso(),
  }
  return letters.full || letters.short || letters.email || letters.linkedin ? letters : null
}

function normalizeCompany(raw: unknown, warnings: string[], label: string): RawCompany | null {
  if (typeof raw === 'string' && raw.trim()) return normalizeCompany({ name: raw }, warnings, label)
  if (!isObj(raw)) return null
  const name = str(raw.name)
  if (!name) {
    warnings.push(`${label} : entreprise sans "name", ignorée.`)
    return null
  }
  return {
    name,
    sector: str(raw.sector),
    location: str(raw.location),
    website: str(raw.website),
    careersUrl: str(raw.careersUrl),
    description: str(raw.description),
    compatibilityReasons: strList(raw.compatibilityReasons),
    sources: strList(raw.sources),
    notes: str(raw.notes),
  }
}

function normalizeJob(raw: unknown, fallbackCompany: string, warnings: string[], label: string): RawJob | null {
  if (!isObj(raw)) return null
  const title = str(raw.title)
  const url = str(raw.url)
  if (!title && !url) {
    warnings.push(`${label} : offre sans "title" ni "url", ignorée.`)
    return null
  }
  const companyField = raw.companyName ?? raw.company
  const publishedRaw = raw.publishedAt
  const publishedAt = coerceIsoDate(publishedRaw)
  if (publishedRaw && !publishedAt) warnings.push(`${label} : date de publication "${str(publishedRaw)}" illisible, ignorée.`)
  return {
    companyName: (isObj(companyField) ? str(companyField.name) : str(companyField)) || fallbackCompany,
    title,
    url,
    location: str(raw.location),
    contractType: str(raw.contractType ?? raw.type),
    description: str(raw.description),
    requirements: strList(raw.requirements),
    skills: strList(raw.skills),
    salary: str(raw.salary),
    publishedAt,
    source: str(raw.source),
    analysis: normalizeAnalysis(raw.analysis, warnings, label),
    coverLetters: normalizeLetters(raw.coverLetters),
  }
}

function mergeCandidate(target: Obj, source: Obj): void {
  for (const key of ['companies', 'jobs']) {
    const add = source[key]
    if (Array.isArray(add)) target[key] = [...(Array.isArray(target[key]) ? (target[key] as unknown[]) : []), ...add]
  }
  for (const key of ['company', 'job', 'analysis', 'coverLetters']) {
    if (source[key] !== undefined && target[key] === undefined) target[key] = source[key]
  }
}

export function parseClaudeText(text: string): ParseResult {
  if (!text.trim()) return { ok: false, error: 'Aucun contenu à importer. Collez la réponse de Claude ou son bloc JSON.' }
  const { values, lastError } = extractJsonCandidates(text)
  if (!values.length) {
    return {
      ok: false,
      error: `JSON invalide : ${lastError || 'aucun bloc JSON trouvé'}. Vérifiez que vous avez copié tout le bloc JSON (de « { » jusqu'à « } »), sans virgule finale ni commentaire.`,
    }
  }

  const merged: Obj = {}
  for (const v of values) {
    if (isObj(v) && KNOWN_KEYS.some((k) => k in v)) mergeCandidate(merged, v)
    else if (Array.isArray(v)) mergeCandidate(merged, { jobs: v })
  }
  if (!Object.keys(merged).length) {
    return { ok: false, error: `JSON valide, mais aucune clé attendue (${KNOWN_KEYS.join(', ')}). Ce n'est pas un résultat au format de l'application.` }
  }

  const warnings: string[] = []
  const companies: RawCompany[] = []
  const jobs: RawJob[] = []
  const rawCompanies = Array.isArray(merged.companies) ? merged.companies : []
  const singleCompany = normalizeCompany(merged.company, warnings, 'company')
  if (singleCompany) companies.push(singleCompany)

  rawCompanies.forEach((rc, i) => {
    const label = `companies[${i}]`
    const company = normalizeCompany(rc, warnings, label)
    if (!company) return
    companies.push(company)
    const nested = isObj(rc) && Array.isArray(rc.jobs) ? rc.jobs : []
    nested.forEach((rj, j) => {
      const job = normalizeJob(rj, company.name, warnings, `${label}.jobs[${j}]`)
      if (job) jobs.push(job)
    })
  })

  let primaryJobIndex: number | null = null
  if (merged.job !== undefined) {
    const job = normalizeJob(merged.job, singleCompany?.name ?? '', warnings, 'job')
    if (job) {
      primaryJobIndex = jobs.length
      jobs.push(job)
    }
  }
  const topLevelJobs = Array.isArray(merged.jobs) ? merged.jobs : []
  topLevelJobs.forEach((rj, i) => {
    const job = normalizeJob(rj, '', warnings, `jobs[${i}]`)
    if (job) jobs.push(job)
  })

  const analysis = normalizeAnalysis(merged.analysis, warnings, 'analysis')
  const letters = normalizeLetters(merged.coverLetters)
  let loneAnalysis: ClaudeAnalysis | null = null
  let loneLetters: CoverLetters | null = null
  const primary = primaryJobIndex === null ? undefined : jobs[primaryJobIndex]
  if (primary) {
    primary.analysis = primary.analysis ?? analysis
    primary.coverLetters = primary.coverLetters ?? letters
  } else {
    loneAnalysis = analysis
    loneLetters = letters
  }

  if (!companies.length && !jobs.length && !loneAnalysis && !loneLetters) {
    return { ok: false, error: 'Le JSON est valide mais ne contient aucune entreprise, offre, analyse ou lettre exploitable.' }
  }
  return { ok: true, payload: { companies, jobs, loneAnalysis, loneLetters, primaryJobIndex, warnings } }
}
