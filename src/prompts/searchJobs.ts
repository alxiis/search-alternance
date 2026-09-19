import type { Profile, SearchCriteria } from '../types'
import { buildPrompt } from './buildPrompt'
import { criteriaToText, profileToText } from './format'
import { JSON_RULES, NO_INVENTION_RULES, SEARCH_SCHEMA } from './schemas'

export const SEARCH_JOBS_TEMPLATE = `Tu es mon assistant de recherche d'alternance. Utilise la recherche web pour trouver des offres d'emploi actuellement ouvertes qui correspondent à mon profil.

## Mon profil
{{profile}}

## Mes critères de recherche
{{criteria}}

## Ta mission
1. Cherche sur le web (sites carrière des entreprises en priorité, puis plateformes d'emploi reconnues) 10 à 20 offres réelles et actuellement ouvertes.
2. Pour chaque offre, ouvre la page et relève : entreprise, intitulé, URL exacte de l'offre, type de contrat, localisation, date de publication si disponible, technologies et exigences demandées, source, date de vérification.
3. Pour chaque entreprise concernée, indique aussi : secteur, site officiel, page recrutement, courte description.
4. Écarte les offres expirées, les doublons et celles qui ne correspondent pas à mes critères obligatoires. Explique brièvement pourquoi chaque offre retenue me correspond.

{{rules}}

## Format de sortie
Présente d'abord un résumé lisible, puis termine par le JSON strict suivant. Regroupe les offres sous leur entreprise dans "companies[].jobs" ; le tableau "jobs" de premier niveau reste vide sauf si une entreprise ne peut pas être identifiée (dans ce cas, renseigne "companyName" dans l'offre).

\`\`\`json
{{schema}}
\`\`\`

{{jsonRules}}`

export function buildSearchJobsPrompt(profile: Profile, criteria: SearchCriteria | undefined): string {
  return buildPrompt(SEARCH_JOBS_TEMPLATE, {
    profile: profileToText(profile),
    criteria: criteriaToText(criteria),
    rules: NO_INVENTION_RULES,
    schema: SEARCH_SCHEMA,
    jsonRules: JSON_RULES,
  })
}
