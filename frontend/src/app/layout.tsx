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
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
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
