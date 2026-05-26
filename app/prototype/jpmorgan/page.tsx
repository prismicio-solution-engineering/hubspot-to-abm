import type { Metadata } from "next";
import PrototypeView from "@/components/prototype/PrototypeView";

export const metadata: Metadata = { title: "ABM Prototype — JPMorgan" };

function SalesforceIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M10 4.5C10 3.12 11.12 2 12.5 2C13.42 2 14.22 2.5 14.67 3.25C15.08 3.1 15.53 3 16 3C18.21 3 20 4.79 20 7C20 7.14 19.99 7.28 19.97 7.41C21.17 7.9 22 9.08 22 10.5C22 12.43 20.43 14 18.5 14H6C4.07 14 2.5 12.43 2.5 10.5C2.5 8.96 3.5 7.65 4.9 7.18C4.65 6.68 4.5 6.11 4.5 5.5C4.5 3.57 6.07 2 8 2C8.86 2 9.64 2.32 10.23 2.85C10.08 3.39 10 3.94 10 4.5Z" fill="#009EDB"/>
    </svg>
  );
}

export default function JpMorganPrototypePage() {
  return (
    <PrototypeView
      preview={
        <iframe
          src="https://jpmorganchase.vercel.app/payment-modernization"
          className="w-full h-full border-0"
          title="JPMorgan Chase — Environmental Sustainability"
        />
      }
      previewTitle="Payment Modernization Blueprint"
      previewUrl="https://jpmorganchase.vercel.app/payment-modernization"
      generatePagesEndpoint="/api/prototype/jpmorgan/generate-pages"
      generateAbmPagesEndpoint="/api/prototype/jpmorgan/generate-abm-pages"
      baselineDocumentId="agxFYBIAACoAyvsb"
      segmentSourceIcon={<SalesforceIcon />}
      segmentPromptText="Sure! Select the Salesforce segment you'd like to personalize this page for:"
    />
  );
}
