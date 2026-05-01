"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { AlertTriangle, AlertCircle, ShieldCheck, RotateCcw, ArrowLeft } from "lucide-react";
import { LiveDebate } from "@/components/arbitrix/LiveDebate";

const TYPE_LABEL: Record<string, string> = {
  vendor: "Vendor / Supplier Agreement",
  employment: "Employment Contract",
  partnership: "Partnership Agreement",
  property: "Property / Lease Contract",
  freelance: "Freelance / Service Contract",
  other: "Contract",
};

export default function VerdictClient() {
  const router = useRouter();
  const { verdict, lang, T, contractType, resetAnalysis, analysisError, industry, role } = useApp();
  const [plain, setPlain] = useState(true);

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

  const gradientCls =
    tier === "high"
      ? "from-red-500 to-rose-600 shadow-red-500/20"
      : tier === "mod"
      ? "from-amber-400 to-orange-500 shadow-amber-500/20"
      : "from-emerald-400 to-teal-500 shadow-emerald-500/20";

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
        <div className="text-sm text-muted-foreground truncate">
          <span className={lang === "ur" ? "font-urdu" : ""}>{T.verdict.heading}</span>
          {contractType && <> · <span className="font-medium text-foreground">{TYPE_LABEL[contractType]}</span></>}
        </div>
      </div>

      {/* Risk Banner (Previous Design Style) */}
      <div className={`rounded-3xl bg-gradient-to-br ${gradientCls} text-white p-8 md:p-10 shadow-elegant`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/20 backdrop-blur">
              <TierIcon className="h-8 w-8" />
            </div>
            <div>
              <div className="text-sm uppercase tracking-wider opacity-80 font-medium">{T.verdict.heading}</div>
              <div className={`text-3xl md:text-5xl font-bold mt-1 ${lang === "ur" ? "font-urdu leading-[1.3]" : ""}`}>{tierLabel}</div>
              <div className={`mt-2 text-base md:text-lg opacity-95 ${lang === "ur" ? "font-urdu leading-relaxed" : ""}`}>{tierMsg}</div>
            </div>
          </div>
          <div className="text-center min-w-[140px] rounded-2xl bg-white/15 backdrop-blur px-6 py-4">
            <div className="text-xs uppercase tracking-wider opacity-80">{T.verdict.gauge}</div>
            <div className="text-5xl font-bold mt-1">
              {score.toFixed(1)}<span className="text-2xl opacity-70">/10</span>
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
              <p className="text-lg leading-loose font-urdu" dir="rtl" style={{ lineHeight: lang === 'ur' ? '2.2' : 'inherit' }}>{verdict.summary_urdu}</p>
            )}
          </div>
        ))}
      </div>

      {/* Red Flags & Recommendations Section */}
      <div className={`grid md:grid-cols-5 gap-8 ${lang === "ur" ? "[direction:rtl]" : ""}`}>
        <div className="md:col-span-3 space-y-6">
          <h3 className={`text-xl font-bold flex items-center gap-2 ${lang === "ur" ? "font-urdu" : ""}`}>
            <AlertTriangle className="h-5 w-5 text-destructive" />
            {lang === "ur" ? "نشاندہی کردہ خطرات (Red Flags)" : "Identified Red Flags"}
          </h3>
          <div className="space-y-4">
            {verdict.red_flags.map((flag, i) => (
              <div key={i} className="group rounded-2xl border border-border bg-card p-5 shadow-soft hover:shadow-card transition-smooth">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      flag.severity === "HIGH" ? "bg-red-100 text-red-700" : 
                      flag.severity === "MEDIUM" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                    }`}>
                      {flag.severity}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Found by {flag.agent}
                    </span>
                  </div>
                </div>
                <p className="font-bold text-foreground mb-2">{flag.clause}</p>
                <p className={`text-sm text-muted-foreground leading-relaxed ${lang === "ur" ? "font-urdu" : ""}`}>
                  {flag.risk}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <h3 className={`text-xl font-bold flex items-center gap-2 ${lang === "ur" ? "font-urdu" : ""}`}>
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            {lang === "ur" ? "سفارشات (Recommendations)" : "Action Items"}
          </h3>
          <div className="rounded-2xl bg-emerald-50/50 border border-emerald-100 p-6 space-y-4">
            {verdict.recommendations.map((rec, i) => (
              <div key={i} className="flex gap-3">
                <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                <p className={`text-sm text-emerald-900 leading-relaxed ${lang === "ur" ? "font-urdu" : ""}`}>
                  {rec}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="h-px bg-border/60" />

      {/* Debate (Previous Design Style) */}
      <div>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h3 className={`text-xl font-bold ${lang === "ur" ? "font-urdu leading-relaxed" : ""}`}>{T.verdict.debate}</h3>
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
        <LiveDebate 
          plain={plain} 
          contractType={contractType} 
          industry={industry || "Business"} 
          role={role || "Owner"} 
          tier={tier} 
        />
      </div>

      <div className="flex justify-center pt-4">
        <Button variant="outline" size="lg" onClick={handleReset} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          {T.verdict.newReview}
        </Button>
      </div>
    </div>
  );
}
