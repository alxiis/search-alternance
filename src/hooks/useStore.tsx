import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { buildDemoData } from '../data/demo'
import type {
  Application, AppData, AppSettings, Company, JobOffer, JobStatus, Profile, ProspectStatus, SearchCriteria, StoredFile,
} from '../types'
import { emptyCompany, emptyJob, emptyProfile, emptySettings } from '../lib/factories'
import { loadAll, storage } from '../services/storage'
import { applyImportPlan, type ImportItem, type ImportResult } from '../services/claudeImport'
import { addDays, nowIso, today } from '../utils/dates'
import { mergeContacts, type ContactInput } from '../utils/contacts'
import { findCompanyByName, findDuplicateJob, type DuplicateMatch } from '../utils/dedupe'
import { unique } from '../utils/text'
import { useToast } from './useToast'

export interface NewJobInput {
  url: string
  companyName: string
  title: string
  location: string
  contractType: string
  publishedAt: string | null
  salary: string
  notes: string
  status: JobStatus
}

/** Entreprise repérée en prospection (registre officiel) à ajouter au suivi. */
export interface ProspectInput {
  name: string
  siren: string
  sector: string
  location: string
  size: string
  contacts: ContactInput[]
  source: string
}

export type AddJobResult = { ok: true; job: JobOffer } | { ok: false; duplicate: DuplicateMatch }

export interface Store {
  ready: boolean
  loadError: string | null
  data: AppData
  saveProfile: (p: Profile) => Promise<void>
  saveSettings: (patch: Partial<AppSettings>) => Promise<void>
  saveCriteria: (c: SearchCriteria) => Promise<void>
  deleteCriteria: (id: string) => Promise<void>
  addJob: (input: NewJobInput) => Promise<AddJobResult>
  updateJob: (id: string, patch: Partial<JobOffer>, companyName?: string) => Promise<void>
  updateApplication: (id: string, patch: Partial<Application>) => Promise<void>
  setJobStatus: (id: string, status: JobStatus) => Promise<void>
  deleteJob: (id: string) => Promise<void>
  saveCompany: (c: Company) => Promise<void>
  /** Modifie quelques champs d'une entreprise sans écraser le reste (import ou autre onglet entre-temps). */
  updateCompany: (id: string, patch: Partial<Company>) => Promise<void>
  setProspectStatus: (id: string, status: ProspectStatus) => Promise<void>
  /** Ajoute une entreprise à la prospection, ou complète celle déjà suivie (même SIREN ou même nom). */
  addProspect: (input: ProspectInput) => Promise<{ company: Company; created: boolean }>
  deleteCompany: (id: string) => Promise<void>
  markCompanySearched: (id: string) => Promise<void>
  importResults: (items: ImportItem[], targetJobId?: string) => Promise<ImportResult | null>
  saveFile: (id: StoredFile['id'], file: File) => Promise<void>
  deleteFile: (id: StoredFile['id']) => Promise<void>
  clearFiles: () => Promise<void>
  loadDemo: () => Promise<void>
  replaceAll: (data: AppData) => Promise<void>
  clearAll: () => Promise<void>
}

const StoreContext = createContext<Store | null>(null)

const emptyData = (): AppData => ({
  profile: emptyProfile(),
  criteria: [],
  companies: [],
  jobs: [],
  settings: emptySettings(),
  files: [],
})

export function StoreProvider({ children }: { children: ReactNode }) {
  const { notify } = useToast()
  const [data, setData] = useState<AppData>(emptyData)
  const [ready, setReady] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const dataRef = useRef<AppData>(data)

  useEffect(() => {
    loadAll()
      .then((loaded) => {
        dataRef.current = loaded
        setData(loaded)
      })
      .catch((e: unknown) => setLoadError(e instanceof Error ? e.message : 'Lecture de la base locale impossible'))
      .finally(() => setReady(true))
    void navigator.storage?.persist?.()
  }, [])

  const store = useMemo<Store>(() => {
    const commit = (updater: (d: AppData) => AppData): AppData => {
      const next = updater(dataRef.current)
      dataRef.current = next
      setData(next)
      return next
    }

    /** Exécute une écriture IndexedDB ; en cas d'échec, prévient l'utilisateur et relance l'erreur. */
    const persist = async (write: () => Promise<unknown>): Promise<void> => {
      try {
        await write()
      } catch (e) {
        notify(`Sauvegarde locale impossible : ${e instanceof Error ? e.message : 'erreur inconnue'}`, 'error')
        throw e
      }
    }

    const upsert = <T extends { id: string }>(list: T[], item: T): T[] =>
      list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : [...list, item]

    const ensureCompany = (name: string): Company | null => {
      const trimmed = name.trim()
      if (!trimmed) return null
      const existing = findCompanyByName(trimmed, dataRef.current.companies)
      if (existing) return existing
      const created = emptyCompany(trimmed)
      commit((d) => ({ ...d, companies: [...d.companies, created] }))
      // L'échec est déjà signalé par `persist` ; on évite seulement un rejet de promesse non géré.
      void persist(() => storage.saveCompanies([created])).catch(() => undefined)
      return created
    }

    const patchJob = async (id: string, change: (j: JobOffer) => JobOffer): Promise<void> => {
      const current = dataRef.current.jobs.find((j) => j.id === id)
      if (!current) return
      const updated = { ...change(current), updatedAt: nowIso() }
      commit((d) => ({ ...d, jobs: upsert(d.jobs, updated) }))
      await persist(() => storage.saveJobs([updated]))
    }

    const patchCompany = async (id: string, change: (c: Company) => Company): Promise<void> => {
      const current = dataRef.current.companies.find((c) => c.id === id)
      if (!current) return
      const updated = { ...change(current), updatedAt: nowIso() }
      commit((d) => ({ ...d, companies: upsert(d.companies, updated) }))
      await persist(() => storage.saveCompanies([updated]))
    }

    return {
      ready: false,
      loadError: null,
      data: dataRef.current,

      async saveProfile(p) {
        const profile = { ...p, updatedAt: nowIso() }
        commit((d) => ({ ...d, profile }))
        await persist(() => storage.saveProfile(profile))
      },

      async saveSettings(patch) {
        const settings = { ...dataRef.current.settings, ...patch }
        commit((d) => ({ ...d, settings }))
        await persist(() => storage.saveSettings(settings))
      },

      async saveCriteria(c) {
        const criteria = { ...c, updatedAt: nowIso() }
        const isFirst = dataRef.current.criteria.length === 0
        commit((d) => ({ ...d, criteria: upsert(d.criteria, criteria) }))
        await persist(() => storage.saveCriteria(criteria))
        if (isFirst || !dataRef.current.settings.activeCriteriaId) await store.saveSettings({ activeCriteriaId: criteria.id })
      },

      async deleteCriteria(id) {
        commit((d) => ({ ...d, criteria: d.criteria.filter((c) => c.id !== id) }))
        await persist(() => storage.deleteCriteria(id))
        if (dataRef.current.settings.activeCriteriaId === id) {
          await store.saveSettings({ activeCriteriaId: dataRef.current.criteria[0]?.id ?? null })
        }
      },

      async addJob(input) {
        const url = input.url.trim()
        const duplicate = findDuplicateJob(
          { url, title: input.title, location: input.location, companyName: input.companyName },
          dataRef.current.jobs,
          dataRef.current.companies,
        )
        if (duplicate) return { ok: false, duplicate }
        const company = ensureCompany(input.companyName)
        const base = emptyJob(url)
        const days = dataRef.current.settings.followUpDays
        const job: JobOffer = {
          ...base,
          companyId: company?.id ?? null,
          title: input.title.trim(),
          location: input.location.trim(),
          contractType: input.contractType,
          publishedAt: input.publishedAt,
          salary: input.salary.trim(),
          notes: input.notes.trim(),
          status: input.status,
          application: input.status === 'applied' ? { ...base.application, appliedAt: today(), followUpDate: addDays(today(), days) } : base.application,
        }
        commit((d) => ({ ...d, jobs: [...d.jobs, job] }))
        await persist(() => storage.saveJobs([job]))
        return { ok: true, job }
      },

      async updateJob(id, patch, companyName) {
        const companyId = companyName === undefined ? undefined : (ensureCompany(companyName)?.id ?? null)
        await patchJob(id, (j) => ({
          ...j,
          ...patch,
          ...(companyId === undefined ? {} : { companyId }),
          lastActionAt: today(),
        }))
      },

      async updateApplication(id, patch) {
        await patchJob(id, (j) => ({ ...j, application: { ...j.application, ...patch }, lastActionAt: today() }))
      },

      async setJobStatus(id, status) {
        const days = dataRef.current.settings.followUpDays
        await patchJob(id, (j) => {
          if (j.status === status) return j
          const app = { ...j.application }
          if (status === 'applied') {
            app.appliedAt = app.appliedAt ?? today()
            app.followUpDate = app.followUpDate ?? addDays(today(), days)
          }
          if (status === 'followup') app.followUpDate = app.followUpDate ?? today()
          return { ...j, status, application: app, lastActionAt: today() }
        })
      },

      async deleteJob(id) {
        commit((d) => ({ ...d, jobs: d.jobs.filter((j) => j.id !== id) }))
        await persist(() => storage.deleteJob(id))
      },

      async saveCompany(c) {
        const company = { ...c, updatedAt: nowIso() }
        commit((d) => ({ ...d, companies: upsert(d.companies, company) }))
        await persist(() => storage.saveCompanies([company]))
      },

      async updateCompany(id, patch) {
        await patchCompany(id, (c) => ({ ...c, ...patch }))
      },

      async setProspectStatus(id, status) {
        const days = dataRef.current.settings.followUpDays
        await patchCompany(id, (c) => {
          if (c.prospectStatus === status) return c
          const next = { ...c, prospectStatus: status }
          if (status === 'contacted') {
            next.contactedAt = c.contactedAt ?? today()
            next.followUpDate = c.followUpDate ?? addDays(today(), days)
          }
          if (status === 'followup') next.followUpDate = c.followUpDate ?? today()
          return next
        })
      },

      async addProspect(input) {
        const { companies } = dataRef.current
        const existing = (input.siren ? companies.find((c) => c.siren === input.siren) : undefined) ?? findCompanyByName(input.name, companies)
        const base = existing ?? emptyCompany(input.name.trim())
        const keep = (current: string, incoming: string) => (current.trim() ? current : incoming.trim())
        const company: Company = {
          ...base,
          siren: keep(base.siren, input.siren),
          sector: keep(base.sector, input.sector),
          location: keep(base.location, input.location),
          size: keep(base.size, input.size),
          contacts: mergeContacts(base.contacts, input.contacts),
          sources: unique([...base.sources, input.source]),
          prospectStatus: base.prospectStatus === 'none' ? 'to_contact' : base.prospectStatus,
          updatedAt: nowIso(),
        }
        commit((d) => ({ ...d, companies: upsert(d.companies, company) }))
        await persist(() => storage.saveCompanies([company]))
        return { company, created: !existing }
      },

      async deleteCompany(id) {
        const detached = dataRef.current.jobs.filter((j) => j.companyId === id).map((j) => ({ ...j, companyId: null }))
        commit((d) => ({
          ...d,
          companies: d.companies.filter((c) => c.id !== id),
          jobs: d.jobs.map((j) => (j.companyId === id ? { ...j, companyId: null } : j)),
        }))
        await persist(async () => {
          await storage.deleteCompany(id)
          if (detached.length) await storage.saveJobs(detached)
        })
      },

      async markCompanySearched(id) {
        await patchCompany(id, (c) => ({ ...c, lastSearchAt: today() }))
      },

      async importResults(items, targetJobId) {
        const result = applyImportPlan(items, { companies: dataRef.current.companies, jobs: dataRef.current.jobs, targetJobId })
        if (!result.companies.length && !result.jobs.length) return null
        commit((d) => ({
          ...d,
          companies: result.companies.reduce(upsert, d.companies),
          jobs: result.jobs.reduce(upsert, d.jobs),
        }))
        await persist(async () => {
          await storage.saveCompanies(result.companies)
          await storage.saveJobs(result.jobs)
        })
        return result
      },

      async saveFile(id, file) {
        const stored: StoredFile = { id, name: file.name, mimeType: file.type || 'application/octet-stream', size: file.size, blob: file, addedAt: nowIso() }
        commit((d) => ({ ...d, files: upsert(d.files, stored) }))
        await persist(() => storage.saveFile(stored))
      },

      async deleteFile(id) {
        commit((d) => ({ ...d, files: d.files.filter((f) => f.id !== id) }))
        await persist(() => storage.deleteFile(id))
      },

      async clearFiles() {
        commit((d) => ({ ...d, files: [] }))
        await persist(() => storage.clearFiles())
      },

      async loadDemo() {
        const demo = buildDemoData()
        const jobs = demo.jobs.filter((j) => !dataRef.current.jobs.some((e) => e.url === j.url))
        const companies = demo.companies.filter((c) => !findCompanyByName(c.name, dataRef.current.companies))
        const usedIds = new Set(jobs.map((j) => j.companyId))
        const neededCompanies = companies.filter((c) => usedIds.has(c.id))
        const criteria = dataRef.current.criteria.length ? [] : demo.criteria
        commit((d) => ({
          ...d,
          companies: [...d.companies, ...neededCompanies],
          jobs: [...d.jobs, ...jobs],
          criteria: [...d.criteria, ...criteria],
        }))
        await persist(async () => {
          await storage.saveCompanies(neededCompanies)
          await storage.saveJobs(jobs)
          for (const c of criteria) await storage.saveCriteria(c)
        })
        if (criteria[0] && !dataRef.current.settings.activeCriteriaId) await store.saveSettings({ activeCriteriaId: criteria[0].id })
      },

      async replaceAll(next) {
        dataRef.current = next
        setData(next)
        await persist(() => storage.replaceAll(next))
      },

      async clearAll() {
        const empty = emptyData()
        dataRef.current = empty
        setData(empty)
        await persist(() => storage.clearAll())
      },
    }
    // Les actions lisent toujours l'état courant via dataRef : le store est créé une seule fois.
  }, [notify])

  const value = useMemo(() => ({ ...store, ready, loadError, data }), [store, ready, loadError, data])
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): Store {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore doit être utilisé dans <StoreProvider>')
  return ctx
}
