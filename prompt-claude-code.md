# Prompt pour Claude Code

Crée une application web Next.js 15 (App Router, TypeScript) qui affiche les contacts de segments HubSpot prédéfinis. Voici les spécifications complètes.

## Objectif

Outil opérationnel interne permettant à une équipe de consulter les contacts contenus dans plusieurs listes HubSpot prédéfinies, avec accès direct vers la fiche HubSpot de chaque contact.

## Stack technique

- **Next.js 15** avec App Router et TypeScript
- **Tailwind CSS** pour le style (sobre, pas de lib de composants)
- **`@hubspot/api-client`** pour l'API HubSpot
- **Cookie httpOnly signé** pour la session
- **Middleware Next.js** pour la protection des routes
- Déploiement cible : **Vercel**

## Fonctionnalités

### 1. Authentification par mot de passe partagé
- Page `/login` avec un champ password.
- POST sur `/api/auth/login` qui compare avec `APP_PASSWORD` via `crypto.timingSafeEqual` (anti-timing attack).
- Si OK : set un cookie `session` httpOnly, secure, sameSite=lax, durée 7 jours, signé avec `SESSION_SECRET` (HMAC-SHA256).
- Route `/api/auth/logout` qui clear le cookie.
- Middleware (`middleware.ts`) qui protège toutes les routes sauf `/login`, `/api/auth/login`, et les assets statiques. Redirige vers `/login` si cookie absent ou invalide.

### 2. Sélecteur de segments
- Liste des segments curée dans `config/segments.ts` :
  ```ts
  export const SEGMENTS = [
    { id: "12345", label: "Exemple segment 1" },
    { id: "67890", label: "Exemple segment 2" },
  ] as const;
  ```
- Composant `<SegmentSelector>` : un `<select>` Tailwind qui liste ces segments.
- Le segment sélectionné est conservé dans l'URL via un query param `?segment=ID` pour permettre le partage de lien et le rafraîchissement.

### 3. Affichage des contacts
- Au changement de segment, fetch côté client vers `/api/segments/[id]`.
- Le endpoint serveur :
  1. Récupère les memberships de la liste via `GET /crm/v3/lists/{listId}/memberships` (ou équivalent SDK).
  2. Fait un batch read des contacts via `POST /crm/v3/objects/contacts/batch/read` en demandant les propriétés : `firstname`, `lastname`, `email`, `phone`, `address`, `city`, `zip`, `country`, `company`, `jobtitle`.
  3. Renvoie un JSON typé `{ contacts: Contact[] }`.
- Composant `<ContactsTable>` : tableau Tailwind avec colonnes Prénom, Nom, Email, Téléphone, Adresse (concat address + city + zip + country), Entreprise, Poste, et une colonne "Ouvrir" avec un lien externe.
- États : loading (skeleton ou spinner Tailwind), erreur (message clair), vide (« Aucun contact dans ce segment »).
- Le segment contient ~100 contacts max, donc pas besoin de pagination ni virtualisation.

### 4. Lien vers HubSpot
- Chaque ligne a un lien vers `https://app.hubspot.com/contacts/{HUBSPOT_PORTAL_ID}/contact/{contactId}` ouvert en `target="_blank" rel="noopener noreferrer"`.

## Variables d'environnement

Crée un `.env.example` avec :
```
HUBSPOT_ACCESS_TOKEN=pat-xxx-xxxxxxxx
HUBSPOT_PORTAL_ID=12345678
APP_PASSWORD=change-me
SESSION_SECRET=generate-a-long-random-string
```

Et un `.env.local` (gitignoré) avec des valeurs de placeholder.

## Structure de fichiers attendue

```
.
├── .env.example
├── .env.local
├── .gitignore
├── README.md
├── middleware.ts
├── config/
│   └── segments.ts
├── lib/
│   ├── hubspot.ts          # Wrapper API HubSpot (server-only)
│   ├── session.ts          # Sign/verify cookie
│   └── types.ts            # Types Contact, Segment
├── app/
│   ├── layout.tsx
│   ├── page.tsx            # Server Component : layout + SegmentSelector
│   ├── globals.css
│   ├── login/
│   │   └── page.tsx
│   └── api/
│       ├── auth/
│       │   ├── login/route.ts
│       │   └── logout/route.ts
│       └── segments/
│           └── [id]/route.ts
└── components/
    ├── SegmentSelector.tsx  # Client component
    ├── ContactsTable.tsx    # Client component
    └── LogoutButton.tsx     # Client component
```

## Exigences de sécurité

- Le token HubSpot ne doit **jamais** apparaître côté client. Tous les appels HubSpot se font dans des Route Handlers ou Server Components.
- Marque `lib/hubspot.ts` avec `import "server-only"` au top du fichier.
- Le middleware vérifie la signature HMAC du cookie, pas juste sa présence.
- Le endpoint `/api/segments/[id]` valide que l'ID demandé est bien dans `SEGMENTS` avant tout appel HubSpot (anti-IDOR).

## Performance et fiabilité

- Sur les Route Handlers HubSpot, ajoute `export const revalidate = 60` pour mettre en cache 1 min.
- Gère proprement les erreurs HubSpot (401 = token invalide, 404 = liste introuvable, 429 = rate limit) avec des messages clairs renvoyés au client.
- Type strictement les réponses HubSpot avec une interface `Contact`.

## UI / UX

- Layout minimaliste : header avec titre de l'app + bouton logout à droite, puis le sélecteur, puis le tableau.
- Tailwind brut, palette sobre (gris/blanc, accent bleu), responsive (le tableau scroll horizontalement sur mobile).
- Aucune lib UI externe (pas de shadcn, pas de Mantine).

## Livrables

1. Le code complet de l'app, prêt à `npm install && npm run dev`.
2. Un `README.md` qui explique :
   - Comment créer la Private App HubSpot et récupérer le token (scopes `crm.lists.read` et `crm.objects.contacts.read`).
   - Comment trouver l'ID d'une liste et le `portalId`.
   - Comment configurer `.env.local`.
   - Comment ajouter/retirer des segments dans `config/segments.ts`.
   - Comment déployer sur Vercel (en ajoutant les vars d'env dans le dashboard).

## Ce qu'il ne faut PAS faire

- Pas d'export CSV (volontairement exclu).
- Pas de modification de contacts depuis l'app (lecture seule).
- Pas d'authentification multi-utilisateurs (un seul mot de passe partagé suffit).
- Pas de base de données (tout vient de HubSpot en direct).
- Pas de pagination côté UI (les segments font moins de 100 contacts).

Commence par initialiser le projet, puis implémente dans cet ordre : config + types → wrapper HubSpot → auth + middleware → page principale + composants. Vérifie que `npm run build` passe sans erreur à la fin.
