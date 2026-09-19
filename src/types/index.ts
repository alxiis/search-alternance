export type JobStatus =
  | 'to_analyze'
  | 'to_apply'
  | 'prepared'
  | 'applied'
  | 'followup'
  | 'interview'
  | 'second_interview'
  | 'rejected'
  | 'accepted'
  | 'archived'

export interface Profile {
  firstName: string
  lastName: string
  education: string
  studyLevel: string
  city: string
  mobilityRadiusKm: number
  mainSearch: string
  contractType: string
  availability: string
  skills: string[]
  technologies: string[]
  experienceYears: number
  experienceMonths: number
  experiences: string
  projects: string
  qualities: string[]
  interests: string[]
  linkedin: string
  github: string
  portfolio: string
  extraInfo: string
  /** Texte du CV (optionnel) : inclus dans les prompts si renseigné. */
  cvText: string
  /** Texte de la lettre de motivation de base (optionnel). */
  letterText: string
  updatedAt: string
}

export type RemoteMode = 'any' | 'onsite' | 'hybrid' | 'remote'

export interface SearchCriteria {
  id: string
  name: string
  jobTitle: string
  keywords: string[]
  city: string
  radiusKm: number
  regions: string[]
  remote: RemoteMode
  contractType: string
  studyLevel: string
  availabilityDate: string
  requiredTech: string[]
  preferredTech: string[]
  updatedAt: string
}

export interface UsefulUrl {
  label: string
  url: string
}

export interface Company {
  id: string
  name: string
  sector: string
  location: string
  website: string
  careersUrl: string
  description: string
  compatibilityReasons: string[]
  sources: string[]
  usefulUrls: UsefulUrl[]
  notes: string
  lastSearchAt: string | null
  createdAt: string
  updatedAt: string
}

export interface ContactInfo {
  name: string
  email: string
  phone: string
  linkedin: string
}

/** Suivi de candidature attaché à une offre. Dates au format YYYY-MM-DD. */
export interface Application {
  appliedAt: string | null
  followUpDate: string | null
  interviewDate: string | null
  lastContactAt: string | null
  nextAction: string
  response: string
  contact: ContactInfo
}

export interface CompanyInsights {
  activities: string
  products: string
  recentProjects: string
  careersUrl: string
}

export interface ClaudeAnalysis {
  compatibilityScore: number | null
  scoreExplanation: string
  matchingSkills: string[]
  missingSkills: string[]
  strengths: string[]
  weaknesses: string[]
  keyPoints: string[]
  applicationArguments: string[]
  companyInsights: CompanyInsights
  recommendation: string
  sources: string[]
  analyzedAt: string
}

export interface CoverLetters {
  full: string
  short: string
  emailSubject: string
  email: string
  linkedin: string
  generatedAt: string
}

export interface JobOffer {
  id: string
  companyId: string | null
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
  discoveredAt: string
  status: JobStatus
  notes: string
  /** 0-100, fourni par l'analyse Claude importée. null = pas encore analysé. */
  compatibilityScore: number | null
  analysis: ClaudeAnalysis | null
  coverLetters: CoverLetters | null
  application: Application
  lastActionAt: string
  createdAt: string
  updatedAt: string
}

export type PromptKind =
  | 'searchCompanies'
  | 'searchJobs'
  | 'findCompanyJobs'
  | 'verifyJob'
  | 'similarCompanies'
  | 'analyzeJob'
  | 'coverLetter'

export interface PromptResult {
  kind: PromptKind
  title: string
  text: string
  /** Offre visée : sert de cible à l'import du résultat. */
  jobId?: string
  companyId?: string
}

export interface FollowUpTask {
  jobId: string
  kind: 'followup' | 'interview'
  dueDate: string
  label: string
  overdue: boolean
}

export interface AppSettings {
  claudeUrl: string
  activeCriteriaId: string | null
  followUpDays: number
}

export interface StoredFile {
  id: 'cv' | 'letter'
  name: string
  mimeType: string
  size: number
  blob: Blob
  addedAt: string
}

export interface AppData {
  profile: Profile
  criteria: SearchCriteria[]
  companies: Company[]
  jobs: JobOffer[]
  settings: AppSettings
  files: StoredFile[]
}

/** Format du fichier de sauvegarde JSON (fichiers encodés en base64). */
export interface BackupFile {
  format: 'suivi-alternance-backup'
  version: 1
  exportedAt: string
  profile: Profile
  criteria: SearchCriteria[]
  companies: Company[]
  jobs: JobOffer[]
  settings: AppSettings
  files: Array<Omit<StoredFile, 'blob'> & { dataBase64: string }>
}
