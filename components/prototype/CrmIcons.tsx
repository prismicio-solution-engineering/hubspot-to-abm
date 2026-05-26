import type { ContactSourceId } from "@/lib/types";

interface IconProps {
  className?: string;
}

export function HubSpotIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="-1 -0.5 26 26"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M18.164 7.931V5.085a2.198 2.198 0 0 0 1.266-1.978V3.06A2.198 2.198 0 0 0 17.233.863h-.047a2.198 2.198 0 0 0-2.196 2.198v.047c0 .87.507 1.627 1.266 1.978v2.846a6.232 6.232 0 0 0-2.962 1.302L6.023 4.382a2.44 2.44 0 0 0 .07-.556 2.46 2.46 0 1 0-2.46 2.46c.44 0 .856-.12 1.213-.327l7.198 4.424a6.23 6.23 0 0 0-.806 3.073c0 1.138.306 2.204.84 3.118L9.84 17.81a1.98 1.98 0 0 0-.58-.094 1.994 1.994 0 1 0 1.994 1.994 1.978 1.978 0 0 0-.324-1.084l2.21-2.196a6.257 6.257 0 1 0 5.025-8.5zm-.978 9.504a3.282 3.282 0 1 1 0-6.564 3.282 3.282 0 0 1 0 6.564z"
        fill="#FF7A59"
      />
    </svg>
  );
}

export function SalesforceIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M10 4.5C10 3.12 11.12 2 12.5 2C13.42 2 14.22 2.5 14.67 3.25C15.08 3.1 15.53 3 16 3C18.21 3 20 4.79 20 7C20 7.14 19.99 7.28 19.97 7.41C21.17 7.9 22 9.08 22 10.5C22 12.43 20.43 14 18.5 14H6C4.07 14 2.5 12.43 2.5 10.5C2.5 8.96 3.5 7.65 4.9 7.18C4.65 6.68 4.5 6.11 4.5 5.5C4.5 3.57 6.07 2 8 2C8.86 2 9.64 2.32 10.23 2.85C10.08 3.39 10 3.94 10 4.5Z"
        fill="#009EDB"
      />
    </svg>
  );
}

export function CrmIcon({ sourceId, className }: IconProps & { sourceId: ContactSourceId }) {
  return sourceId === "hubspot" ? (
    <HubSpotIcon className={className} />
  ) : (
    <SalesforceIcon className={className} />
  );
}

export const CRM_LABELS: Record<ContactSourceId, string> = {
  hubspot: "HubSpot",
  salesforce: "Salesforce",
};
