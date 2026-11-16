/**
 * Schémas JSON que Claude doit renvoyer, et règles communes à tous les prompts.
 * Ils sont injectés tels quels dans les prompts et documentés dans le README ainsi que dans la page « Données ».
 */

/** Assemble un objet JSON lisible à partir de lignes `"clé": valeur` (les valeurs sur plusieurs lignes sont ré-indentées). */
function obj(lines: string[]): string {
  return `{\n${lines.map((l) => `  ${l.replace(/\n/g, '\n  ')}`).join(',\n')}\n}`
}

const arrayOf = (item: string): string => `[\n  ${item.replace(/\n/g, '\n  ')}\n]`

const JOB_LINES = [
  `"title": "Intitulé exact du poste"`,
  `"url": "URL exacte de l'offre (annonce d'origine de préférence)"`,
  `"location": "Ville (département)"`,
  `"contractType": "Alternance | Apprentissage | Contrat de professionnalisation | Stage | CDI | CDD"`,
  `"description": "Résumé fidèle de l'offre (missions principales)"`,
  `"requirements": ["Exigence 1"]`,
  `"skills": ["Technologie ou compétence demandée"]`,
  `"salary": "Rémunération si indiquée, sinon vide"`,
  `"publishedAt": "YYYY-MM-DD ou null"`,
  `"startDate": "Date de début annoncée (ex. septembre 2027), sinon vide"`,
  `"duration": "Durée du contrat (ex. 12 mois), sinon vide"`,
  `"rhythm": "Rythme d'alternance annoncé, sinon vide"`,
  `"studyLevel": "Niveau d'études préparé ou demandé (ex. Bac+3), sinon vide"`,
  `"source": "Site où l'offre a été vue"`,
  `"expiresAt": "Date limite de candidature annoncée (YYYY-MM-DD), sinon null"`,
  `"verifiedAt": "YYYY-MM-DD (jour où tu as ouvert la page)"`,
  `"availability": "open | expired | doubtful"`,
]

/** Champs propres aux recherches : estimation rapide, à ne pas confondre avec l'analyse détaillée. */
const MATCH_LINES = [
  `"matchScore": 0`,
  `"matchReasons": ["Raison concrète pour laquelle cette offre correspond à mon profil"]`,
]

const COMPANY_LINES = [
  `"name": "Nom officiel"`,
  `"sector": "Secteur d'activité"`,
  `"location": "Ville du siège ou de l'établissement concerné"`,
  `"website": "https://site-officiel"`,
  `"careersUrl": "URL de la page recrutement, sinon vide"`,
  `"description": "Description courte (2-3 phrases)"`,
  `"compatibilityReasons": ["Pourquoi cette entreprise convient à mon profil"]`,
  `"notes": "Comment candidater spontanément (formulaire, e-mail officiel de recrutement, contact public), sinon vide"`,
  `"sources": ["URL des sources consultées"]`,
  `"verifiedAt": "YYYY-MM-DD"`,
]

const ANALYSIS_LINES = [
  `"compatibilityScore": 0`,
  `"scoreExplanation": "Explication détaillée du score"`,
  `"matchingSkills": ["Compétence du profil qui correspond à l'offre"]`,
  `"missingSkills": ["Compétence demandée absente du profil"]`,
  `"strengths": ["Points forts de ma candidature"]`,
  `"weaknesses": ["Points faibles ou risques"]`,
  `"keyPoints": ["Éléments à mettre en avant"]`,
  `"applicationArguments": ["Arguments personnalisés pour cette candidature"]`,
  `"companyInsights": ${obj([
    `"activities": "Activités de l'entreprise"`,
    `"products": "Produits / services"`,
    `"recentProjects": "Projets ou actualités récentes"`,
    `"careersUrl": "URL de la page recrutement, sinon vide"`,
  ])}`,
  `"recommendation": "Recommandation finale (postuler ou non, et comment)"`,
  `"sources": ["URL de chaque source externe utilisée"]`,
]

export const SEARCH_SCHEMA = obj([
  `"schemaVersion": 1`,
  `"companies": ${arrayOf(obj([...COMPANY_LINES, `"jobs": ${arrayOf(obj([...JOB_LINES, ...MATCH_LINES]))}`]))}`,
  `"jobs": []`,
])

/** Vérification d'une offre : l'offre est sous la clé "job" pour être rattachée à celle de l'application. */
export const VERIFY_SCHEMA = obj([
  `"schemaVersion": 1`,
  `"company": ${obj(COMPANY_LINES)}`,
  `"job": ${obj(JOB_LINES)}`,
  `"jobs": []`,
])

export const ANALYSIS_SCHEMA = obj([
  `"schemaVersion": 1`,
  `"company": ${obj(COMPANY_LINES)}`,
  `"job": ${obj(JOB_LINES)}`,
  `"analysis": ${obj(ANALYSIS_LINES)}`,
  `"coverLetters": { "full": "Lettre de motivation complète" }`,
  `"jobs": ${arrayOf(obj([`"companyName": "Nom de l'entreprise"`, ...JOB_LINES, ...MATCH_LINES]))}`,
])

const CONTACT_LINES = [
  `"name": "Prénom Nom"`,
  `"role": "Fonction exacte dans l'entreprise"`,
  `"email": "Adresse professionnelle publiée, sinon vide"`,
  `"phone": "Téléphone professionnel publié, sinon vide"`,
  `"linkedin": "URL du profil LinkedIn public, sinon vide"`,
  `"source": "URL de la page où tu as trouvé cette personne"`,
  `"notes": "Pourquoi la contacter, et par quel canal"`,
]

/** Recherche d'interlocuteurs : les contacts sont rattachés à l'entreprise sous la clé "company". */
export const CONTACTS_SCHEMA = obj([
  `"schemaVersion": 1`,
  `"company": ${obj([
    `"name": "Nom officiel"`,
    `"website": "https://site-officiel"`,
    `"careersUrl": "URL de la page recrutement, sinon vide"`,
    `"notes": "Canal de candidature spontanée recommandé (formulaire, adresse générique de recrutement), sinon vide"`,
    `"sources": ["URL des sources consultées"]`,
    `"contacts": ${arrayOf(obj(CONTACT_LINES))}`,
  ])}`,
])

export function coverLetterSchema(keys: string[]): string {
  return obj([`"schemaVersion": 1`, `"coverLetters": ${obj(keys.map((k) => `"${k}": "..."`))}`])
}

export const JSON_RULES = `Règles du JSON :
- JSON strict et valide : guillemets doubles, aucun commentaire, aucune virgule finale.
- Un seul bloc de code \`\`\`json placé à la toute fin de ta réponse, après ton texte d'explication. Les valeurs du modèle ci-dessus sont des descriptions : remplace-les par les vraies données.
- Champ inconnu : "" pour un texte, [] pour une liste, null pour une date ou un score. Ne remplis jamais un champ avec une supposition ni avec « non disponible ».
- Dates au format YYYY-MM-DD. Scores (compatibilityScore, matchScore) : entiers de 0 à 100.
- "availability" : "open" si tu as vu l'annonce en ligne et ouverte aux candidatures, "expired" si elle est retirée, pourvue ou clôturée, "doubtful" si elle est suspecte, "" si tu n'as pas pu ouvrir la page.
- Échappe correctement les guillemets et les retours à la ligne (\\n) dans les textes.
- Si la réponse risque d'être trop longue, réduis le nombre d'éléments plutôt que de tronquer le JSON : il doit être complet et se terminer par « } ».`

export const NO_INVENTION_RULES = `Règles impératives :
- N'invente AUCUNE information. Si une donnée est introuvable ou incertaine, dis-le dans ton texte et laisse le champ vide dans le JSON.
- Privilégie les sources officielles (site de l'entreprise, page carrière, plateformes d'emploi reconnues) et vérifie chaque information avant de la donner.
- Donne l'URL de chaque source et de chaque offre trouvée. Ne cite jamais une URL que tu n'as pas réellement consultée, et ne reconstruis jamais une URL de mémoire.
- Indique la date de vérification. Signale clairement les offres qui semblent expirées.
- Réponds en français.`

/** Savoir-faire propre à la recherche d'alternance en France, commun à toutes les recherches. */
export const SEARCH_METHOD = `Méthode de recherche :
- Fais plusieurs recherches plutôt qu'une seule, en variant le vocabulaire : « alternance », « alternant(e) », « apprentissage », « apprenti(e) », « contrat de professionnalisation », combinés à l'intitulé du métier, à ses intitulés voisins, aux technologies clés, puis à la ville, aux communes voisines et au département.
- Sources à consulter, dans cet ordre : pages carrière des entreprises (et leurs outils de recrutement : Welcome to the Jungle, Workday, SmartRecruiters, Teamtailor, Recruitee, Lever, Greenhouse…), La bonne alternance, France Travail, Apec, HelloWork, Indeed, LinkedIn, JobTeaser, puis les sites des écoles et CFA qui relaient des offres d'entreprises partenaires.
- Quand une offre est relayée par un agrégateur, remonte à l'annonce d'origine et donne cette URL en priorité ; cite l'agrégateur dans "source".
- Écarte les annonces qui sont en réalité des formations payantes ou des écoles qui recrutent des étudiants, et non des employeurs.
- Une offre de stage, de CDI ou de CDD ne remplace pas une alternance : ne la retiens que si mes critères l'autorisent.
- Pour chaque offre, contrôle : annonce en ligne à la date du jour, lieu dans ma zone, niveau d'études préparé compatible avec le mien, date de début compatible avec ma disponibilité, ancienneté de l'annonce dans la limite fixée.`
