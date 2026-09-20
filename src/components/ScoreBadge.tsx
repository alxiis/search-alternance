import { TONE_BADGE, type Tone } from '../data/tones'
import { cn } from '../utils/text'

export function scoreTone(score: number): Tone {
  if (score >= 80) return 'emerald'
  if (score >= 60) return 'lime'
  if (score >= 40) return 'amber'
  return 'rose'
}

export function ScoreBadge({ score, className }: { score: number | null; className?: string }) {
  if (score === null) {
    return (
      <span className={cn('inline-block whitespace-nowrap rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground', className)} title="Pas encore analysé avec Claude">
        Non analysé
      </span>
    )
  }
  return (
    <span className={cn('inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums', TONE_BADGE[scoreTone(score)], className)} title="Score de compatibilité fourni par l'analyse Claude importée">
      {score}/100
    </span>
  )
}
