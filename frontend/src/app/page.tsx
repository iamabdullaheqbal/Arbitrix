import { Hero } from "@/components/arbitrix/Hero";
import { TrustSection } from "@/components/arbitrix/TrustSection";
import { KnowledgeSection } from "@/components/arbitrix/KnowledgeSection";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home",
};

export default function Home() {
  return (
    <main className="flex-1 w-full flex flex-col">
      <Hero />
      <KnowledgeSection />
      <TrustSection />
    </main>
  );
}
