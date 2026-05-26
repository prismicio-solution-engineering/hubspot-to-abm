import "server-only";
import {
  getCompaniesForList,
  getContactsForList,
  getListMetadata,
  listAllLists,
} from "../hubspot";
import type { ContactSource } from "../contact-source";
import { registerSource } from "../contact-source";
import type {
  Segment,
  UiCompaniesResponse,
  UiCompany,
  UiContact,
  UiContactsResponse,
  UiRecordsResponse,
} from "../types";

const HubSpotSource: ContactSource = {
  id: "hubspot",
  label: "HubSpot",
  async isAvailable() {
    return !!process.env.HUBSPOT_ACCESS_TOKEN;
  },
  async listSegments(): Promise<Segment[]> {
    const lists = await listAllLists();
    return lists.map((l): Segment => ({
      id: l.id,
      name: l.name,
      objectType: l.objectType,
      size: l.size,
      sourceId: "hubspot",
      raw: l,
    }));
  },
  async getSegment(segmentId: string): Promise<UiRecordsResponse> {
    const meta = await getListMetadata(segmentId);
    if (meta.objectType === "contact") {
      const contacts = await getContactsForList(segmentId);
      const records: UiContact[] = contacts.map((c) => ({
        id: c.id,
        firstName: c.firstname,
        lastName: c.lastname,
        email: c.email,
        city: c.city,
        country: c.country,
        jobTitle: c.jobtitle,
        sourceId: "hubspot",
        associatedCompany: c.associatedCompany
          ? {
              id: c.associatedCompany.id,
              name: c.associatedCompany.name,
              domain: c.associatedCompany.domain,
              website: c.associatedCompany.website,
              industry: c.associatedCompany.industry,
              numberOfEmployees: c.associatedCompany.numberofemployees
                ? Number(c.associatedCompany.numberofemployees)
                : undefined,
              city: c.associatedCompany.city,
              country: c.associatedCompany.country,
              sourceId: "hubspot",
            }
          : undefined,
      }));
      const response: UiContactsResponse = {
        type: "contact",
        sourceId: "hubspot",
        segmentName: meta.name,
        segmentSize: meta.size,
        records,
      };
      return response;
    }
    const companies = await getCompaniesForList(segmentId);
    const records: UiCompany[] = companies.map((c) => ({
      id: c.id,
      name: c.name,
      domain: c.domain,
      website: c.website,
      industry: c.industry,
      numberOfEmployees: c.numberofemployees ? Number(c.numberofemployees) : undefined,
      city: c.city,
      country: c.country,
      sourceId: "hubspot",
    }));
    const response: UiCompaniesResponse = {
      type: "company",
      sourceId: "hubspot",
      segmentName: meta.name,
      segmentSize: meta.size,
      records,
    };
    return response;
  },
};

registerSource(HubSpotSource);

export default HubSpotSource;
