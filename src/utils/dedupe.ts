import type { Company, JobOffer } from '../types'
import { normalizeText } from './text'
import { cleanUrl } from './url'

export interface JobIdentity {
  url: string
  title: string
  location: string
  companyName: string
}

export type DuplicateReason = 'url' | 'cleanUrl' | 'companyTitleLocation'

export interface DuplicateMatch {
  job: JobOffer
  reason: DuplicateReason
}

export const DUPLICATE_REASON_LABEL: Record<DuplicateReason, string> = {
  url: 'URL identique',
  cleanUrl: 'URL identique (hors paramètres de suivi)',
  companyTitleLocation: 'Même entreprise, intitulé et lieu',
}

function triple(companyName: string, title: string, location: string): string | null {
  const c = normalizeText(companyName)
  const t = normalizeText(title)
  if (!c || !t) return null
  return `${c}|${t}|${normalizeText(location)}`
}

/** Détection par priorité : URL exacte, URL nettoyée, puis entreprise + intitulé + lieu. */
export function findDuplicateJob(
  candidate: JobIdentity,
  jobs: JobOffer[],
  companies: Company[],
): DuplicateMatch | null {
  const url = candidate.url.trim()
  if (url) {
    const exact = jobs.find((j) => j.url.trim() === url)
    if (exact) return { job: exact, reason: 'url' }
    const cleaned = cleanUrl(url)
    const byClean = jobs.find((j) => j.url && cleanUrl(j.url) === cleaned)
    if (byClean) return { job: byClean, reason: 'cleanUrl' }
  }
  const key = triple(candidate.companyName, candidate.title, candidate.location)
  if (!key) return null
  const nameById = new Map(companies.map((c) => [c.id, c.name]))
  const byTriple = jobs.find((j) => {
    const name = j.companyId ? (nameById.get(j.companyId) ?? '') : ''
    return triple(name, j.title, j.location) === key
  })
  return byTriple ? { job: byTriple, reason: 'companyTitleLocation' } : null
}

export function findCompanyByName(name: string, companies: Company[]): Company | undefined {
  const n = normalizeText(name)
  return n ? companies.find((c) => normalizeText(c.name) === n) : undefined
}
