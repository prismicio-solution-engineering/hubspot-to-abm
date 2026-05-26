import type {
  Company,
  GeneratePagesContact,
  GeneratePagesPayload,
  HubSpotContextPropertySelection,
  PrismicDocumentMetadata,
  Segment,
  UiCompany,
  UiContact,
} from "./types";

function uiCompanyToCompany(c: UiCompany): Company {
  return {
    id: c.id,
    name: c.name,
    domain: c.domain,
    website: c.website,
    industry: c.industry,
    numberofemployees:
      c.numberOfEmployees != null ? String(c.numberOfEmployees) : undefined,
    city: c.city,
    country: c.country,
  };
}

function toPayloadContact(c: UiContact): GeneratePagesContact {
  const out: GeneratePagesContact = { id: c.id };
  if (c.firstName) out.firstName = c.firstName;
  if (c.lastName) out.lastName = c.lastName;
  if (c.associatedCompany?.name) out.company = c.associatedCompany.name;
  if (c.associatedCompany?.domain) out.companyDomain = c.associatedCompany.domain;
  if (c.associatedCompany?.industry) out.companyIndustry = c.associatedCompany.industry;
  if (c.jobTitle) out.jobTitle = c.jobTitle;
  if (c.associatedCompany) out.associatedCompany = uiCompanyToCompany(c.associatedCompany);
  return out;
}

export function buildPayload(
  contacts: readonly UiContact[],
  selectedIds: ReadonlySet<string>,
  prismicDocument: PrismicDocumentMetadata,
  segment: Segment,
  contextProperties: readonly HubSpotContextPropertySelection[] = [],
  now: Date = new Date(),
): GeneratePagesPayload {
  const selected = contacts
    .filter((c) => selectedIds.has(c.id))
    .map(toPayloadContact);

  const source: GeneratePagesPayload["source"] =
    segment.sourceId === "hubspot"
      ? {
          type: "hubspot_list",
          listId: segment.id,
          listName: segment.name,
          sourceId: "hubspot",
        }
      : {
          type: "salesforce_campaign",
          listId: segment.id,
          listName: segment.name,
          campaignId: segment.id,
          campaignName: segment.name,
          sourceId: "salesforce",
        };

  return {
    version: "1.0",
    generatedAt: now.toISOString(),
    target: {
      type: "prismic_document",
      documentId: prismicDocument.id,
      uid: prismicDocument.uid,
      customType: prismicDocument.type,
      lang: prismicDocument.lang,
    },
    source,
    contextProperties: contextProperties.filter((property) => property.name.length > 0),
    contacts: selected,
  };
}
