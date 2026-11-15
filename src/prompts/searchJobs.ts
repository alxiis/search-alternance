import type { Profile, SearchCriteria } from '../types'
import { buildPrompt } from './buildPrompt'
import { criteriaToText, focusSection, knownSection, profileToText, todayText, type SearchPromptOptions } from './format'
import { JSON_RULES, NO_INVENTION_RULES, SEARCH_METHOD, SEARCH_SCHEMA } from './schemas'

export const SEARCH_JOBS_TEMPLATE = `Tu es mon assistant de recherche d'alternance en France. Utilise la recherche web pour trouver des offres actuellement ouvertes qui correspondent à mon profil et à mes critères.

Date du jour : {{today}}

## Mon profil
{{profile}}

## Mes critères de recherche
{{criteria}}

{{focus?}}

{{known?}}

## Ta mission
1. Trouve 10 à 20 offres réelles et actuellement ouvertes, en suivant la méthode ci-dessous. La pertinence prime sur le nombre : mieux vaut 8 offres vérifiées que 20 approximatives.
2. Pour chaque offre, ouvre la page et relève : entreprise, intitulé exact, URL exacte, type de contrat, localisation, date de publication, date de début, durée, rythme d'alternance, niveau d'études préparé, rémunération, technologies et exigences, source, date de vérification.
3. Pour chaque entreprise concernée, indique aussi : secteur, site officiel, page recrutement, courte description.
4. Écarte les offres expirées ou pourvues, les doublons (la même offre publiée sur plusieurs sites ne compte qu'une fois), celles hors de ma zone, celles qui ne respectent pas mes critères obligatoires et celles déjà dans mon suivi.
5. Pour chaque offre retenue, donne une estimation rapide de compatibilité de 0 à 100 ("matchScore") et deux ou trois raisons concrètes tirées de mon profil ("matchReasons"). Classe les offres de la plus à la moins pertinente.
6. Termine ton résumé par les requêtes et les sites qui ont donné des résultats, puis par trois pistes pour élargir la recherche si peu d'offres correspondent (intitulés voisins, villes proches, secteurs).

{{method}}

{{rules}}

## Format de sortie
Présente d'abord un résumé lisible (un tableau des offres, de la plus à la moins pertinente), puis termine par le JSON strict suivant. Regroupe les offres sous leur entreprise dans "companies[].jobs" ; le tableau "jobs" de premier niveau reste vide sauf si une entreprise ne peut pas être identifiée (dans ce cas, renseigne "companyName" dans l'offre).

\`\`\`json
{{schema}}
\`\`\`

{{jsonRules}}`

export function buildSearchJobsPrompt(profile: Profile, criteria: SearchCriteria | undefined, options: SearchPromptOptions = {}): string {
  return buildPrompt(SEARCH_JOBS_TEMPLATE, {
    today: todayText(),
    profile: profileToText(profile),
    criteria: criteriaToText(criteria),
    focus: focusSection(options.focus),
    known: knownSection(options.known, 'jobs'),
    method: SEARCH_METHOD,
    rules: NO_INVENTION_RULES,
    schema: SEARCH_SCHEMA,
    jsonRules: JSON_RULES,
  })
}
