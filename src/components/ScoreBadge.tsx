import { TONE_BADGE, type Tone } from '../data/tones'
import type { JobAvailability } from '../types'
import { effectiveAvailability } from '../utils/availability'
import { formatDate } from '../utils/dates'
import { cn } from '../utils/text'

export function scoreTone(score: number): Tone {
  if (score >= 80) return 'emerald'
  if (score >= 60) return 'lime'
  if (score >= 40) return 'amber'
  return 'rose'
}

interface ScoreProps {
  score: number | null
  /** Vrai si le score vient d'une recherche (estimation rapide) et non d'une analyse détaillée. */
  estimated?: boolean
  className?: string
}

export function ScoreBadge({ score, estimated = false, className }: ScoreProps) {
  if (score === null) {
    return (
      <span className={cn('inline-block whitespace-nowrap rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground', className)} title="Pas encore analysé avec Claude">
        Non analysé
      </span>
    )
  }
  return (
    <span
      className={cn('inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums', TONE_BADGE[scoreTone(score)], estimated && 'border border-dashed border-current/40', className)}
      title={estimated ? "Estimation rapide donnée par Claude lors d'une recherche. Lancez l'analyse pour un score détaillé." : "Score de compatibilité fourni par l'analyse Claude importée"}
    >
      {estimated ? '≈ ' : ''}{score}/100
    </span>
  )
}

const AVAILABILITY_META: Record<Exclude<JobAvailability, ''>, { label: string; tone: Tone }> = {
  open: { label: 'En ligne', tone: 'emerald' },
  expired: { label: 'Expirée', tone: 'rose' },
  doubtful: { label: 'Douteuse', tone: 'amber' },
}

export const AVAILABILITY_LABEL: Record<JobAvailability, string> = {
  '': 'Non vérifiée',
  open: AVAILABILITY_META.open.label,
  expired: AVAILABILITY_META.expired.label,
  doubtful: AVAILABILITY_META.doubtful.label,
}

/** État de l'annonce d'après la dernière vérification. Par défaut, seuls les états problématiques sont affichés. */
export function AvailabilityBadge({ availability, verifiedAt, expiresAt = null, showOpen = false, className }: { availability: JobAvailability; verifiedAt?: string | null; expiresAt?: string | null; showOpen?: boolean; className?: string }) {
  const state = effectiveAvailability({ availability, expiresAt })
  if (!state || (state === 'open' && !showOpen)) return null
  const meta = AVAILABILITY_META[state]
  // Expirée sans vérification : c'est la date limite de l'annonce qui est dépassée.
  const title = state !== availability && expiresAt ? `Date limite dépassée le ${formatDate(expiresAt)}` : verifiedAt ? `Vérifiée le ${formatDate(verifiedAt)}` : undefined
  return (
    <span className={cn('inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium', TONE_BADGE[meta.tone], className)} title={title}>
      {meta.label}
    </span>
  )
}
