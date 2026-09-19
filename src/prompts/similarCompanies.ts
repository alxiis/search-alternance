import type { Company, Profile, SearchCriteria } from '../types'
import { buildPrompt } from './buildPrompt'
import { companyToText, criteriaToText, profileToText } from './format'
import { JSON_RULES, NO_INVENTION_RULES, SEARCH_SCHEMA } from './schemas'

export const SIMILAR_COMPANIES_TEMPLATE = `Tu es mon assistant de recherche d'alternance. Utilise la recherche web pour trouver des entreprises similaires à une entreprise qui m'intéresse.

## Entreprise de référence
{{company}}

## Mon profil
{{profile}}

## Mes critères de recherche
{{criteria}}

## Ta mission
1. Comprends l'activité, le secteur, la taille et la stack technique de l'entreprise de référence à partir de sources officielles.
2. Trouve 8 à 12 entreprises réelles comparables (même secteur, même type de produits ou de missions) situées dans ma zone de recherche, et qui recrutent des alternants.
3. Pour chacune : nom, secteur, ville, site officiel, page recrutement, description courte, en quoi elle ressemble à l'entreprise de référence, raisons de compatibilité avec mon profil, et les offres ouvertes trouvées (intitulé, URL, contrat, lieu, date, technologies, source, date de vérification).
4. N'inclus pas l'entreprise de référence elle-même.

{{rules}}

## Format de sortie
Résumé lisible, puis JSON strict.

\`\`\`json
{{schema}}
\`\`\`

{{jsonRules}}`

export function buildSimilarCompaniesPrompt(company: Company, profile: Profile, criteria: SearchCriteria | undefined): string {
  return buildPrompt(SIMILAR_COMPANIES_TEMPLATE, {
    company: companyToText(company),
    profile: profileToText(profile),
    criteria: criteriaToText(criteria),
    rules: NO_INVENTION_RULES,
    schema: SEARCH_SCHEMA,
    jsonRules: JSON_RULES,
  })
}
