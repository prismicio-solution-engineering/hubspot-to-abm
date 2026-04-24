# ABM Campaigns

Internal Next.js 15 tool for preparing ABM campaigns from HubSpot lists: segment selection, contact selection, and generation of a JSON payload ready to be sent to an AI agent.

- Step-by-step flow (wizard) with a step indicator, routed via a query param (`?step=…`).
- Two segment selection modes: **search by name** or **paste a HubSpot URL**.
- The object type (contact or company) is **auto-detected** from the list metadata.
- Authentication via a shared password (HMAC-signed httpOnly cookie).
- No database: everything is fetched live from HubSpot.

## Stack

- Next.js 15 (App Router, TypeScript)
- Tailwind CSS
- `@hubspot/api-client` (via `Client.apiRequest`)
- HMAC-SHA256 signed cookie (Web Crypto) + Next.js middleware

## 1. Create the HubSpot Private App

1. In HubSpot, go to **Settings → Integrations → Private Apps**.
2. Click **Create a private app** (or open the existing app).
3. In the **Scopes** tab, **you must** check:
   - `crm.lists.read`
   - `crm.objects.contacts.read`
   - `crm.objects.companies.read`
4. Create the app (or click **Save**) and copy the **access token** (starts with `pat-`).

### Updating an existing Private App

If you had already installed the app without the companies scope:

1. Open the Private App in HubSpot.
2. **Scopes** tab → add `crm.objects.companies.read`.
3. Click **Save** at the top right. The token remains unchanged.

## 2. Get `HUBSPOT_PORTAL_ID`

**Portal ID**: visible in the URL when you're logged into HubSpot, in the form `https://app.hubspot.com/contacts/<PORTAL_ID>/...`. It's the number after `/contacts/`.

No list ID needs to be configured manually: the app reads metadata as needed.

## 3. Configure `.env.local`

```bash
cp .env.example .env.local
```

```
HUBSPOT_ACCESS_TOKEN=pat-xxx-xxxxxxxx
HUBSPOT_PORTAL_ID=12345678
APP_PASSWORD=a-strong-password
SESSION_SECRET=a-long-random-string-at-least-32-chars
```

To generate a strong `SESSION_SECRET`:

```bash
openssl rand -hex 32
```

## 4. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll be redirected to `/login`. Enter the password configured in `.env.local`.

## 5. Usage

After logging in, the user lands on the **ABM Campaigns** homepage (CTA *Start generating*), which launches a step-by-step flow at `/campaigns/new?step=<id>`:

1. **Select your HubSpot Segment** — Two selection modes (search by name / paste URL). Once a segment is chosen, it's displayed in a "Selected segment" container with a *Change* button, then *Continue* moves to the next step.
2. **Select contacts** — Table of the list's contacts, selection of up to 20 contacts, *Generate pages* button that opens the JSON modal. *Back* button to return to step 1.

A step indicator (numbered stepper) is visible throughout the flow. Completed steps appear in blue with a checkmark; the current step is highlighted; future steps are greyed out. The only way to go back is via the *Back* button in each step.

The state of the ongoing campaign is kept in a React context (`lib/campaign-context.tsx`) for the entire duration of the flow. Refreshing the page restarts from step 1 (no persistence for now).

## 6. Deploy to Vercel

1. Push the project to a Git repo.
2. On Vercel, click **New Project** and import the repo.
3. In **Settings → Environment Variables**, add for Production / Preview:
   - `HUBSPOT_ACCESS_TOKEN`
   - `HUBSPOT_PORTAL_ID`
   - `APP_PASSWORD`
   - `SESSION_SECRET`
4. Deploy. Vercel automatically detects Next.js.

## Architecture & security

- `lib/hubspot.ts`: `server-only` wrapper. Exposes `listAllLists`, `getListMetadata`, `getContactsForList`, `getCompaniesForList`. Translates 401/403/404/422/429 into clear messages.
- `lib/session.ts`: HMAC-SHA256 signed cookies via Web Crypto (Edge runtime compatible).
- `middleware.ts`: verifies the cookie signature on all routes except `/login` and `/api/auth/login`. APIs return 401 JSON, pages are redirected to `/login`.
- `app/api/lists/search/route.ts`: `GET ?name=…`, paginated on the HubSpot side, sorted by relevance (exact → prefix → contains), top 10. Server cache 5 min.
- `app/api/lists/[id]/route.ts`: `GET` metadata for a list (`id`, `name`, `objectType`, `size`). 422 if the object type is neither contact nor company.
- `app/api/segments/[id]/route.ts`: auto-detects the type via `getListMetadata`, then performs the corresponding batch read. Returns `{ type, records, listName, listSize }`. Server cache 60 s.
- The HubSpot token stays on the server — no HubSpot calls from the browser.

## Generating a payload for an AI agent

From a list of **contacts** (not companies), you can check one or more contacts and then click **Generate pages**. A modal displays the ready-to-send JSON payload, with a *Copy* button.

Format (versioned, stable):

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

Empty properties are **omitted** (no `null`, no empty string) to make consumption by the AI agent easier. The `buildPayload()` function in `lib/payload.ts` is pure and reusable.

### Future evolution

Once the delivery mode to the agent is decided, all that's needed is to add a `POST /api/generate-pages` endpoint that receives this same payload and relays it. On the UI side, the manual copy will simply be replaced with a `fetch`. The `version: "1.0"` field allows the format to evolve without breaking consumers.

## Step-by-step flow architecture

The flow is driven by a single source of configuration: `lib/campaign-flow.ts`. The entire mechanism (stepper, step router, navigation) adapts automatically to this list.

```
app/
├── page.tsx                          # "ABM Campaigns" landing
└── campaigns/new/
    ├── layout.tsx                    # <CampaignProvider> + <StepIndicator>
    └── page.tsx                      # <Suspense> around the step router
components/
├── CampaignStepRouter.tsx            # Reads ?step=… and renders the matching step
├── StepIndicator.tsx                 # Numbered stepper
└── steps/
    ├── SelectSegmentStep.tsx
    └── SelectContactsStep.tsx
lib/
├── campaign-flow.ts                  # CAMPAIGN_STEPS (step config)
└── campaign-context.tsx              # CampaignProvider / useCampaign
```

### Adding a new step

1. Create the component in `components/steps/NewStep.tsx`.
2. Add it to `CAMPAIGN_STEPS` in `lib/campaign-flow.ts` (id, number, label, title, Component).

The stepper, step router, and navigation adapt with no other changes required. Step components don't know their position in the flow: they consume `useCampaign()` for shared state and navigate via `router.push("?step=...")`.

### Adding a field to the campaign state

1. Add the field in `CampaignState` (`lib/campaign-context.tsx`).
2. Add a setter in `CampaignProvider`.
3. Consume via `useCampaign()` in the relevant step.

### Persistence (future evolution)

State currently lives in memory (reload = back to step 1). To add persistence (localStorage, session, API, DB), simply modify `CampaignProvider` to read/write to the target store. Components that consume `useCampaign()` won't need any changes.

## Build

```bash
npm run build
```