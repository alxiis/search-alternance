# Suivi Alternance

Application web **personnelle** pour préparer, organiser et suivre une recherche d'alternance.
Elle fonctionne **entièrement dans le navigateur** : pas de serveur, pas d'API Claude, pas de clé, pas de base distante.
Vous copiez des prompts dans **Claude Pro** (vous-même, à la main), puis vous réimportez les résultats en JSON.

- React + TypeScript (strict) + Vite + Tailwind CSS 4 + lucide-react + React Router (`HashRouter`)
- Données : **IndexedDB** locale (profil, critères, offres, entreprises, CV en fichier)
- Déployable tel quel sur **GitHub Pages**

## Installation et lancement

Prérequis : Node.js 20 ou plus récent.

```bash
npm install
npm run dev        # http://localhost:5173
```

```bash
npm run build      # vérifie TypeScript puis génère dist/
npm run preview    # sert dist/ en local
npm run typecheck  # TypeScript seul
```

## Déploiement sur GitHub Pages

1. Créez un dépôt GitHub et poussez le projet sur la branche `main`.
2. Dépôt → **Settings → Pages → Build and deployment → Source : GitHub Actions**.
3. Chaque push sur `main` déclenche `.github/workflows/deploy.yml` : `npm ci`, `npm run build`, puis publication de `dist/`.
4. Le site est disponible sur `https://<utilisateur>.github.io/<depot>/`.

Aucune configuration supplémentaire : `vite.config.ts` utilise `base: './'` (chemins relatifs) et le routage par `#` évite les erreurs 404 au rechargement.
Le site est marqué `noindex`. Attention : une page GitHub Pages est **publique**, mais elle ne contient aucune donnée personnelle (elles restent dans votre navigateur). Si votre dépôt est privé, la publication Pages privée dépend de votre offre GitHub.

## Parcours d'utilisation

1. **Profil** : renseignez vos informations, importez votre CV (PDF) et éventuellement votre lettre de base. Les fichiers restent dans IndexedDB.
   Le contenu du PDF n'est pas lu par l'application : collez le texte du CV dans le champ prévu si vous voulez qu'il soit inclus dans les prompts, sinon joignez le PDF dans Claude.
2. **Critères** : créez un ou plusieurs profils de recherche (« Alternance développeur web Toulouse », « Alternance développeur Python »…). Un profil est « actif ».
3. **Recherche Claude** : choisissez l'action (entreprises, offres, offres d'une entreprise, vérifier une offre, entreprises similaires) → un prompt complet est généré → **Copier et ouvrir Claude**.
4. Dans Claude Pro, collez le prompt. Claude termine sa réponse par un bloc JSON.
5. **Importer résultat Claude** (bouton en haut de page) : collez toute la réponse (le JSON est détecté automatiquement), ou le seul bloc JSON, ou chargez un fichier `.json`. Un aperçu permet de cocher ce qui est importé ; les doublons sont signalés.
6. **Offres** : tableau avec recherche, filtres, tri, pagination. Le statut se change directement dans le tableau. **Kanban** : glissez-déposez entre colonnes (sauvegarde automatique).
7. **Ajouter une offre** : collez l'URL, cliquez *Ajouter* (ou *Ajouter et analyser*). L'application n'essaie **jamais** de lire la page de l'offre.
8. **Analyser avec Claude** sur une offre → prompt (profil + offre + entreprise) → Claude renvoie analyse, score 0-100, lettre → *Importer le résultat* depuis la fiche : l'offre est mise à jour (score, explication, lettre).
9. **Générer ma lettre** : choisissez les formats (lettre complète, courte, email, message LinkedIn) et copiez le prompt. Importez la réponse : les textes sont conservés dans l'onglet *Lettres* de l'offre.
10. **Suivi** : dans la fiche d'une offre, onglet *Suivi* (dates, contact RH, prochaine action). Passer une offre en « Postulé » fixe la date de candidature et une relance (7 jours par défaut, réglable dans *Données*). Les relances en retard et les entretiens à venir apparaissent sur le tableau de bord.

Le score de compatibilité est **toujours fourni par Claude** puis importé ; l'application ne le calcule pas. Sans analyse, l'offre affiche « Non analysé ».

## Stockage local et confidentialité

- Base IndexedDB `suivi-alternance` (stores : `profile`, `criteria`, `companies`, `jobs`, `files`, `settings`). Migrations versionnées dans `src/lib/db.ts`.
- Sauvegarde automatique à chaque modification (formulaires : après ~0,7 s d'inactivité).
- Aucun appel réseau vers un service tiers : le seul lien sortant est le bouton « Ouvrir Claude » (adresse modifiable dans *Recherche Claude*), qui ouvre simplement un onglet.
- Vider les données du site dans le navigateur, ou changer de navigateur/appareil, fait perdre les données : **exportez régulièrement une sauvegarde** (page *Données*).

## Page « Données »

- Export JSON complet (avec ou sans fichiers), import d'une sauvegarde (remplace tout, avec confirmation).
- Export CSV des candidatures (séparateur `;`, ouverture directe dans Excel).
- Espace utilisé, suppression des fichiers seuls, suppression de toutes les données.
- Chargement des données de démonstration (5 entreprises, 10 offres, statuts, scores et relances variés).

Format de sauvegarde (`format: "suivi-alternance-backup"`, `version: 1`) : `profile`, `criteria`, `companies`, `jobs`, `settings`, `files` (fichiers en base64). Les types exacts sont dans `src/types/index.ts`.

## Format JSON attendu de Claude

Les prompts l'imposent déjà à Claude. Toutes les clés sont facultatives ; les champs inconnus sont `""`, `[]` ou `null`. Dates : `YYYY-MM-DD`. Score : entier 0-100 (borné sinon).
Les schémas exacts sont dans `src/prompts/schemas.ts` et visibles dans *Données → Format JSON attendu de Claude*.

**Recherche d'entreprises / d'offres**

```json
{
  "schemaVersion": 1,
  "companies": [
    {
      "name": "", "sector": "", "location": "", "website": "", "careersUrl": "",
      "description": "", "compatibilityReasons": [], "sources": [], "verifiedAt": "YYYY-MM-DD",
      "jobs": [
        { "title": "", "url": "", "location": "", "contractType": "", "description": "",
          "requirements": [], "skills": [], "salary": "", "publishedAt": null, "source": "" }
      ]
    }
  ],
  "jobs": []
}
```

`jobs` (premier niveau) accepte aussi des offres avec un champ `companyName`.

**Analyse d'une offre**

```json
{
  "schemaVersion": 1,
  "company": { "name": "", "website": "", "careersUrl": "", "description": "", "location": "", "sector": "", "sources": [] },
  "job": { "title": "", "url": "", "location": "", "contractType": "", "description": "", "requirements": [], "skills": [], "publishedAt": null, "source": "" },
  "analysis": {
    "compatibilityScore": 0, "scoreExplanation": "", "matchingSkills": [], "missingSkills": [],
    "strengths": [], "weaknesses": [], "keyPoints": [], "applicationArguments": [],
    "companyInsights": { "activities": "", "products": "", "recentProjects": "", "careersUrl": "" },
    "recommendation": "", "sources": []
  },
  "coverLetters": { "full": "" },
  "jobs": []
}
```

**Lettres** : `{ "coverLetters": { "full": "", "short": "", "emailSubject": "", "email": "", "linkedin": "" } }`

### Import et doublons

- Le texte collé peut contenir du texte autour du JSON : les blocs ```` ```json ```` puis les accolades équilibrées sont recherchés.
- Erreurs claires : JSON invalide (message du parseur), JSON valide mais sans clé attendue, éléments ignorés avec avertissement (offre sans titre ni URL, date illisible, score hors bornes).
- Doublons d'offres, par priorité : **1)** URL exacte, **2)** URL nettoyée (sans `utm_*`, `gclid`, `ref`…, `www.`, slash final), **3)** entreprise + intitulé + localisation. Un doublon n'est jamais recréé : il complète l'offre existante (champs vides, analyse, lettres) sans toucher à vos statuts ni à vos notes.
- Importer depuis la fiche d'une offre rattache l'analyse à cette offre.

## Prompts

Tous les prompts sont dans `src/prompts/` et se modifient facilement :

| Fichier | Rôle |
| --- | --- |
| `buildPrompt.ts` | `buildPrompt(template, data)` : remplace les `{{clés}}` (valeur absente → « Non renseigné ») |
| `searchCompanies.ts`, `searchJobs.ts`, `findCompanyJobs.ts`, `verifyJob.ts`, `similarCompanies.ts` | recherches |
| `analyzeJob.ts` | analyse de compatibilité + entreprise + lettre |
| `generateCoverLetter.ts` | lettre, version courte, email, LinkedIn |
| `schemas.ts` | schémas JSON et règles communes (pas d'invention, sources, dates) |
| `format.ts` | conversion profil / critères / offre / entreprise en texte |

## Structure

```
src/
  components/  Sidebar, Header, StatCard, JobTable, JobCard, KanbanBoard, CompanyTable, SearchFilters,
               ProfileForm, SearchCriteriaForm, PromptModal, ImportJsonModal, JobDetailsModal,
               StatusBadge, ScoreBadge, EmptyState, ConfirmDialog, Toast, …
  pages/       Dashboard, Profile, Criteria, Search, Jobs, Kanban, Companies, CompanyDetail, Data
  hooks/       useStore (état + persistance), useToast, useUi (modales globales), useAutosave
  lib/         db.ts (IndexedDB + migrations), factories.ts, clipboard.ts
  services/    storage.ts, claudeParser.ts, claudeImport.ts, backup.ts
  prompts/     modèles de prompts
  types/       Profile, SearchCriteria, Company, JobOffer, Application, ClaudeAnalysis, PromptResult,
               FollowUpTask, AppSettings, …
  utils/       dates, url, dedupe, csv, tasks, jobFilters, text
  data/        constantes (statuts…) et données de démonstration
```

## Limites connues

- Pas de lecture automatique des offres ni du PDF (choix volontaire : aucun scraping, aucun envoi).
- Les données sont liées à un navigateur : passez par l'export/import JSON pour changer d'appareil.
- Le mode sombre n'est pas implémenté (les couleurs passent par des jetons Tailwind, il pourra être ajouté).
