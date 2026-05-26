import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { ContactSource } from "../contact-source";
import { registerSource } from "../contact-source";
import type {
  Segment,
  UiContact,
  UiContactsResponse,
  UiRecordsResponse,
} from "../types";

const MOCKS_DIR = join(process.cwd(), "public", "mocks");

interface SalesforceCampaignRaw {
  Id: string;
  Name: string;
  IsActive: boolean;
  Type: string;
  Status: string;
  StartDate: string | null;
  EndDate: string | null;
  NumberOfContacts: number;
  NumberOfLeads: number;
  Description: string | null;
  CreatedDate: string;
}

interface SalesforceAccountRaw {
  Id: string;
  Name: string;
  Website?: string | null;
  Industry?: string | null;
  NumberOfEmployees?: number | null;
  AnnualRevenue?: number | null;
  BillingCity?: string | null;
  BillingCountry?: string | null;
  Phone?: string | null;
  Type?: string | null;
  Description?: string | null;
  ABM_Tier__c?: string | null;
}

interface SalesforceContactRaw {
  Id: string;
  FirstName?: string | null;
  LastName?: string | null;
  Email?: string | null;
  Phone?: string | null;
  Title?: string | null;
  Department?: string | null;
  LeadSource?: string | null;
  MailingCity?: string | null;
  MailingCountry?: string | null;
  AccountId?: string | null;
  Persona__c?: string | null;
  Account?: SalesforceAccountRaw;
}

interface SalesforceCampaignMemberRaw {
  ContactId: string;
  Status: string;
  Contact: SalesforceContactRaw;
}

interface SoqlResponse<T> {
  totalSize: number;
  done: boolean;
  records: T[];
}

async function readJsonMock<T>(filename: string): Promise<T> {
  const path = join(MOCKS_DIR, filename);
  const text = await readFile(path, "utf-8");
  return JSON.parse(text) as T;
}

async function getCampaignName(campaignId: string): Promise<string> {
  const raw = await readJsonMock<SoqlResponse<SalesforceCampaignRaw>>(
    "salesforce-campaigns.json",
  );
  return raw.records.find((c) => c.Id === campaignId)?.Name ?? campaignId;
}

function extractDomain(website: string | null | undefined): string | undefined {
  if (!website) return undefined;
  try {
    return new URL(website).hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
}

const SalesforceSource: ContactSource = {
  id: "salesforce",
  label: "Salesforce",
  async isAvailable() {
    return true;
  },
  async listSegments(): Promise<Segment[]> {
    const raw = await readJsonMock<SoqlResponse<SalesforceCampaignRaw>>(
      "salesforce-campaigns.json",
    );
    return raw.records.map((c): Segment => ({
      id: c.Id,
      name: c.Name,
      objectType: "contact",
      size: c.NumberOfContacts,
      sourceId: "salesforce",
      raw: c,
    }));
  },
  async getSegment(segmentId: string): Promise<UiRecordsResponse> {
    const filename = `salesforce-campaign-members-${segmentId}.json`;
    const raw = await readJsonMock<SoqlResponse<SalesforceCampaignMemberRaw>>(filename);
    const campaignName = await getCampaignName(segmentId);

    const records: UiContact[] = raw.records.map((m): UiContact => ({
      id: m.Contact.Id,
      firstName: m.Contact.FirstName ?? undefined,
      lastName: m.Contact.LastName ?? undefined,
      email: m.Contact.Email ?? undefined,
      phone: m.Contact.Phone ?? undefined,
      jobTitle: m.Contact.Title ?? undefined,
      department: m.Contact.Department ?? undefined,
      city: m.Contact.MailingCity ?? undefined,
      country: m.Contact.MailingCountry ?? undefined,
      sourceId: "salesforce",
      associatedCompany: m.Contact.Account
        ? {
          id: m.Contact.Account.Id,
          name: m.Contact.Account.Name ?? undefined,
          domain: extractDomain(m.Contact.Account.Website),
          website: m.Contact.Account.Website ?? undefined,
          industry: m.Contact.Account.Industry ?? undefined,
          numberOfEmployees: m.Contact.Account.NumberOfEmployees ?? undefined,
          annualRevenue: m.Contact.Account.AnnualRevenue ?? undefined,
          city: m.Contact.Account.BillingCity ?? undefined,
          country: m.Contact.Account.BillingCountry ?? undefined,
          sourceId: "salesforce",
        }
        : undefined,
    }));

    const response: UiContactsResponse = {
      type: "contact",
      sourceId: "salesforce",
      segmentName: campaignName,
      segmentSize: raw.totalSize,
      records,
    };
    return response;
  },
};

registerSource(SalesforceSource);

export default SalesforceSource;
