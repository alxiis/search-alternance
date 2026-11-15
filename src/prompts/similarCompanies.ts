import type { Company, Profile, SearchCriteria } from '../types'
import { buildPrompt } from './buildPrompt'
import { companyToText, criteriaToText, focusSection, knownSection, profileToText, todayText, type SearchPromptOptions } from './format'
import { JSON_RULES, NO_INVENTION_RULES, SEARCH_METHOD, SEARCH_SCHEMA } from './schemas'

export const SIMILAR_COMPANIES_TEMPLATE = `Tu es mon assistant de recherche d'alternance en France. Utilise la recherche web pour trouver des entreprises similaires à une entreprise qui m'intéresse.

Date du jour : {{today}}

## Entreprise de référence
{{company}}

## Mon profil
{{profile}}

## Mes critères de recherche
{{criteria}}

{{focus?}}

{{known?}}

## Ta mission
1. Comprends l'activité, le secteur, la taille et la stack technique de l'entreprise de référence à partir de sources officielles.
2. Trouve 8 à 12 entreprises réelles comparables (même secteur, même type de produits ou de missions, concurrents directs, taille voisine) situées dans ma zone de recherche et susceptibles d'accueillir un alternant.
3. Pour chacune : nom, secteur, ville, site officiel, page recrutement, description courte, en quoi elle ressemble à l'entreprise de référence, raisons de compatibilité avec mon profil, façon de candidater spontanément (dans "notes"), et les offres ouvertes trouvées (intitulé, URL, contrat, lieu, date de publication, date de début, durée, rythme, niveau d'études, technologies, source, date de vérification, "matchScore", "matchReasons").
4. N'inclus ni l'entreprise de référence elle-même, ni celles que je suis déjà.

{{method}}

{{rules}}

## Format de sortie
Résumé lisible, puis JSON strict. Une entreprise sans offre ouverte garde un tableau "jobs" vide.

\`\`\`json
{{schema}}
\`\`\`

{{jsonRules}}`

export function buildSimilarCompaniesPrompt(
  company: Company,
  profile: Profile,
  criteria: SearchCriteria | undefined,
  options: SearchPromptOptions = {},
): string {
  return buildPrompt(SIMILAR_COMPANIES_TEMPLATE, {
    today: todayText(),
    company: companyToText(company),
    profile: profileToText(profile),
    criteria: criteriaToText(criteria),
    focus: focusSection(options.focus),
    known: knownSection(options.known, 'companies'),
    method: SEARCH_METHOD,
    rules: NO_INVENTION_RULES,
    schema: SEARCH_SCHEMA,
    jsonRules: JSON_RULES,
  })
}
