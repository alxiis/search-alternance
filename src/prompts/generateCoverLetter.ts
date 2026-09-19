import type { Company, JobOffer, Profile } from '../types'
import { buildPrompt } from './buildPrompt'
import { analysisToText, companyToText, jobToText, profileToText } from './format'
import { coverLetterSchema, JSON_RULES } from './schemas'

export type LetterFormat = 'full' | 'short' | 'email' | 'linkedin'

export const LETTER_FORMATS: Record<LetterFormat, { label: string; instruction: string; keys: string[] }> = {
  full: { label: 'Lettre complète', instruction: 'Lettre de motivation complète (3 à 4 paragraphes, environ 250 à 350 mots), avec formule d\'appel et de politesse.', keys: ['full'] },
  short: { label: 'Version courte', instruction: 'Version courte (environ 100 mots), utilisable dans un formulaire de candidature.', keys: ['short'] },
  email: { label: 'Email de candidature', instruction: "Email de candidature : un objet accrocheur et un corps concis qui renvoie au CV joint.", keys: ['emailSubject', 'email'] },
  linkedin: { label: 'Message LinkedIn', instruction: 'Message LinkedIn au recruteur (moins de 600 caractères, direct, sans formule pompeuse).', keys: ['linkedin'] },
}

export const COVER_LETTER_TEMPLATE = `Tu es mon coach en candidature pour l'alternance. Rédige les contenus de candidature demandés pour l'offre ci-dessous.

## Mon profil (expériences, projets, compétences)
{{profile}}

## L'offre
{{job}}

## L'entreprise
{{company}}

## Informations découvertes lors de l'analyse
{{analysis}}

## Formats demandés
{{formats}}

## Consignes de rédaction
- Ton naturel, humain et professionnel ; personnalisé, crédible et adapté à l'entreprise, au poste et à un contrat d'alternance (rythme école / entreprise, envie d'apprendre, contribution concrète).
- Aucune phrase générique inutile (« je suis très motivé par votre entreprise dynamique »…). Chaque phrase doit s'appuyer sur un fait de mon profil ou de l'entreprise.
- Mets en avant les expériences, projets et compétences de mon profil qui répondent réellement à l'offre.
- N'invente rien : aucune expérience, compétence, diplôme, chiffre ou information sur l'entreprise qui ne figure pas ci-dessus. Si une information manque, ne l'utilise pas (ou utilise [à compléter]).
- Si tu as besoin d'un fait supplémentaire sur l'entreprise, cherche-le sur le web (source officielle) et cite la source.
{{extra}}

## Format de sortie
Présente chaque contenu de façon lisible, puis termine par le JSON strict suivant.

\`\`\`json
{{schema}}
\`\`\`

{{jsonRules}}`

export function buildCoverLetterPrompt(
  profile: Profile,
  job: JobOffer,
  company: Company | undefined,
  formats: LetterFormat[],
  extra: string,
): string {
  const selected = formats.length ? formats : (['full'] as LetterFormat[])
  return buildPrompt(COVER_LETTER_TEMPLATE, {
    profile: profileToText(profile),
    job: jobToText(job, company),
    company: companyToText(company),
    analysis: analysisToText(job) || "Aucune analyse importée pour l'instant : appuie-toi sur le profil et l'offre.",
    formats: selected.map((f) => `- ${LETTER_FORMATS[f].label} : ${LETTER_FORMATS[f].instruction}`).join('\n'),
    extra: extra.trim() ? `- Consignes supplémentaires : ${extra.trim()}` : '',
    schema: coverLetterSchema(selected.flatMap((f) => LETTER_FORMATS[f].keys)),
    jsonRules: JSON_RULES,
  })
}
