"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/contexts/AppContext";
import { Briefcase, Gavel, Building2, Sparkles, AlertCircle, RefreshCw, AlertTriangle, ShieldCheck, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type AgentId = "lawyer" | "businessman" | "regulator";

const AGENTS: Record<AgentId, {
  label: string; labelPlain: string; labelUr: string; labelUrPlain: string;
  icon: typeof Briefcase; color: string; ring: string
}> = {
  lawyer:     { label: "Legal Analysis",     labelPlain: "Lawyer Says",           labelUr: "قانونی تجزیہ",      labelUrPlain: "وکیل کہتا ہے",       icon: Gavel,     color: "from-sky-500 to-indigo-600",   ring: "ring-sky-400/40"     },
  businessman:{ label: "Commercial Analysis", labelPlain: "Business Advisor Says", labelUr: "تجارتی تجزیہ",      labelUrPlain: "کاروباری مشیر",       icon: Briefcase, color: "from-amber-500 to-orange-600", ring: "ring-amber-400/40"   },
  regulator:  { label: "Regulatory Analysis", labelPlain: "Rules Checker Says",    labelUr: "ریگولیٹری تجزیہ",   labelUrPlain: "قوانین چیکر",         icon: Building2, color: "from-emerald-500 to-teal-600", ring: "ring-emerald-400/40" },
};

interface Finding {
  clause: string;
  risk: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
}

/** Try to parse agent JSON output into structured findings. Returns null if not parseable. */
function parseFindings(raw: string): Finding[] | null {
  try {
    // Strip markdown code fences (```json ... ``` or ``` ... ```)
    let text = raw.trim().replace(/^```[a-z]*\n?/i, "").replace(/```$/, "").trim();
    // Extract the first JSON object if there's surrounding text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) text = jsonMatch[0];
    const obj = JSON.parse(text);
    const findings = obj?.findings;
    if (Array.isArray(findings) && findings.length > 0) return findings as Finding[];
  } catch { /* not JSON yet — still streaming */ }
  return null;
}

const SEVERITY_STYLES: Record<string, string> = {
  HIGH:   "bg-red-100 text-red-700 border-red-200",
  MEDIUM: "bg-amber-100 text-amber-700 border-amber-200",
  LOW:    "bg-blue-100 text-blue-700 border-blue-200",
};

function StreamingPlaceholder({ lang, waiting }: { lang: string; waiting?: boolean }) {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="flex items-center gap-2 mb-4">
        {waiting ? (
          <span className="text-muted-foreground italic text-sm">
            {lang === "ur" ? "انتظار میں…" : "Waiting for response…"}
          </span>
        ) : (
          <>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-70" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            <span className="text-xs text-muted-foreground">
              {lang === "ur" ? "تجزیہ جاری ہے…" : "Analyzing…"}
            </span>
          </>
        )}
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl border border-border bg-muted/40 p-4 space-y-2">
          <div className="h-3 w-16 rounded-full bg-muted-foreground/20" />
          <div className="h-3 w-full rounded-full bg-muted-foreground/15" />
          <div className="h-3 w-4/5 rounded-full bg-muted-foreground/15" />
          <div className="h-3 w-full rounded-full bg-muted-foreground/10 mt-2" />
          <div className="h-3 w-3/4 rounded-full bg-muted-foreground/10" />
        </div>
      ))}
    </div>
  );
}

function FindingsCard({ findings, lang }: { findings: Finding[]; lang: string }) {
  const isUr = lang === "ur";
  const urduStyle: React.CSSProperties = {
    fontFamily: "'Noto Nastaliq Urdu', serif",
    lineHeight: "2.2",
    fontSize: "1rem",
  };
  return (
    <div className="space-y-3">
      {findings.map((f, i) => (
        <div key={i} className="rounded-xl border border-border bg-background/60 p-4 space-y-2">
          <div className={`flex items-center gap-2 flex-wrap ${isUr ? "flex-row-reverse" : ""}`}>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${SEVERITY_STYLES[f.severity] ?? SEVERITY_STYLES.LOW}`}>
              {f.severity}
            </span>
            {f.severity === "HIGH" && <AlertTriangle className="h-3.5 w-3.5 text-red-500" />}
            {f.severity === "LOW"  && <ShieldCheck   className="h-3.5 w-3.5 text-blue-500" />}
          </div>
          <p className="text-xs font-semibold text-foreground/70 uppercase tracking-wide">
            {isUr ? "متنازعہ شق" : "Clause"}
          </p>
          {/* Clause always LTR — it's a direct quote */}
          <blockquote className="text-sm font-medium text-foreground leading-snug border-l-2 border-muted-foreground/30 pl-3 italic" dir="ltr">
            "{f.clause}"
          </blockquote>
          <p className="text-xs font-semibold text-foreground/70 uppercase tracking-wide mt-1">
            {isUr ? "خطرہ" : "Risk"}
          </p>
          <p
            className={`text-sm text-muted-foreground leading-relaxed ${isUr ? "font-urdu" : ""}`}
            dir={isUr ? "rtl" : undefined}
            style={isUr ? urduStyle : undefined}
          >
            {f.risk}
          </p>
        </div>
      ))}
    </div>
  );
}

export default function DebateClient() {
  const router = useRouter();
  const {
    contractText, setAgentOutputs, setAgentDone, setVerdict,
    setAnalysisError, setAnalysisCache, lang, setLang, resetAnalysis, mode,
  } = useApp();
  const isUr = lang === "ur";

  const [outputs, setOutputs] = useState<Record<AgentId, string>>({ lawyer: "", businessman: "", regulator: "" });
  const [done, setDone] = useState<Record<AgentId, boolean>>({ lawyer: false, businessman: false, regulator: false });
  const [agentErrors, setAgentErrors] = useState<Record<AgentId, string | null>>({ lawyer: null, businessman: null, regulator: null });
  const [synthesizing, setSynthesizing] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  const scrollRefs = useRef<Record<AgentId, HTMLDivElement | null>>({ lawyer: null, businessman: null, regulator: null });
  const hasStarted = useRef(false);

  useEffect(() => {
    if (!contractText) { router.replace("/analyze"); return; }
    if (hasStarted.current) return;
    hasStarted.current = true;
    startStream();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contractText]);

  useEffect(() => {
    (Object.keys(scrollRefs.current) as AgentId[]).forEach((id) => {
      const el = scrollRefs.current[id];
      if (el) el.scrollTop = el.scrollHeight;
    });
  }, [outputs]);

  const startStream = async () => {
    setStreamError(null);
    setConnected(false);
    try {
      const res = await fetch(`${API}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contract_text: contractText, mode, language: lang === "ur" ? "urdu" : "english" }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Analysis failed" }));
        throw new Error(err.detail ?? "Analysis failed");
      }
      setConnected(true);
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const raw = line.slice(5).trim();
          if (!raw) continue;
          try { handleEvent(JSON.parse(raw)); } catch { /* skip malformed */ }
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Stream failed";
      setStreamError(msg);
      setAnalysisError(msg);
    }
  };

  // Track English agent outputs for cache (always English from backend)
  const englishOutputsRef = useRef<Record<AgentId, string>>({ lawyer: "", businessman: "", regulator: "" });

  const handleEvent = (event: {
    agent: string; chunk?: string; done?: boolean; error?: string;
    verdict?: { english: unknown; urdu: unknown };
  }) => {
    const agent = event.agent as AgentId | "synthesis";

    if (agent === "synthesis") {
      setSynthesizing(false);
      if (event.error) { setAnalysisError(event.error); setStreamError(event.error); return; }
      if (event.verdict) {
        const { english, urdu } = event.verdict as {
          english: import("@/contexts/AppContext").Verdict;
          urdu: import("@/contexts/AppContext").Verdict;
        };

        // Store both languages in cache — language toggle reads from here, no re-fetch
        const cache: import("@/contexts/AppContext").AnalysisCache = {
          verdict: { english, urdu },
          agentOutputs: {
            english: { ...englishOutputsRef.current },
            // Urdu agent outputs: use English for now (debate section shows English findings)
            urdu: { ...englishOutputsRef.current },
          },
          timestamp: Date.now(),
        };
        setAnalysisCache(cache);
        setVerdict(english); // default display
        router.push("/verdict");
      }
      return;
    }

    if (!["lawyer", "businessman", "regulator"].includes(agent)) return;
    const agentId = agent as AgentId;

    if (event.error) {
      setAgentErrors((prev) => ({ ...prev, [agentId]: event.error ?? "Agent failed" }));
      setDone((prev) => ({ ...prev, [agentId]: true }));
      setAgentDone((prev) => ({ ...prev, [agentId]: true }));
      return;
    }

    if (!event.done && event.chunk) {
      setOutputs((prev) => ({ ...prev, [agentId]: prev[agentId] + event.chunk }));
      setAgentOutputs((prev) => ({ ...prev, [agentId]: prev[agentId] + (event.chunk ?? "") }));
      englishOutputsRef.current[agentId] += event.chunk ?? "";
    }

    if (event.done) {
      setDone((prev) => {
        const updated = { ...prev, [agentId]: true };
        if (updated.lawyer && updated.businessman && updated.regulator) setSynthesizing(true);
        return updated;
      });
      setAgentDone((prev) => ({ ...prev, [agentId]: true }));
    }
  };

  const handleRetry = () => {
    hasStarted.current = false;
    setOutputs({ lawyer: "", businessman: "", regulator: "" });
    setDone({ lawyer: false, businessman: false, regulator: false });
    setAgentErrors({ lawyer: null, businessman: null, regulator: null });
    setAgentOutputs(() => ({ lawyer: "", businessman: "", regulator: "" }));
    setAgentDone(() => ({ lawyer: false, businessman: false, regulator: false }));
    setSynthesizing(false);
    setStreamError(null);
    setConnected(false);
    // Re-run stream in-place — no navigation
    hasStarted.current = true;
    startStream();
  };

  const allDone = done.lawyer && done.businessman && done.regulator;

  return (
    <div className="container max-w-7xl py-8 md:py-12 space-y-6" dir={isUr ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <h1 className={`text-2xl md:text-3xl font-bold leading-tight ${isUr ? "font-urdu" : ""}`}
            style={isUr ? { fontFamily: "'Noto Nastaliq Urdu', serif", lineHeight: "1.6", paddingBottom: "0.1em" } : undefined}>
            {isUr ? "تین مشیروں کی بحث" : "Three-Advisor Debate"}
          </h1>
          <p className={`text-muted-foreground mt-2 text-sm ${isUr ? "font-urdu" : ""}`}
            style={isUr ? { fontFamily: "'Noto Nastaliq Urdu', serif", lineHeight: "1.6", display: "block" } : undefined}>
            {synthesizing ? (isUr ? "فیصلہ تیار ہو رہا ہے…" : "Synthesizing verdict…")
              : allDone ? (isUr ? "تجزیہ مکمل" : "Analysis complete")
              : (isUr ? "تجزیہ جاری ہے…" : "Analysis in progress…")}
          </p>
        </div>

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

          {connected && !allDone && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-70" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
              </span>
              {isUr ? "لائیو" : "Live"}
            </span>
          )}
        </div>
      </div>

      {/* Stream error */}
      {streamError && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-5 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-destructive">{isUr ? "کنکشن ناکام" : "Connection failed"}</p>
            <p className="text-sm text-muted-foreground mt-1">{streamError}</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleRetry} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" />
            {isUr ? "دوبارہ کوشش" : "Retry"}
          </Button>
        </div>
      )}

      {/* Three columns */}
      <div className="grid md:grid-cols-3 gap-4">
        {(Object.keys(AGENTS) as AgentId[]).map((id) => {
          const agent = AGENTS[id];
          const Icon = agent.icon;
          const isActive = !done[id] && connected;
          const hasError = !!agentErrors[id];
          const raw = outputs[id];
          const findings = done[id] ? parseFindings(raw) : null;

          return (
            <div key={id} className="flex flex-col rounded-2xl border border-border bg-card shadow-card overflow-hidden">
              <div className={`flex items-center gap-3 px-4 py-3 border-b border-border bg-gradient-to-r ${agent.color} text-white`}>
                <div className={`grid h-9 w-9 place-items-center rounded-xl bg-white/20 ${isActive ? `ring-4 ${agent.ring} animate-glow-pulse` : ""}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <div className={`font-semibold text-sm ${isUr ? "font-urdu" : ""}`}
                    style={isUr ? { fontFamily: "'Noto Nastaliq Urdu', serif" } : undefined}>
                    {isUr
                      ? (mode === "plain" ? agent.labelUrPlain : agent.labelUr)
                      : (mode === "plain" ? agent.labelPlain : agent.label)}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-white/70">
                    {hasError
                      ? (isUr ? "خطا" : "Error")
                      : done[id]
                      ? (isUr ? "مکمل" : "Done")
                      : isActive
                      ? (isUr ? "تجزیہ جاری…" : "Analyzing…")
                      : (isUr ? "انتظار…" : "Waiting…")}
                  </div>
                </div>
              </div>

              <div
                ref={(el) => { scrollRefs.current[id] = el; }}
                className="flex-1 min-h-[300px] max-h-[500px] overflow-y-auto p-4"
                dir={isUr ? "rtl" : "ltr"}
              >
                {hasError ? (
                  <div className="flex items-center gap-2 text-destructive text-sm">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{isUr ? "مشیر دستیاب نہیں" : "Agent unavailable"}</span>
                  </div>
                ) : findings ? (
                  <FindingsCard findings={findings} lang={lang} />
                ) : isActive ? (
                  <StreamingPlaceholder lang={lang} />
                ) : done[id] && synthesizing ? (
                  /* All agents done, synthesis running — keep loader visible until navigation */
                  <StreamingPlaceholder lang={lang} />
                ) : done[id] && !findings ? (
                  /* Genuine parse failure after synthesis — should rarely appear */
                  <StreamingPlaceholder lang={lang} />
                ) : (
                  <StreamingPlaceholder lang={lang} waiting />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Synthesis loading bar */}
      {synthesizing && (
        <div className="rounded-2xl border border-accent/30 bg-accent/5 p-5 text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-sm font-medium">
            <Sparkles className="h-4 w-4 text-accent animate-pulse" />
            <span className={isUr ? "font-urdu" : ""}
              style={isUr ? { fontFamily: "'Noto Nastaliq Urdu', serif" } : undefined}>
              {isUr ? "تینوں مشیروں کی رائے یکجا کی جا رہی ہے…" : "Synthesizing all three advisor opinions…"}
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-accent to-primary animate-[cta-fill_3s_linear_infinite]" />
          </div>
        </div>
      )}
    </div>
  );
}
