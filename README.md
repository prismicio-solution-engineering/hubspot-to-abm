# HubSpot Segments App

Outil interne Next.js 15 permettant de consulter les contacts de listes HubSpot prédéfinies, avec lien direct vers la fiche HubSpot de chaque contact.

- Lecture seule, pas de modification côté HubSpot.
- Authentification par mot de passe partagé (cookie httpOnly signé HMAC).
- Pas de base de données : tout est récupéré en direct depuis HubSpot.

## Stack

- Next.js 15 (App Router, TypeScript)
- Tailwind CSS
- `@hubspot/api-client` (via `Client.apiRequest`)
- Cookie signé HMAC-SHA256 (Web Crypto) + middleware Next.js

## 1. Créer la Private App HubSpot

1. Dans HubSpot, va dans **Settings → Integrations → Private Apps**.
2. Clique sur **Create a private app**.
3. Dans l'onglet **Scopes**, coche au minimum :
   - `crm.lists.read`
   - `crm.objects.contacts.read`
4. Crée l'app et copie l'**access token** (commence par `pat-`).

## 2. Récupérer `HUBSPOT_PORTAL_ID` et les IDs de listes

- **Portal ID** : visible dans l'URL quand tu es connecté à HubSpot, sous la forme `https://app.hubspot.com/contacts/<PORTAL_ID>/...`. C'est le numéro après `/contacts/`.
- **List ID** : va dans **Contacts → Lists**, ouvre la liste, l'URL contient `/lists/<PORTAL_ID>/list/<LIST_ID>/`. C'est le dernier numéro.

## 3. Configurer `.env.local`

Copie `.env.example` vers `.env.local` et remplis les valeurs :

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

## 5. Ajouter / retirer des segments

Édite `config/segments.ts` :

```ts
export const SEGMENTS = [
  { id: "12345", label: "Exemple segment 1" },
  { id: "67890", label: "Exemple segment 2" },
  { id: "99999", label: "Nouveau segment" },
] as const;
```

Le `id` doit être l'ID numérique HubSpot de la liste. Le `label` est libre et s'affiche dans le sélecteur. Le endpoint `/api/segments/[id]` refuse tout ID qui n'est pas dans cette liste (protection anti-IDOR).

## 6. Déployer sur Vercel

1. Pousse le projet sur un repo Git.
2. Sur Vercel, clique sur **New Project** et importe le repo.
3. Dans **Settings → Environment Variables**, ajoute les 4 variables de `.env.example` pour les environnements **Production**, **Preview** et **Development** (ou au moins Production et Preview) :
   - `HUBSPOT_ACCESS_TOKEN`
   - `HUBSPOT_PORTAL_ID`
   - `APP_PASSWORD`
   - `SESSION_SECRET`
4. Déploie. Vercel détecte automatiquement Next.js.

## Architecture & sécurité

- `lib/hubspot.ts` : wrapper `server-only`, centralise les appels HubSpot. Traduit 401/404/429 en messages clairs.
- `lib/session.ts` : création et vérification de cookies signés HMAC-SHA256 via Web Crypto (compatible Edge runtime).
- `middleware.ts` : vérifie la signature du cookie sur toutes les routes sauf `/login` et `/api/auth/login`. Les API renvoient 401 JSON, les pages sont redirigées vers `/login`.
- `app/api/segments/[id]/route.ts` : valide que l'ID est dans `SEGMENTS` avant d'appeler HubSpot, cache serveur 60 s (`export const revalidate = 60`).
- Le token HubSpot reste côté serveur — aucun appel HubSpot n'est fait depuis le navigateur.

## Build

```bash
npm run build
```
