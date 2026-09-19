import type { Company, JobOffer, Profile } from '../types'
import { buildPrompt } from './buildPrompt'
import { companyToText, jobToText, profileToText } from './format'
import { ANALYSIS_SCHEMA, JSON_RULES, NO_INVENTION_RULES } from './schemas'

export const ANALYZE_JOB_TEMPLATE = `Tu es mon conseiller en recherche d'alternance. Analyse la compatibilité entre mon profil et l'offre ci-dessous, puis recherche l'entreprise sur le web.

## Mon profil
{{profile}}

## L'offre
{{job}}

## L'entreprise (informations déjà connues)
{{company}}

## Ta mission
Ouvre l'URL de l'offre si elle est fournie (sinon base-toi sur les informations ci-dessus), puis :
1. Analyse la compatibilité entre mon profil et l'offre.
2. Donne un score de compatibilité de 0 à 100.
3. Explique ce score, critère par critère.
4. Liste les correspondances (compétences, expériences, projets du profil qui répondent à l'offre).
5. Liste les compétences manquantes ou insuffisantes.
6. Identifie les éléments importants à mettre en avant dans ma candidature.
7. Recherche l'entreprise sur le web (sources officielles en priorité).
8. Recherche ses activités.
9. Recherche ses produits et services.
10. Recherche ses projets et actualités récents.
11. Recherche sa page recrutement.
12. Recherche d'autres offres pertinentes de cette entreprise pour mon profil.
13. Propose des arguments personnalisés pour ma candidature.
14. Rédige une lettre de motivation personnalisée (voir ci-dessous).

## Lettre de motivation
Lettre naturelle, professionnelle et humaine, adaptée à l'alternance, au poste et à l'entreprise. Aucune phrase générique creuse. Elle ne doit s'appuyer que sur mon profil et sur des faits vérifiés sur l'entreprise. Mets-la dans la réponse lisible ET dans le JSON (clé "coverLetters.full").

{{rules}}
- Distingue clairement ce qui vient de mon profil de ce qui vient de tes recherches, et cite une source pour toute information externe à mon profil.
- Le score doit être justifié uniquement par des éléments présents dans mon profil et dans l'offre.

## Format de sortie
Réponse structurée et lisible (une section par point ci-dessus), puis JSON strict. Dans "job", reprends l'offre en complétant les champs que tu as pu confirmer (garde l'URL fournie). Dans "jobs", mets les autres offres pertinentes de l'entreprise (tableau vide s'il n'y en a pas).
\`\`\`json
{{schema}}
\`\`\`

{{jsonRules}}`

export function buildAnalyzeJobPrompt(profile: Profile, job: JobOffer, company: Company | undefined): string {
  return buildPrompt(ANALYZE_JOB_TEMPLATE, {
    profile: profileToText(profile),
    job: jobToText(job, company),
    company: companyToText(company),
    rules: NO_INVENTION_RULES,
    schema: ANALYSIS_SCHEMA,
    jsonRules: JSON_RULES,
  })
}
