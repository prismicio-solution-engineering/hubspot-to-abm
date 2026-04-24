# ABM Campaigns

Outil interne Next.js 15 pour préparer des campagnes ABM à partir d'un document Prismic et de listes HubSpot : sélection d'un document cible, sélection d'un segment, choix des contacts, génération d'un payload JSON prêt à envoyer à un agent IA.

- Flow par étapes (wizard) avec indicateur d'étapes, routé par query param (`?step=…`).
- Sélection d'un document Prismic cible par collage d'URL.
- Deux modes de sélection d'un segment : **recherche par nom** ou **collage d'une URL HubSpot**.
- Le type d'objet (contact ou company) est **auto-détecté** à partir des métadonnées de la liste.
- Authentification par mot de passe partagé (cookie httpOnly signé HMAC).
- Pas de base de données : tout est récupéré en direct depuis HubSpot.

## Stack

- Next.js 15 (App Router, TypeScript)
- Tailwind CSS
- `@hubspot/api-client` (via `Client.apiRequest`)
- Cookie signé HMAC-SHA256 (Web Crypto) + middleware Next.js

## 1. Créer la Private App HubSpot

1. Dans HubSpot, va dans **Settings → Integrations → Private Apps**.
2. Clique sur **Create a private app** (ou ouvre l'app existante).
3. Dans l'onglet **Scopes**, coche **obligatoirement** :
   - `crm.lists.read`
   - `crm.objects.contacts.read`
   - `crm.objects.companies.read`
4. Crée l'app (ou clique **Save**) et copie l'**access token** (commence par `pat-`).

### Mettre à jour une Private App existante

Si tu avais déjà installé l'app sans le scope companies :

1. Ouvre la Private App dans HubSpot.
2. Onglet **Scopes** → ajoute `crm.objects.companies.read`.
3. Clique **Save** en haut à droite. Le token reste inchangé.

## 2. Récupérer `HUBSPOT_PORTAL_ID`

**Portal ID** : visible dans l'URL quand tu es connecté à HubSpot, sous la forme `https://app.hubspot.com/contacts/<PORTAL_ID>/...`. C'est le numéro après `/contacts/`.

Aucun ID de liste à configurer manuellement : l'app lit les métadonnées au besoin.

## 3. Configurer `.env.local`

```bash
cp .env.example .env.local
```

```
HUBSPOT_ACCESS_TOKEN=pat-xxx-xxxxxxxx
HUBSPOT_PORTAL_ID=12345678
APP_PASSWORD=un-mot-de-passe-fort
SESSION_SECRET=une-longue-chaine-aleatoire-32-chars-min
PRISMIC_REPOSITORY=template-landing
PRISMIC_MASTER_TOKEN=MC5...
```

Pour générer un `SESSION_SECRET` solide :

```bash
openssl rand -hex 32
```

## 4. Lancer en local

```bash
npm install
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000). Tu es redirigé vers `/login`. Entre le mot de passe configuré dans `.env.local`.

## 5. Utilisation

Après login, l'utilisateur arrive sur la page d'accueil **ABM Campaigns** (CTA *Start generating*) qui le lance dans un flow par étapes à `/campaigns/new?step=<id>` :

1. **Select your Prismic Document** — Collage d'une URL de document Prismic. L'app extrait l'ID du document, récupère le master ref, puis charge uniquement les métadonnées du document via l'API Prismic.
2. **Select your HubSpot Segment** — Deux modes de sélection (recherche par nom / collage d'URL). Une fois un segment choisi, il s'affiche dans un container "Selected segment" avec un bouton *Change*, puis *Continue* mène à l'étape suivante.
3. **Select contacts** — Tableau des contacts de la liste, sélection jusqu'à 20 contacts, bouton *Generate pages* qui lance l'agent OpenAI.
4. **Review ABM Recommendations** — Affiche les recommandations générées sous forme de cartes avec les champs structurés et un bouton *Copy JSON*.

Un indicateur d'étapes (stepper numéroté) est visible tout au long du flow. Les étapes validées apparaissent en bleu avec une coche ; l'étape courante est mise en évidence ; les étapes futures sont grisées. Le seul moyen de revenir en arrière est via le bouton *Précédent* dans chaque étape.

L'état de la campagne en cours est conservé dans un contexte React (`lib/campaign-context.tsx`) pour toute la durée du flow. Un rafraîchissement de la page repart à l'étape 1 (pas de persistance pour l'instant).

## 6. Déployer sur Vercel

1. Pousse le projet sur un repo Git.
2. Sur Vercel, clique sur **New Project** et importe le repo.
3. Dans **Settings → Environment Variables**, ajoute pour Production / Preview :
   - `HUBSPOT_ACCESS_TOKEN`
   - `HUBSPOT_PORTAL_ID`
   - `APP_PASSWORD`
   - `SESSION_SECRET`
   - `PRISMIC_REPOSITORY`
   - `PRISMIC_MASTER_TOKEN`
4. Déploie. Vercel détecte automatiquement Next.js.

## Architecture & sécurité

- `lib/hubspot.ts` : wrapper `server-only`. Expose `listAllLists`, `getListMetadata`, `getContactsForList`, `getCompaniesForList`. Traduit 401/403/404/422/429 en messages clairs.
- `lib/prismic.ts` : wrapper `server-only`. Lit `PRISMIC_REPOSITORY` et `PRISMIC_MASTER_TOKEN`, récupère le master ref, puis cherche un document par ID.
- `lib/session.ts` : cookies signés HMAC-SHA256 via Web Crypto (compatible Edge runtime).
- `middleware.ts` : vérifie la signature du cookie sur toutes les routes sauf `/login` et `/api/auth/login`. Les API renvoient 401 JSON, les pages sont redirigées vers `/login`.
- `app/api/lists/search/route.ts` : `GET ?name=…`, paginé côté HubSpot, tri par pertinence (exact → prefix → contains), top 10. Cache serveur 5 min.
- `app/api/lists/[id]/route.ts` : `GET` métadonnées d'une liste (`id`, `name`, `objectType`, `size`). 422 si le type d'objet n'est ni contact ni company.
- `app/api/prismic/documents/[id]/route.ts` : `GET` document Prismic par ID. Retourne le JSON normalisé du document et son `data`.
- `app/api/segments/[id]/route.ts` : auto-détecte le type via `getListMetadata`, puis fait le batch read correspondant. Retourne `{ type, records, listName, listSize }`. Cache serveur 60 s.
- Le token HubSpot reste côté serveur — aucun appel HubSpot depuis le navigateur.

## Générer un payload pour un agent IA

Depuis une liste de **contacts** (pas les companies), tu peux cocher un ou plusieurs contacts puis cliquer sur **Generate pages**. L'app appelle alors `/api/generate-pages`, récupère le document Prismic complet côté serveur, lance l'agent OpenAI avec web search, puis affiche le JSON de recommandation avec un bouton *Copier*.

Format (versionné, stable) :

```json
{
  "version": "1.0",
  "generatedAt": "2026-04-20T14:32:00.000Z",
  "target": { "type": "prismic_document", "documentId": "…", "uid": "landing-page", "customType": "page", "lang": "en-us" },
  "source": { "type": "hubspot_list", "listId": "…", "listName": "…" },
  "contacts": [
    { "id": "123", "firstName": "Jean", "lastName": "Dupont", "company": "Acme", "jobTitle": "CMO" }
  ]
}
```

Les propriétés vides sont **omises** (pas de `null`, pas de chaîne vide) pour faciliter la consommation par l'agent IA. La fonction `buildPayload()` dans `lib/payload.ts` est pure et réutilisable.

### Évolution future

Le champ `version: "1.0"` permet de faire évoluer le format sans casser les consommateurs. L'envoi à Prismic n'est pas encore implémenté : pour l'instant, l'endpoint retourne la recommandation JSON générée par OpenAI.

## Architecture du flow par étapes

Le flow est piloté par une unique source de configuration : `lib/campaign-flow.ts`. Toute la mécanique (stepper, routeur d'étape, navigation) s'adapte automatiquement à cette liste.

```
app/
├── page.tsx                          # Landing "ABM Campaigns"
└── campaigns/new/
    ├── layout.tsx                    # <CampaignProvider> + <StepIndicator>
    └── page.tsx                      # <Suspense> autour du routeur d'étape
components/
├── CampaignStepRouter.tsx            # Lit ?step=… et rend l'étape correspondante
├── StepIndicator.tsx                 # Stepper numéroté
└── steps/
    ├── SelectSegmentStep.tsx
    └── SelectContactsStep.tsx
lib/
├── campaign-flow.ts                  # CAMPAIGN_STEPS (config des étapes)
└── campaign-context.tsx              # CampaignProvider / useCampaign
```

### Ajouter une nouvelle étape

1. Créer le composant dans `components/steps/NewStep.tsx`.
2. L'ajouter à `CAMPAIGN_STEPS` dans `lib/campaign-flow.ts` (id, number, label, title, Component).

Le stepper, le routeur d'étape et la navigation s'adaptent sans autre modification. Les composants d'étape ne connaissent pas leur position dans le flow : ils consomment `useCampaign()` pour l'état partagé et naviguent via `router.push("?step=...")`.

### Ajouter un champ à l'état de la campagne

1. Ajouter le champ dans `CampaignState` (`lib/campaign-context.tsx`).
2. Ajouter un setter dans `CampaignProvider`.
3. Consommer via `useCampaign()` dans l'étape concernée.

### Persistance (évolution future)

L'état vit actuellement en mémoire (rechargement = retour à l'étape 1). Pour ajouter la persistance (localStorage, session, API, DB), il suffira de modifier `CampaignProvider` pour lire/écrire dans le store cible. Les composants qui consomment `useCampaign()` n'auront rien à changer.

## Build

```bash
npm run build
```
