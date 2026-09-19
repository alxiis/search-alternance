import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { AddJobModal } from '../components/AddJobModal'
import { ImportJsonModal } from '../components/ImportJsonModal'
import { JobDetailsModal } from '../components/JobDetailsModal'
import { LetterModal } from '../components/LetterModal'
import { PromptModal } from '../components/PromptModal'
import { buildAnalyzeJobPrompt } from '../prompts/analyzeJob'
import { buildFindCompanyJobsPrompt } from '../prompts/findCompanyJobs'
import type { PromptResult } from '../types'
import { useStore } from './useStore'

interface UiApi {
  openJob: (id: string) => void
  openAddJob: (url?: string) => void
  openImport: (targetJobId?: string) => void
  showPrompt: (result: PromptResult) => void
  analyzeJob: (jobId: string) => void
  writeLetter: (jobId: string) => void
  searchCompanyJobs: (companyId: string) => void
}

const UiContext = createContext<UiApi | null>(null)

export function UiProvider({ children }: { children: ReactNode }) {
  const { data, markCompanySearched } = useStore()
  const [jobId, setJobId] = useState<string | null>(null)
  const [addJob, setAddJob] = useState<{ url: string } | null>(null)
  const [importTarget, setImportTarget] = useState<{ jobId?: string } | null>(null)
  const [prompt, setPrompt] = useState<PromptResult | null>(null)
  const [letterJobId, setLetterJobId] = useState<string | null>(null)
  const [pendingAnalyze, setPendingAnalyze] = useState<string | null>(null)

  const api = useMemo<UiApi>(() => {
    const activeCriteria = () => data.criteria.find((c) => c.id === data.settings.activeCriteriaId) ?? data.criteria[0]
    return {
      openJob: setJobId,
      openAddJob: (url = '') => setAddJob({ url }),
      openImport: (targetJobId) => setImportTarget({ jobId: targetJobId }),
      showPrompt: setPrompt,
      analyzeJob(id) {
        const job = data.jobs.find((j) => j.id === id)
        if (!job) return
        const company = data.companies.find((c) => c.id === job.companyId)
        setPrompt({
          kind: 'analyzeJob',
          title: `Analyser avec Claude — ${job.title || company?.name || 'offre'}`,
          text: buildAnalyzeJobPrompt(data.profile, job, company),
          jobId: id,
        })
      },
      writeLetter: setLetterJobId,
      searchCompanyJobs(companyId) {
        const company = data.companies.find((c) => c.id === companyId)
        if (!company) return
        setPrompt({
          kind: 'findCompanyJobs',
          title: `Nouvelles offres — ${company.name}`,
          text: buildFindCompanyJobsPrompt(company, data.profile, activeCriteria()),
          companyId,
        })
        void markCompanySearched(companyId).catch(() => undefined)
      },
    }
  }, [data, markCompanySearched])

  // Une offre tout juste créée n'apparaît dans `data` qu'au rendu suivant : on attend qu'elle y soit.
  useEffect(() => {
    if (pendingAnalyze && data.jobs.some((j) => j.id === pendingAnalyze)) {
      api.analyzeJob(pendingAnalyze)
      setPendingAnalyze(null)
    }
  }, [pendingAnalyze, data.jobs, api])

  return (
    <UiContext.Provider value={api}>
      {children}
      {jobId && (
        <JobDetailsModal
          jobId={jobId}
          onClose={() => setJobId(null)}
          onAnalyze={() => api.analyzeJob(jobId)}
          onLetter={() => setLetterJobId(jobId)}
          onImport={() => setImportTarget({ jobId })}
        />
      )}
      {addJob && (
        <AddJobModal
          initialUrl={addJob.url}
          onClose={() => setAddJob(null)}
          onOpenExisting={(id) => {
            setAddJob(null)
            setJobId(id)
          }}
          onCreated={(id, analyze) => {
            setAddJob(null)
            if (analyze) setPendingAnalyze(id)
          }}
        />
      )}
      {letterJobId && <LetterModal jobId={letterJobId} onClose={() => setLetterJobId(null)} onImport={() => setImportTarget({ jobId: letterJobId })} />}
      {prompt && <PromptModal result={prompt} onClose={() => setPrompt(null)} onImport={() => setImportTarget({ jobId: prompt.jobId })} />}
      {importTarget && <ImportJsonModal targetJobId={importTarget.jobId} onClose={() => setImportTarget(null)} />}
    </UiContext.Provider>
  )
}

export function useUi(): UiApi {
  const ctx = useContext(UiContext)
  if (!ctx) throw new Error('useUi doit être utilisé dans <UiProvider>')
  return ctx
}
