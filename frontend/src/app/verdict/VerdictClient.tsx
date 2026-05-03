"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { AlertTriangle, AlertCircle, ShieldCheck, RotateCcw, ArrowLeft, Languages } from "lucide-react";
import { LiveDebate } from "@/components/arbitrix/LiveDebate";

const TYPE_LABEL: Record<string, { en: string; ur: string }> = {
  vendor:      { en: "Vendor / Supplier Agreement",  ur: "سپلائر معاہدہ" },
  employment:  { en: "Employment Contract",           ur: "ملازمت کا معاہدہ" },
  partnership: { en: "Partnership Agreement",         ur: "شراکت داری معاہدہ" },
  property:    { en: "Property / Lease Contract",     ur: "جائیداد / کرایہ معاہدہ" },
  freelance:   { en: "Freelance / Service Contract",  ur: "فری لانس معاہدہ" },
  other:       { en: "Contract",                      ur: "معاہدہ" },
};

const AGENT_LABEL: Record<string, { en: string; ur: string }> = {
  lawyer:      { en: "Lawyer",           ur: "وکیل" },
  businessman: { en: "Businessman",      ur: "کاروباری مشیر" },
  regulator:   { en: "Regulator",        ur: "ریگولیٹری افسر" },
};

const SEV_LABEL: Record<string, { en: string; ur: string }> = {
  HIGH:   { en: "HIGH",   ur: "زیادہ خطرہ" },
  MEDIUM: { en: "MEDIUM", ur: "درمیانہ خطرہ" },
  LOW:    { en: "LOW",    ur: "کم خطرہ" },
};

export default function VerdictClient() {
  const router = useRouter();
  const { verdict, lang, setLang, T, contractType, resetAnalysis, analysisError, industry, role, mode, analysisCache } = useApp();

  const isUr = lang === "ur";

  // Read the correct language verdict from cache — no API call needed
  const displayVerdict = analysisCache
    ? (isUr ? analysisCache.verdict.urdu : analysisCache.verdict.english)
    : verdict;

  useEffect(() => {
    if (!displayVerdict && !analysisError) router.replace("/analyze");
  }, [displayVerdict, analysisError, router]);

  if (!displayVerdict) {
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

  const score = displayVerdict.risk_score;
  const tier  = score >= 7 ? "high" : score >= 4 ? "mod" : "low";
  const TierIcon = tier === "high" ? AlertTriangle : tier === "mod" ? AlertCircle : ShieldCheck;
  const tierLabel = tier === "high" ? T.risk.high : tier === "mod" ? T.risk.mod : T.risk.low;
  const tierMsg   = tier === "high" ? T.risk.highMsg : tier === "mod" ? T.risk.modMsg : T.risk.lowMsg;

  const gradientCls =
    tier === "high" ? "from-red-500 to-rose-600 shadow-red-500/20"
    : tier === "mod" ? "from-amber-400 to-orange-500 shadow-amber-500/20"
    : "from-emerald-400 to-teal-500 shadow-emerald-500/20";

  const typeLabel = contractType ? (TYPE_LABEL[contractType]?.[lang] ?? contractType) : null;

  const urduStyle: React.CSSProperties = {
    fontFamily: "'Noto Nastaliq Urdu', serif",
    lineHeight: "2.2",
    fontSize: "1.05rem",
  };

  const handleReset = () => { resetAnalysis(); router.push("/analyze"); };

  return (
    <div
      className="container max-w-4xl py-8 md:py-12 space-y-8 animate-fade-in-up"
      dir={isUr ? "rtl" : "ltr"}
    >
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className={`h-4 w-4 ${isUr ? "rotate-180" : ""}`} />
          {T.upload.back}
        </Button>

        <div className="flex items-center gap-3">
          {/* Language toggle */}
          <div className="flex items-center gap-1.5 rounded-full border border-border bg-card p-1 shadow-soft">
            <Languages className="h-3.5 w-3.5 text-muted-foreground ms-1.5" />
            <button
              onClick={() => setLang("en")}
              className={`h-7 rounded-full px-3 text-xs font-medium transition-all ${
                !isUr ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              English
            </button>
            <button
              onClick={() => setLang("ur")}
              className={`h-7 rounded-full px-3 text-xs font-medium transition-all ${
                isUr ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
              style={{ fontFamily: "'Noto Nastaliq Urdu', serif" }}
            >
              اردو
            </button>
          </div>

          {typeLabel && (
            <span className="text-sm text-muted-foreground hidden sm:block">
              {typeLabel}
            </span>
          )}
        </div>
      </div>

      {/* ── Risk Banner ── */}
      <div className={`rounded-3xl bg-gradient-to-br ${gradientCls} text-white p-8 md:p-10 shadow-elegant`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/20 backdrop-blur flex-shrink-0">
              <TierIcon className="h-8 w-8" />
            </div>
            <div>
              <div className="text-sm uppercase tracking-wider opacity-80 font-medium">
                {isUr ? "آپ کے معاہدے کا فیصلہ" : "Your contract verdict"}
              </div>
              <div
                className={`text-2xl sm:text-3xl md:text-5xl font-bold mt-1 break-words ${isUr ? "font-urdu" : ""}`}
                style={isUr ? { fontFamily: "'Noto Nastaliq Urdu', serif", lineHeight: "1.5" } : undefined}
              >
                {tierLabel}
              </div>
              <div
                className={`mt-2 text-base md:text-lg opacity-95 ${isUr ? "font-urdu" : ""}`}
                style={isUr ? { fontFamily: "'Noto Nastaliq Urdu', serif", lineHeight: "1.8" } : undefined}
              >
                {tierMsg}
              </div>
            </div>
          </div>
          <div className="text-center min-w-[140px] rounded-2xl bg-white/15 backdrop-blur px-6 py-4 flex-shrink-0">
            <div className="text-xs uppercase tracking-wider opacity-80">
              {isUr ? "خطرے کا اسکور" : "Overall risk score"}
            </div>
            <div className="text-5xl font-bold mt-1">
              {score.toFixed(1)}<span className="text-2xl opacity-70">/10</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Summary — single language only ── */}
      <div className="rounded-2xl border border-primary/20 bg-card p-6 shadow-card">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          {isUr
            ? (mode === "plain" ? "آسان الفاظ میں خلاصہ" : "خلاصہ")
            : (mode === "plain" ? "In Simple Words" : "Executive Summary")}
        </div>
        {isUr ? (
          <p className="font-urdu text-foreground" dir="rtl" style={urduStyle}>
            {displayVerdict.summary_urdu || displayVerdict.summary_english}
          </p>
        ) : (
          <p className="text-base leading-relaxed text-foreground">
            {displayVerdict.summary_english}
          </p>
        )}
      </div>

      {/* ── Red Flags + Recommendations ── */}
      <div className="grid md:grid-cols-5 gap-8">
        {/* Red Flags */}
        <div className="md:col-span-3 space-y-4">
          <h3 className={`text-xl font-bold flex items-center gap-2 ${isUr ? "font-urdu flex-row-reverse" : ""}`}>
            <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0" />
            {isUr ? "سرخ جھنڈے" : "Identified Red Flags"}
          </h3>

          <div className="space-y-4">
            {displayVerdict.red_flags.map((flag, i) => {
              const sev = flag.severity ?? "LOW";
              const borderSide = isUr ? "borderRight" : "borderLeft";
              const borderColor =
                sev === "HIGH" ? "#dc2626" : sev === "MEDIUM" ? "#d97706" : "#2563eb";
              const sevBadge =
                sev === "HIGH" ? "bg-red-100 text-red-700"
                : sev === "MEDIUM" ? "bg-amber-100 text-amber-700"
                : "bg-blue-100 text-blue-700";

              return (
                <div
                  key={i}
                  className="rounded-2xl border border-border bg-card p-5 shadow-soft"
                  style={{ [borderSide]: `4px solid ${borderColor}` }}
                >
                  {/* Badge row */}
                  <div className={`flex items-center gap-2 mb-3 flex-wrap ${isUr ? "flex-row-reverse" : ""}`}>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${sevBadge}`}>
                      {SEV_LABEL[sev]?.[lang] ?? sev}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      {isUr
                        ? AGENT_LABEL[flag.agent]?.ur ?? flag.agent
                        : `Found by ${AGENT_LABEL[flag.agent]?.en ?? flag.agent}`}
                    </span>
                  </div>

                  {/* Clause — always LTR, it's a direct quote */}
                  <blockquote className="border-l-2 border-muted-foreground/30 pl-3 mb-3">
                    <p className="text-sm font-medium text-foreground leading-snug italic">
                      "{flag.clause}"
                    </p>
                  </blockquote>

                  {/* Risk explanation — language-aware */}
                  <p
                    className={`text-sm text-muted-foreground leading-relaxed ${isUr ? "font-urdu" : ""}`}
                    dir={isUr ? "rtl" : undefined}
                    style={isUr ? urduStyle : undefined}
                  >
                    {flag.risk}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recommendations */}
        <div className="md:col-span-2 space-y-4">
          <h3 className={`text-xl font-bold flex items-center gap-2 ${isUr ? "font-urdu flex-row-reverse" : ""}`}>
            <ShieldCheck className="h-5 w-5 text-emerald-600 flex-shrink-0" />
            {isUr ? "سفارشات" : "Action Items"}
          </h3>
          <div className="rounded-2xl bg-emerald-50/50 border border-emerald-100 p-6 space-y-4">
            {displayVerdict.recommendations.map((rec, i) => (
              <div key={i} className={`flex gap-3 ${isUr ? "flex-row-reverse" : ""}`}>
                <div className="mt-2 h-1.5 w-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                <p
                  className={`text-sm text-emerald-900 leading-relaxed ${isUr ? "font-urdu" : ""}`}
                  dir={isUr ? "rtl" : undefined}
                  style={isUr ? urduStyle : undefined}
                >
                  {rec}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="h-px bg-border/60" />

      {/* ── Debate ── */}
      <div>
        <h3 className={`text-xl font-bold mb-4 ${isUr ? "font-urdu" : ""}`}
          style={isUr ? { fontFamily: "'Noto Nastaliq Urdu', serif" } : undefined}
        >
          {T.verdict.debate}
        </h3>
        <LiveDebate
          plain={mode === "plain"}
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
