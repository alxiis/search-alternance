# Suivi Alternance

Application web **personnelle** pour préparer, organiser et suivre une recherche d'alternance.
Elle fonctionne **entièrement dans le navigateur** : pas de serveur, pas d'API Claude, pas de clé, pas de base distante.
Seule la page *Prospection* interroge un service extérieur (le registre public des entreprises), et uniquement quand vous lancez une recherche.
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
   En plus du métier, de la zone et des technologies, précisez ce qui est propre à l'alternance : rythme imposé par l'école, durée du contrat, secteurs visés, mots-clés à écarter et ancienneté maximale des offres (30 jours par défaut).
3. **Recherche Claude** : choisissez l'action (offres, entreprises, offres d'une entreprise, entreprises similaires, vérifier une offre) → un prompt complet est généré → **Copier et ouvrir Claude**.
   - **Précisions pour cette recherche** : une consigne ponctuelle (« uniquement des PME », « offres de cette semaine ») ajoutée aux prompts sans toucher aux critères enregistrés.
   - **Ne pas reproposer ce que je suis déjà** (coché par défaut) : vos entreprises et vos offres sont listées dans le prompt, pour que Claude cherche du nouveau au lieu de répéter les mêmes résultats.
   - **Chercher directement sur les sites d'emploi** : liens vers La bonne alternance, France Travail, Indeed, HelloWork, LinkedIn, Apec, Welcome to the Jungle et Google, pré-remplis avec votre métier et votre ville quand le site le permet.
4. Dans Claude Pro, collez le prompt dans une conversation où la recherche web est activée. Claude termine sa réponse par un bloc JSON.
5. **Importer résultat Claude** (bouton en haut de page) : collez toute la réponse (le JSON est détecté automatiquement), ou le seul bloc JSON, ou chargez un fichier `.json`. Un aperçu permet de cocher ce qui est importé ; les doublons sont signalés.
6. **Offres** : tableau avec recherche, filtres, tri, pagination. Le statut se change directement dans le tableau. **Kanban** : glissez-déposez entre colonnes (sauvegarde automatique).
7. **Ajouter une offre**, de deux façons :
   - **Bouton de capture** (le plus rapide) : dans *Recherche Claude*, glissez le bouton « Suivi Alternance » dans votre barre de favoris. Sur la page d'une offre, cliquez sur ce favori : l'offre s'ouvre dans l'application, déjà remplie (poste, entreprise, lieu, contrat, dates de publication et d'expiration, salaire, compétences, description). Vous confirmez, elle est ajoutée.
   - **À la main** : collez l'URL, cliquez *Ajouter* (ou *Ajouter et analyser*).

   L'application n'essaie **jamais** de lire elle-même la page d'une offre : le favori lui transmet ce que la page affiche déjà dans votre navigateur.
8. **Analyser avec Claude** sur une offre → prompt (profil + offre + entreprise) → Claude renvoie analyse, score 0-100, lettre → *Importer le résultat* depuis la fiche : l'offre est mise à jour (score, explication, lettre).
9. **Générer ma lettre** : choisissez les formats (lettre complète, courte, email, message LinkedIn) et copiez le prompt. Importez la réponse : les textes sont conservés dans l'onglet *Lettres* de l'offre.
10. **Prospection** : cherchez dans le registre officiel les entreprises d'un secteur, d'une zone et d'une taille données, puis ajoutez celles qui vous intéressent. Chaque entreprise suit alors son propre parcours de candidature spontanée (*À contacter → Contactée → À relancer → Échange en cours / Sans suite*), avec une date de relance qui remonte sur le tableau de bord.
11. **Contacts** : la fiche d'une entreprise tient un carnet de contacts (fonction, coordonnées, source, historique daté des échanges). Elle propose des recherches pré-remplies pour trouver un recruteur, le responsable de l'équipe ou un ancien de votre école, un prompt *Trouver des interlocuteurs* dont le résultat s'importe, et un prompt de message (candidature spontanée, prise de contact, relance, remerciement). Noter un premier échange fait passer l'entreprise en « Contactée ».
12. **Suivi** : dans la fiche d'une offre, onglet *Suivi* (dates, contact RH, prochaine action). Passer une offre en « Postulé » fixe la date de candidature et une relance (7 jours par défaut, réglable dans *Données*). Les relances en retard et les entretiens à venir apparaissent sur le tableau de bord.

Le score de compatibilité est **toujours fourni par Claude** puis importé ; l'application ne le calcule pas. Une recherche donne une **estimation rapide** par offre (affichée « ≈ 84/100 », bordure en pointillés) qui sert à trier les résultats ; l'analyse détaillée la remplace par le score définitif. Sans l'un ni l'autre, l'offre affiche « Non analysé ».

**État de l'annonce** : chaque recherche ou vérification indique si l'annonce est en ligne, expirée ou douteuse, avec la date du contrôle. Les offres expirées ou douteuses portent un badge et peuvent être masquées dans le tableau (« Masquer les expirées »). Le bouton **Vérifier l'annonce** de la fiche génère le prompt de contrôle ; son résultat met à jour l'offre sans toucher à votre statut ni à vos notes.

## Thème Jour / Nuit

- Bouton soleil / lune dans l'en-tête ; réglage à trois états (Jour, Nuit, Système) dans *Données → Apparence*.
- Sans choix enregistré, le thème de l'appareil est suivi (y compris en direct si l'appareil change). Un choix manuel est mémorisé dans `localStorage` (clé `suivi-alternance:theme`).
- Un petit script dans `index.html` applique le thème avant le premier rendu : pas de clignotement.
- Les couleurs passent par des variables CSS sémantiques (`--background`, `--foreground`, `--card`, `--muted`, `--border`, `--primary`, `--accent`, `--danger`, `--success`, `--warning`…) définies dans `src/index.css` pour `:root` et `:root.dark`, puis exposées à Tailwind (`bg-card`, `text-muted-foreground`, `border-border`…). Les teintes de badges (statuts, scores) sont dans `src/data/tones.ts`.
- Les animations (changement de thème, ouverture des modales) sont désactivées si le système demande `prefers-reduced-motion`.

## Stockage local et confidentialité

- Base IndexedDB `suivi-alternance` (stores : `profile`, `criteria`, `companies`, `jobs`, `files`, `settings`). Migrations versionnées dans `src/lib/db.ts`.
- Sauvegarde automatique à chaque modification (formulaires : après ~0,7 s d'inactivité).
- Les liens sortants (bouton « Ouvrir Claude », dont l'adresse est modifiable dans *Recherche Claude*, liens vers les sites d'emploi, recherches de personnes, page d'une offre) ouvrent simplement un onglet quand vous cliquez.
- **Un seul cas d'appel réseau** : la page *Prospection*. Quand vous cliquez sur *Chercher*, elle interroge deux API publiques de l'État, sans clé ni compte : l'API Géo (`geo.api.gouv.fr`) pour retrouver la commune, et l'API Recherche d'entreprises (`recherche-entreprises.api.gouv.fr`) pour le registre. Seuls la ville, le secteur (codes NAF), la taille et l'éventuel mot-clé saisis leur sont envoyés ; votre profil, vos offres et votre suivi ne quittent jamais le navigateur.
- **Bouton de capture** : les données de l'offre passent du favori à l'application dans le fragment de l'adresse (après `#`), qui n'est envoyé à aucun serveur. L'adresse est nettoyée dès que l'offre est ajoutée ou refusée.
- Vider les données du site dans le navigateur, ou changer de navigateur/appareil, fait perdre les données : **exportez régulièrement une sauvegarde** (page *Données*).

## Page « Données »

- Export JSON complet (avec ou sans fichiers), import d'une sauvegarde (remplace tout, avec confirmation ; l'écriture se fait en une seule transaction, donc un échec laisse vos données actuelles intactes). Une sauvegarde d'une version antérieure reste lisible : les champs ajoutés depuis prennent leur valeur par défaut.
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
          "requirements": [], "skills": [], "salary": "", "publishedAt": null,
          "startDate": "", "duration": "", "rhythm": "", "studyLevel": "",
          "source": "", "verifiedAt": "YYYY-MM-DD", "availability": "open",
          "matchScore": 0, "matchReasons": [] }
      ]
    }
  ],
  "jobs": []
}
```

`jobs` (premier niveau) accepte aussi des offres avec un champ `companyName`.
`availability` vaut `open`, `expired` ou `doubtful`. `matchScore` est l'estimation rapide d'une recherche (0-100) et `matchReasons` ses raisons. `notes` (entreprise) sert à la marche à suivre pour une candidature spontanée.

**Vérification d'une offre** : `{ "company": { … }, "job": { … mêmes champs qu'une offre, dont "availability" et "verifiedAt" }, "jobs": [] }`. La clé `job` rattache le résultat à l'offre depuis laquelle la vérification a été lancée.

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

**Interlocuteurs**

```json
{
  "schemaVersion": 1,
  "company": {
    "name": "", "website": "", "careersUrl": "", "notes": "", "sources": [],
    "contacts": [
      { "name": "", "role": "", "email": "", "phone": "", "linkedin": "", "source": "", "notes": "" }
    ]
  }
}
```

Les contacts sont ajoutés à l'entreprise depuis laquelle le prompt a été lancé, même si Claude l'écrit autrement. Un contact déjà connu (même e-mail ou même nom) est complété, jamais dupliqué ; ses notes et son historique sont conservés. Une adresse e-mail mal formée est ignorée avec un avertissement.

Une offre accepte aussi `"expiresAt"` (date limite annoncée, `YYYY-MM-DD`) : une fois dépassée, l'offre est marquée comme expirée sans attendre de vérification.

### Import et doublons

- Le texte collé peut contenir du texte autour du JSON : les blocs ```` ```json ```` puis les accolades équilibrées sont recherchés.
- Erreurs claires : JSON invalide (message du parseur), JSON valide mais sans clé attendue, éléments ignorés avec avertissement (offre sans titre ni URL, adresse invalide, date illisible, score hors bornes).
- Nettoyage à l'import : les valeurs de remplissage (« non disponible », « N/A »…) deviennent des champs vides ; seules les adresses `http(s)` sont conservées (`www.exemple.fr` est complétée en `https://`) ; le type de contrat est ramené à une valeur de la liste (« Contrat d'apprentissage » → « Apprentissage ») pour que les filtres fonctionnent.
- Doublons d'offres, par priorité : **1)** URL exacte, **2)** URL nettoyée (sans `utm_*`, `gclid`, `ref`…, `www.`, slash final), **3)** entreprise + intitulé + localisation. Cette dernière comparaison ignore la forme juridique (« Groupe Nébula SAS » = « Nebula »), les mentions de genre (« (H/F) », « alternant(e) ») et le détail du lieu (« Toulouse (31) » = « Toulouse, France »). Un doublon n'est jamais recréé : il complète l'offre existante (champs vides, analyse, lettres, état de l'annonce) sans toucher à vos statuts ni à vos notes.
- Importer depuis la fiche d'une offre rattache l'analyse, la vérification ou la lettre à cette offre. Depuis le bouton général, une analyse ou une lettre sans offre demande à quelle offre la rattacher.

## Prompts

Tous les prompts sont dans `src/prompts/` et se modifient facilement :

| Fichier | Rôle |
| --- | --- |
| `buildPrompt.ts` | `buildPrompt(template, data)` : remplace les `{{clés}}` (valeur absente → « Non renseigné ») ; `{{clé?}}` est un bloc facultatif, supprimé s'il est vide |
| `searchCompanies.ts`, `searchJobs.ts`, `findCompanyJobs.ts`, `verifyJob.ts`, `similarCompanies.ts` | recherches |
| `analyzeJob.ts` | analyse de compatibilité + entreprise + lettre |
| `generateCoverLetter.ts` | lettre, version courte, email, LinkedIn |
| `findContacts.ts` | recherche des interlocuteurs d'une entreprise (informations professionnelles publiées uniquement, aucune adresse devinée) |
| `contactMessage.ts` | message à une personne : candidature spontanée, prise de contact, relance, remerciement (réponse en texte, sans JSON) |
| `schemas.ts` | schémas JSON et règles communes (pas d'invention, sources, dates), et `SEARCH_METHOD` : la méthode de recherche d'alternance (vocabulaire à varier, sites à consulter, annonce d'origine, contrôles par offre) |
| `format.ts` | conversion profil / critères / offre / entreprise en texte, liste de ce qui est déjà suivi, date du jour |

## Structure

```
src/
  components/  Sidebar, Header, StatCard, JobTable, JobCard, KanbanBoard, CompanyTable, SearchFilters,
               ProfileForm, SearchCriteriaForm, PromptModal, ImportJsonModal, JobDetailsModal,
               StatusBadge, ScoreBadge, EmptyState, ConfirmDialog, Toast, ContactsSection,
               ProspectStatusSelect, BookmarkletInstall, …
  pages/       Dashboard, Profile, Criteria, Search, Prospection, Capture, Jobs, Kanban, Companies,
               CompanyDetail, Data
  hooks/       useStore (état + persistance), useToast, useUi (modales globales), useAutosave
  lib/         db.ts (IndexedDB + migrations), factories.ts, clipboard.ts
  services/    storage.ts, claudeParser.ts, claudeImport.ts, backup.ts,
               capture.ts (bouton de capture), companyDirectory.ts (registre des entreprises, API Géo)
  prompts/     modèles de prompts
  types/       Profile, SearchCriteria, Company, JobOffer, Application, ClaudeAnalysis, PromptResult,
               FollowUpTask, AppSettings, …
  utils/       dates, url, dedupe, csv, tasks, jobFilters, jobBoards, peopleSearch, contacts, availability, text
  data/        constantes (statuts…), données de démonstration, et sectors.ts : secteurs proposés
               en prospection (codes NAF) et tranches d'effectif
```

## Limites connues

- Pas de lecture automatique des offres ni du PDF (choix volontaire : aucun scraping, aucun envoi).
- Le bouton de capture dépend de ce que chaque site publie : la plupart des sites d'emploi fournissent des données d'offre structurées, mais pas tous. Sans elles, seuls le titre, l'adresse et le texte que vous aviez sélectionné sont repris. Il s'installe sur ordinateur (barre de favoris) et reste lié à l'adresse du site depuis lequel vous l'avez installé.
- La prospection cherche par secteur d'activité officiel (code NAF) et par commune ou département, pas par rayon kilométrique ; la distance affichée est indicative. La taille est celle de l'entreprise entière, pas de l'établissement local.
- Les recherches de personnes ouvrent LinkedIn ou Google : l'application ne lit pas les résultats, c'est à vous d'ajouter le contact retenu.
- Les données sont liées à un navigateur : passez par l'export/import JSON pour changer d'appareil.
