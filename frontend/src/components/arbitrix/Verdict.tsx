"use client";

import { useMemo, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { AlertTriangle, AlertCircle, ShieldCheck, RotateCcw, ArrowLeft } from "lucide-react";
import { LiveDebate } from "./LiveDebate";

const TYPE_LABEL_EN: Record<string, string> = {
  vendor: "Vendor / Supplier Agreement",
  employment: "Employment Contract",
  partnership: "Partnership Agreement",
  property: "Property / Lease Contract",
  freelance: "Freelance / Service Contract",
  other: "Contract",
};

interface Props {
  fileName: string;
  onReset: () => void;
}

export const Verdict = ({ fileName, onReset }: Props) => {
  const { T, lang, contractType, role, industry } = useApp();
  const [plain, setPlain] = useState(true);

  // Demo: risk score deterministically derived from filename for reproducibility
  const score = useMemo(() => {
    const sum = fileName.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    return (sum % 10) + 1;
  }, [fileName]);

  const tier = score >= 7 ? "high" : score >= 4 ? "mod" : "low";
  const tierColor = tier === "high" ? "destructive" : tier === "mod" ? "warning" : "success";
  const TierIcon = tier === "high" ? AlertTriangle : tier === "mod" ? AlertCircle : ShieldCheck;
  const tierLabel = tier === "high" ? T.risk.high : tier === "mod" ? T.risk.mod : T.risk.low;
  const tierMsg = tier === "high" ? T.risk.highMsg : tier === "mod" ? T.risk.modMsg : T.risk.lowMsg;
  const gradientCls =
    tier === "high"
      ? "[background:var(--gradient-risk-high)]"
      : tier === "mod"
      ? "[background:var(--gradient-risk-mod)]"
      : "[background:var(--gradient-risk-low)]";

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-4">
        <Button variant="ghost" onClick={onReset} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          {T.upload.back}
        </Button>
        <div className="text-sm text-muted-foreground truncate">
          <span className={lang === "ur" ? "font-urdu" : ""}>{T.verdict.heading}</span>
          {contractType && <> · <span className="font-medium text-foreground">{TYPE_LABEL_EN[contractType]}</span></>}
        </div>
      </div>

      {/* RISK BANNER */}
      <div className={`rounded-3xl ${gradientCls} text-white p-8 md:p-10 shadow-elegant`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/20 backdrop-blur">
              <TierIcon className="h-8 w-8" />
            </div>
            <div>
              <div className="text-sm uppercase tracking-wider opacity-80 font-medium">{T.verdict.heading}</div>
              <div className={`text-3xl md:text-5xl font-bold mt-1 ${lang === "ur" ? "font-urdu" : ""}`}>{tierLabel}</div>
              <div className={`mt-2 text-base md:text-lg opacity-95 ${lang === "ur" ? "font-urdu" : ""}`}>{tierMsg}</div>
            </div>
          </div>
          <div className="text-center min-w-[140px] rounded-2xl bg-white/15 backdrop-blur px-6 py-4">
            <div className="text-xs uppercase tracking-wider opacity-80">{T.verdict.gauge}</div>
            <div className="text-5xl font-bold mt-1">{score}<span className="text-2xl opacity-70">/10</span></div>
          </div>
        </div>
      </div>

      {/* Summaries (Urdu primary in Urdu mode) */}
      <div className={`grid md:grid-cols-2 gap-5 ${lang === "ur" ? "md:[direction:rtl]" : ""}`}>
        {(lang === "ur" ? ["urdu", "english"] : ["english", "urdu"]).map((which) => (
          <div
            key={which}
            className={`rounded-2xl border p-6 shadow-card ${
              (lang === "ur" ? which === "urdu" : which === "english")
                ? "border-primary/20 bg-card"
                : "border-border bg-muted/30"
            }`}
          >
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {which === "english" ? T.verdict.english : T.verdict.urdu}
            </div>
            {which === "english" ? (
              <p className="mt-3 text-base leading-relaxed">
                This {TYPE_LABEL_EN[contractType ?? "other"].toLowerCase()} carries a <strong>{tierLabel.toLowerCase()}</strong>.
                Three clauses need attention before you sign — primarily around liability, dispute resolution
                {industry ? `, with specific exposure for ${industry}` : ""}.
              </p>
            ) : (
              <p className="mt-3 text-lg leading-loose font-urdu" dir="rtl">
                یہ معاہدہ <strong>{tierLabel}</strong> کا حامل ہے۔ دستخط سے پہلے تین اہم شقوں پر توجہ ضروری ہے —
                خاص طور پر ذمہ داری اور تنازع کے حل سے متعلق۔
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Debate */}
      <div>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h3 className={`text-xl font-bold ${lang === "ur" ? "font-urdu" : ""}`}>{T.verdict.debate}</h3>
          <div className="inline-flex rounded-full border border-border bg-card p-1 shadow-soft text-xs font-medium">
            <button
              onClick={() => setPlain(false)}
              className={`px-3 py-1.5 rounded-full transition-smooth ${!plain ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >{T.verdict.modeTech}</button>
            <button
              onClick={() => setPlain(true)}
              className={`px-3 py-1.5 rounded-full transition-smooth ${plain ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >{T.verdict.modePlain}</button>
          </div>
        </div>
        <LiveDebate plain={plain} contractType={contractType} industry={industry} role={role} tier={tier} />
      </div>

      <div className="flex justify-center pt-4">
        <Button variant="outline" size="lg" onClick={onReset} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          {T.verdict.newReview}
        </Button>
      </div>
    </div>
  );
};
