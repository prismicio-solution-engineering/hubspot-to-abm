import type { Metadata } from "next";
import PrototypeView from "@/components/prototype/PrototypeView";

export const metadata: Metadata = { title: "ABM Prototype — JPMorgan" };

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
    />
  );
}
