import { normalizeContractType } from '../utils/text'
import { isHttpUrl } from '../utils/url'
import { parseClaudeText, type ParsedPayload } from './claudeParser'

/**
 * Bouton de capture : un favori (« bookmarklet ») que l'utilisateur clique sur une page d'offre.
 * Il lit ce que la page publie déjà pour les moteurs de recherche (bloc JSON-LD « JobPosting »),
 * puis ouvre l'application avec ces données dans le fragment de l'adresse (#…), qui n'est envoyé à aucun serveur.
 * L'application ne lit donc jamais une page elle-même : c'est l'utilisateur qui lui apporte ce qu'il a sous les yeux.
 */
const BOOKMARKLET_SOURCE = `(function(app){
var d=document,jp=null;
function pick(o){if(!o||typeof o!=='object')return;if(Array.isArray(o)){o.forEach(pick);return}var t=o['@type'];if(t==='JobPosting'||(Array.isArray(t)&&t.indexOf('JobPosting')>-1)){jp=jp||o;return}if(o['@graph'])pick(o['@graph'])}
d.querySelectorAll('script[type="application/ld+json"]').forEach(function(s){try{pick(JSON.parse(s.textContent))}catch(e){}});
function m(n){var e=d.querySelector('meta[property="'+n+'"],meta[name="'+n+'"]');return e?(e.getAttribute('content')||''):''}
function cut(v,n){return v==null?'':String(v).slice(0,n)}
var job=null;
if(jp){job={title:jp.title,description:cut(jp.description,9000),datePosted:jp.datePosted,validThrough:jp.validThrough,employmentType:jp.employmentType,hiringOrganization:jp.hiringOrganization,jobLocation:jp.jobLocation,baseSalary:jp.baseSalary,educationRequirements:jp.educationRequirements,skills:jp.skills}}
var data={v:1,url:location.href,pageTitle:cut(d.title,300),site:m('og:site_name')||location.hostname,ogTitle:cut(m('og:title'),300),ogDescription:cut(m('og:description'),1000),selection:cut(window.getSelection?window.getSelection():'',9000),job:job};
var w=window.open(app+'#/capture?d='+encodeURIComponent(JSON.stringify(data)),'_blank');
if(!w)alert('Suivi Alternance : autorisez les fenêtres surgissantes pour ce site, puis cliquez à nouveau.');
})`

/** Adresse `javascript:` du favori, liée à l'adresse de l'application (là où vivent les données). */
export function bookmarkletCode(appUrl: string): string {
  const code = `${BOOKMARKLET_SOURCE.replace(/\n/g, '')}(${JSON.stringify(appUrl)});void 0`
  return `javascript:${encodeURIComponent(code)}`
}

type Obj = Record<string, unknown>
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v)
const text = (v: unknown): string => (typeof v === 'string' ? v.trim() : typeof v === 'number' ? String(v) : '')
const first = (v: unknown): unknown => (Array.isArray(v) ? v[0] : v)

/** Les descriptions JSON-LD sont du HTML, parfois échappé deux fois : on n'en garde que le texte, avec ses retours à la ligne. */
export function htmlToText(html: string): string {
  let out = html
  for (let pass = 0; pass < 2 && /<[a-z/!]|&[a-z#]/i.test(out); pass++) {
    const withBreaks = out
      .replace(/<(script|style)\b[\s\S]*?<\/\1\s*>/gi, '')
      .replace(/<\s*br\s*\/?>/gi, '\n')
      .replace(/<\s*li[^>]*>/gi, '\n• ')
      .replace(/<\/\s*(p|div|li|ul|ol|tr|h[1-6])\s*>/gi, '\n')
    // DOMParser n'exécute aucun script : on ne lit que le texte du document produit.
    out = new DOMParser().parseFromString(withBreaks, 'text/html').body.textContent ?? ''
  }
  return out
    .replace(/[ \t ]+/g, ' ')
    .replace(/ ?\n ?/g, '\n')
    .replace(/\n{2,}(?=• )/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function locationText(raw: unknown): string {
  const loc = first(raw)
  if (typeof loc === 'string') return loc.trim()
  if (!isObj(loc)) return ''
  const address = loc.address
  if (typeof address === 'string') return address.trim()
  if (!isObj(address)) return text(loc.name)
  const city = text(address.addressLocality)
  const postal = text(address.postalCode)
  const dept = /^\d{5}$/.test(postal) ? postal.slice(0, 2) : ''
  return city ? `${city}${dept ? ` (${dept})` : ''}` : text(address.addressRegion) || text(address.addressCountry)
}

const SALARY_UNITS: Record<string, string> = { HOUR: 'heure', DAY: 'jour', WEEK: 'semaine', MONTH: 'mois', YEAR: 'an' }

function salaryText(raw: unknown): string {
  if (typeof raw === 'string' || typeof raw === 'number') return text(raw)
  if (!isObj(raw)) return ''
  const value = raw.value
  const currency = text(raw.currency) === 'EUR' || !text(raw.currency) ? '€' : text(raw.currency)
  if (!isObj(value)) return text(value) ? `${text(value)} ${currency}` : ''
  const min = text(value.minValue)
  const max = text(value.maxValue)
  const amount = min && max && min !== max ? `${min} à ${max}` : min || max || text(value.value)
  if (!amount) return ''
  const unit = SALARY_UNITS[text(value.unitText).toUpperCase()]
  return `${amount} ${currency}${unit ? ` par ${unit}` : ''}`
}

const EMPLOYMENT_TYPES: Record<string, string> = { INTERN: 'Stage', TEMPORARY: 'CDD' }

/** schema.org n'a pas de valeur « alternance » : on la reconnaît d'abord dans l'intitulé et le début de l'annonce. */
function contractType(title: string, description: string, employmentType: unknown): string {
  const hint = /alternan|apprenti|professionnalisation/i.exec(`${title} ${description.slice(0, 600)}`)
  if (hint) return normalizeContractType(hint[0])
  const types = (Array.isArray(employmentType) ? employmentType : [employmentType]).map((t) => text(t).toUpperCase())
  return types.map((t) => EMPLOYMENT_TYPES[t]).find(Boolean) ?? ''
}

function skillList(raw: unknown): string[] {
  const items = Array.isArray(raw) ? raw.map((s) => (isObj(s) ? text(s.name) : text(s))) : text(raw).split(/[,;\n]/)
  return items.map((s) => s.trim()).filter((s) => s && s.length <= 60).slice(0, 20)
}

/** Niveaux de diplôme normalisés par schema.org (en anglais), ramenés aux niveaux français : c'est le minimum demandé. */
const EDUCATION_LEVELS: Record<string, string> = {
  'high school': 'Bac',
  'associate degree': 'Bac+2',
  'bachelor degree': 'Bac+3',
  'postgraduate degree': 'Bac+5',
  'professional certificate': '',
  'no requirements': '',
}

function educationText(raw: unknown): string {
  const value = first(raw)
  const label = isObj(value) ? text(value.credentialCategory) || text(value.name) : text(value)
  const known = EDUCATION_LEVELS[label.toLowerCase()]
  if (known !== undefined) return known
  return label.length <= 80 ? label : ''
}

export type CaptureResult =
  | { ok: true; payload: ParsedPayload; /** Vrai si la page fournissait des données structurées d'offre. */ structured: boolean; hasDescription: boolean }
  | { ok: false; error: string }

/** Convertit les données envoyées par le favori en une offre, en passant par le même contrôle que les imports Claude. */
export function parseCapture(encoded: string): CaptureResult {
  let data: unknown
  try {
    data = JSON.parse(encoded)
  } catch {
    return { ok: false, error: "Les données reçues sont illisibles. Retournez sur la page de l'offre et cliquez à nouveau sur le bouton de capture." }
  }
  if (!isObj(data) || data.v !== 1) return { ok: false, error: "Ce lien ne vient pas du bouton de capture de l'application." }
  const url = text(data.url)
  if (!isHttpUrl(url)) return { ok: false, error: "L'adresse de la page capturée n'est pas valide." }

  const job = isObj(data.job) ? data.job : null
  const organization = first(job?.hiringOrganization)
  const title = text(job?.title) || text(data.ogTitle) || text(data.pageTitle)
  const description = htmlToText(text(job?.description)) || text(data.selection) || text(data.ogDescription)

  const result = parseClaudeText(
    JSON.stringify({
      jobs: [
        {
          companyName: isObj(organization) ? text(organization.name) : text(organization),
          title,
          url,
          location: locationText(job?.jobLocation),
          contractType: contractType(title, description, job?.employmentType),
          description,
          skills: skillList(job?.skills),
          salary: salaryText(job?.baseSalary),
          publishedAt: text(job?.datePosted) || null,
          expiresAt: text(job?.validThrough) || null,
          studyLevel: educationText(job?.educationRequirements),
          source: text(data.site),
        },
      ],
    }),
  )
  if (!result.ok) return { ok: false, error: result.error }
  return { ok: true, payload: result.payload, structured: job !== null, hasDescription: description !== '' }
}
