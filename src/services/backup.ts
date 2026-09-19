import { STATUS_META } from '../data/constants'
import type { AppData, BackupFile, StoredFile } from '../types'
import { emptyApplication, emptyProfile, emptySettings } from '../lib/factories'
import { toCsv } from '../utils/csv'
import { today } from '../utils/dates'

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '')
    reader.onerror = () => reject(reader.error ?? new Error('Lecture du fichier impossible'))
    reader.readAsDataURL(blob)
  })
}

function base64ToBlob(data: string, mimeType: string): Blob {
  const bin = atob(data)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new Blob([bytes], { type: mimeType })
}

export async function buildBackup(data: AppData, includeFiles: boolean): Promise<BackupFile> {
  const files = includeFiles
    ? await Promise.all(
        data.files.map(async ({ blob, ...meta }) => ({ ...meta, dataBase64: await blobToBase64(blob) })),
      )
    : []
  return {
    format: 'suivi-alternance-backup',
    version: 1,
    exportedAt: new Date().toISOString(),
    profile: data.profile,
    criteria: data.criteria,
    companies: data.companies,
    jobs: data.jobs,
    settings: data.settings,
    files,
  }
}

export function parseBackup(text: string): AppData {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch (e) {
    throw new Error(`Fichier JSON invalide : ${e instanceof Error ? e.message : 'erreur de lecture'}`)
  }
  const b = raw as Partial<BackupFile> | null
  if (!b || b.format !== 'suivi-alternance-backup') throw new Error("Ce fichier n'est pas une sauvegarde de cette application.")
  if (b.version !== 1) throw new Error(`Version de sauvegarde non prise en charge : ${String(b.version)}.`)
  if (!Array.isArray(b.jobs) || !Array.isArray(b.companies) || !Array.isArray(b.criteria)) {
    throw new Error('Sauvegarde incomplète : offres, entreprises ou critères manquants.')
  }
  const files: StoredFile[] = (b.files ?? []).map(({ dataBase64, ...meta }) => ({
    ...meta,
    blob: base64ToBlob(dataBase64, meta.mimeType),
  }))
  return {
    profile: { ...emptyProfile(), ...b.profile },
    settings: { ...emptySettings(), ...b.settings },
    criteria: b.criteria,
    companies: b.companies,
    jobs: b.jobs.map((j) => ({ ...j, application: { ...emptyApplication(), ...j.application } })),
    files,
  }
}

export function applicationsToCsv(data: AppData): string {
  const names = new Map(data.companies.map((c) => [c.id, c.name]))
  const header = [
    'Entreprise', 'Poste', 'Localisation', 'Type', 'URL', 'Statut', 'Score', 'Date de découverte', 'Date de publication',
    'Date de candidature', 'Prochaine relance', 'Date d’entretien', 'Dernier contact', 'Prochaine action',
    'Contact', 'Email', 'Téléphone', 'LinkedIn contact', 'Réponse', 'Notes',
  ]
  const rows = data.jobs.map((j) => [
    j.companyId ? (names.get(j.companyId) ?? '') : '',
    j.title, j.location, j.contractType, j.url, STATUS_META[j.status].label,
    j.compatibilityScore === null ? '' : String(j.compatibilityScore),
    j.discoveredAt, j.publishedAt ?? '', j.application.appliedAt ?? '', j.application.followUpDate ?? '',
    j.application.interviewDate ?? '', j.application.lastContactAt ?? '', j.application.nextAction,
    j.application.contact.name, j.application.contact.email, j.application.contact.phone, j.application.contact.linkedin,
    j.application.response, j.notes,
  ])
  return toCsv([header, ...rows])
}

export const backupFilename = (): string => `suivi-alternance-${today()}.json`
export const csvFilename = (): string => `candidatures-${today()}.csv`
