import type { JobStatus, RemoteMode } from '../types'

export interface StatusMeta {
  label: string
  /** Classes Tailwind du badge. */
  badge: string
  /** Classe de la pastille (Kanban). */
  dot: string
}

export const STATUS_META: Record<JobStatus, StatusMeta> = {
  to_analyze: { label: 'À analyser', badge: 'bg-slate-100 text-slate-700', dot: 'bg-slate-400' },
  to_apply: { label: 'À candidater', badge: 'bg-sky-100 text-sky-800', dot: 'bg-sky-500' },
  prepared: { label: 'Candidature préparée', badge: 'bg-indigo-100 text-indigo-800', dot: 'bg-indigo-500' },
  applied: { label: 'Postulé', badge: 'bg-violet-100 text-violet-800', dot: 'bg-violet-500' },
  followup: { label: 'Relance à faire', badge: 'bg-amber-100 text-amber-800', dot: 'bg-amber-500' },
  interview: { label: 'Entretien', badge: 'bg-teal-100 text-teal-800', dot: 'bg-teal-500' },
  second_interview: { label: 'Deuxième entretien', badge: 'bg-cyan-100 text-cyan-800', dot: 'bg-cyan-500' },
  rejected: { label: 'Refusé', badge: 'bg-rose-100 text-rose-800', dot: 'bg-rose-500' },
  accepted: { label: 'Accepté', badge: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-500' },
  archived: { label: 'Archivé', badge: 'bg-zinc-100 text-zinc-600', dot: 'bg-zinc-400' },
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
