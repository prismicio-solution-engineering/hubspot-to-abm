export interface Contact {
  id: string;
  firstname: string | null;
  lastname: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  zip: string | null;
  country: string | null;
  company: string | null;
  jobtitle: string | null;
}

export interface Segment {
  id: string;
  label: string;
}

export interface ContactsResponse {
  contacts: Contact[];
}

export interface ErrorResponse {
  error: string;
}
