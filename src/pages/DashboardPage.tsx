import { Archive, Briefcase, CalendarClock, CheckCircle2, FlaskConical, MessagesSquare, Search, Send, UserRound, XCircle, type LucideIcon } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState } from '../components/EmptyState'
import { ScoreBadge } from '../components/ScoreBadge'
import { StatCard } from '../components/StatCard'
import { StatusBadge } from '../components/StatusBadge'
import { SENT_STATUSES } from '../data/constants'
import { useStore } from '../hooks/useStore'
import { useToast } from '../hooks/useToast'
import { useUi } from '../hooks/useUi'
import { addDays, formatDate, mondayOf, today } from '../utils/dates'
import { buildTasks } from '../utils/tasks'
import { cn } from '../utils/text'

const WEEKS = 8

function WeeklyChart({ counts }: { counts: Array<{ label: string; value: number }> }) {
  const max = Math.max(1, ...counts.map((c) => c.value))
  return (
    <div>
      <div className="flex h-36 items-end gap-2" role="img" aria-label={`Candidatures envoyées par semaine sur ${WEEKS} semaines : ${counts.map((c) => c.value).join(', ')}`}>
        {counts.map((c) => (
          <div key={c.label} className="flex flex-1 flex-col items-center justify-end gap-1">
            <span className="text-xs tabular-nums text-slate-500">{c.value || ''}</span>
            <div className="w-full rounded-t bg-brand-500" style={{ height: `${(c.value / max) * 100}%`, minHeight: c.value ? 4 : 2, opacity: c.value ? 1 : 0.2 }} />
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-2">
        {counts.map((c) => <span key={c.label} className="flex-1 text-center text-[10px] text-slate-400">{c.label}</span>)}
      </div>
    </div>
  )
}

function Shortcut({ to, icon: Icon, label, onClick }: { to?: string; icon: LucideIcon; label: string; onClick?: () => void }) {
  const cls = 'flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 hover:border-brand-500 hover:text-brand-700'
  return to ? <Link to={to} className={cls}><Icon className="h-4 w-4" aria-hidden />{label}</Link> : <button onClick={onClick} className={cls}><Icon className="h-4 w-4" aria-hidden />{label}</button>
}

export function DashboardPage() {
  const { data, loadDemo } = useStore()
  const { notify } = useToast()
  const { openJob, openImport, openAddJob } = useUi()
  const { jobs, companies, profile } = data
  const names = new Map(companies.map((c) => [c.id, c.name]))

  const stats = useMemo(() => {
    const count = (pred: (s: string) => boolean) => jobs.filter((j) => pred(j.status)).length
    return {
      total: jobs.length,
      toApply: count((s) => s === 'to_apply'),
      sent: count((s) => SENT_STATUSES.includes(s as never)),
      interviews: count((s) => s === 'interview' || s === 'second_interview'),
      rejected: count((s) => s === 'rejected'),
      accepted: count((s) => s === 'accepted'),
    }
  }, [jobs])

  const latest = useMemo(
    () => jobs.filter((j) => j.application.appliedAt).sort((a, b) => (b.application.appliedAt ?? '').localeCompare(a.application.appliedAt ?? '')).slice(0, 5),
    [jobs],
  )
  const tasks = useMemo(() => buildTasks(jobs).slice(0, 8), [jobs])

  const weekly = useMemo(() => {
    const start = mondayOf(addDays(today(), -7 * (WEEKS - 1)))
    return Array.from({ length: WEEKS }, (_, i) => {
      const from = addDays(start, i * 7)
      const to = addDays(from, 7)
      const value = jobs.filter((j) => j.application.appliedAt && j.application.appliedAt >= from && j.application.appliedAt < to).length
      return { label: formatDate(from).replace(/ \d{4}$/, ''), value }
    })
  }, [jobs])

  const profileReady = Boolean(profile.firstName || profile.skills.length)

  return (
    <div className="space-y-6">
      {(!profileReady || !jobs.length) && (
        <section className="card border-brand-100 bg-brand-50 p-5">
          <h2 className="font-semibold text-slate-900">Pour démarrer</h2>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-700">
            <li><Link className="font-medium text-brand-700 hover:underline" to="/profil">Renseignez votre profil</Link> et importez votre CV.</li>
            <li><Link className="font-medium text-brand-700 hover:underline" to="/criteres">Définissez vos critères</Link> de recherche.</li>
            <li><Link className="font-medium text-brand-700 hover:underline" to="/recherche">Générez un prompt</Link>, collez-le dans Claude, puis importez le JSON obtenu.</li>
          </ol>
          <button className="btn-secondary btn-sm mt-3" onClick={() => void loadDemo().then(() => notify('Données de démonstration chargées.'))}>
            <FlaskConical className="h-3.5 w-3.5" aria-hidden /> Charger les données de démonstration
          </button>
        </section>
      )}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6" aria-label="Statistiques">
        <StatCard label="Offres au total" value={stats.total} icon={Briefcase} to="/offres" />
        <StatCard label="À candidater" value={stats.toApply} icon={CalendarClock} tone="bg-sky-100 text-sky-700" to="/kanban" />
        <StatCard label="Candidatures envoyées" value={stats.sent} icon={Send} tone="bg-violet-100 text-violet-700" to="/offres" />
        <StatCard label="Entretiens" value={stats.interviews} icon={MessagesSquare} tone="bg-teal-100 text-teal-700" to="/kanban" />
        <StatCard label="Refus" value={stats.rejected} icon={XCircle} tone="bg-rose-100 text-rose-700" to="/kanban" />
        <StatCard label="Acceptées" value={stats.accepted} icon={CheckCircle2} tone="bg-emerald-100 text-emerald-700" to="/kanban" />
      </section>

      <section className="flex flex-wrap gap-2" aria-label="Raccourcis">
        <Shortcut to="/recherche" icon={Search} label="Préparer une recherche" />
        <Shortcut icon={Briefcase} label="Ajouter une offre" onClick={() => openAddJob()} />
        <Shortcut icon={Archive} label="Importer résultat Claude" onClick={() => openImport()} />
        <Shortcut to="/profil" icon={UserRound} label="Mon profil" />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-4 font-semibold text-slate-900">Prochaines relances et entretiens</h2>
          {tasks.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">Aucune relance prévue. Une date de relance est proposée automatiquement quand vous passez une offre en « Postulé ».</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {tasks.map((t) => {
                const job = jobs.find((j) => j.id === t.jobId)
                if (!job) return null
                return (
                  <li key={`${t.jobId}-${t.kind}`}>
                    <button className="flex w-full items-center gap-3 py-2.5 text-left hover:bg-slate-50" onClick={() => openJob(job.id)}>
                      <span className={cn('w-24 shrink-0 text-xs font-medium', t.overdue ? 'text-rose-600' : 'text-slate-500')}>
                        {formatDate(t.dueDate).replace(/ \d{4}$/, '')}{t.overdue ? ' · en retard' : ''}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-slate-900">{names.get(job.companyId ?? '') ?? 'Entreprise inconnue'} — {job.title || 'Offre'}</span>
                        <span className="text-xs text-slate-500">{t.label}{job.application.nextAction ? ` · ${job.application.nextAction}` : ''}</span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section className="card p-5">
          <h2 className="mb-4 font-semibold text-slate-900">Candidatures envoyées par semaine</h2>
          <WeeklyChart counts={weekly} />
        </section>
      </div>

      <section className="card">
        <h2 className="px-5 pt-5 font-semibold text-slate-900">Dernières candidatures</h2>
        {latest.length === 0 ? (
          <EmptyState icon={Send} title="Aucune candidature envoyée" description="Passez une offre au statut « Postulé » pour la voir apparaître ici." />
        ) : (
          <ul className="divide-y divide-slate-100 p-2">
            {latest.map((j) => (
              <li key={j.id}>
                <button className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 rounded-lg px-3 py-2.5 text-left hover:bg-slate-50" onClick={() => openJob(j.id)}>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-slate-900">{j.title || 'Offre'}</span>
                    <span className="text-xs text-slate-500">{names.get(j.companyId ?? '') ?? 'Entreprise inconnue'} · le {formatDate(j.application.appliedAt)}</span>
                  </span>
                  <ScoreBadge score={j.compatibilityScore} />
                  <StatusBadge status={j.status} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
