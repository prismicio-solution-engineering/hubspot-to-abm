import type {
  Contact,
  GeneratePagesContact,
  GeneratePagesPayload,
  PrismicDocumentMetadata,
} from "./types";

function toPayloadContact(c: Contact): GeneratePagesContact {
  const out: GeneratePagesContact = { id: c.id };
  if (c.firstname) out.firstName = c.firstname;
  if (c.lastname) out.lastName = c.lastname;
  if (c.company) out.company = c.company;
  if (c.associatedCompany?.domain) out.companyDomain = c.associatedCompany.domain;
  if (c.associatedCompany?.industry) out.companyIndustry = c.associatedCompany.industry;
  if (c.jobtitle) out.jobTitle = c.jobtitle;
  if (c.associatedCompany) out.associatedCompany = c.associatedCompany;
  return out;
}

export function buildPayload(
  contacts: readonly Contact[],
  selectedIds: ReadonlySet<string>,
  prismicDocument: PrismicDocumentMetadata,
  listId: string,
  listName: string,
  now: Date = new Date(),
): GeneratePagesPayload {
  const selected = contacts
    .filter((c) => selectedIds.has(c.id))
    .map(toPayloadContact);

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
    source: {
      type: "hubspot_list",
      listId,
      listName,
    },
    contacts: selected,
  };
}
