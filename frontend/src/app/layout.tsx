import type { Metadata } from "next";
import { Providers } from "@/components/Providers";
import "@/index.css";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: {
    template: "%s | Arbitrix",
    default: "Arbitrix - Legal Guide Genius",
  },
  description: "AI-powered legal contract analysis and verdict.",
  icons: {
    icon: "/favicon.png",
  },
};

import { Navbar } from "@/components/arbitrix/Navbar";
import { DisclaimerStrip } from "@/components/arbitrix/DisclaimerStrip";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <Providers>
          <div className="min-h-screen flex flex-col bg-background">
            <Suspense fallback={null}>
              <Navbar />
            </Suspense>
            <main className="flex-1">
              {children}
            </main>
            <DisclaimerStrip />
          </div>
        </Providers>
      </body>
    </html>
  );
}
