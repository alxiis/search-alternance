import { DEFAULT_CLAUDE_URL } from '../data/constants'
import type { Application, AppSettings, ClaudeAnalysis, Company, Contact, JobOffer, Profile, SearchCriteria } from '../types'
import { nowIso, today } from '../utils/dates'
import { uid } from '../utils/id'

export function emptyProfile(): Profile {
  return {
    firstName: '',
    lastName: '',
    education: '',
    studyLevel: '',
    city: '',
    mobilityRadiusKm: 30,
    school: '',
    mainSearch: '',
    contractType: 'Alternance',
    availability: '',
    skills: [],
    technologies: [],
    experienceYears: 0,
    experienceMonths: 0,
    experiences: '',
    projects: '',
    qualities: [],
    interests: [],
    linkedin: '',
    github: '',
    portfolio: '',
    extraInfo: '',
    cvText: '',
    letterText: '',
    updatedAt: nowIso(),
  }
}

export function emptySettings(): AppSettings {
  return { claudeUrl: DEFAULT_CLAUDE_URL, activeCriteriaId: null, followUpDays: 7 }
}

export function emptyCriteria(name = 'Nouvelle recherche'): SearchCriteria {
  return {
    id: uid(),
    name,
    jobTitle: '',
    keywords: [],
    city: '',
    radiusKm: 30,
    regions: [],
    remote: 'any',
    contractType: 'Alternance',
    studyLevel: '',
    availabilityDate: '',
    requiredTech: [],
    preferredTech: [],
    rhythm: '',
    contractDuration: '',
    sectors: [],
    excludedKeywords: [],
    maxAgeDays: 30,
    updatedAt: nowIso(),
  }
}

export function emptyCompany(name: string): Company {
  const now = nowIso()
  return {
    id: uid(),
    name,
    sector: '',
    location: '',
    website: '',
    careersUrl: '',
    description: '',
    compatibilityReasons: [],
    sources: [],
    usefulUrls: [],
    notes: '',
    siren: '',
    size: '',
    contacts: [],
    prospectStatus: 'none',
    contactedAt: null,
    followUpDate: null,
    lastSearchAt: null,
    createdAt: now,
    updatedAt: now,
  }
}

export function emptyContact(name = ''): Contact {
  return { id: uid(), name, role: '', email: '', phone: '', linkedin: '', source: '', notes: '', history: [], createdAt: nowIso() }
}

export function emptyApplication(): Application {
  return {
    appliedAt: null,
    followUpDate: null,
    interviewDate: null,
    lastContactAt: null,
    nextAction: '',
    response: '',
    contact: { name: '', email: '', phone: '', linkedin: '' },
  }
}

export function emptyAnalysis(): ClaudeAnalysis {
  return {
    compatibilityScore: null,
    scoreExplanation: '',
    matchingSkills: [],
    missingSkills: [],
    strengths: [],
    weaknesses: [],
    keyPoints: [],
    applicationArguments: [],
    companyInsights: { activities: '', products: '', recentProjects: '', careersUrl: '' },
    recommendation: '',
    sources: [],
    analyzedAt: nowIso(),
  }
}

export function emptyJob(url = ''): JobOffer {
  const now = nowIso()
  return {
    id: uid(),
    companyId: null,
    title: '',
    url,
    location: '',
    contractType: '',
    description: '',
    requirements: [],
    skills: [],
    salary: '',
    publishedAt: null,
    source: '',
    startDate: '',
    duration: '',
    rhythm: '',
    studyLevel: '',
    matchReasons: [],
    expiresAt: null,
    verifiedAt: null,
    availability: '',
    discoveredAt: today(),
    status: 'to_analyze',
    notes: '',
    compatibilityScore: null,
    analysis: null,
    coverLetters: null,
    application: emptyApplication(),
    lastActionAt: today(),
    createdAt: now,
    updatedAt: now,
  }
}

/*
 * Hydratation : un enregistrement créé par une version antérieure (IndexedDB ou sauvegarde JSON)
 * n'a pas les champs ajoutés depuis. On les complète avec les valeurs par défaut, sans toucher au reste.
 */
export function hydrateJob(j: JobOffer): JobOffer {
  const base = emptyJob()
  return {
    ...base,
    ...j,
    application: { ...base.application, ...j.application, contact: { ...base.application.contact, ...j.application?.contact } },
  }
}

export function hydrateCriteria(c: SearchCriteria): SearchCriteria {
  // Une recherche antérieure à `maxAgeDays` n'avait aucune limite d'ancienneté : on conserve ce comportement.
  return { ...emptyCriteria(), ...c, maxAgeDays: c.maxAgeDays ?? 0 }
}

export function hydrateCompany(c: Company): Company {
  return {
    ...emptyCompany(c.name ?? ''),
    ...c,
    contacts: (c.contacts ?? []).map((contact) => ({ ...emptyContact(), ...contact, history: contact.history ?? [] })),
  }
}
