import type { Company, Profile, SearchCriteria } from '../types'
import { buildPrompt } from './buildPrompt'
import { companyToText, criteriaToText, knownContactsText, profileToText, todayText } from './format'
import { CONTACTS_SCHEMA, JSON_RULES, NO_INVENTION_RULES } from './schemas'

export const FIND_CONTACTS_TEMPLATE = `Tu es mon assistant de recherche d'alternance en France. Aide-moi à trouver à qui adresser ma candidature dans une entreprise précise.

Date du jour : {{today}}

## Entreprise ciblée
{{company}}

## Mon profil
{{profile}}

## Mes critères de recherche
{{criteria}}

{{known?}}

## Ta mission
1. Trouve la voie officielle de candidature : page recrutement, formulaire de candidature spontanée, adresse générique de recrutement publiée par l'entreprise.
2. Identifie 3 à 6 personnes pertinentes, dans cet ordre de priorité :
   - la personne chargée du recrutement des alternants ou des relations écoles (campus manager, chargé de recrutement, RH) ;
   - le ou la responsable de l'équipe où je travaillerais (futur tuteur possible) ;
   - dans une petite structure, le dirigeant ou la dirigeante ;
   - d'anciens élèves de mon école qui y travaillent.
3. Pour chacune : nom, fonction exacte, lien vers la page publique où tu l'as trouvée, et la raison de la contacter. Indique le canal le plus adapté (formulaire, e-mail, LinkedIn).
4. Conseille-moi sur l'ordre des prises de contact et sur l'angle d'approche pour chacune, à partir de mon profil.

Règles propres aux contacts :
- N'utilise que des informations professionnelles publiées (site de l'entreprise, profil LinkedIn public, article, annuaire officiel). Aucune information privée : pas d'adresse ni de téléphone personnels, pas de comptes personnels sur les réseaux sociaux.
- Ne devine jamais une adresse e-mail. Si elle n'est pas publiée, laisse le champ vide ; tu peux signaler dans ton texte le format d'adresse utilisé par l'entreprise s'il est lui-même public, en précisant qu'il reste à vérifier.
- Vérifie que chaque personne est toujours en poste (profil ou page à jour). En cas de doute, dis-le dans "notes".

{{rules}}

## Format de sortie
Présente d'abord tes conseils de façon lisible, puis termine par le JSON strict suivant. Ne mets dans "contacts" que les personnes non encore connues de moi.

\`\`\`json
{{schema}}
\`\`\`

{{jsonRules}}`

export function buildFindContactsPrompt(company: Company, profile: Profile, criteria: SearchCriteria | undefined): string {
  const known = knownContactsText(company.contacts)
  return buildPrompt(FIND_CONTACTS_TEMPLATE, {
    today: todayText(),
    company: companyToText(company),
    profile: profileToText(profile),
    criteria: criteriaToText(criteria),
    known: known ? `## Contacts que j'ai déjà\n${known}` : '',
    rules: NO_INVENTION_RULES,
    schema: CONTACTS_SCHEMA,
    jsonRules: JSON_RULES,
  })
}
