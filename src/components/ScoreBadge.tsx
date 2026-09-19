import { cn } from '../utils/text'

export function scoreTone(score: number): string {
  if (score >= 80) return 'bg-emerald-100 text-emerald-800'
  if (score >= 60) return 'bg-lime-100 text-lime-800'
  if (score >= 40) return 'bg-amber-100 text-amber-800'
  return 'bg-rose-100 text-rose-800'
}

export function ScoreBadge({ score, className }: { score: number | null; className?: string }) {
  if (score === null) {
    return (
      <span className={cn('inline-block whitespace-nowrap rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-500', className)} title="Pas encore analysé avec Claude">
        Non analysé
      </span>
    )
  }
  return (
    <span className={cn('inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums', scoreTone(score), className)} title="Score de compatibilité fourni par l'analyse Claude importée">
      {score}/100
    </span>
  )
}
