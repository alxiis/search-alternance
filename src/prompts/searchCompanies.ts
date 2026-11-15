import type { Profile, SearchCriteria } from '../types'
import { buildPrompt } from './buildPrompt'
import { criteriaToText, focusSection, knownSection, profileToText, todayText, type SearchPromptOptions } from './format'
import { JSON_RULES, NO_INVENTION_RULES, SEARCH_METHOD, SEARCH_SCHEMA } from './schemas'

export const SEARCH_COMPANIES_TEMPLATE = `Tu es mon assistant de recherche d'alternance en France. Utilise la recherche web pour trouver des entreprises susceptibles d'accueillir un alternant avec un profil comme le mien.

Date du jour : {{today}}

## Mon profil
{{profile}}

## Mes critères de recherche
{{criteria}}

{{focus?}}

{{known?}}

## Ta mission
1. Trouve 10 à 15 entreprises réelles, situées dans ma zone de recherche, en mélangeant deux types de pistes :
   - celles qui ont aujourd'hui une offre d'alternance ouverte correspondant à mon profil ;
   - celles qui recrutent régulièrement des alternants sur ce type de poste (offres passées, page « stages et alternance », alternants visibles dans l'équipe) même sans offre ouverte aujourd'hui : elles sont utiles pour une candidature spontanée.
   Ne te limite pas aux grands groupes : pense aux PME, ETI, startups, ESN, agences, éditeurs de logiciels, collectivités et associations.
2. Pour chaque entreprise, donne :
   - nom, secteur, ville, site officiel, page recrutement ;
   - une description courte ;
   - les raisons de compatibilité avec mon profil (technologies, secteur, missions) ;
   - dans "notes", la façon de candidater spontanément : formulaire, adresse e-mail officielle de recrutement, ou contact dont le nom est public ;
   - les offres actuellement ouvertes trouvées, avec pour chacune : intitulé, URL, type de contrat, localisation, date de publication, date de début, durée, rythme, niveau d'études, technologies demandées, source, date de vérification, estimation de compatibilité ("matchScore") et raisons ("matchReasons").
3. Classe les entreprises de la plus à la moins pertinente pour moi.
4. Ouvre réellement les pages d'offres pour confirmer qu'elles sont toujours en ligne. Ne liste que ce que tu as pu vérifier ; une entreprise sans offre ouverte garde un tableau "jobs" vide.

{{method}}

{{rules}}

## Format de sortie
Présente d'abord un court résumé lisible, puis termine par le JSON strict suivant (adapte le contenu, pas la structure). Mets dans "jobs" (au premier niveau) uniquement les offres qui ne se rattachent à aucune entreprise listée.

\`\`\`json
{{schema}}
\`\`\`

{{jsonRules}}`

export function buildSearchCompaniesPrompt(profile: Profile, criteria: SearchCriteria | undefined, options: SearchPromptOptions = {}): string {
  return buildPrompt(SEARCH_COMPANIES_TEMPLATE, {
    today: todayText(),
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
