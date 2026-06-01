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
  prismicRepository?: string;
  prismicMasterToken?: string;
  prismicWriteToken?: string;
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
