export type ObjectType = "contact" | "company";

export interface HubSpotList {
  id: string;
  name: string;
  objectType: ObjectType;
  size: number;
}

// ----- CRM source abstraction -----

/** Identifier for the CRM source. Extend this union when adding new CRMs. */
export type ContactSourceId = "hubspot" | "salesforce";

/** Neutral segment shape consumed by UI components. */
export interface Segment {
  id: string;
  name: string;
  objectType: ObjectType;
  size: number;
  sourceId: ContactSourceId;
  /** Original raw record kept for debugging / source-specific access if needed. */
  raw?: unknown;
}

/** Neutral contact shape consumed by UI components.
 *  Use this only in code that should work across CRMs.
 *  HubSpot-specific code can continue to use the existing `Contact` type. */
export interface UiContact {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  jobTitle?: string;
  department?: string;
  city?: string;
  country?: string;
  sourceId: ContactSourceId;
  associatedCompany?: UiCompany;
}

export interface UiCompany {
  id: string;
  name?: string;
  domain?: string;
  website?: string;
  industry?: string;
  numberOfEmployees?: number;
  annualRevenue?: number;
  city?: string;
  country?: string;
  sourceId: ContactSourceId;
}

/** Neutral contacts response — replaces the per-source ContactsResponse for new code. */
export interface UiContactsResponse {
  type: "contact";
  records: UiContact[];
  segmentName: string;
  segmentSize: number;
  sourceId: ContactSourceId;
}

export interface UiCompaniesResponse {
  type: "company";
  records: UiCompany[];
  segmentName: string;
  segmentSize: number;
  sourceId: ContactSourceId;
}

export type UiRecordsResponse = UiContactsResponse | UiCompaniesResponse;

export interface PrismicDocumentMetadata {
  id: string;
  uid: string | null;
  type: string;
  lang: string;
  url: string | null;
  firstPublicationDate: string | null;
  lastPublicationDate: string | null;
  metaTitle: string | null;
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
  address?: string;
  city?: string;
  zip?: string;
  country?: string;
  company?: string;
  jobtitle?: string;
  associatedCompany?: Company;
}

export interface Company {
  id: string;
  name?: string;
  domain?: string;
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
  companyDomain?: string;
  companyIndustry?: string;
  jobTitle?: string;
  associatedCompany?: Company;
  companyContextProperties?: GeneratePagesCompanyContextProperty[];
}

export interface HubSpotContextPropertySelection {
  name: string;
  label: string;
  type: string;
  fieldType?: string;
  groupName: string;
  hubspotDefined: boolean;
  instruction: string;
}

export interface GeneratePagesCompanyContextProperty {
  propertyName: string;
  propertyValue: string | null;
  "How to use it": string;
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
    type: "hubspot_list" | "salesforce_campaign";
    listId: string;
    listName: string;
    campaignId?: string;
    campaignName?: string;
    sourceId?: ContactSourceId;
  };
  contextProperties?: HubSpotContextPropertySelection[];
  contacts: GeneratePagesContact[];
}

export interface RecommendationItem {
  companyName: string;
  firstName: string;
  lastName: string;
  position: string;
  challenges: string[];
  specificPainPoints: string[];
  personalizedInstructions: string;
}

export interface RecommendationResponse {
  recommendationItems: RecommendationItem[];
}

export interface PrismicGenerationResult {
  release: {
    id: string;
    label: string;
    url: string;
  };
  items: Array<{
    companyName: string;
    ok: boolean;
    response: unknown;
    error?: string;
  }>;
}
