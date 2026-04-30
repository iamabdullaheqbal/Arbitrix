"use client";

import { ContractTypeSelector } from "@/components/arbitrix/ContractTypeSelector";
import { UploadZone } from "@/components/arbitrix/UploadZone";

export default function AnalyzeClient() {
  return (
    <div className="container pb-16 md:pb-24 max-w-5xl pt-8 md:pt-12">
      <div className="space-y-6">
        <ContractTypeSelector />
        {/* onAnalyze is a no-op here — UploadZone navigates to /debate itself */}
        <UploadZone onAnalyze={() => {}} />
      </div>
    </div>
  );
}
