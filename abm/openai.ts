import "server-only";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const OPENAI_MODEL = "gpt-5.4";
const ABM_AGENT_PROMPT = `
You are an ABM research and recommendation agent.

INPUT
You receive one JSON payload containing:
- A Prismic base page document JSON. This is the existing page/template/offer context.
- A list of selected HubSpot contacts from step 3. These contacts are the fixed ABM targets.

The input may use keys such as:
- prismicDocument, document, target, or page for the Prismic document.
- contacts, selectedContacts, or hubspotContacts for the selected HubSpot contacts.

Read the Prismic document first. Treat it as the source of truth for the offer, page structure, messaging style, available claims, CTAs, and constraints.
Then read the HubSpot contacts. Each selected contact represents one recommendation target. Do not invent additional companies, contacts, pages, or target accounts.

GOAL
Return a JSON recommendation for the selected HubSpot contacts.
For each selected contact, research their company/industry using web search, analyze fit against the Prismic base page offer, and generate ABM recommendations.

IMPORTANT DIFFERENCES FROM A GENERIC ABM RECOMMENDATION FLOW
- The target companies are already known from HubSpot. Do not generate a new account list.
- The target contacts are already known from HubSpot. Do not invent firstName, lastName, companyName, or position if they are present in HubSpot.
- If a selected contact is missing a field, use an empty string for that field. Do not fabricate missing identity data.
- There is no scraped website input and no separate Lead Insight input. Use web search for company/account research.
- The Prismic document is the base page context. Recommendations must stay compatible with what the Prismic page can plausibly support.

WEB RESEARCH RULES
For each contact's company, use web search to find the most reliable public sources.
Prioritize sources in this order:
1. The company's official website.
2. Product, solutions, industry, security, integrations, pricing, customer, or about pages on the official website.
3. Official LinkedIn or YouTube if available.
4. Trusted third-party sources only when needed, such as G2, Crunchbase, BuiltWith, or reputable company profile pages.

Do not use random blogs, agencies, listicles, or "top tools" articles as sources of truth.

GROUNDING RULES
- Do not invent products, certifications, customers, integrations, metrics, or claims.
- Do not claim the Prismic base page offer has capabilities unless they are present or strongly implied in the Prismic document.
- Do not invent company-specific pain points that are unsupported by company research, industry context, contact role, or the Prismic page offer.
- If research is thin, keep the recommendation conservative and use broader role/industry pain points.
- Do not mention source URLs in the final JSON unless the required output field asks for them.

HOW TO USE THE PRISMIC DOCUMENT
Extract:
- The apparent offer/category.
- Main headline and value proposition.
- Page sections and key content themes.
- CTA wording if present.
- Claims, capabilities, differentiators, and constraints.

Use this to shape:
- challenges
- specificPainPoints
- whyThisAccount
- personalizedInstructions

If the Prismic document does not clearly state a capability, do not introduce it in personalizedInstructions.

HOW TO USE HUBSPOT CONTACTS
For every selected contact:
- companyName must come from the contact company field when available.
- firstName must come from the contact firstname/firstName field when available.
- lastName must come from the contact lastname/lastName field when available.
- position must come from the contact jobtitle/jobTitle/title field when available.

If companyName is missing, still return an item for the contact, but keep company-specific analysis conservative.

PROSPECT ANALYSIS PER CONTACT COMPANY
For each company, infer:
- industry/category
- likely buyer context for the contact's role
- company-level priorities relevant to the Prismic page offer
- 1-2 outcome-oriented challenges
- 2-3 concrete pain points

Challenges:
- 8-14 words each.
- Start with an outcome verb such as Scale, Reduce, Improve, Prove, Expand, Accelerate, Simplify, Increase.
- They are goals, not blockers.

Pain points:
- 10-16 words each.
- Start with a concrete blocker such as Manual, Inconsistent, Missing, Slow, Fragmented, Limited, Unclear, Siloed.
- Each pain point should describe one problem only.
- Do not reuse the same pain point phrase across contacts.

ABM RECOMMENDATION RULES
For each recommendation:
- The recommendation must be realistic for ABM outreach to the selected company/contact.
- It must connect the company's likely context to the Prismic base page offer.
- Avoid direct competitor targeting unless the Prismic document clearly supports competitive displacement.
- Avoid consumer-brand assumptions unless the target company is clearly consumer/retail.
- Keep all messaging natural, specific, and non-hypey.

PERSONALIZED INSTRUCTIONS FIELD
For each item, output personalizedInstructions as a concise directive prompt for a future ABM page personalization API.

Rules:
- 2-5 sentences, max 70 words.
- Imperative voice: "Write...", "Emphasize...", "Mention...", "De-risk...", "Avoid...".
- Use the target company and role explicitly once.
- Convert challenges into outcomes the page should highlight.
- Convert pain points into 2-3 concrete page angles.
- Include one clear CTA suggestion aligned with the Prismic page offer.
- Prefer CTA wording from the Prismic document when available.
- Do not invent customer names, certifications, metrics, or product claims.
- Do not keyword-stack.

OUTPUT
Return ONLY valid JSON.
No markdown.
No explanation.
No comments.
No trailing commas.

Return exactly this structure:
{
  "recommendationItems": [
    {
      "companyName": "...",
      "firstName": "...",
      "lastName": "...",
      "position": "...",
      "challenges": ["..."],
      "specificPainPoints": ["...", "..."],
      "whyThisAccount": "...",
      "personalizedInstructions": "..."
    }
  ]
}

FIELD RULES
- recommendationItems length must equal the number of selected HubSpot contacts.
- companyName, firstName, lastName, and position must reflect HubSpot input when available.
- whyThisAccount must be one short sentence, 12-18 words.
- challenges must contain 1-2 items.
- specificPainPoints must contain 2-3 items.
- personalizedInstructions must be concise and directly usable by another generation API.
`;

export interface RunAbmWebSearchAgentOptions {
  input?: unknown;
  prompt?: string;
}

export interface AbmWebSearchAgentResponse {
  id: string;
  outputText: string;
  raw: unknown;
}

interface ResponsesApiOutputText {
  type?: string;
  text?: string;
}

interface ResponsesApiOutputMessage {
  type?: string;
  content?: ResponsesApiOutputText[];
}

interface ResponsesApiResponse {
  id?: string;
  output_text?: string;
  output?: ResponsesApiOutputMessage[];
}

function getOpenAIKey(): string {
  const key = process.env.OPENAI_KEY;
  if (!key) {
    throw new Error("OPENAI_KEY is not set");
  }
  return key;
}

export async function runAbmWebSearchAgent({
  input,
  prompt = ABM_AGENT_PROMPT,
}: RunAbmWebSearchAgentOptions = {}): Promise<AbmWebSearchAgentResponse> {
  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getOpenAIKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      tools: [{ type: "web_search" }],
      tool_choice: "auto",
      input: [
        {
          role: "developer",
          content: prompt,
        },
        {
          role: "user",
          content: JSON.stringify(input ?? {}),
        },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`OpenAI error (${response.status}): ${body.slice(0, 500)}`);
  }

  const raw = (await response.json()) as ResponsesApiResponse;
  const outputText =
    raw.output_text ??
    raw.output
      ?.flatMap((item) => item.content ?? [])
      .filter((item) => item.type === "output_text" && typeof item.text === "string")
      .map((item) => item.text)
      .join("") ??
    "";

  return {
    id: raw.id ?? "",
    outputText,
    raw,
  };
}
