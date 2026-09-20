import { Database, Download, FileSpreadsheet, FlaskConical, HardDrive, Monitor, Moon, Palette, ShieldCheck, Sun, Trash2, Upload, type LucideIcon } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { NumberField } from '../components/fields'
import { useStore } from '../hooks/useStore'
import { useTheme, type ThemePreference } from '../hooks/useTheme'
import { useToast } from '../hooks/useToast'
import { copyText } from '../lib/clipboard'
import { ANALYSIS_SCHEMA, coverLetterSchema, SEARCH_SCHEMA } from '../prompts/schemas'
import { applicationsToCsv, backupFilename, buildBackup, csvFilename, parseBackup } from '../services/backup'
import { downloadBlob } from '../utils/csv'
import { cn, formatBytes } from '../utils/text'

type Confirm = 'all' | 'files' | 'restore' | null

const THEME_OPTIONS: Array<{ value: ThemePreference; label: string; icon: LucideIcon }> = [
  { value: 'light', label: 'Jour', icon: Sun },
  { value: 'dark', label: 'Nuit', icon: Moon },
  { value: 'system', label: 'Système', icon: Monitor },
]

function ThemeChoice() {
  const { preference, setPreference } = useTheme()
  return (
    <div role="radiogroup" aria-label="Thème de l'interface" className="inline-flex rounded-lg border border-input bg-muted p-1">
      {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={preference === value}
          onClick={() => setPreference(value)}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            preference === value ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Icon className="h-4 w-4" aria-hidden /> {label}
        </button>
      ))}
    </div>
  )
}

function Card({ icon: Icon, title, children }: { icon: typeof Database; title: string; children: ReactNode }) {
  return (
    <section className="card p-5">
      <h2 className="mb-3 flex items-center gap-2 font-semibold text-foreground"><Icon className="h-4 w-4 text-muted-foreground" aria-hidden />{title}</h2>
      {children}
    </section>
  )
}

function Schema({ title, code }: { title: string; code: string }) {
  const { notify } = useToast()
  return (
    <details className="rounded-lg border border-border">
      <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-foreground">{title}</summary>
      <div className="border-t border-border p-3">
        <button className="btn-secondary btn-sm mb-2" onClick={() => void copyText(code).then((ok) => notify(ok ? 'Schéma copié.' : 'Copie impossible.', ok ? 'success' : 'error'))}>Copier</button>
        <pre className="overflow-x-auto rounded-lg border border-border bg-muted p-3 text-xs leading-relaxed text-foreground">{code}</pre>
      </div>
    </details>
  )
}

export function DataPage() {
  const { data, replaceAll, clearAll, clearFiles, loadDemo, saveSettings } = useStore()
  const { notify } = useToast()
  const [confirm, setConfirm] = useState<Confirm>(null)
  const [pending, setPending] = useState<ReturnType<typeof parseBackup> | null>(null)
  const [usage, setUsage] = useState<{ used: number; quota: number } | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  const filesSize = data.files.reduce((sum, f) => sum + f.size, 0)
  const jsonSize = new Blob([JSON.stringify({ ...data, files: [] })]).size

  useEffect(() => {
    navigator.storage?.estimate?.().then((e) => setUsage({ used: e.usage ?? 0, quota: e.quota ?? 0 })).catch(() => setUsage(null))
  }, [data])

  const exportJson = async (includeFiles: boolean) => {
    try {
      const backup = await buildBackup(data, includeFiles)
      downloadBlob(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }), backupFilename())
      notify('Sauvegarde exportée.')
    } catch (e) {
      notify(`Export impossible : ${e instanceof Error ? e.message : 'erreur'}`, 'error')
    }
  }

  const onBackupFile = async (file: File | undefined) => {
    if (!file) return
    try {
      setPending(parseBackup(await file.text()))
      setConfirm('restore')
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Fichier illisible', 'error')
    }
  }

  const run = async (action: () => Promise<void>, message: string) => {
    try {
      await action()
      notify(message)
    } catch {
      /* déjà signalé */
    } finally {
      setConfirm(null)
      setPending(null)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Card icon={ShieldCheck} title="Confidentialité">
        <p className="text-sm text-muted-foreground">
          Toutes vos données (profil, offres, CV) sont stockées dans <strong>ce navigateur</strong> (IndexedDB). Aucun serveur, aucune API, aucune clé : rien n'est envoyé ailleurs tant que vous ne collez pas vous-même un prompt dans Claude.
          Vider les données du site dans votre navigateur efface tout : faites des sauvegardes régulières.
        </p>
      </Card>

      <Card icon={HardDrive} title="Espace utilisé">
        <dl className="grid gap-3 text-sm sm:grid-cols-3">
          <div><dt className="text-muted-foreground">Données (offres, profil…)</dt><dd className="font-semibold text-foreground">{formatBytes(jsonSize)}</dd></div>
          <div><dt className="text-muted-foreground">Fichiers ({data.files.length})</dt><dd className="font-semibold text-foreground">{formatBytes(filesSize)}</dd></div>
          <div><dt className="text-muted-foreground">Total navigateur (estimation)</dt><dd className="font-semibold text-foreground">{usage ? `${formatBytes(usage.used)} / ${formatBytes(usage.quota)}` : 'Indisponible'}</dd></div>
        </dl>
      </Card>

      <Card icon={Download} title="Sauvegarde et export">
        <div className="flex flex-wrap gap-2">
          <button className="btn-primary" onClick={() => void exportJson(true)}><Download className="h-4 w-4" aria-hidden /> Exporter tout (JSON, avec fichiers)</button>
          <button className="btn-secondary" onClick={() => void exportJson(false)}>Exporter sans les fichiers</button>
          <button className="btn-secondary" onClick={() => { downloadBlob(new Blob([applicationsToCsv(data)], { type: 'text/csv;charset=utf-8' }), csvFilename()); notify('CSV exporté.') }}>
            <FileSpreadsheet className="h-4 w-4" aria-hidden /> Candidatures (CSV)
          </button>
          <input ref={fileInput} type="file" accept=".json,application/json" className="hidden" onChange={(e) => { void onBackupFile(e.target.files?.[0]); e.target.value = '' }} />
          <button className="btn-secondary" onClick={() => fileInput.current?.click()}><Upload className="h-4 w-4" aria-hidden /> Importer une sauvegarde</button>
        </div>
        <p className="hint">L'import d'une sauvegarde remplace toutes les données actuelles.</p>
      </Card>

      <Card icon={Palette} title="Apparence">
        <ThemeChoice />
        <p className="hint">« Système » suit automatiquement le réglage clair ou sombre de votre appareil. Le bouton soleil / lune de l'en-tête bascule à tout moment.</p>
      </Card>

      <Card icon={Database} title="Paramètres">
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField label="Délai de relance par défaut (jours)" min={1} value={data.settings.followUpDays} onChange={(v) => void saveSettings({ followUpDays: v || 7 })} hint="Appliqué quand une offre passe en « Postulé »." />
        </div>
      </Card>

      <Card icon={FlaskConical} title="Données de démonstration">
        <p className="mb-3 text-sm text-muted-foreground">Ajoute 5 entreprises et 10 offres fictives (statuts, scores et relances variés) pour tester l'application. Elles s'ajoutent à vos données ; supprimez-les depuis les tableaux.</p>
        <button className="btn-secondary" onClick={() => void run(loadDemo, 'Données de démonstration chargées.')}>Charger les données de démonstration</button>
      </Card>

      <Card icon={Trash2} title="Zone de danger">
        <div className="flex flex-wrap gap-2">
          <button className="btn-secondary text-danger" onClick={() => setConfirm('files')} disabled={!data.files.length}>Supprimer uniquement les fichiers</button>
          <button className="btn-danger" onClick={() => setConfirm('all')}>Supprimer toutes les données</button>
        </div>
      </Card>

      <Card icon={Database} title="Format JSON attendu de Claude">
        <p className="mb-3 text-sm text-muted-foreground">Les prompts demandent déjà ce format à Claude. Les clés absentes sont tolérées ; les dates sont au format YYYY-MM-DD ; le score va de 0 à 100. La détection des doublons se fait par URL exacte, URL nettoyée (sans paramètres de suivi), puis entreprise + intitulé + lieu.</p>
        <div className="space-y-2">
          <Schema title="Recherche d'entreprises / d'offres" code={SEARCH_SCHEMA} />
          <Schema title="Analyse d'une offre" code={ANALYSIS_SCHEMA} />
          <Schema title="Lettre de motivation" code={coverLetterSchema(['full', 'short', 'emailSubject', 'email', 'linkedin'])} />
        </div>
      </Card>

      {confirm === 'all' && <ConfirmDialog title="Supprimer toutes les données ?" message="Profil, critères, entreprises, offres et fichiers seront définitivement effacés de ce navigateur. Exportez une sauvegarde avant si besoin." confirmLabel="Tout supprimer" onCancel={() => setConfirm(null)} onConfirm={() => void run(clearAll, 'Toutes les données ont été supprimées.')} />}
      {confirm === 'files' && <ConfirmDialog title="Supprimer les fichiers ?" message="Le CV et la lettre importés seront effacés. Le reste des données est conservé." confirmLabel="Supprimer les fichiers" onCancel={() => setConfirm(null)} onConfirm={() => void run(clearFiles, 'Fichiers supprimés.')} />}
      {confirm === 'restore' && pending && (
        <ConfirmDialog
          title="Remplacer les données par cette sauvegarde ?"
          message={`La sauvegarde contient ${pending.jobs.length} offre(s), ${pending.companies.length} entreprise(s) et ${pending.files.length} fichier(s). Vos données actuelles seront remplacées.`}
          confirmLabel="Restaurer"
          danger={false}
          onCancel={() => { setConfirm(null); setPending(null) }}
          onConfirm={() => void run(() => replaceAll(pending), 'Sauvegarde restaurée.')}
        />
      )}
    </div>
  )
}
