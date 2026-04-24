export type ObjectType = "contact" | "company";

export interface HubSpotList {
  id: string;
  name: string;
  objectType: ObjectType;
  size: number;
}

export interface PrismicDocumentMetadata {
  id: string;
  uid: string | null;
  type: string;
  lang: string;
  url: string | null;
  firstPublicationDate: string | null;
  lastPublicationDate: string | null;
}

export interface PrismicDocument extends PrismicDocumentMetadata {
  data: unknown;
  raw: unknown;
}

export interface Contact {
  id: string;
  firstname?: string;
  lastname?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  zip?: string;
  country?: string;
  company?: string;
  jobtitle?: string;
}

export interface Company {
  id: string;
  name?: string;
  domain?: string;
  phone?: string;
  address?: string;
  city?: string;
  zip?: string;
  country?: string;
  industry?: string;
  numberofemployees?: string;
  website?: string;
}

export type ContactsResponse = {
  type: "contact";
  records: Contact[];
  listName: string;
  listSize: number;
};
export type CompaniesResponse = {
  type: "company";
  records: Company[];
  listName: string;
  listSize: number;
};
export type RecordsResponse = ContactsResponse | CompaniesResponse;

export interface SearchResponse {
  lists: HubSpotList[];
}

export interface ErrorResponse {
  error: string;
}

export interface GeneratePagesContact {
  id: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  jobTitle?: string;
}

export interface GeneratePagesPayload {
  version: "1.0";
  generatedAt: string;
  target: {
    type: "prismic_document";
    documentId: string;
    uid: string | null;
    customType: string;
    lang: string;
  };
  source: {
    type: "hubspot_list";
    listId: string;
    listName: string;
  };
  contacts: GeneratePagesContact[];
}
