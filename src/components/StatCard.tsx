import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '../utils/text'

interface Props {
  label: string
  value: number
  icon: LucideIcon
  tone?: string
  to?: string
}

export function StatCard({ label, value, icon: Icon, tone = 'bg-slate-100 text-slate-600', to }: Props) {
  const body = (
    <>
      <div className={cn('rounded-lg p-2.5', tone)}>
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <div>
        <p className="text-2xl font-semibold tabular-nums text-slate-900">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </>
  )
  const cls = 'card flex items-center gap-4 p-4'
  return to ? (
    <Link to={to} className={cn(cls, 'transition-shadow hover:shadow-md')}>{body}</Link>
  ) : (
    <div className={cls}>{body}</div>
  )
}
