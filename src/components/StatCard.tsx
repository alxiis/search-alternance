import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { TONE_BADGE, type Tone } from '../data/tones'
import { cn } from '../utils/text'

interface Props {
  label: string
  value: number
  icon: LucideIcon
  tone?: Tone
  to?: string
}

export function StatCard({ label, value, icon: Icon, tone = 'neutral', to }: Props) {
  const body = (
    <>
      <div className="min-w-0">
        <p className="text-sm leading-snug text-muted-foreground">{label}</p>
        <p className="mt-1.5 text-3xl font-semibold tabular-nums tracking-tight text-foreground">{value}</p>
      </div>
      <div className={cn('shrink-0 rounded-lg p-2', TONE_BADGE[tone])}>
        <Icon className="h-[18px] w-[18px]" aria-hidden />
      </div>
    </>
  )
  const cls = 'card flex items-start justify-between gap-3 p-4'
  return to ? (
    <Link to={to} className={cn(cls, 'transition-colors duration-150 hover:border-input hover:bg-muted/40')}>{body}</Link>
  ) : (
    <div className={cls}>{body}</div>
  )
}
