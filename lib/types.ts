export type ObjectType = "contact" | "company";

export interface HubSpotList {
  id: string;
  name: string;
  objectType: ObjectType;
  size: number;
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
