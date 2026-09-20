import type { JobStatus, RemoteMode } from '../types'
import { TONE_BADGE, TONE_DOT, type Tone } from './tones'

export interface StatusMeta {
  label: string
  tone: Tone
  /** Classes du badge (fond + texte, thèmes clair et sombre). */
  badge: string
  /** Classe de la pastille (Kanban). */
  dot: string
}

const meta = (label: string, tone: Tone): StatusMeta => ({ label, tone, badge: TONE_BADGE[tone], dot: TONE_DOT[tone] })

export const STATUS_META: Record<JobStatus, StatusMeta> = {
  to_analyze: meta('À analyser', 'neutral'),
  to_apply: meta('À candidater', 'sky'),
  prepared: meta('Candidature préparée', 'indigo'),
  applied: meta('Postulé', 'violet'),
  followup: meta('Relance à faire', 'amber'),
  interview: meta('Entretien', 'teal'),
  second_interview: meta('Deuxième entretien', 'cyan'),
  rejected: meta('Refusé', 'rose'),
  accepted: meta('Accepté', 'emerald'),
  archived: meta('Archivé', 'neutral'),
}

export const ALL_STATUSES = Object.keys(STATUS_META) as JobStatus[]

export const KANBAN_STATUSES: JobStatus[] = [
  'to_apply',
  'prepared',
  'applied',
  'interview',
  'second_interview',
  'rejected',
  'accepted',
]

/** Statuts pour lesquels une candidature est considérée comme envoyée. */
export const SENT_STATUSES: JobStatus[] = ['applied', 'followup', 'interview', 'second_interview', 'rejected', 'accepted']

/** Statuts pour lesquels plus aucune relance n'est utile. */
export const CLOSED_STATUSES: JobStatus[] = ['rejected', 'accepted', 'archived']

export const CONTRACT_TYPES = ['Alternance', 'Apprentissage', 'Contrat de professionnalisation', 'Stage', 'CDI', 'CDD', 'Autre']

export const STUDY_LEVELS = ['Bac', 'Bac+2', 'Bac+3', 'Bac+4', 'Bac+5', 'Doctorat', 'Autre']

export const REMOTE_LABELS: Record<RemoteMode, string> = {
  any: 'Indifférent',
  onsite: 'Sur site uniquement',
  hybrid: 'Hybride',
  remote: 'Télétravail complet',
}

export const DEFAULT_CLAUDE_URL = 'https://claude.ai/new'
