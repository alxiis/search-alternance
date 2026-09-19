import { REMOTE_LABELS } from '../data/constants'
import type { Company, JobOffer, Profile, SearchCriteria } from '../types'
import { formatDate } from '../utils/dates'

function line(label: string, value: string | number | null | undefined): string {
  const v = typeof value === 'number' ? String(value) : (value ?? '').trim()
  return v ? `- ${label} : ${v}` : ''
}

function block(...lines: string[]): string {
  return lines.filter(Boolean).join('\n')
}

const list = (items: string[]): string => items.join(', ')

export function profileToText(p: Profile): string {
  const experience = p.experienceYears || p.experienceMonths ? `${p.experienceYears} an(s) et ${p.experienceMonths} mois` : ''
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
    line("Expérience cumulée", experience),
    line('Qualités', list(p.qualities)),
    line("Centres d'intérêt", list(p.interests)),
    line('LinkedIn', p.linkedin),
    line('GitHub', p.github),
    line('Portfolio', p.portfolio),
    line('Informations complémentaires', p.extraInfo),
  )
  const sections = [text]
  if (p.experiences.trim()) sections.push(`Expériences :\n${p.experiences.trim()}`)
  if (p.projects.trim()) sections.push(`Projets :\n${p.projects.trim()}`)
  if (p.cvText.trim()) sections.push(`Texte de mon CV :\n${p.cvText.trim()}`)
  if (p.letterText.trim()) sections.push(`Ma lettre de motivation de base (style à respecter) :\n${p.letterText.trim()}`)
  return sections.join('\n\n') || 'Profil non renseigné.'
}

export function criteriaToText(c: SearchCriteria | undefined): string {
  if (!c) return 'Aucun critère défini.'
  return block(
    line('Métier recherché', c.jobTitle),
    line('Mots-clés', list(c.keywords)),
    line('Ville', c.city),
    line('Rayon', c.radiusKm ? `${c.radiusKm} km` : ''),
    line('Régions', list(c.regions)),
    line('Télétravail', REMOTE_LABELS[c.remote]),
    line('Type de contrat', c.contractType),
    line("Niveau d'étude", c.studyLevel),
    line('Date de disponibilité', c.availabilityDate),
    line('Technologies obligatoires', list(c.requiredTech)),
    line('Technologies appréciées', list(c.preferredTech)),
  )
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
    line('Rémunération', j.salary),
    line('Date de publication', j.publishedAt ? formatDate(j.publishedAt) : ''),
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
