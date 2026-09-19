import type { Profile, SearchCriteria } from '../types'
import { buildPrompt } from './buildPrompt'
import { criteriaToText, profileToText } from './format'
import { JSON_RULES, NO_INVENTION_RULES, SEARCH_SCHEMA } from './schemas'

export const SEARCH_COMPANIES_TEMPLATE = `Tu es mon assistant de recherche d'alternance. Utilise la recherche web pour trouver des entreprises susceptibles de recruter un profil comme le mien.

## Mon profil
{{profile}}

## Mes critères de recherche
{{criteria}}

## Ta mission
1. Recherche sur le web 10 à 15 entreprises réelles, situées dans ma zone de recherche, qui recrutent ou ont déjà recruté des alternants sur des postes correspondant à mon profil.
2. Pour chaque entreprise, donne :
   - nom, secteur, ville, site officiel, page recrutement ;
   - une description courte ;
   - les raisons de compatibilité avec mon profil (technologies, secteur, missions) ;
   - les offres actuellement ouvertes trouvées, avec pour chacune : intitulé du poste, URL, type de contrat, localisation, date de publication si disponible, technologies demandées, source, date de vérification.
3. Classe les entreprises de la plus à la moins pertinente pour moi.
4. Ouvre réellement les pages d'offres pour confirmer qu'elles sont toujours en ligne. Ne liste que ce que tu as pu vérifier.

{{rules}}

## Format de sortie
Présente d'abord un court résumé lisible, puis termine par le JSON strict suivant (adapte le contenu, pas la structure). Mets dans "jobs" (au premier niveau) uniquement les offres qui ne se rattachent à aucune entreprise listée.

\`\`\`json
{{schema}}
\`\`\`

{{jsonRules}}`

export function buildSearchCompaniesPrompt(profile: Profile, criteria: SearchCriteria | undefined): string {
  return buildPrompt(SEARCH_COMPANIES_TEMPLATE, {
    profile: profileToText(profile),
    criteria: criteriaToText(criteria),
    rules: NO_INVENTION_RULES,
    schema: SEARCH_SCHEMA,
    jsonRules: JSON_RULES,
  })
}
