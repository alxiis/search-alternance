import type { Company, JobOffer } from '../types'
import { buildPrompt } from './buildPrompt'
import { companyToText, jobToText } from './format'
import { JSON_RULES, NO_INVENTION_RULES, SEARCH_SCHEMA } from './schemas'

export const VERIFY_JOB_TEMPLATE = `Tu es mon assistant de recherche d'alternance. Vérifie qu'une offre d'emploi est toujours valable et fiable.

## Offre à vérifier
{{job}}

## Entreprise
{{company}}

## Ta mission
1. Ouvre l'URL de l'offre. Indique si elle est toujours en ligne, si elle a été retirée ou si elle a expiré.
2. Compare avec la page recrutement officielle de l'entreprise : l'offre y figure-t-elle ? Existe-t-elle sous une autre URL ?
3. Vérifie la cohérence : entreprise réelle, intitulé, lieu, type de contrat, date de publication. Signale tout indice d'annonce douteuse (entreprise introuvable, demande d'argent, offre dupliquée sous un faux nom, etc.).
4. Complète les champs manquants de l'offre uniquement avec ce que tu peux confirmer.

{{rules}}

## Format de sortie
Verdict clair (en ligne / expirée / douteuse / impossible à vérifier) avec les preuves et les URLs, puis JSON strict. Mets l'offre vérifiée dans "companies[0].jobs[0]" avec ses champs complétés.

\`\`\`json
{{schema}}
\`\`\`

{{jsonRules}}`

export function buildVerifyJobPrompt(job: JobOffer, company: Company | undefined): string {
  return buildPrompt(VERIFY_JOB_TEMPLATE, {
    job: jobToText(job, company),
    company: companyToText(company),
    rules: NO_INVENTION_RULES,
    schema: SEARCH_SCHEMA,
    jsonRules: JSON_RULES,
  })
}
