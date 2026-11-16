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
  /** École ou établissement : sert à retrouver d'anciens élèves dans une entreprise. */
  school: string
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
  /** Rythme d'alternance souhaité ou imposé par l'école (ex. « 3 semaines entreprise / 1 semaine école »). */
  rhythm: string
  /** Durée du contrat visée (ex. « 12 mois », « 24 mois »). */
  contractDuration: string
  /** Secteurs d'activité visés. */
  sectors: string[]
  /** Mots-clés, types de postes ou entreprises à écarter des résultats. */
  excludedKeywords: string[]
  /** Ancienneté maximale des offres, en jours (0 = sans limite). */
  maxAgeDays: number
  updatedAt: string
}

export interface UsefulUrl {
  label: string
  url: string
}

export type ContactChannel = 'email' | 'linkedin' | 'phone' | 'meeting' | 'other'

/** Un échange avec un contact (date au format YYYY-MM-DD). */
export interface ContactEvent {
  id: string
  date: string
  channel: ContactChannel
  note: string
}

/** Interlocuteur dans une entreprise : recruteur, responsable d'équipe, ancien élève, dirigeant… */
export interface Contact {
  id: string
  name: string
  role: string
  email: string
  phone: string
  linkedin: string
  /** D'où vient ce contact (LinkedIn, registre des entreprises, salon, recherche Claude…). */
  source: string
  notes: string
  history: ContactEvent[]
  createdAt: string
}

/**
 * Avancement d'une candidature spontanée auprès d'une entreprise.
 * 'none' : l'entreprise n'est suivie que pour ses offres.
 */
export type ProspectStatus = 'none' | 'to_contact' | 'contacted' | 'followup' | 'in_discussion' | 'closed'

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
  /** Numéro SIREN (9 chiffres), si l'entreprise vient du registre officiel. */
  siren: string
  /** Effectif, en clair (« 20 à 49 salariés »). */
  size: string
  contacts: Contact[]
  prospectStatus: ProspectStatus
  /** Date du premier contact spontané (YYYY-MM-DD). */
  contactedAt: string | null
  /** Date de relance de la candidature spontanée (YYYY-MM-DD). */
  followUpDate: string | null
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

/** État de l'annonce d'après la dernière vérification. '' = jamais vérifiée. */
export type JobAvailability = '' | 'open' | 'expired' | 'doubtful'

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
  /** Date de début du contrat, telle qu'annoncée (texte libre : « septembre 2027 », « dès que possible »…). */
  startDate: string
  /** Durée du contrat (ex. « 12 mois »). */
  duration: string
  /** Rythme d'alternance annoncé. */
  rhythm: string
  /** Niveau d'études préparé ou demandé (ex. « Bac+3 »). */
  studyLevel: string
  /** Raisons pour lesquelles l'offre a été retenue lors d'une recherche Claude. */
  matchReasons: string[]
  /** Date limite annoncée par l'annonce (YYYY-MM-DD) : passée, l'offre est considérée comme expirée. */
  expiresAt: string | null
  /** Date (YYYY-MM-DD) à laquelle Claude a confirmé l'état de l'annonce. */
  verifiedAt: string | null
  availability: JobAvailability
  discoveredAt: string
  status: JobStatus
  notes: string
  /**
   * 0-100, fourni par Claude. Si `analysis` est null, c'est une estimation rapide issue d'une recherche ;
   * sinon c'est le score de l'analyse détaillée. null = aucun score.
   */
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
  | 'findContacts'
  | 'contactMessage'

export interface PromptResult {
  kind: PromptKind
  title: string
  text: string
  /** Offre visée : sert de cible à l'import du résultat. */
  jobId?: string
  /** Entreprise visée : le résultat importé lui est rattaché même si Claude l'orthographie autrement. */
  companyId?: string
  /** Vrai si la réponse est un texte à copier (message, e-mail) et non un JSON à importer. */
  noImport?: boolean
}

export interface FollowUpTask {
  /** Offre concernée ; absent pour la relance d'une candidature spontanée. */
  jobId?: string
  /** Entreprise concernée par une relance de candidature spontanée. */
  companyId?: string
  kind: 'followup' | 'interview' | 'prospect'
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
