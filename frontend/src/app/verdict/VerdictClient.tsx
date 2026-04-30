"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/contexts/AppContext";
import { AlertTriangle, AlertCircle, ShieldCheck, RotateCcw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const SEVERITY_BADGE: Record<string, string> = {
  HIGH: "bg-destructive/15 text-destructive border-destructive/30",
  MEDIUM: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  LOW: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
};

const AGENT_BADGE: Record<string, string> = {
  lawyer: "bg-sky-500/10 text-sky-700 border-sky-500/30",
  businessman: "bg-amber-500/10 text-amber-700 border-amber-500/30",
  regulator: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
};

export default function VerdictClient() {
  const router = useRouter();
  const { verdict, lang, T, contractType, resetAnalysis, analysisError } = useApp();

  useEffect(() => {
    if (!verdict && !analysisError) {
      router.replace("/analyze");
    }
  }, [verdict, analysisError, router]);

  if (!verdict) {
    return (
      <div className="container max-w-3xl py-16 text-center space-y-4">
        {analysisError ? (
          <>
            <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
            <p className="text-lg font-semibold">Verdict generation failed</p>
            <p className="text-muted-foreground text-sm">{analysisError}</p>
            <Button variant="outline" onClick={() => { resetAnalysis(); router.push("/analyze"); }}>
              Try again
            </Button>
          </>
        ) : (
          <p className="text-muted-foreground">Redirecting…</p>
        )}
      </div>
    );
  }

  const score = verdict.risk_score;
  const tier = score >= 7 ? "high" : score >= 4 ? "mod" : "low";
  const TierIcon = tier === "high" ? AlertTriangle : tier === "mod" ? AlertCircle : ShieldCheck;
  const tierLabel = tier === "high" ? T.risk.high : tier === "mod" ? T.risk.mod : T.risk.low;
  const tierMsg = tier === "high" ? T.risk.highMsg : tier === "mod" ? T.risk.modMsg : T.risk.lowMsg;

  const gaugeColor =
    tier === "high"
      ? "from-red-500 to-rose-600"
      : tier === "mod"
      ? "from-amber-400 to-orange-500"
      : "from-emerald-400 to-teal-500";

  const TYPE_LABEL: Record<string, string> = {
    vendor: "Vendor / Supplier Agreement",
    employment: "Employment Contract",
    partnership: "Partnership Agreement",
    property: "Property / Lease Contract",
    freelance: "Freelance / Service Contract",
    other: "Contract",
  };

  const handleReset = () => {
    resetAnalysis();
    router.push("/analyze");
  };

  return (
    <div className="container max-w-4xl py-8 md:py-12 space-y-8 animate-fade-in-up">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          {T.upload.back}
        </Button>
        <div className="text-sm text-muted-foreground">
          <span className={lang === "ur" ? "font-urdu" : ""}>{T.verdict.heading}</span>
          {contractType && <> · <span className="font-medium text-foreground">{TYPE_LABEL[contractType]}</span></>}
        </div>
      </div>

      {/* Risk banner */}
      <div className={`rounded-3xl bg-gradient-to-br ${gaugeColor} text-white p-8 md:p-10 shadow-elegant`}>
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
          {/* Gauge */}
          <div className="text-center min-w-[140px] rounded-2xl bg-white/15 backdrop-blur px-6 py-4">
            <div className="text-xs uppercase tracking-wider opacity-80">{T.verdict.gauge}</div>
            <div className="text-5xl font-bold mt-1">
              {score.toFixed(1)}<span className="text-2xl opacity-70">/10</span>
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-white/20 overflow-hidden">
              <div
                className="h-full rounded-full bg-white/80 transition-all duration-1000"
                style={{ width: `${(score / 10) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Summaries */}
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
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              {which === "english" ? T.verdict.english : T.verdict.urdu}
            </div>
            {which === "english" ? (
              <p className="text-base leading-relaxed">{verdict.summary_english}</p>
            ) : (
              <p className="text-lg leading-loose font-urdu" dir="rtl">{verdict.summary_urdu}</p>
            )}
          </div>
        ))}
      </div>

      {/* Red flags */}
      {verdict.red_flags.length > 0 && (
        <div className="space-y-3">
          <h2 className={`text-xl font-bold ${lang === "ur" ? "font-urdu" : ""}`}>
            {lang === "ur" ? "خطرناک شقیں" : "Red Flags"}
          </h2>
          <div className="space-y-3">
            {verdict.red_flags.map((flag, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-5 shadow-card space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${SEVERITY_BADGE[flag.severity] ?? ""}`}>
                    {flag.severity}
                  </span>
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${AGENT_BADGE[flag.agent] ?? ""}`}>
                    {flag.agent}
                  </span>
                </div>
                <p className="text-sm font-mono text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 leading-relaxed">
                  {flag.clause}
                </p>
                <p className="text-sm leading-relaxed">{flag.risk}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {verdict.recommendations.length > 0 && (
        <div className="space-y-3">
          <h2 className={`text-xl font-bold ${lang === "ur" ? "font-urdu" : ""}`}>
            {lang === "ur" ? "تجاویز" : "Recommendations"}
          </h2>
          <ol className="space-y-2">
            {verdict.recommendations.map((rec, i) => (
              <li key={i} className="flex gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-card text-sm">
                <span className="flex-shrink-0 grid h-6 w-6 place-items-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  {i + 1}
                </span>
                <span className="leading-relaxed">{rec}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="flex justify-center pt-4">
        <Button variant="outline" size="lg" onClick={handleReset} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          {T.verdict.newReview}
        </Button>
      </div>
    </div>
  );
}
