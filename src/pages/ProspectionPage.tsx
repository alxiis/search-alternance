import { Building2, Check, ExternalLink, Loader2, MapPin, Plus, Search, ShieldCheck, TriangleAlert, Users } from 'lucide-react'
import { useMemo, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState } from '../components/EmptyState'
import { TONE_BADGE } from '../data/tones'
import { normalizeNaf, SECTOR_PRESETS, SIZE_PRESETS } from '../data/sectors'
import { useStore } from '../hooks/useStore'
import { useToast } from '../hooks/useToast'
import {
  directoryPageUrl, distanceKm, searchCommunes, searchDirectory,
  type Commune, type DirectoryCompany, type DirectoryPage, type DirectoryQuery,
} from '../services/companyDirectory'
import { findCompanyByName } from '../utils/dedupe'
import { cn } from '../utils/text'

const CUSTOM = 'custom'
const SOURCE = 'Registre national des entreprises (recherche-entreprises.api.gouv.fr)'

function Badge({ tone, children }: { tone: keyof typeof TONE_BADGE; children: string }) {
  return <span className={cn('whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium', TONE_BADGE[tone])}>{children}</span>
}

/** Prospection : trouver dans le registre officiel les entreprises d'un secteur et d'une zone, pour des candidatures spontanées. */
export function ProspectionPage() {
  const { data, addProspect } = useStore()
  const { notify } = useToast()
  const activeCriteria = data.criteria.find((c) => c.id === data.settings.activeCriteriaId) ?? data.criteria[0]

  const [sectorId, setSectorId] = useState(SECTOR_PRESETS[0]?.id ?? CUSTOM)
  const [customNaf, setCustomNaf] = useState('')
  const [text, setText] = useState('')
  const [city, setCity] = useState(activeCriteria?.city || data.profile.city)
  const [zoneKind, setZoneKind] = useState<'department' | 'commune'>('department')
  const [sizeIds, setSizeIds] = useState<string[]>(['small', 'medium'])
  const [hideTraining, setHideTraining] = useState(true)

  const [communes, setCommunes] = useState<Commune[]>([])
  const [communeCode, setCommuneCode] = useState('')
  const resolvedCity = useRef('')
  const [query, setQuery] = useState<DirectoryQuery | null>(null)
  const [result, setResult] = useState<DirectoryPage | null>(null)
  const [found, setFound] = useState<DirectoryCompany[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [adding, setAdding] = useState<string | null>(null)

  const sector = SECTOR_PRESETS.find((s) => s.id === sectorId)
  const commune = communes.find((c) => c.code === communeCode)
  const customCodes = customNaf.split(/[,;\s]+/).filter(Boolean)
  const invalidCodes = customCodes.filter((c) => !normalizeNaf(c))

  const tracked = useMemo(() => {
    const bySiren = new Map(data.companies.filter((c) => c.siren).map((c) => [c.siren, c]))
    return (c: DirectoryCompany) => bySiren.get(c.siren) ?? findCompanyByName(c.name, data.companies)
  }, [data.companies])

  const run = async (next: DirectoryQuery, append: boolean) => {
    setLoading(true)
    setError(null)
    try {
      const page = await searchDirectory(next)
      setQuery(next)
      setResult(page)
      setFound((prev) => (append ? [...prev, ...page.companies.filter((c) => !prev.some((p) => p.siren === c.siren))] : page.companies))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Recherche impossible.')
    } finally {
      setLoading(false)
    }
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const naf = sectorId === CUSTOM ? customCodes.map(normalizeNaf).filter(Boolean) : (sector?.naf ?? [])
    if (!naf.length && !text.trim()) return setError('Choisissez un secteur, saisissez un code NAF ou un mot-clé.')
    if (invalidCodes.length) return setError(`Code NAF invalide : ${invalidCodes.join(', ')}. Le format attendu est « 62.01Z ».`)
    if (!city.trim()) return setError('Indiquez une ville : la recherche se fait dans cette commune ou dans son département.')

    setLoading(true)
    setError(null)
    try {
      // La ville n'est résolue à nouveau que si elle a changé : sinon on garde la commune choisie dans la liste.
      let place = commune
      if (resolvedCity.current !== city.trim().toLowerCase() || !place) {
        const matches = await searchCommunes(city)
        setCommunes(matches)
        place = matches[0]
        setCommuneCode(place?.code ?? '')
        resolvedCity.current = city.trim().toLowerCase()
      }
      if (!place) {
        setLoading(false)
        return setError(`Aucune commune trouvée pour « ${city.trim()} ». Vérifiez l'orthographe.`)
      }
      const sizeCodes = SIZE_PRESETS.filter((s) => sizeIds.includes(s.id)).flatMap((s) => s.codes)
      await run(
        {
          naf,
          text,
          zone: zoneKind === 'commune' ? { kind: 'commune', code: place.code } : { kind: 'department', code: place.department },
          sizeCodes: sizeIds.length === SIZE_PRESETS.length ? [] : sizeCodes,
          page: 1,
        },
        false,
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Recherche impossible.')
      setLoading(false)
    }
  }

  const add = async (c: DirectoryCompany) => {
    setAdding(c.siren)
    try {
      const { company, created } = await addProspect({
        name: c.name,
        siren: c.siren,
        sector: sector && sectorId !== CUSTOM ? sector.label : '',
        location: c.city,
        size: c.size,
        contacts: c.leaders.map((l) => ({ name: l.name, role: l.role, source: 'Registre national des entreprises' })),
        source: SOURCE,
      })
      notify(created ? `${company.name} ajoutée à votre prospection.` : `${company.name} était déjà suivie : sa fiche a été complétée.`)
    } catch {
      /* déjà signalé par le store */
    } finally {
      setAdding(null)
    }
  }

  const visible = hideTraining ? found.filter((c) => !c.isTrainingOrganization) : found
  const hiddenCount = found.length - visible.length
  const center = commune && commune.lat !== null && commune.lon !== null ? { lat: commune.lat, lon: commune.lon } : null

  return (
    <div className="space-y-6">
      <form className="card space-y-4 p-5" onSubmit={(e) => void submit(e)}>
        <div>
          <h2 className="font-semibold text-foreground">Trouver des entreprises à qui écrire</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Une partie des alternances se décrochent sans offre publiée. Cherchez ici, dans le registre officiel, les entreprises de votre secteur près de chez vous, puis suivez vos candidatures spontanées depuis la page Entreprises.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="prospect-sector" className="label">Secteur d'activité</label>
            <select id="prospect-sector" className="input" value={sectorId} onChange={(e) => setSectorId(e.target.value)}>
              {SECTOR_PRESETS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              <option value={CUSTOM}>Autre : saisir des codes NAF</option>
            </select>
            {sectorId !== CUSTOM && sector && <p className="hint">Codes NAF : {sector.naf.join(', ')}</p>}
          </div>
          {sectorId === CUSTOM ? (
            <div>
              <label htmlFor="prospect-naf" className="label">Codes NAF</label>
              <input id="prospect-naf" className="input" value={customNaf} onChange={(e) => setCustomNaf(e.target.value)} placeholder="Ex. : 62.01Z, 58.29C" aria-invalid={invalidCodes.length ? true : undefined} />
              <p className="hint">Le code NAF figure sur la fiche officielle de toute entreprise du secteur visé (annuaire-entreprises.data.gouv.fr).</p>
            </div>
          ) : (
            <div>
              <label htmlFor="prospect-text" className="label">Nom ou mot-clé (facultatif)</label>
              <input id="prospect-text" className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Ex. : le nom d'une entreprise" />
            </div>
          )}
          <div>
            <label htmlFor="prospect-city" className="label">Ville</label>
            <input id="prospect-city" className="input" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ex. : Toulouse" />
            {communes.length > 1 && (
              <select className="input mt-2" value={communeCode} onChange={(e) => setCommuneCode(e.target.value)} aria-label="Commune retenue">
                {communes.map((c) => <option key={c.code} value={c.code}>{c.name} ({c.department})</option>)}
              </select>
            )}
          </div>
          <div>
            <label htmlFor="prospect-zone" className="label">Zone</label>
            <select id="prospect-zone" className="input" value={zoneKind} onChange={(e) => setZoneKind(e.target.value as 'department' | 'commune')}>
              <option value="department">Tout le département</option>
              <option value="commune">Cette commune uniquement</option>
            </select>
          </div>
        </div>

        <fieldset>
          <legend className="label">Taille de l'entreprise</legend>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {SIZE_PRESETS.map((s) => (
              <label key={s.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-input accent-[var(--primary)]"
                  checked={sizeIds.includes(s.id)}
                  onChange={() => setSizeIds((cur) => (cur.includes(s.id) ? cur.filter((x) => x !== s.id) : [...cur, s.id]))}
                />
                {s.label}
              </label>
            ))}
          </div>
          <p className="hint">La taille est celle de l'entreprise entière, pas de l'établissement local. Les structures de taille moyenne reçoivent souvent moins de candidatures que les grands groupes.</p>
        </fieldset>

        <div className="flex flex-wrap items-center gap-4">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Search className="h-4 w-4" aria-hidden />} Chercher
          </button>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input type="checkbox" className="h-4 w-4 rounded border-input accent-[var(--primary)]" checked={hideTraining} onChange={(e) => setHideTraining(e.target.checked)} />
            Masquer les écoles et organismes de formation
          </label>
        </div>

        <p className="flex items-start gap-2 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
          Cette recherche interroge deux services publics de l'État (API Géo et API Recherche d'entreprises). Seuls la ville, le secteur et la taille choisis leur sont envoyés : ni votre profil, ni vos offres, ni votre suivi.
        </p>
      </form>

      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger-soft p-3 text-sm text-danger-soft-foreground">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>{error}</p>
        </div>
      )}

      {result && (
        <section className="space-y-3">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {result.total.toLocaleString('fr-FR')} entreprise{result.total > 1 ? 's' : ''} dans le registre, {visible.length} affichée{visible.length > 1 ? 's' : ''}
            {hiddenCount > 0 ? ` (${hiddenCount} organisme${hiddenCount > 1 ? 's' : ''} de formation masqué${hiddenCount > 1 ? 's' : ''})` : ''}.
          </p>

          {visible.length === 0 ? (
            <div className="card">
              <EmptyState icon={Building2} title="Aucune entreprise" description="Élargissez la zone au département, cochez d'autres tailles ou essayez un secteur voisin." />
            </div>
          ) : (
            <ul className="grid gap-3 lg:grid-cols-2">
              {visible.map((c) => {
                const existing = tracked(c)
                const km = center && c.lat !== null && c.lon !== null ? distanceKm(center, { lat: c.lat, lon: c.lon }) : null
                return (
                  <li key={c.siren} className="card flex flex-col p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-foreground">{c.name}</h3>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" aria-hidden />{c.city || 'Lieu inconnu'}{km !== null ? ` · ${km < 1 ? 'moins de 1' : Math.round(km)} km` : ''}</span>
                          {c.size && <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" aria-hidden />{c.size}</span>}
                          {c.naf && <span>NAF {c.naf}</span>}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        {existing && <Badge tone="indigo">Déjà suivie</Badge>}
                        {c.isTrainingOrganization && <Badge tone="amber">Organisme de formation</Badge>}
                      </div>
                    </div>
                    {c.isBranch && c.headOfficeCity && c.headOfficeCity !== c.city && (
                      <p className="mt-2 text-xs text-muted-foreground">Établissement local d'une entreprise dont le siège est à {c.headOfficeCity}.</p>
                    )}
                    {c.leaders.length > 0 && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">Dirigeants : </span>
                        {c.leaders.map((l) => `${l.name}${l.role ? ` (${l.role})` : ''}`).join(' ; ')}
                      </p>
                    )}
                    <div className="mt-auto flex flex-wrap items-center gap-2 pt-3">
                      {existing && existing.prospectStatus !== 'none' ? (
                        <Link to={`/entreprises/${existing.id}`} className="btn-secondary btn-sm"><Check className="h-3.5 w-3.5" aria-hidden /> Voir la fiche</Link>
                      ) : (
                        <button className="btn-primary btn-sm" disabled={adding === c.siren} onClick={() => void add(c)}>
                          <Plus className="h-3.5 w-3.5" aria-hidden /> Ajouter à ma prospection
                        </button>
                      )}
                      <a className="btn-ghost btn-sm" href={directoryPageUrl(c.siren)} target="_blank" rel="noopener noreferrer" title="Fiche officielle : adresse, dirigeants, établissements">
                        Fiche officielle <ExternalLink className="h-3 w-3" aria-hidden />
                      </a>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}

          {query && result.page < result.totalPages && (
            <div className="flex justify-center">
              <button className="btn-secondary" disabled={loading} onClick={() => void run({ ...query, page: result.page + 1 }, true)}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Afficher les suivantes
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
