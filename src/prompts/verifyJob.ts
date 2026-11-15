import type { Company, JobOffer } from '../types'
import { buildPrompt } from './buildPrompt'
import { companyToText, jobToText, todayText } from './format'
import { JSON_RULES, NO_INVENTION_RULES, VERIFY_SCHEMA } from './schemas'

export const VERIFY_JOB_TEMPLATE = `Tu es mon assistant de recherche d'alternance en France. Vérifie qu'une offre d'emploi est toujours valable et fiable.

Date du jour : {{today}}

## Offre à vérifier
{{job}}

## Entreprise
{{company}}

## Ta mission
1. Ouvre l'URL de l'offre (ou retrouve l'annonce par une recherche si l'URL manque). Indique si elle est toujours en ligne et ouverte aux candidatures, si elle a été retirée, pourvue ou si elle a expiré.
2. Compare avec la page recrutement officielle de l'entreprise : l'offre y figure-t-elle ? Existe-t-elle sous une autre URL, plus officielle ?
3. Vérifie la cohérence : entreprise réelle, intitulé, lieu, type de contrat, date de publication. Signale tout indice d'annonce douteuse (entreprise introuvable, demande d'argent, formation payante déguisée en offre, offre dupliquée sous un faux nom, etc.).
4. Complète les champs manquants de l'offre uniquement avec ce que tu peux confirmer : date de début, durée, rythme d'alternance, niveau d'études, rémunération, exigences.

{{rules}}

## Format de sortie
Verdict clair (en ligne / expirée / douteuse / impossible à vérifier) avec les preuves et les URLs, puis JSON strict. Mets l'offre vérifiée dans "job" avec ses champs complétés, son état dans "availability" et la date du jour dans "verifiedAt". Laisse "jobs" vide.

\`\`\`json
{{schema}}
\`\`\`

{{jsonRules}}`

export function buildVerifyJobPrompt(job: JobOffer, company: Company | undefined): string {
  return buildPrompt(VERIFY_JOB_TEMPLATE, {
    today: todayText(),
    job: jobToText(job, company),
    company: companyToText(company),
    rules: NO_INVENTION_RULES,
    schema: VERIFY_SCHEMA,
    jsonRules: JSON_RULES,
  })
}
