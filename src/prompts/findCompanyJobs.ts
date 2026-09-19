import type { Company, Profile, SearchCriteria } from '../types'
import { buildPrompt } from './buildPrompt'
import { companyToText, criteriaToText, profileToText } from './format'
import { JSON_RULES, NO_INVENTION_RULES, SEARCH_SCHEMA } from './schemas'

export const FIND_COMPANY_JOBS_TEMPLATE = `Tu es mon assistant de recherche d'alternance. Utilise la recherche web pour trouver toutes les offres actuellement ouvertes chez UNE entreprise précise.

## Entreprise ciblée
{{company}}

## Mon profil
{{profile}}

## Mes critères de recherche
{{criteria}}

## Ta mission
1. Trouve le site officiel et la page recrutement de l'entreprise (ou confirme ceux ci-dessus).
2. Liste toutes les offres ouvertes en alternance, apprentissage, professionnalisation ou stage susceptibles de me correspondre, y compris dans d'autres villes de l'entreprise si elles restent dans mon périmètre de mobilité.
3. Pour chaque offre : intitulé, URL exacte, type de contrat, localisation, date de publication si disponible, technologies et exigences, source, date de vérification. Précise pourquoi elle me correspond.
4. Signale s'il n'y a aucune offre correspondante, et indique s'il existe une candidature spontanée possible (avec le contact ou le formulaire officiel).
5. Vérifie aussi si l'entreprise recrute via des plateformes tierces et cite les URLs.

{{rules}}

## Format de sortie
Résumé lisible, puis JSON strict. Une seule entreprise dans "companies", ses offres dans "companies[0].jobs".

\`\`\`json
{{schema}}
\`\`\`

{{jsonRules}}`

export function buildFindCompanyJobsPrompt(company: Company, profile: Profile, criteria: SearchCriteria | undefined): string {
  return buildPrompt(FIND_COMPANY_JOBS_TEMPLATE, {
    company: companyToText(company),
    profile: profileToText(profile),
    criteria: criteriaToText(criteria),
    rules: NO_INVENTION_RULES,
    schema: SEARCH_SCHEMA,
    jsonRules: JSON_RULES,
  })
}
