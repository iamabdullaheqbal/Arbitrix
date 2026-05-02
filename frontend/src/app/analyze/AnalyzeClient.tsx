"use client";

import { ContractTypeSelector } from "@/components/arbitrix/ContractTypeSelector";
import { UploadZone } from "@/components/arbitrix/UploadZone";
import { useApp } from "@/contexts/AppContext";
import { Scale, MessageCircle } from "lucide-react";

export default function AnalyzeClient() {
  const { mode, setMode, lang } = useApp();

  return (
    <div className="container pb-16 md:pb-24 max-w-5xl pt-8 md:pt-12">
      <div className="space-y-6">
        {/* Mode toggle — Step 1 */}
        <div className="rounded-3xl border border-border gradient-card p-6 md:p-8 shadow-card">
          <div className="text-center mb-5">
            <span className="inline-block rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent-foreground uppercase tracking-wider">
              {lang === "ur" ? "مرحلہ ۱" : "Step 1"}
            </span>
            <h2 className={`mt-3 text-xl md:text-2xl font-bold tracking-tight ${lang === "ur" ? "font-urdu" : ""}`}>
              {lang === "ur" ? "تجزیہ کا انداز منتخب کریں" : "Choose Analysis Mode"}
            </h2>
            <p className={`mt-1 text-sm text-muted-foreground ${lang === "ur" ? "font-urdu" : ""}`}>
              {lang === "ur"
                ? "کیا آپ قانونی ماہر ہیں یا عام شہری؟"
                : "Are you a legal professional or a regular person?"}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
            <button
              type="button"
              onClick={() => setMode("technical")}
              className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-sm font-medium transition-all ${
                mode === "technical"
                  ? "border-primary bg-primary/5 text-foreground shadow-sm"
                  : "border-border bg-card text-muted-foreground hover:border-primary/30"
              }`}
            >
              <Scale className={`h-6 w-6 ${mode === "technical" ? "text-primary" : "text-muted-foreground"}`} />
              <span className={lang === "ur" ? "font-urdu" : ""}>
                {lang === "ur" ? "⚖️ قانونی انداز" : "⚖️ Technical"}
              </span>
              <span className="text-[10px] text-muted-foreground font-normal text-center leading-tight">
                {lang === "ur" ? "وکلاء اور پیشہ ور افراد کے لیے" : "For lawyers & professionals"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setMode("plain")}
              className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-sm font-medium transition-all ${
                mode === "plain"
                  ? "border-primary bg-primary/5 text-foreground shadow-sm"
                  : "border-border bg-card text-muted-foreground hover:border-primary/30"
              }`}
            >
              <MessageCircle className={`h-6 w-6 ${mode === "plain" ? "text-primary" : "text-muted-foreground"}`} />
              <span className={lang === "ur" ? "font-urdu" : ""}>
                {lang === "ur" ? "💬 آسان زبان" : "💬 Plain Language"}
              </span>
              <span className="text-[10px] text-muted-foreground font-normal text-center leading-tight">
                {lang === "ur" ? "عام افراد کے لیے سادہ زبان" : "Simple words for everyone"}
              </span>
            </button>
          </div>
        </div>

        <ContractTypeSelector />
        <UploadZone onAnalyze={() => {}} />
      </div>
    </div>
  );
}
