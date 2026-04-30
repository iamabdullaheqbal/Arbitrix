import { HowItWorks } from "@/components/arbitrix/HowItWorks";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How It Works",
};

export default function FeaturesPage() {
  return (
    <div className="pt-8">
      <HowItWorks />
    </div>
  );
}
