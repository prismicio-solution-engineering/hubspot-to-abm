import { Search } from "lucide-react";
import LogoutButton from "@/components/LogoutButton";
import { Input } from "@/components/ui/input";
import NewCampaignDialog from "@/components/NewCampaignDialog";

export default function HomePage() {
  return (
    <div className="flex flex-col bg-background min-h-screen">
      <header className="flex justify-between items-center px-6 border-border border-b h-14">
        <div className="flex items-center gap-2">
          <div className="flex justify-center items-center bg-primary rounded w-7 h-7">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary-foreground">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="font-semibold text-foreground text-sm">ABM Campaigns</span>
        </div>
        <div className="flex flex-1 items-center gap-3 px-6">
          <div className="relative flex-1 w-full">
            <Search className="top-1/2 left-3 absolute w-4 h-4 text-muted-foreground -translate-y-1/2" />
            <Input
              placeholder="Search for a campaign"
              className="bg-white pl-9 h-10 text-sm"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <NewCampaignDialog />
          <LogoutButton />
        </div>
      </header>

      <main className="flex-1 px-6 py-6">
      </main>
    </div>
  );
}
