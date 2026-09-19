import type { Company, JobOffer, JobStatus } from '../types'
import { normalizeText } from './text'
import { today } from './dates'

export type SortKey = 'company' | 'title' | 'location' | 'contractType' | 'discoveredAt' | 'publishedAt' | 'score' | 'status' | 'lastActionAt' | 'followUp'
export type SortDir = 'asc' | 'desc'

export interface JobFilters {
  query: string
  status: JobStatus | ''
  contractType: string
  companyId: string
  minScore: number
  followUpDue: boolean
}

export const NO_FILTERS: JobFilters = { query: '', status: '', contractType: '', companyId: '', minScore: 0, followUpDue: false }

export function hasActiveFilters(f: JobFilters): boolean {
  return JSON.stringify(f) !== JSON.stringify(NO_FILTERS)
}

export function filterJobs(jobs: JobOffer[], companies: Company[], f: JobFilters): JobOffer[] {
  const names = new Map(companies.map((c) => [c.id, c.name]))
  const q = normalizeText(f.query)
  const now = today()
  return jobs.filter((j) => {
    if (f.status && j.status !== f.status) return false
    if (f.contractType && j.contractType !== f.contractType) return false
    if (f.companyId && j.companyId !== f.companyId) return false
    if (f.minScore && (j.compatibilityScore ?? -1) < f.minScore) return false
    if (f.followUpDue && !(j.application.followUpDate && j.application.followUpDate <= now)) return false
    if (!q) return true
    const haystack = normalizeText([names.get(j.companyId ?? '') ?? '', j.title, j.location, j.contractType, j.notes, j.skills.join(' ')].join(' '))
    return q.split(' ').every((word) => haystack.includes(word))
  })
}

export function sortJobs(jobs: JobOffer[], companies: Company[], key: SortKey, dir: SortDir): JobOffer[] {
  const names = new Map(companies.map((c) => [c.id, c.name]))
  const value = (j: JobOffer): string | number => {
    switch (key) {
      case 'company': return normalizeText(names.get(j.companyId ?? '') ?? '')
      case 'title': return normalizeText(j.title)
      case 'location': return normalizeText(j.location)
      case 'contractType': return normalizeText(j.contractType)
      case 'discoveredAt': return j.discoveredAt
      case 'publishedAt': return j.publishedAt ?? ''
      case 'score': return j.compatibilityScore ?? -1
      case 'status': return j.status
      case 'lastActionAt': return j.lastActionAt
      case 'followUp': return j.application.followUpDate ?? '9999'
    }
  }
  const sign = dir === 'asc' ? 1 : -1
  return [...jobs].sort((a, b) => {
    const va = value(a)
    const vb = value(b)
    return (va < vb ? -1 : va > vb ? 1 : 0) * sign
  })
}
