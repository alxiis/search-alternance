import { Building2, Briefcase, CopyPlus, Import, ShieldCheck, Telescope, TriangleAlert, type LucideIcon } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../hooks/useStore'
import { useUi } from '../hooks/useUi'
import { buildFindCompanyJobsPrompt } from '../prompts/findCompanyJobs'
import { buildSearchCompaniesPrompt } from '../prompts/searchCompanies'
import { buildSearchJobsPrompt } from '../prompts/searchJobs'
import { buildSimilarCompaniesPrompt } from '../prompts/similarCompanies'
import { buildVerifyJobPrompt } from '../prompts/verifyJob'

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
        <div className="rounded-lg bg-brand-50 p-2 text-brand-600"><Icon className="h-5 w-5" aria-hidden /></div>
        <div>
          <h2 className="font-semibold text-slate-900">{title}</h2>
          <p className="mt-0.5 text-sm text-slate-500">{description}</p>
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
  const { showPrompt, openImport } = useUi()
  const { profile, criteria, companies, jobs, settings } = data
  const activeCriteria = criteria.find((c) => c.id === settings.activeCriteriaId) ?? criteria[0]
  const [companyId, setCompanyId] = useState('')
  const [jobId, setJobId] = useState('')
  const company = companies.find((c) => c.id === (companyId || companies[0]?.id))
  const job = jobs.find((j) => j.id === (jobId || jobs[0]?.id))
  const profileEmpty = !profile.firstName && !profile.skills.length && !profile.experiences && !profile.cvText

  const companySelect = (
    <select className="input" value={company?.id ?? ''} onChange={(e) => setCompanyId(e.target.value)} aria-label="Entreprise">
      {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
    </select>
  )

  return (
    <div className="space-y-6">
      <section className="card flex flex-wrap items-end gap-4 p-5">
        <div className="min-w-[16rem] flex-1">
          <label htmlFor="criteria-select" className="label">Critères utilisés dans les prompts</label>
          {criteria.length ? (
            <select id="criteria-select" className="input" value={activeCriteria?.id ?? ''} onChange={(e) => void saveSettings({ activeCriteriaId: e.target.value })}>
              {criteria.map((c) => <option key={c.id} value={c.id}>{c.name || 'Sans nom'}</option>)}
            </select>
          ) : (
            <p className="text-sm text-slate-600">Aucun critère défini. <Link to="/criteres" className="font-medium text-brand-700 hover:underline">Créer un profil de recherche</Link></p>
          )}
        </div>
        <div className="min-w-[16rem] flex-1">
          <label htmlFor="claude-url" className="label">Adresse du bouton « Ouvrir Claude »</label>
          <input id="claude-url" className="input" type="url" value={settings.claudeUrl} onChange={(e) => void saveSettings({ claudeUrl: e.target.value })} />
        </div>
        <button className="btn-secondary" onClick={() => openImport()}><Import className="h-4 w-4" aria-hidden /> Importer résultat Claude</button>
      </section>

      {profileEmpty && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900" role="note">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>Votre profil est vide : les prompts seront peu utiles. <Link to="/profil" className="font-medium underline">Complétez-le d'abord.</Link></p>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <ToolCard
          icon={Building2}
          title="Rechercher des entreprises"
          description="Claude cherche sur le web des entreprises qui recrutent des profils comme le vôtre, avec leurs offres."
          action={() => showPrompt({ kind: 'searchCompanies', title: 'Rechercher des entreprises', text: buildSearchCompaniesPrompt(profile, activeCriteria) })}
        />
        <ToolCard
          icon={Telescope}
          title="Rechercher des offres"
          description="Claude relève des offres réellement ouvertes qui correspondent à vos critères, en vérifiant chaque page."
          action={() => showPrompt({ kind: 'searchJobs', title: 'Rechercher des offres', text: buildSearchJobsPrompt(profile, activeCriteria) })}
        />
        <ToolCard
          icon={Briefcase}
          title="Rechercher des offres d'une entreprise"
          description="Toutes les offres ouvertes chez une entreprise déjà enregistrée."
          disabled={!company}
          disabledHint="Ajoutez d'abord une entreprise (importez une recherche ou ajoutez une offre)."
          action={() => {
            if (!company) return
            showPrompt({ kind: 'findCompanyJobs', title: `Offres — ${company.name}`, text: buildFindCompanyJobsPrompt(company, profile, activeCriteria), companyId: company.id })
            void markCompanySearched(company.id).catch(() => undefined)
          }}
        >
          {companies.length ? companySelect : null}
        </ToolCard>
        <ToolCard
          icon={ShieldCheck}
          title="Vérifier une offre"
          description="Claude contrôle qu'une offre est toujours en ligne, cohérente et fiable."
          disabled={!job}
          disabledHint="Ajoutez d'abord une offre."
          action={() => {
            if (!job) return
            const owner = companies.find((c) => c.id === job.companyId)
            showPrompt({ kind: 'verifyJob', title: `Vérifier — ${job.title || job.url}`, text: buildVerifyJobPrompt(job, owner), jobId: job.id })
          }}
        >
          {jobs.length ? (
            <select className="input" value={job?.id ?? ''} onChange={(e) => setJobId(e.target.value)} aria-label="Offre à vérifier">
              {jobs.map((j) => <option key={j.id} value={j.id}>{j.title || j.url}</option>)}
            </select>
          ) : null}
        </ToolCard>
        <ToolCard
          icon={CopyPlus}
          title="Trouver des entreprises similaires"
          description="À partir d'une entreprise qui vous plaît, Claude en propose d'autres du même type."
          disabled={!company}
          disabledHint="Ajoutez d'abord une entreprise."
          action={() => company && showPrompt({ kind: 'similarCompanies', title: `Entreprises similaires — ${company.name}`, text: buildSimilarCompaniesPrompt(company, profile, activeCriteria), companyId: company.id })}
        >
          {companies.length ? companySelect : null}
        </ToolCard>
      </div>
    </div>
  )
}
