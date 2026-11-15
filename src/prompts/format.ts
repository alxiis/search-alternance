import { CLOSED_STATUSES, REMOTE_LABELS } from '../data/constants'
import type { Company, JobOffer, Profile, SearchCriteria } from '../types'
import { formatDate, today } from '../utils/dates'

function line(label: string, value: string | number | null | undefined): string {
  const v = typeof value === 'number' ? String(value) : (value ?? '').trim()
  return v ? `- ${label} : ${v}` : ''
}

function block(...lines: string[]): string {
  return lines.filter(Boolean).join('\n')
}

const list = (items: string[]): string => items.join(', ')

/** Date du jour en clair : Claude en a besoin pour juger de la fraîcheur d'une offre et dater ses vérifications. */
export function todayText(): string {
  return `${formatDate(today())} (${today()})`
}

function experienceText(years: number, months: number): string {
  const parts: string[] = []
  if (years) parts.push(`${years} an${years > 1 ? 's' : ''}`)
  if (months) parts.push(`${months} mois`)
  return parts.join(' et ')
}

/**
 * `includeLetter` : la lettre de base ne sert qu'aux prompts qui rédigent (analyse, lettre).
 * L'inclure dans une recherche allonge le prompt sans rien apporter.
 */
export function profileToText(p: Profile, { includeLetter = false }: { includeLetter?: boolean } = {}): string {
  const text = block(
    line('Nom', `${p.firstName} ${p.lastName}`),
    line('Formation', p.education),
    line("Niveau d'études", p.studyLevel),
    line('Ville', p.city),
    line('Rayon de mobilité', p.mobilityRadiusKm ? `${p.mobilityRadiusKm} km` : ''),
    line('Recherche principale', p.mainSearch),
    line('Type de contrat', p.contractType),
    line('Disponibilité', p.availability),
    line('Compétences', list(p.skills)),
    line('Technologies', list(p.technologies)),
    line('Expérience cumulée', experienceText(p.experienceYears, p.experienceMonths)),
    line('Qualités', list(p.qualities)),
    line("Centres d'intérêt", list(p.interests)),
    line('LinkedIn', p.linkedin),
    line('GitHub', p.github),
    line('Portfolio', p.portfolio),
    line('Informations complémentaires', p.extraInfo),
  )
  const sections = text ? [text] : []
  if (p.experiences.trim()) sections.push(`Expériences :\n${p.experiences.trim()}`)
  if (p.projects.trim()) sections.push(`Projets :\n${p.projects.trim()}`)
  if (p.cvText.trim()) sections.push(`Texte de mon CV :\n${p.cvText.trim()}`)
  if (includeLetter && p.letterText.trim()) sections.push(`Ma lettre de motivation de base (style à respecter) :\n${p.letterText.trim()}`)
  return sections.join('\n\n') || 'Profil non renseigné.'
}

export function criteriaToText(c: SearchCriteria | undefined): string {
  if (!c) return 'Aucun critère défini : déduis-les de mon profil (recherche principale, ville, rayon de mobilité, type de contrat).'
  return block(
    line('Métier recherché', c.jobTitle),
    line('Mots-clés', list(c.keywords)),
    line('Secteurs visés', list(c.sectors)),
    line('Ville', c.city),
    line('Rayon', c.radiusKm ? `${c.radiusKm} km autour de la ville` : ''),
    line('Régions acceptées', list(c.regions)),
    line('Télétravail', c.remote === 'any' ? '' : REMOTE_LABELS[c.remote]),
    line('Type de contrat', c.contractType),
    line("Niveau d'études préparé", c.studyLevel),
    line('Disponible à partir du', c.availabilityDate ? formatDate(c.availabilityDate) : ''),
    line('Durée de contrat souhaitée', c.contractDuration),
    line("Rythme d'alternance", c.rhythm),
    line('Technologies obligatoires', list(c.requiredTech)),
    line('Technologies appréciées', list(c.preferredTech)),
    line('À écarter (mots-clés, postes ou entreprises)', list(c.excludedKeywords)),
    line('Ancienneté maximale des offres', c.maxAgeDays ? `${c.maxAgeDays} jours` : ''),
  )
}

const MAX_KNOWN_COMPANIES = 80
const MAX_KNOWN_JOBS = 40

/** Entreprises déjà suivies, pour que Claude en propose de nouvelles au lieu de répéter les mêmes. */
export function knownCompaniesText(companies: Company[]): string {
  const names = companies.map((c) => c.name.trim()).filter(Boolean)
  if (!names.length) return ''
  const shown = names.slice(-MAX_KNOWN_COMPANIES)
  const more = names.length - shown.length
  return `${shown.join(' ; ')}${more > 0 ? ` ; et ${more} autre(s)` : ''}`
}

/** Offres déjà enregistrées (les plus récentes d'abord), avec leur URL pour une comparaison exacte. */
export function knownJobsText(jobs: JobOffer[], companies: Company[]): string {
  if (!jobs.length) return ''
  const names = new Map(companies.map((c) => [c.id, c.name]))
  const recent = [...jobs].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, MAX_KNOWN_JOBS)
  const lines = recent.map((j) => {
    const label = [j.title || 'Offre sans titre', names.get(j.companyId ?? '')].filter(Boolean).join(' — ')
    return `- ${label}${j.url ? ` (${j.url})` : ''}${CLOSED_STATUSES.includes(j.status) ? ' [clôturée]' : ''}`
  })
  const more = jobs.length - recent.length
  if (more > 0) lines.push(`- … et ${more} offre(s) plus ancienne(s)`)
  return lines.join('\n')
}

export interface SearchPromptOptions {
  /** Précisions libres saisies pour cette recherche (« uniquement des PME », « offres de cette semaine »…). */
  focus?: string
  /** Ce qui est déjà suivi dans l'application, pour ne pas le voir reproposé. */
  known?: { companies: Company[]; jobs: JobOffer[] }
}

export function focusSection(focus: string | undefined): string {
  return focus?.trim() ? `## Précisions pour cette recherche\n${focus.trim()}` : ''
}

/**
 * Section « déjà dans mon suivi ». `mode` :
 * - 'jobs' : on cherche des offres — celles déjà enregistrées sont exclues, les entreprises connues restent bienvenues ;
 * - 'companies' : on cherche de nouvelles entreprises — celles déjà suivies sont exclues.
 */
export function knownSection(known: SearchPromptOptions['known'], mode: 'jobs' | 'companies'): string {
  if (!known) return ''
  const companies = knownCompaniesText(known.companies)
  const jobs = mode === 'jobs' ? knownJobsText(known.jobs, known.companies) : ''
  const parts: string[] = []
  if (jobs) parts.push(`Offres déjà enregistrées — ne les relève pas à nouveau, même si tu les retrouves sous une autre URL :\n${jobs}`)
  if (companies) {
    parts.push(
      mode === 'jobs'
        ? `Entreprises que je suis déjà (leurs nouvelles offres m'intéressent, mais cherche aussi ailleurs) : ${companies}`
        : `Entreprises que je suis déjà — ne les repropose pas, trouve-m'en d'autres : ${companies}`,
    )
  }
  return parts.length ? `## Déjà dans mon suivi\n${parts.join('\n\n')}` : ''
}

export function companyToText(c: Company | undefined, fallbackName = ''): string {
  if (!c) return block(line('Nom', fallbackName))
  return block(
    line('Nom', c.name),
    line('Secteur', c.sector),
    line('Localisation', c.location),
    line('Site officiel', c.website),
    line('Page recrutement', c.careersUrl),
    line('Description', c.description),
    line('Sources connues', list(c.sources)),
    line('Notes', c.notes),
  )
}

export function jobToText(j: JobOffer, company: Company | undefined): string {
  const a = j.analysis
  return block(
    line('Entreprise', company?.name),
    line('Intitulé', j.title),
    line('URL', j.url),
    line('Localisation', j.location),
    line('Type de contrat', j.contractType),
    line('Date de début', j.startDate),
    line('Durée', j.duration),
    line("Rythme d'alternance", j.rhythm),
    line("Niveau d'études demandé", j.studyLevel),
    line('Rémunération', j.salary),
    line('Date de publication', j.publishedAt ? formatDate(j.publishedAt) : ''),
    line('Source', j.source),
    line('Dernière vérification', j.verifiedAt ? formatDate(j.verifiedAt) : ''),
    line('Description', j.description),
    line('Exigences', list(j.requirements)),
    line('Compétences demandées', list(j.skills)),
    line('Mes notes', j.notes),
    a ? line('Score déjà obtenu', a.compatibilityScore) : '',
  )
}

export function analysisToText(j: JobOffer): string {
  const a = j.analysis
  if (!a) return ''
  return block(
    line('Score de compatibilité', a.compatibilityScore),
    line('Correspondances', list(a.matchingSkills)),
    line('Compétences manquantes', list(a.missingSkills)),
    line('Points forts', list(a.strengths)),
    line('À mettre en avant', list(a.keyPoints)),
    line('Arguments de candidature', list(a.applicationArguments)),
    line("Activités de l'entreprise", a.companyInsights.activities),
    line('Produits / services', a.companyInsights.products),
    line('Projets récents', a.companyInsights.recentProjects),
    line('Recommandation', a.recommendation),
  )
}
