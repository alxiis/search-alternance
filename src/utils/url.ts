const TRACKING_PARAMS =
  /^(utm_.*|gclid|fbclid|msclkid|yclid|dclid|gbraid|wbraid|gad_source|mc_.*|_hs.*|hsa_.*|at_.*|xtor|ref|referrer|refid|trk|trackingid|source|src|origin|from|vjs|tk|sxsrp|sid)$/i

/** Normalise une URL fournie par un tiers : ajoute https:// à « www.exemple.fr », refuse tout ce qui n'est pas http(s). */
export function toSafeHttpUrl(value: string): string {
  const v = value.trim()
  if (!v) return ''
  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(v) ? v : /^[\w-]+(\.[\w-]+)+([/?#].*)?$/.test(v) ? `https://${v}` : v
  return isHttpUrl(candidate) ? candidate : ''
}

export function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value.trim())
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

/** URL sans paramètres de suivi, fragment, "www." ni slash final. */
export function cleanUrl(value: string): string {
  try {
    const u = new URL(value.trim())
    for (const key of [...u.searchParams.keys()]) {
      if (TRACKING_PARAMS.test(key)) u.searchParams.delete(key)
    }
    u.searchParams.sort()
    const host = u.hostname.replace(/^www\./, '').toLowerCase()
    const path = u.pathname.replace(/\/+$/, '')
    const query = u.searchParams.toString()
    return `${host}${path}${query ? `?${query}` : ''}`
  } catch {
    return value.trim().toLowerCase()
  }
}

export function hostOf(value: string): string {
  try {
    return new URL(value.trim()).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

export function ensureProtocol(value: string): string {
  const v = value.trim()
  if (!v) return v
  return /^https?:\/\//i.test(v) ? v : `https://${v}`
}

/** Recherche web pré-remplie pour retrouver une offre dont l'URL est inconnue. */
export function offerSearchUrl(job: { title: string; location: string }, companyName: string): string {
  const hasKeyword = /alternan|apprenti/i.test(job.title)
  const terms = [job.title, companyName, job.location, hasKeyword ? '' : 'alternance'].filter(Boolean).join(' ')
  return `https://www.google.com/search?q=${encodeURIComponent(terms)}`
}
