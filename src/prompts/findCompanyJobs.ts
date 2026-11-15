import type { Company, Profile, SearchCriteria } from '../types'
import { buildPrompt } from './buildPrompt'
import { companyToText, criteriaToText, focusSection, knownJobsText, profileToText, todayText, type SearchPromptOptions } from './format'
import { JSON_RULES, NO_INVENTION_RULES, SEARCH_SCHEMA } from './schemas'

export const FIND_COMPANY_JOBS_TEMPLATE = `Tu es mon assistant de recherche d'alternance en France. Utilise la recherche web pour trouver toutes les offres actuellement ouvertes chez UNE entreprise précise.

Date du jour : {{today}}

## Entreprise ciblée
{{company}}

## Mon profil
{{profile}}

## Mes critères de recherche
{{criteria}}

{{focus?}}

{{known?}}

## Ta mission
1. Trouve le site officiel et la page recrutement de l'entreprise (ou confirme ceux ci-dessus), y compris son espace sur un outil de recrutement externe s'il existe.
2. Liste toutes les offres ouvertes en alternance, apprentissage ou contrat de professionnalisation susceptibles de me correspondre, y compris dans d'autres établissements de l'entreprise s'ils restent dans mon périmètre de mobilité. N'ajoute les stages que si mes critères les autorisent.
3. Pour chaque offre : intitulé, URL exacte, type de contrat, localisation, date de publication, date de début, durée, rythme, niveau d'études, technologies et exigences, source, date de vérification, estimation de compatibilité ("matchScore") et raisons ("matchReasons").
4. Vérifie aussi si l'entreprise publie ses offres sur des plateformes tierces (La bonne alternance, France Travail, Apec, HelloWork, Indeed, LinkedIn, Welcome to the Jungle) et cite les URLs.
5. S'il n'y a aucune offre correspondante, dis-le clairement et renseigne dans "notes" la façon de candidater spontanément (formulaire, adresse e-mail officielle de recrutement, contact dont le nom est public).
6. Ne relève pas à nouveau les offres déjà dans mon suivi ; signale seulement dans ton texte celles qui ne sont plus en ligne.

{{rules}}

## Format de sortie
Résumé lisible, puis JSON strict. Une seule entreprise dans "companies", ses offres dans "companies[0].jobs" (tableau vide s'il n'y en a aucune).

\`\`\`json
{{schema}}
\`\`\`

{{jsonRules}}`

export function buildFindCompanyJobsPrompt(
  company: Company,
  profile: Profile,
  criteria: SearchCriteria | undefined,
  options: SearchPromptOptions = {},
): string {
  // Seules les offres de cette entreprise sont utiles à rappeler ici.
  const ownJobs = knownJobsText(options.known?.jobs.filter((j) => j.companyId === company.id) ?? [], [])
  return buildPrompt(FIND_COMPANY_JOBS_TEMPLATE, {
    today: todayText(),
    company: companyToText(company),
    profile: profileToText(profile),
    criteria: criteriaToText(criteria),
    focus: focusSection(options.focus),
    known: ownJobs ? `## Offres de cette entreprise déjà dans mon suivi\n${ownJobs}` : '',
    rules: NO_INVENTION_RULES,
    schema: SEARCH_SCHEMA,
    jsonRules: JSON_RULES,
  })
}
