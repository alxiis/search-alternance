/**
 * Liens de recherche vers les principaux sites d'offres d'alternance, pré-remplis quand le site le permet.
 * Aucun appel réseau : l'application construit seulement une adresse, que l'utilisateur ouvre lui-même dans un onglet.
 */
export interface JobBoardLink {
  name: string
  url: string
  /** Ce que le site apporte de particulier à une recherche d'alternance. */
  hint: string
}

export interface JobBoardQuery {
  /** Métier recherché (« Développeur web »). */
  what: string
  /** Ville. */
  where: string
}

const enc = encodeURIComponent

/** Ajoute « alternance » au métier si l'intitulé ne le dit pas déjà. */
export function alternanceKeywords(what: string): string {
  const w = what.trim()
  return /alternan|apprenti/i.test(w) ? w : `alternance ${w}`.trim()
}

export function jobBoardLinks({ what, where }: JobBoardQuery): JobBoardLink[] {
  const keywords = alternanceKeywords(what)
  const place = where.trim()
  const pickPlace = place ? ` Le lieu se choisit sur place (${place}).` : ''
  return [
    {
      // Sa recherche s'appuie sur des codes métier et des coordonnées : impossible à pré-remplir, on ouvre l'accueil.
      name: 'La bonne alternance',
      url: 'https://labonnealternance.apprentissage.beta.gouv.fr/',
      hint: 'Service public : offres, formations et entreprises qui recrutent souvent en alternance (utile pour les candidatures spontanées). Recherche à saisir sur place.',
    },
    {
      // Le lieu attend un code commune : la ville dans les mots-clés ne renvoie aucun résultat.
      name: 'France Travail',
      url: `https://candidat.francetravail.fr/offres/recherche?motsCles=${enc(keywords)}`,
      hint: `Offres du service public de l'emploi et de ses partenaires.${pickPlace}`,
    },
    {
      name: 'Indeed',
      url: `https://fr.indeed.com/jobs?q=${enc(keywords)}${place ? `&l=${enc(place)}` : ''}`,
      hint: "Agrégateur très large : pensez à remonter à l'annonce d'origine.",
    },
    {
      name: 'HelloWork',
      url: `https://www.hellowork.com/fr-fr/emploi/recherche.html?k=${enc(keywords)}${place ? `&l=${enc(place)}` : ''}`,
      hint: "Beaucoup d'offres de PME et d'ETI en région.",
    },
    {
      name: 'LinkedIn',
      url: `https://www.linkedin.com/jobs/search/?keywords=${enc(keywords)}${place ? `&location=${enc(place)}` : ''}`,
      hint: 'Utile aussi pour repérer le recruteur et lui écrire.',
    },
    {
      name: 'Apec',
      url: `https://www.apec.fr/candidat/recherche-emploi.html/emploi?motsCles=${enc(keywords)}`,
      hint: `Offres cadres et jeunes diplômés, alternances de niveau Bac+4 / Bac+5.${pickPlace}`,
    },
    {
      // Son moteur n'accepte plus de recherche par l'adresse : on ouvre la page des offres.
      name: 'Welcome to the Jungle',
      url: 'https://www.welcometothejungle.com/fr/jobs',
      hint: 'Startups et entreprises du numérique, avec présentation des équipes. Recherche à saisir sur place.',
    },
    {
      name: 'Google',
      url: `https://www.google.com/search?q=${enc(['offres', keywords, place].filter(Boolean).join(' '))}`,
      hint: "Vue d'ensemble, et pages carrière que les autres sites ne relaient pas.",
    },
  ]
}
