import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: "ABM Campaigns",
  description: "Create ABM campaigns from HubSpot segments.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <div style={{ height: "4px", backgroundColor: "#6e56cf", flexShrink: 0 }} />
        {children}
      </body>
    </html>
  );
}
