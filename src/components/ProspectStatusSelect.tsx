import { ALL_PROSPECT_STATUSES, PROSPECT_META } from '../data/constants'
import { useStore } from '../hooks/useStore'
import type { Company, ProspectStatus } from '../types'
import { cn } from '../utils/text'

/** Avancement de la candidature spontanée auprès d'une entreprise, sauvegardé immédiatement. */
export function ProspectStatusSelect({ company, className }: { company: Company; className?: string }) {
  const { setProspectStatus } = useStore()
  return (
    <select
      value={company.prospectStatus}
      onChange={(e) => void setProspectStatus(company.id, e.target.value as ProspectStatus).catch(() => undefined)}
      aria-label={`Prospection de ${company.name}`}
      className={cn('rounded-full border-0 py-1 pl-2.5 pr-7 text-xs font-medium focus:ring-2 focus:ring-ring/30', PROSPECT_META[company.prospectStatus].badge, className)}
    >
      {ALL_PROSPECT_STATUSES.map((s) => <option key={s} value={s}>{PROSPECT_META[s].label}</option>)}
    </select>
  )
}
