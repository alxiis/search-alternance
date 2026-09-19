/**
 * Schémas JSON que Claude doit renvoyer. Ils sont injectés tels quels dans les prompts
 * et documentés dans le README ainsi que dans la page « Données ».
 */

const JOB_FIELDS = `{
      "title": "Intitulé exact du poste",
      "url": "URL exacte de l'offre",
      "location": "Ville (département)",
      "contractType": "Alternance | Apprentissage | Contrat de professionnalisation | Stage | CDI | CDD",
      "description": "Résumé fidèle de l'offre",
      "requirements": ["Exigence 1"],
      "skills": ["Technologie ou compétence demandée"],
      "salary": "Rémunération si indiquée, sinon \\"\\"",
      "publishedAt": "YYYY-MM-DD ou null",
      "source": "URL de la page où l'offre a été vue",
      "verifiedAt": "YYYY-MM-DD"
    }`

const COMPANY_FIELDS = `{
      "name": "Nom officiel",
      "sector": "Secteur d'activité",
      "location": "Ville du siège ou de l'établissement",
      "website": "https://site-officiel",
      "careersUrl": "URL de la page recrutement ou \\"\\"",
      "description": "Description courte (2-3 phrases)",
      "compatibilityReasons": ["Pourquoi cette entreprise convient à mon profil"],
      "sources": ["URL des sources consultées"],
      "verifiedAt": "YYYY-MM-DD"
    }`

const ANALYSIS_FIELDS = `{
    "compatibilityScore": 0,
    "scoreExplanation": "Explication détaillée du score",
    "matchingSkills": ["Compétence du profil qui correspond à l'offre"],
    "missingSkills": ["Compétence demandée absente du profil"],
    "strengths": ["Points forts de ma candidature"],
    "weaknesses": ["Points faibles ou risques"],
    "keyPoints": ["Éléments à mettre en avant"],
    "applicationArguments": ["Arguments personnalisés pour cette candidature"],
    "companyInsights": {
      "activities": "Activités de l'entreprise",
      "products": "Produits / services",
      "recentProjects": "Projets ou actualités récentes",
      "careersUrl": "URL page recrutement ou \\"\\""
    },
    "recommendation": "Recommandation finale (postuler ou non, et comment)",
    "sources": ["URL de chaque source externe utilisée"]
  }`

export const SEARCH_SCHEMA = `{
  "schemaVersion": 1,
  "companies": [
    {
      "name": "...",
      "sector": "...",
      "location": "...",
      "website": "...",
      "careersUrl": "...",
      "description": "...",
      "compatibilityReasons": ["..."],
      "sources": ["..."],
      "verifiedAt": "YYYY-MM-DD",
      "jobs": [
        ${JOB_FIELDS.replace(/\n {4}/g, '\n        ')}
      ]
    }
  ],
  "jobs": []
}`

export const ANALYSIS_SCHEMA = `{
  "schemaVersion": 1,
  "company": ${COMPANY_FIELDS.replace(/\n {4}/g, '\n  ')},
  "job": ${JOB_FIELDS.replace(/\n {4}/g, '\n  ')},
  "analysis": ${ANALYSIS_FIELDS},
  "coverLetters": { "full": "Lettre de motivation complète" },
  "jobs": [
    {
      "companyName": "Nom de l'entreprise",
      "title": "...", "url": "...", "location": "...", "contractType": "...", "description": "...",
      "requirements": [], "skills": [], "publishedAt": null, "source": "..."
    }
  ]
}`

export function coverLetterSchema(keys: string[]): string {
  const lines = keys.map((k) => `    "${k}": "..."`).join(',\n')
  return `{
  "schemaVersion": 1,
  "coverLetters": {
${lines}
  }
}`
}

export const JSON_RULES = `Règles du JSON :
- JSON strict et valide : guillemets doubles, aucun commentaire, aucune virgule finale.
- Un seul bloc de code \`\`\`json placé à la toute fin de ta réponse, après ton texte d'explication.
- Champ inconnu : "" pour un texte, [] pour une liste, null pour une date ou un score. Ne remplis jamais un champ avec une supposition.
- Dates au format YYYY-MM-DD. compatibilityScore : entier de 0 à 100.
- Échappe correctement les guillemets et les retours à la ligne (\\n) dans les textes.`

export const NO_INVENTION_RULES = `Règles impératives :
- N'invente AUCUNE information. Si une donnée est introuvable ou incertaine, écris « non disponible » (ou laisse le champ vide dans le JSON).
- Privilégie les sources officielles (site de l'entreprise, page carrière, plateformes d'emploi reconnues) et vérifie chaque information avant de la donner.
- Donne l'URL de chaque source et de chaque offre trouvée. Ne cite jamais une URL que tu n'as pas réellement consultée.
- Indique la date de vérification. Signale clairement les offres qui semblent expirées.
- Réponds en français.`
