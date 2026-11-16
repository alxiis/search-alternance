import { Building2, Briefcase, CopyPlus, ExternalLink, Globe, Import, ShieldCheck, Telescope, TriangleAlert, type LucideIcon } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { BookmarkletInstall } from '../components/BookmarkletInstall'
import { CLOSED_STATUSES, DEFAULT_CLAUDE_URL } from '../data/constants'
import { useStore } from '../hooks/useStore'
import { useUi } from '../hooks/useUi'
import { buildFindCompanyJobsPrompt } from '../prompts/findCompanyJobs'
import type { SearchPromptOptions } from '../prompts/format'
import { buildSearchCompaniesPrompt } from '../prompts/searchCompanies'
import { buildSearchJobsPrompt } from '../prompts/searchJobs'
import { buildSimilarCompaniesPrompt } from '../prompts/similarCompanies'
import { jobBoardLinks } from '../utils/jobBoards'
import { isHttpUrl } from '../utils/url'

function ToolCard({ icon: Icon, title, description, children, action, disabled, disabledHint }: {
  icon: LucideIcon
  title: string
  description: string
  children?: ReactNode
  action: () => void
  disabled?: boolean
  disabledHint?: string
}) {
  return (
    <section className="card flex flex-col p-5">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-accent p-2 text-accent-foreground"><Icon className="h-5 w-5" aria-hidden /></div>
        <div>
          <h2 className="font-semibold text-foreground">{title}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {children && <div className="mt-4">{children}</div>}
      <div className="mt-auto pt-4">
        <button className="btn-primary" onClick={action} disabled={disabled}>Générer le prompt</button>
        {disabled && disabledHint && <p className="hint">{disabledHint}</p>}
      </div>
    </section>
  )
}

export function SearchPage() {
  const { data, saveSettings, markCompanySearched } = useStore()
  const { showPrompt, openImport, verifyJob } = useUi()
  const { profile, criteria, companies, jobs, settings } = data
  const activeCriteria = criteria.find((c) => c.id === settings.activeCriteriaId) ?? criteria[0]
  const [companyId, setCompanyId] = useState('')
  const [jobId, setJobId] = useState('')
  const [focus, setFocus] = useState('')
  const [excludeKnown, setExcludeKnown] = useState(true)
  const [claudeUrl, setClaudeUrl] = useState(settings.claudeUrl)

  const sortedCompanies = useMemo(() => [...companies].sort((a, b) => a.name.localeCompare(b.name, 'fr')), [companies])
  // Offres à vérifier : celles encore en cours d'abord, libellées avec leur entreprise pour les distinguer.
  const jobChoices = useMemo(() => {
    const names = new Map(companies.map((c) => [c.id, c.name]))
    return jobs
      .map((j) => ({
        id: j.id,
        closed: CLOSED_STATUSES.includes(j.status),
        label: [names.get(j.companyId ?? ''), j.title || j.url || 'Offre sans titre'].filter(Boolean).join(' — '),
      }))
      .sort((a, b) => Number(a.closed) - Number(b.closed) || a.label.localeCompare(b.label, 'fr'))
  }, [jobs, companies])

  const company = sortedCompanies.find((c) => c.id === companyId) ?? sortedCompanies[0]
  const selectedJobId = jobChoices.some((j) => j.id === jobId) ? jobId : (jobChoices[0]?.id ?? '')
  const profileEmpty = !profile.firstName && !profile.skills.length && !profile.experiences && !profile.cvText

  const what = activeCriteria?.jobTitle || profile.mainSearch
  const where = activeCriteria?.city || profile.city
  const missing = [!what && 'le métier recherché', !where && 'la ville'].filter(Boolean).join(' et ')
  const boards = useMemo(() => jobBoardLinks({ what, where }), [what, where])

  const options: SearchPromptOptions = { focus, known: excludeKnown ? { companies, jobs } : undefined }
  const hasKnown = companies.length > 0 || jobs.length > 0

  const companySelect = (
    <select className="input" value={company?.id ?? ''} onChange={(e) => setCompanyId(e.target.value)} aria-label="Entreprise">
      {sortedCompanies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
    </select>
  )

  return (
    <div className="space-y-6">
      <section className="card space-y-4 p-5">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[16rem] flex-1">
            <label htmlFor="criteria-select" className="label">Critères utilisés dans les prompts</label>
            {criteria.length ? (
              <select id="criteria-select" className="input" value={activeCriteria?.id ?? ''} onChange={(e) => void saveSettings({ activeCriteriaId: e.target.value })}>
                {criteria.map((c) => <option key={c.id} value={c.id}>{c.name || 'Sans nom'}</option>)}
              </select>
            ) : (
              <p className="text-sm text-muted-foreground">Aucun critère défini. <Link to="/criteres" className="font-medium text-accent-foreground hover:underline">Créer un profil de recherche</Link></p>
            )}
          </div>
          <div className="min-w-[16rem] flex-1">
            <label htmlFor="claude-url" className="label">Adresse du bouton « Ouvrir Claude »</label>
            <input
              id="claude-url"
              className="input"
              type="url"
              value={claudeUrl}
              aria-invalid={claudeUrl.trim() !== '' && !isHttpUrl(claudeUrl) ? true : undefined}
              onChange={(e) => {
                setClaudeUrl(e.target.value)
                // Seule une adresse valide est enregistrée ; un champ vidé revient à l'adresse par défaut.
                const next = e.target.value.trim()
                if (!next) void saveSettings({ claudeUrl: DEFAULT_CLAUDE_URL })
                else if (isHttpUrl(next)) void saveSettings({ claudeUrl: next })
              }}
            />
          </div>
          <button className="btn-secondary" onClick={() => openImport()}><Import className="h-4 w-4" aria-hidden /> Importer résultat Claude</button>
        </div>

        <div>
          <label htmlFor="search-focus" className="label">Précisions pour cette recherche (facultatif)</label>
          <textarea
            id="search-focus"
            className="input"
            rows={2}
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
            placeholder="Ex. : uniquement des PME ; offres publiées cette semaine ; élargir aux communes voisines ; éviter les ESN…"
          />
          <p className="hint">Ajouté aux prompts de recherche ci-dessous, sans modifier vos critères enregistrés.</p>
        </div>

        {hasKnown && (
          <label className="flex items-start gap-2 text-sm text-foreground">
            <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-input accent-[var(--primary)]" checked={excludeKnown} onChange={(e) => setExcludeKnown(e.target.checked)} />
            <span>
              Ne pas reproposer ce que je suis déjà
              <span className="block text-xs text-muted-foreground">
                Vos {companies.length} entreprise{companies.length > 1 ? 's' : ''} et {jobs.length} offre{jobs.length > 1 ? 's' : ''} sont listées dans le prompt : Claude cherche du nouveau au lieu de répéter les mêmes résultats.
              </span>
            </span>
          </label>
        )}
      </section>

      {profileEmpty && (
        <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning-soft p-3 text-sm text-warning-soft-foreground" role="note">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>Votre profil est vide : les prompts seront peu utiles. <Link to="/profil" className="font-medium underline">Complétez-le d'abord.</Link></p>
        </div>
      )}
      {!profileEmpty && missing && (
        <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning-soft p-3 text-sm text-warning-soft-foreground" role="note">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>Il manque {missing} : la recherche sera trop large. <Link to="/criteres" className="font-medium underline">Précisez vos critères.</Link></p>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <ToolCard
          icon={Telescope}
          title="Rechercher des offres"
          description="Claude relève des offres réellement ouvertes qui correspondent à vos critères, vérifie chaque page et estime leur compatibilité."
          action={() => showPrompt({ kind: 'searchJobs', title: 'Rechercher des offres', text: buildSearchJobsPrompt(profile, activeCriteria, options) })}
        />
        <ToolCard
          icon={Building2}
          title="Rechercher des entreprises"
          description="Entreprises qui recrutent des alternants comme vous, avec leurs offres ouvertes — ou la façon de leur envoyer une candidature spontanée."
          action={() => showPrompt({ kind: 'searchCompanies', title: 'Rechercher des entreprises', text: buildSearchCompaniesPrompt(profile, activeCriteria, options) })}
        />
        <ToolCard
          icon={Briefcase}
          title="Rechercher des offres d'une entreprise"
          description="Toutes les offres ouvertes chez une entreprise déjà enregistrée."
          disabled={!company}
          disabledHint="Ajoutez d'abord une entreprise (importez une recherche ou ajoutez une offre)."
          action={() => {
            if (!company) return
            showPrompt({ kind: 'findCompanyJobs', title: `Offres — ${company.name}`, text: buildFindCompanyJobsPrompt(company, profile, activeCriteria, options), companyId: company.id })
            void markCompanySearched(company.id).catch(() => undefined)
          }}
        >
          {companies.length ? companySelect : null}
        </ToolCard>
        <ToolCard
          icon={CopyPlus}
          title="Trouver des entreprises similaires"
          description="À partir d'une entreprise qui vous plaît, Claude en propose d'autres du même type."
          disabled={!company}
          disabledHint="Ajoutez d'abord une entreprise."
          action={() => company && showPrompt({ kind: 'similarCompanies', title: `Entreprises similaires — ${company.name}`, text: buildSimilarCompaniesPrompt(company, profile, activeCriteria, options), companyId: company.id })}
        >
          {companies.length ? companySelect : null}
        </ToolCard>
        <ToolCard
          icon={ShieldCheck}
          title="Vérifier une offre"
          description="Claude contrôle qu'une offre est toujours en ligne, cohérente et fiable, et complète ses informations. L'état de l'annonce est mis à jour à l'import."
          disabled={!selectedJobId}
          disabledHint="Ajoutez d'abord une offre."
          action={() => selectedJobId && verifyJob(selectedJobId)}
        >
          {jobChoices.length ? (
            <select className="input" value={selectedJobId} onChange={(e) => setJobId(e.target.value)} aria-label="Offre à vérifier">
              {jobChoices.map((j) => <option key={j.id} value={j.id}>{j.label}{j.closed ? ' (clôturée)' : ''}</option>)}
            </select>
          ) : null}
        </ToolCard>

        <section className="card flex flex-col p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-accent p-2 text-accent-foreground"><Globe className="h-5 w-5" aria-hidden /></div>
            <div>
              <h2 className="font-semibold text-foreground">Chercher directement sur les sites d'emploi</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {what || where ? <>Recherche pré-remplie quand le site le permet : <strong className="font-medium text-foreground">{[what, where].filter(Boolean).join(' · ')}</strong>.</> : 'Renseignez un métier et une ville dans vos critères pour pré-remplir ces recherches.'}
                {' '}Une offre vous plaît ? Ajoutez-la en un clic avec le bouton de capture ci-dessous.
              </p>
            </div>
          </div>
          <ul className="mt-4 flex flex-wrap gap-2">
            {boards.map((b) => (
              <li key={b.name}>
                <a className="btn-secondary btn-sm" href={b.url} target="_blank" rel="noopener noreferrer" title={b.hint}>
                  {b.name} <ExternalLink className="h-3 w-3" aria-hidden />
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-4"><BookmarkletInstall /></div>
        </section>
      </div>
    </div>
  )
}
