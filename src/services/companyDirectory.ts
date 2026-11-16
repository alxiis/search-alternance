import { SIZE_LABELS } from '../data/sectors'

/**
 * Accès aux deux API publiques de l'État utilisées par la prospection. Ce sont les seuls appels réseau de l'application :
 * ils partent uniquement quand l'utilisateur lance une recherche, et n'envoient que ses critères (ville, secteur, taille).
 * - API Géo (geo.api.gouv.fr) : retrouver une commune, son code INSEE et son centre.
 * - API Recherche d'entreprises (recherche-entreprises.api.gouv.fr) : registre officiel, sans clé d'accès.
 */
const GEO_URL = 'https://geo.api.gouv.fr/communes'
const COMPANIES_URL = 'https://recherche-entreprises.api.gouv.fr/search'
export const DIRECTORY_PAGE_SIZE = 25

export interface Commune {
  code: string
  name: string
  department: string
  postalCodes: string[]
  /** Centre de la commune, pour estimer les distances. */
  lat: number | null
  lon: number | null
}

export interface DirectoryLeader {
  name: string
  role: string
}

export interface DirectoryCompany {
  siren: string
  name: string
  naf: string
  /** Code de tranche d'effectif INSEE, '' si inconnu. */
  sizeCode: string
  size: string
  /** Commune de l'établissement situé dans la zone cherchée (ou du siège). */
  city: string
  address: string
  /** Vrai si l'établissement trouvé dans la zone n'est pas le siège. */
  isBranch: boolean
  headOfficeCity: string
  lat: number | null
  lon: number | null
  leaders: DirectoryLeader[]
  isTrainingOrganization: boolean
}

export interface DirectoryQuery {
  naf: string[]
  /** Texte libre : nom d'entreprise ou mot-clé. */
  text: string
  zone: { kind: 'commune'; code: string } | { kind: 'department'; code: string }
  sizeCodes: string[]
  page: number
}

export interface DirectoryPage {
  companies: DirectoryCompany[]
  total: number
  page: number
  totalPages: number
}

type Obj = Record<string, unknown>
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v)
const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : typeof v === 'number' ? String(v) : '')
const num = (v: unknown): number | null => {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() ? Number(v) : NaN
  return Number.isFinite(n) ? n : null
}

async function getJson(url: string, signal?: AbortSignal): Promise<unknown> {
  let response: Response
  try {
    response = await fetch(url, { signal, headers: { Accept: 'application/json' } })
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') throw e
    throw new Error('Service injoignable. Vérifiez votre connexion, puis réessayez.')
  }
  if (response.status === 429) throw new Error('Trop de recherches en peu de temps : patientez quelques secondes, puis réessayez.')
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null)
    const detail = isObj(body) ? str(body.erreur) || str(body.message) : ''
    throw new Error(detail || `Le service a répondu par une erreur (${response.status}).`)
  }
  return response.json()
}

/** Communes dont le nom commence comme `name`, les plus peuplées d'abord. */
export async function searchCommunes(name: string, signal?: AbortSignal): Promise<Commune[]> {
  const q = name.trim()
  if (q.length < 2) return []
  const url = `${GEO_URL}?nom=${encodeURIComponent(q)}&fields=code,nom,centre,codeDepartement,codesPostaux&boost=population&limit=6`
  const data = await getJson(url, signal)
  if (!Array.isArray(data)) return []
  return data.filter(isObj).map((c) => {
    const coordinates = isObj(c.centre) && Array.isArray(c.centre.coordinates) ? c.centre.coordinates : []
    return {
      code: str(c.code),
      name: str(c.nom),
      department: str(c.codeDepartement),
      postalCodes: Array.isArray(c.codesPostaux) ? c.codesPostaux.map(str).filter(Boolean) : [],
      lon: num(coordinates[0]),
      lat: num(coordinates[1]),
    }
  }).filter((c) => c.code && c.name)
}

const titleCase = (s: string): string => s.toLowerCase().replace(/(^|[\s'’-])(\p{L})/gu, (_m, sep: string, letter: string) => sep + letter.toUpperCase())

/** Dirigeants personnes physiques, hors commissaires aux comptes : les interlocuteurs utiles d'une petite structure. */
function leadersOf(raw: unknown): DirectoryLeader[] {
  if (!Array.isArray(raw)) return []
  const leaders: DirectoryLeader[] = []
  for (const d of raw) {
    if (!isObj(d) || str(d.type_dirigeant) !== 'personne physique') continue
    const role = str(d.qualite)
    if (/commissaire/i.test(role)) continue
    // Le registre liste tous les prénoms d'état civil : on ne garde que le premier, celui d'usage.
    const firstName = str(d.prenoms).split(/[\s,]+/)[0] ?? ''
    const name = titleCase(`${firstName} ${str(d.nom)}`.trim())
    if (name && !leaders.some((l) => l.name === name)) leaders.push({ name, role })
  }
  return leaders.slice(0, 3)
}

function toCompany(raw: Obj): DirectoryCompany | null {
  const siren = str(raw.siren)
  const name = str(raw.nom_complet) || str(raw.nom_raison_sociale)
  if (!siren || !name) return null
  const seat = isObj(raw.siege) ? raw.siege : {}
  const matches = Array.isArray(raw.matching_etablissements) ? raw.matching_etablissements.filter(isObj) : []
  const place = matches[0] ?? seat
  const complements = isObj(raw.complements) ? raw.complements : {}
  const sizeCode = str(raw.tranche_effectif_salarie)
  return {
    siren,
    name: titleCase(name),
    naf: str(raw.activite_principale),
    sizeCode,
    size: SIZE_LABELS[sizeCode] ?? '',
    city: titleCase(str(place.libelle_commune)),
    address: str(place.adresse),
    isBranch: place !== seat && place.est_siege !== true,
    headOfficeCity: titleCase(str(seat.libelle_commune)),
    lat: num(place.latitude),
    lon: num(place.longitude),
    leaders: leadersOf(raw.dirigeants),
    isTrainingOrganization: complements.est_organisme_formation === true,
  }
}

export async function searchDirectory(query: DirectoryQuery, signal?: AbortSignal): Promise<DirectoryPage> {
  const params = new URLSearchParams({
    etat_administratif: 'A',
    per_page: String(DIRECTORY_PAGE_SIZE),
    page: String(query.page),
  })
  if (query.text.trim()) params.set('q', query.text.trim())
  if (query.naf.length) params.set('activite_principale', query.naf.join(','))
  if (query.sizeCodes.length) params.set('tranche_effectif_salarie', query.sizeCodes.join(','))
  params.set(query.zone.kind === 'commune' ? 'code_commune' : 'departement', query.zone.code)

  const data = await getJson(`${COMPANIES_URL}?${params.toString()}`, signal)
  if (!isObj(data)) throw new Error('Réponse inattendue du registre des entreprises.')
  const results = Array.isArray(data.results) ? data.results.filter(isObj) : []
  return {
    companies: results.map(toCompany).filter((c): c is DirectoryCompany => c !== null),
    total: num(data.total_results) ?? 0,
    page: num(data.page) ?? query.page,
    totalPages: num(data.total_pages) ?? 1,
  }
}

/** Distance à vol d'oiseau, en kilomètres (formule de haversine). */
export function distanceKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const rad = (deg: number) => (deg * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLon = rad(b.lon - a.lon)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2
  return 6371 * 2 * Math.asin(Math.sqrt(h))
}

export const directoryPageUrl = (siren: string): string => `https://annuaire-entreprises.data.gouv.fr/entreprise/${encodeURIComponent(siren)}`
