import type {
  Contact,
  GeneratePagesContact,
  GeneratePagesPayload,
} from "./types";

function toPayloadContact(c: Contact): GeneratePagesContact {
  const out: GeneratePagesContact = { id: c.id };
  if (c.firstname) out.firstName = c.firstname;
  if (c.lastname) out.lastName = c.lastname;
  if (c.company) out.company = c.company;
  if (c.jobtitle) out.jobTitle = c.jobtitle;
  return out;
}

export function buildPayload(
  contacts: readonly Contact[],
  selectedIds: ReadonlySet<string>,
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
    source: {
      type: "hubspot_list",
      listId,
      listName,
    },
    contacts: selected,
  };
}
