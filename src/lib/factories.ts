import { DEFAULT_CLAUDE_URL } from '../data/constants'
import type { Application, AppSettings, ClaudeAnalysis, Company, JobOffer, Profile, SearchCriteria } from '../types'
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
    lastSearchAt: null,
    createdAt: now,
    updatedAt: now,
  }
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
