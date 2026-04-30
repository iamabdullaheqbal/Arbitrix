"use client";

import { useState } from "react";
import { ContractTypeSelector } from "@/components/arbitrix/ContractTypeSelector";
import { UploadZone } from "@/components/arbitrix/UploadZone";
import { Verdict } from "@/components/arbitrix/Verdict";

export default function AnalyzeClient() {
  const [verdictFor, setVerdictFor] = useState<string | null>(null);

  return (
    <div className="container pb-16 md:pb-24 max-w-5xl pt-8 md:pt-12">
      {!verdictFor ? (
        <div className="space-y-6">
          <ContractTypeSelector />
          <UploadZone onAnalyze={(name) => { setVerdictFor(name); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
        </div>
      ) : (
        <div className="py-10 md:py-14">
          <Verdict fileName={verdictFor} onReset={() => setVerdictFor(null)} />
        </div>
      )}
    </div>
  );
}
