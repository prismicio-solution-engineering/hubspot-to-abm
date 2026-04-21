# HubSpot Segments Viewer

Outil interne Next.js 15 permettant de consulter, en lecture seule, les **Contacts** ou les **Companies** d'une liste HubSpot, avec lien direct vers la fiche de chaque record.

- Une seule page, deux modes de sélection : **recherche par nom** ou **collage d'une URL HubSpot**.
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

La page d'accueil expose deux champs, toujours visibles en parallèle :

- **Rechercher une liste par nom** : tape un nom (même partiel), valide avec Entrée ou clique sur *Rechercher*. Si un seul résultat correspond, la liste est chargée directement. Si plusieurs correspondent, un menu déroulant (≤ 10) s'affiche avec, pour chaque liste, son nom, un badge **Contacts** ou **Companies** et le nombre de records.
- **Coller l'URL d'une liste HubSpot** : copie l'URL d'une liste depuis HubSpot (format `https://app.hubspot.com/contacts/<portal>/lists/manager/<listId>/...` ou variantes), valide avec Entrée ou clique sur *Charger*. L'ID est extrait par regex et la liste vérifiée côté serveur.

Une fois une liste chargée, l'app affiche un en-tête (nom + badge de type + nombre de records) puis le tableau adapté :

- `objectType = contact` → colonnes Prénom, Nom, Email, Téléphone, Adresse, Entreprise, Poste + lien *Ouvrir ↗* vers la fiche.
- `objectType = company` → colonnes Nom, Domaine, Téléphone, Adresse, Industrie, Effectif, Site web + lien *Ouvrir ↗*.

La liste sélectionnée est conservée dans l'URL sous la forme `?listId=12345` (lien partageable). Le mode d'entrée (nom vs URL) n'est pas mémorisé : c'est toujours le **dernier champ validé qui gagne**.

## 6. Déployer sur Vercel

1. Pousse le projet sur un repo Git.
2. Sur Vercel, clique sur **New Project** et importe le repo.
3. Dans **Settings → Environment Variables**, ajoute pour Production / Preview :
   - `HUBSPOT_ACCESS_TOKEN`
   - `HUBSPOT_PORTAL_ID`
   - `APP_PASSWORD`
   - `SESSION_SECRET`
4. Déploie. Vercel détecte automatiquement Next.js.

## Architecture & sécurité

- `lib/hubspot.ts` : wrapper `server-only`. Expose `listAllLists`, `getListMetadata`, `getContactsForList`, `getCompaniesForList`. Traduit 401/403/404/422/429 en messages clairs.
- `lib/session.ts` : cookies signés HMAC-SHA256 via Web Crypto (compatible Edge runtime).
- `middleware.ts` : vérifie la signature du cookie sur toutes les routes sauf `/login` et `/api/auth/login`. Les API renvoient 401 JSON, les pages sont redirigées vers `/login`.
- `app/api/lists/search/route.ts` : `GET ?name=…`, paginé côté HubSpot, tri par pertinence (exact → prefix → contains), top 10. Cache serveur 5 min.
- `app/api/lists/[id]/route.ts` : `GET` métadonnées d'une liste (`id`, `name`, `objectType`, `size`). 422 si le type d'objet n'est ni contact ni company.
- `app/api/segments/[id]/route.ts` : auto-détecte le type via `getListMetadata`, puis fait le batch read correspondant. Retourne `{ type, records, listName, listSize }`. Cache serveur 60 s.
- Le token HubSpot reste côté serveur — aucun appel HubSpot depuis le navigateur.

## Générer un payload pour un agent IA

Depuis une liste de **contacts** (pas les companies), tu peux cocher un ou plusieurs contacts puis cliquer sur **Generate pages**. Une modale affiche le payload JSON prêt à envoyer, avec un bouton *Copier*.

Format (versionné, stable) :

```json
{
  "version": "1.0",
  "generatedAt": "2026-04-20T14:32:00.000Z",
  "source": { "type": "hubspot_list", "listId": "…", "listName": "…" },
  "contacts": [
    { "id": "123", "firstName": "Jean", "lastName": "Dupont", "company": "Acme", "jobTitle": "CMO" }
  ]
}
```

Les propriétés vides sont **omises** (pas de `null`, pas de chaîne vide) pour faciliter la consommation par l'agent IA. La fonction `buildPayload()` dans `lib/payload.ts` est pure et réutilisable.

### Évolution future

Quand le mode d'envoi à l'agent sera décidé, il suffira d'ajouter un endpoint `POST /api/generate-pages` qui reçoit ce même payload et le relaie. Côté UI, il n'y aura qu'à remplacer la copie manuelle par un `fetch`. Le champ `version: "1.0"` permet de faire évoluer le format sans casser les consommateurs.

## Build

```bash
npm run build
```
