import type { ContactChannel, JobStatus, ProspectStatus, RemoteMode } from '../types'
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

/** Parcours d'une candidature spontanée auprès d'une entreprise. */
export const PROSPECT_META: Record<ProspectStatus, StatusMeta> = {
  none: meta('Hors prospection', 'neutral'),
  to_contact: meta('À contacter', 'sky'),
  contacted: meta('Contactée', 'violet'),
  followup: meta('À relancer', 'amber'),
  in_discussion: meta('Échange en cours', 'teal'),
  closed: meta('Sans suite', 'rose'),
}

export const ALL_PROSPECT_STATUSES = Object.keys(PROSPECT_META) as ProspectStatus[]

/** Statuts pour lesquels une relance de candidature spontanée a un sens. */
export const PROSPECT_WAITING: ProspectStatus[] = ['contacted', 'followup']

export const CHANNEL_LABELS: Record<ContactChannel, string> = {
  email: 'E-mail',
  linkedin: 'LinkedIn',
  phone: 'Téléphone',
  meeting: 'Rencontre',
  other: 'Autre',
}

export const CONTRACT_TYPES = ['Alternance', 'Apprentissage', 'Contrat de professionnalisation', 'Stage', 'CDI', 'CDD', 'Autre']

export const STUDY_LEVELS = ['Bac', 'Bac+2', 'Bac+3', 'Bac+4', 'Bac+5', 'Doctorat', 'Autre']

export const REMOTE_LABELS: Record<RemoteMode, string> = {
  any: 'Indifférent',
  onsite: 'Sur site uniquement',
  hybrid: 'Hybride',
  remote: 'Télétravail complet',
}

export const DEFAULT_CLAUDE_URL = 'https://claude.ai/new'
