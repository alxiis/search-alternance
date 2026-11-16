/**
 * Liens de recherche pré-remplis pour trouver un interlocuteur dans une entreprise.
 * Comme pour les sites d'emploi, l'application ne fait que construire une adresse : c'est l'utilisateur qui l'ouvre
 * et qui lit les résultats. Aucune page n'est lue automatiquement.
 */
export interface PeopleSearchLink {
  label: string
  url: string
  hint: string
}

const enc = encodeURIComponent
const google = (query: string): string => `https://www.google.com/search?q=${enc(query)}`
const quoted = (s: string): string => `"${s.replace(/"/g, ' ').trim()}"`

export interface PeopleSearchInput {
  company: string
  /** Ville de l'entreprise, pour lever les homonymies. */
  city?: string
  /** École de l'utilisateur, pour retrouver d'anciens élèves. */
  school?: string
  /** Métier visé, pour retrouver le responsable de l'équipe concernée. */
  jobTitle?: string
}

export function peopleSearchLinks({ company, city, school, jobTitle }: PeopleSearchInput): PeopleSearchLink[] {
  const name = company.trim()
  if (!name) return []
  const links: PeopleSearchLink[] = [
    {
      label: 'Recruteurs (LinkedIn)',
      url: `https://www.linkedin.com/search/results/people/?keywords=${enc(`${name} recrutement OR RH OR "talent acquisition" OR "relations écoles"`)}`,
      hint: 'Personnes de cette entreprise chargées du recrutement. Nécessite d’être connecté à LinkedIn.',
    },
    {
      label: 'Recruteurs (Google)',
      url: google(`site:linkedin.com/in ${quoted(name)} (recruteur OR recrutement OR "ressources humaines" OR "talent acquisition" OR "campus manager" OR "relations écoles")`),
      hint: 'Même recherche sans compte LinkedIn : profils publics indexés par Google.',
    },
  ]
  if (jobTitle?.trim()) {
    links.push({
      label: "Responsables de l'équipe",
      url: google(`site:linkedin.com/in ${quoted(name)} (responsable OR manager OR directeur OR lead OR "chef de projet") ${jobTitle.trim()}`),
      hint: `Le futur tuteur est souvent plus réceptif qu'un service RH : responsables liés à « ${jobTitle.trim()} ».`,
    })
  }
  if (school?.trim()) {
    links.push({
      label: 'Anciens de mon école',
      url: google(`site:linkedin.com/in ${quoted(name)} ${quoted(school)}`),
      hint: `Personnes passées par ${school.trim()} et qui travaillent ou ont travaillé dans cette entreprise : le contact le plus facile à obtenir.`,
    })
  }
  links.push(
    {
      label: 'Page LinkedIn',
      url: `https://www.linkedin.com/search/results/companies/?keywords=${enc(name)}`,
      hint: "Page de l'entreprise : effectif, employés, publications de recrutement.",
    },
    {
      label: 'Contact recrutement',
      url: google(`${quoted(name)}${city?.trim() ? ` ${city.trim()}` : ''} (recrutement OR carrières OR "nous rejoindre" OR candidature) (contact OR email OR alternance)`),
      hint: 'Page carrière, formulaire ou adresse de recrutement publiés par l’entreprise.',
    },
  )
  return links
}
