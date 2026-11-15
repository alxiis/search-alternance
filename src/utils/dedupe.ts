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

const LEGAL_FORMS = /\b(sas|sasu|sa|sarl|eurl|snc|gmbh|ltd|inc|llc|plc|groupe|group)\b/g

/** Clé de comparaison d'une entreprise : « Groupe Nébula SAS » et « Nebula » désignent la même. */
export function companyKey(name: string): string {
  const n = normalizeText(name)
  return n.replace(LEGAL_FORMS, ' ').replace(/\s+/g, ' ').trim() || n
}

/** Clé d'un intitulé : sans mention de genre — « (H/F) », « F/H », « alternant(e) », « développeur·euse ». */
export function titleKey(title: string): string {
  return normalizeText(
    title
      .replace(/\b[hfmx](\s*[/-]\s*[hfmx]){1,2}\b/gi, ' ')
      .replace(/\(\s*(e|ne|se|euse|trice|rice|ère)\s*\)/gi, '')
      .replace(/[·•]\p{L}+/gu, ''),
  )
}

/** Mots significatifs d'un lieu : « Toulouse (31) », « 31000 Toulouse » et « Toulouse, France » donnent tous « toulouse ». */
function locationWords(location: string): string[] {
  return normalizeText(location)
    .split(' ')
    .filter((w) => w && !/^\d+$/.test(w) && w !== 'france' && w !== 'cedex')
}

/** Deux lieux sont compatibles si l'un est inconnu ou si l'un précise l'autre (« Toulouse » / « Toulouse, Occitanie »). */
function sameLocation(a: string, b: string): boolean {
  const wa = locationWords(a)
  const wb = locationWords(b)
  if (!wa.length || !wb.length) return true
  const [small, large] = wa.length <= wb.length ? [wa, wb] : [wb, wa]
  return small.every((w) => large.includes(w))
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
  const company = companyKey(candidate.companyName)
  const title = titleKey(candidate.title)
  if (!company || !title) return null
  const keyById = new Map(companies.map((c) => [c.id, companyKey(c.name)]))
  const byIdentity = jobs.find(
    (j) =>
      j.companyId !== null &&
      keyById.get(j.companyId) === company &&
      titleKey(j.title) === title &&
      sameLocation(j.location, candidate.location),
  )
  return byIdentity ? { job: byIdentity, reason: 'companyTitleLocation' } : null
}

export function findCompanyByName(name: string, companies: Company[]): Company | undefined {
  const key = companyKey(name)
  return key ? companies.find((c) => companyKey(c.name) === key) : undefined
}
