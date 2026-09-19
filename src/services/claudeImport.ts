import type { Company, JobOffer } from '../types'
import { emptyCompany, emptyJob } from '../lib/factories'
import { findCompanyByName, findDuplicateJob, type DuplicateReason } from '../utils/dedupe'
import { nowIso, today } from '../utils/dates'
import { normalizeText, unique } from '../utils/text'
import type { ParsedPayload, RawCompany, RawJob } from './claudeParser'

export interface CompanyImportItem {
  key: string
  kind: 'company'
  raw: RawCompany
  existingId: string | null
  selected: boolean
}

export interface JobImportItem {
  key: string
  kind: 'job'
  raw: RawJob
  existingId: string | null
  /** null si la correspondance vient de l'offre ciblée plutôt que d'un doublon détecté. */
  reason: DuplicateReason | null
  isTarget: boolean
  selected: boolean
}

export type ImportItem = CompanyImportItem | JobImportItem

export interface ImportContext {
  companies: Company[]
  jobs: JobOffer[]
  targetJobId?: string
}

export interface ImportResult {
  companies: Company[]
  jobs: JobOffer[]
  created: { companies: number; jobs: number }
  updated: { companies: number; jobs: number }
}

const blankJob = (companyName: string, patch: Partial<RawJob>): RawJob => ({
  companyName,
  title: '',
  url: '',
  location: '',
  contractType: '',
  description: '',
  requirements: [],
  skills: [],
  salary: '',
  publishedAt: null,
  source: '',
  analysis: null,
  coverLetters: null,
  ...patch,
})

export function buildImportPlan(payload: ParsedPayload, ctx: ImportContext): ImportItem[] {
  const items: ImportItem[] = []
  const known = new Map<string, RawCompany>()
  for (const c of payload.companies) known.set(normalizeText(c.name), c)
  for (const j of payload.jobs) {
    const k = normalizeText(j.companyName)
    if (k && !known.has(k)) {
      known.set(k, { name: j.companyName, sector: '', location: '', website: '', careersUrl: '', description: '', compatibilityReasons: [], sources: [], notes: '' })
    }
  }
  known.forEach((raw, k) => {
    const existing = findCompanyByName(raw.name, ctx.companies)
    items.push({ key: `company:${k}`, kind: 'company', raw, existingId: existing?.id ?? null, selected: true })
  })

  const jobs = [...payload.jobs]
  if ((payload.loneAnalysis || payload.loneLetters) && ctx.targetJobId) {
    jobs.push(blankJob('', { analysis: payload.loneAnalysis, coverLetters: payload.loneLetters }))
  }
  const loneIndex = jobs.length - 1
  const target = ctx.targetJobId ? ctx.jobs.find((j) => j.id === ctx.targetJobId) : undefined
  const targetIndex = payload.primaryJobIndex ?? (payload.loneAnalysis || payload.loneLetters ? loneIndex : null)

  jobs.forEach((raw, i) => {
    const forced = target && i === targetIndex ? target : null
    const dup = forced ? null : findDuplicateJob({ url: raw.url, title: raw.title, location: raw.location, companyName: raw.companyName }, ctx.jobs, ctx.companies)
    const existing = forced ?? dup?.job ?? null
    items.push({
      key: `job:${i}`,
      kind: 'job',
      raw,
      existingId: existing?.id ?? null,
      reason: dup?.reason ?? null,
      isTarget: Boolean(forced),
      selected: true,
    })
  })
  return items
}

function fill(current: string, incoming: string): string {
  return current.trim() ? current : incoming
}

function mergeCompany(base: Company, raw: RawCompany): Company {
  return {
    ...base,
    sector: fill(base.sector, raw.sector),
    location: fill(base.location, raw.location),
    website: fill(base.website, raw.website),
    careersUrl: fill(base.careersUrl, raw.careersUrl),
    description: fill(base.description, raw.description),
    notes: fill(base.notes, raw.notes),
    compatibilityReasons: unique([...base.compatibilityReasons, ...raw.compatibilityReasons]),
    sources: unique([...base.sources, ...raw.sources]),
    updatedAt: nowIso(),
  }
}

function mergeJob(base: JobOffer, raw: RawJob, companyId: string | null): JobOffer {
  const analysis = raw.analysis ?? base.analysis
  const score = raw.analysis?.compatibilityScore ?? base.compatibilityScore
  return {
    ...base,
    companyId: base.companyId ?? companyId,
    title: fill(base.title, raw.title),
    url: fill(base.url, raw.url),
    location: fill(base.location, raw.location),
    contractType: fill(base.contractType, raw.contractType),
    description: fill(base.description, raw.description),
    salary: fill(base.salary, raw.salary),
    source: fill(base.source, raw.source),
    publishedAt: base.publishedAt ?? raw.publishedAt,
    requirements: base.requirements.length ? base.requirements : raw.requirements,
    skills: unique([...base.skills, ...raw.skills]),
    analysis,
    compatibilityScore: score,
    coverLetters: raw.coverLetters ?? base.coverLetters,
    status: base.status === 'to_analyze' && score !== null ? 'to_apply' : base.status,
    lastActionAt: today(),
    updatedAt: nowIso(),
  }
}

function newJobFromRaw(raw: RawJob, companyId: string | null): JobOffer {
  return mergeJob(emptyJob(raw.url), { ...raw, url: '' }, companyId)
}

/** Applique les éléments cochés. Fonction pure : renvoie les entités à persister. */
export function applyImportPlan(items: ImportItem[], ctx: ImportContext): ImportResult {
  const companies = new Map(ctx.companies.map((c) => [c.id, c]))
  const jobs = new Map(ctx.jobs.map((j) => [j.id, j]))
  const touchedCompanies = new Set<string>()
  const touchedJobs = new Set<string>()
  const result: ImportResult = { companies: [], jobs: [], created: { companies: 0, jobs: 0 }, updated: { companies: 0, jobs: 0 } }

  const rawByName = new Map<string, RawCompany>()
  for (const it of items) if (it.kind === 'company') rawByName.set(normalizeText(it.raw.name), it.raw)

  const ensureCompany = (name: string, count: boolean): string | null => {
    if (!name.trim()) return null
    const raw = rawByName.get(normalizeText(name)) ?? { name, sector: '', location: '', website: '', careersUrl: '', description: '', compatibilityReasons: [], sources: [], notes: '' }
    const existing = findCompanyByName(name, [...companies.values()])
    if (existing) {
      if (count && !touchedCompanies.has(existing.id)) result.updated.companies++
      companies.set(existing.id, mergeCompany(existing, raw))
      touchedCompanies.add(existing.id)
      return existing.id
    }
    const created = mergeCompany(emptyCompany(raw.name), raw)
    companies.set(created.id, created)
    touchedCompanies.add(created.id)
    if (count) result.created.companies++
    return created.id
  }

  for (const it of items) {
    if (it.kind === 'company' && it.selected) ensureCompany(it.raw.name, true)
  }
  for (const it of items) {
    if (it.kind !== 'job' || !it.selected) continue
    const companyId = ensureCompany(it.raw.companyName, false)
    // Nouvelle vérification : deux entrées du même import peuvent désigner la même offre.
    const existing =
      (it.existingId ? jobs.get(it.existingId) : undefined) ??
      findDuplicateJob(
        { url: it.raw.url, title: it.raw.title, location: it.raw.location, companyName: it.raw.companyName },
        [...jobs.values()],
        [...companies.values()],
      )?.job
    if (existing) {
      jobs.set(existing.id, mergeJob(existing, it.raw, companyId))
      touchedJobs.add(existing.id)
      result.updated.jobs++
    } else {
      const created = newJobFromRaw(it.raw, companyId)
      jobs.set(created.id, created)
      touchedJobs.add(created.id)
      result.created.jobs++
    }
  }
  result.companies = [...touchedCompanies].map((id) => companies.get(id)).filter((c): c is Company => Boolean(c))
  result.jobs = [...touchedJobs].map((id) => jobs.get(id)).filter((j): j is JobOffer => Boolean(j))
  return result
}
