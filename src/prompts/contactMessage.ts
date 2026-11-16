import type { Company, Contact, JobOffer, Profile } from '../types'
import { buildPrompt } from './buildPrompt'
import { companyToText, contactToText, jobToText, profileToText, todayText } from './format'

export type MessageKind = 'spontaneous' | 'first' | 'followup' | 'thanks'

export const MESSAGE_KINDS: Record<MessageKind, { label: string; goal: string }> = {
  spontaneous: {
    label: 'Candidature spontanée',
    goal: "Proposer ma candidature en alternance alors qu'aucune offre n'est publiée : montrer que je connais l'entreprise, dire précisément ce que je peux y faire, et demander un échange.",
  },
  first: {
    label: 'Prise de contact',
    goal: "Entrer en relation avec cette personne avant de candidater : me présenter en deux phrases, expliquer pourquoi je m'adresse à elle en particulier, et poser une question simple à laquelle il est facile de répondre.",
  },
  followup: {
    label: 'Relance',
    goal: "Relancer après un premier message resté sans réponse : rappeler le contexte en une phrase, apporter un élément nouveau (projet, disponibilité, précision) et proposer une suite concrète, sans reproche ni insistance.",
  },
  thanks: {
    label: 'Remerciement après échange',
    goal: "Remercier après un échange ou un entretien : reprendre un point précis de la discussion, confirmer mon intérêt et rappeler la prochaine étape convenue.",
  },
}

export const CONTACT_MESSAGE_TEMPLATE = `Tu es mon coach en candidature pour l'alternance. Rédige un message à envoyer à une personne précise.

Date du jour : {{today}}

## Objectif du message
{{goal}}

## Mon profil
{{profile}}

## L'entreprise
{{company}}

## La personne à qui j'écris
{{contact}}

{{job?}}

## Consignes de rédaction
- Écris deux versions : un e-mail (objet + corps, 120 à 180 mots) et un message LinkedIn (moins de 300 caractères, utilisable comme note d'invitation).
- Ton naturel, direct et respectueux. Vouvoiement. Aucune formule creuse (« votre entreprise dynamique », « je me permets de vous contacter »).
- Chaque phrase s'appuie sur un fait de mon profil, de l'entreprise ou de nos échanges précédents. N'invente rien : aucune expérience, aucun chiffre, aucune information sur la personne ou l'entreprise qui ne figure pas ci-dessus. Si une information manque, écris [à compléter].
- Adapte-toi à la fonction de la personne : un recruteur attend des faits sur ma formation, mon rythme et mes dates ; un responsable technique attend du concret sur ce que je sais faire ; un ancien élève attend une demande de conseil, pas une demande de piston.
- Termine par une seule demande claire.
{{extra?}}

## Format de sortie
Donne les deux versions prêtes à copier, sans JSON. Ajoute en une ligne le meilleur moment pour l'envoyer et le délai raisonnable avant une relance.`

export function buildContactMessagePrompt(
  kind: MessageKind,
  profile: Profile,
  company: Company,
  contact: Contact | undefined,
  job: JobOffer | undefined,
  extra: string,
): string {
  return buildPrompt(CONTACT_MESSAGE_TEMPLATE, {
    today: todayText(),
    goal: MESSAGE_KINDS[kind].goal,
    profile: profileToText(profile, { includeLetter: true }),
    company: companyToText(company),
    contact: contact ? contactToText(contact) : "Destinataire non identifié : adresse le message au service recrutement de l'entreprise.",
    job: job ? `## L'offre concernée\n${jobToText(job, company)}` : '',
    extra: extra.trim() ? `- Consignes supplémentaires : ${extra.trim()}` : '',
  })
}
