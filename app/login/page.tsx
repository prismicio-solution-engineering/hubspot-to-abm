import { AlertCircle } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";

function HubSpotIcon({ className }: { className?: string }) {
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

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const error = typeof params?.error === "string" ? params.error : null;

  return (
    <main className="flex justify-center items-center bg-background px-4 min-h-screen">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="flex justify-center items-center bg-primary mx-auto mb-4 rounded-lg w-10 h-10">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary-foreground"
              aria-hidden="true"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <h1 className="font-semibold text-foreground text-xl">ABM Campaigns</h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Sign in with HubSpot to continue.
          </p>
        </div>

        <div className="space-y-4 bg-card shadow-sm p-6 border border-border rounded-lg">
          {error && (
            <p
              className="flex gap-2 bg-destructive/10 px-3 py-2 rounded-md text-destructive text-sm"
              role="alert"
            >
              <AlertCircle className="mt-0.5 w-4 h-4 shrink-0" />
              <span>{error}</span>
            </p>
          )}

          <a
            href="/api/auth/hubspot/start"
            className={`${buttonVariants()} w-full text-sm`}
          >
            <HubSpotIcon className="w-5 h-5" />
            Continue with HubSpot
          </a>
        </div>
      </div>
    </main>
  );
}
