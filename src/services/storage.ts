import type { AppData, AppSettings, Company, JobOffer, Profile, SearchCriteria, StoredFile } from '../types'
import { db } from '../lib/db'
import { emptyApplication, emptyProfile, emptySettings } from '../lib/factories'

const PROFILE_ID = 'me'
const SETTINGS_ID = 'app'

type WithId<T> = T & { id: string }

/** Complète les enregistrements anciens avec les valeurs par défaut des nouveaux champs. */
function hydrateJob(j: JobOffer): JobOffer {
  return { ...j, application: { ...emptyApplication(), ...j.application, contact: { ...emptyApplication().contact, ...j.application?.contact } } }
}

export async function loadAll(): Promise<AppData> {
  const [profiles, criteria, companies, jobs, files, settings] = await Promise.all([
    db.getAll<WithId<Profile>>('profile'),
    db.getAll<SearchCriteria>('criteria'),
    db.getAll<Company>('companies'),
    db.getAll<JobOffer>('jobs'),
    db.getAll<StoredFile>('files'),
    db.getAll<WithId<AppSettings>>('settings'),
  ])
  const { id: _p, ...profile } = profiles[0] ?? { id: PROFILE_ID, ...emptyProfile() }
  const { id: _s, ...savedSettings } = settings[0] ?? { id: SETTINGS_ID, ...emptySettings() }
  return {
    profile: { ...emptyProfile(), ...profile },
    settings: { ...emptySettings(), ...savedSettings },
    criteria,
    companies,
    jobs: jobs.map(hydrateJob),
    files,
  }
}

export const storage = {
  saveProfile: (p: Profile) => db.put('profile', { ...p, id: PROFILE_ID }),
  saveSettings: (s: AppSettings) => db.put('settings', { ...s, id: SETTINGS_ID }),
  saveCriteria: (c: SearchCriteria) => db.put('criteria', c),
  deleteCriteria: (id: string) => db.remove('criteria', id),
  saveCompanies: (list: Company[]) => db.putMany('companies', list),
  deleteCompany: (id: string) => db.remove('companies', id),
  saveJobs: (list: JobOffer[]) => db.putMany('jobs', list),
  deleteJob: (id: string) => db.remove('jobs', id),
  saveFile: (f: StoredFile) => db.put('files', f),
  deleteFile: (id: string) => db.remove('files', id),
  clearFiles: () => db.clear(['files']),
  clearAll: () => db.clear(['profile', 'criteria', 'companies', 'jobs', 'files', 'settings']),
  async replaceAll(data: AppData): Promise<void> {
    await storage.clearAll()
    await Promise.all([
      storage.saveProfile(data.profile),
      storage.saveSettings(data.settings),
      db.putMany('criteria', data.criteria),
      db.putMany('companies', data.companies),
      db.putMany('jobs', data.jobs),
      db.putMany('files', data.files),
    ])
  },
}
