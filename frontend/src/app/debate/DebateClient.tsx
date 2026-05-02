"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/contexts/AppContext";
import { Briefcase, Gavel, Building2, Sparkles, AlertCircle, RefreshCw, AlertTriangle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type AgentId = "lawyer" | "businessman" | "regulator";

const AGENTS: Record<AgentId, { label: string; labelUr: string; icon: typeof Briefcase; color: string; ring: string }> = {
  lawyer:     { label: "Lawyer",      labelUr: "وکیل",       icon: Gavel,     color: "from-sky-500 to-indigo-600",   ring: "ring-sky-400/40"     },
  businessman:{ label: "Businessman", labelUr: "کاروباری",   icon: Briefcase, color: "from-amber-500 to-orange-600", ring: "ring-amber-400/40"   },
  regulator:  { label: "Regulator",   labelUr: "ریگولیٹر",   icon: Building2, color: "from-emerald-500 to-teal-600", ring: "ring-emerald-400/40" },
};

interface Finding {
  clause: string;
  risk: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
}

/** Try to parse agent JSON output into structured findings. Returns null if not parseable. */
function parseFindings(raw: string): Finding[] | null {
  try {
    const text = raw.trim().replace(/^```[a-z]*\n?/, "").replace(/```$/, "").trim();
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

function FindingsCard({ findings }: { findings: Finding[] }) {
  return (
    <div className="space-y-3">
      {findings.map((f, i) => (
        <div key={i} className="rounded-xl border border-border bg-background/60 p-4 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${SEVERITY_STYLES[f.severity] ?? SEVERITY_STYLES.LOW}`}>
              {f.severity}
            </span>
            {f.severity === "HIGH" && <AlertTriangle className="h-3.5 w-3.5 text-red-500" />}
            {f.severity === "LOW"  && <ShieldCheck   className="h-3.5 w-3.5 text-blue-500" />}
          </div>
          <p className="text-xs font-semibold text-foreground/70 uppercase tracking-wide">Clause</p>
          <p className="text-sm font-medium text-foreground leading-snug">{f.clause}</p>
          <p className="text-xs font-semibold text-foreground/70 uppercase tracking-wide mt-1">Risk</p>
          <p className="text-sm text-muted-foreground leading-relaxed">{f.risk}</p>
        </div>
      ))}
    </div>
  );
}

export default function DebateClient() {
  const router = useRouter();
  const { contractText, setAgentOutputs, setAgentDone, setVerdict, setAnalysisError, lang, resetAnalysis } = useApp();

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
        body: JSON.stringify({ contract_text: contractText }),
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

  const handleEvent = (event: { agent: string; chunk?: string; done?: boolean; error?: string; verdict?: unknown }) => {
    const agent = event.agent as AgentId | "synthesis";

    if (agent === "synthesis") {
      setSynthesizing(false);
      if (event.error) { setAnalysisError(event.error); setStreamError(event.error); return; }
      if (event.verdict) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setVerdict(event.verdict as any);
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
    setSynthesizing(false); setStreamError(null); setConnected(false);
    resetAnalysis();
    router.replace("/analyze");
  };

  const allDone = done.lawyer && done.businessman && done.regulator;

  return (
    <div className="container max-w-7xl py-8 md:py-12 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className={`text-2xl md:text-3xl font-bold ${lang === "ur" ? "font-urdu" : ""}`}>
            {lang === "ur" ? "تین مشیروں کی بحث" : "Three-Advisor Debate"}
          </h1>
          <p className={`text-muted-foreground mt-1 text-sm ${lang === "ur" ? "font-urdu" : ""}`}>
            {synthesizing ? (lang === "ur" ? "فیصلہ تیار ہو رہا ہے…" : "Synthesizing verdict…")
              : allDone ? (lang === "ur" ? "تجزیہ مکمل" : "Analysis complete")
              : (lang === "ur" ? "تجزیہ جاری ہے…" : "Analysis in progress…")}
          </p>
        </div>
        {connected && !allDone && (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-70" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
            </span>
            {lang === "ur" ? "لائیو" : "Live"}
          </span>
        )}
      </div>

      {/* Stream error */}
      {streamError && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-5 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-destructive">Connection failed</p>
            <p className="text-sm text-muted-foreground mt-1">{streamError}</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleRetry} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" />
            {lang === "ur" ? "دوبارہ کوشش" : "Retry"}
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
                  <div className={`font-semibold text-sm ${lang === "ur" ? "font-urdu" : ""}`}>
                    {lang === "ur" ? agent.labelUr : agent.label}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-white/70">
                    {hasError ? "Error" : done[id] ? "Done" : isActive ? "Analyzing…" : "Waiting…"}
                  </div>
                </div>
              </div>

              <div
                ref={(el) => { scrollRefs.current[id] = el; }}
                className="flex-1 min-h-[300px] max-h-[500px] overflow-y-auto p-4"
              >
                {hasError ? (
                  <span className="text-destructive text-sm">{lang === "ur" ? "مشیر دستیاب نہیں" : "Agent unavailable"}</span>
                ) : findings ? (
                  /* Streaming done — render structured cards */
                  <FindingsCard findings={findings} />
                ) : raw ? (
                  /* Still streaming — show raw text with cursor */
                  <div className="font-mono text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
                    {raw}
                    {isActive && <span className="inline-block w-1.5 h-3.5 align-middle bg-foreground/60 ml-0.5 animate-pulse" />}
                  </div>
                ) : (
                  <span className="text-muted-foreground italic text-sm">
                    {lang === "ur" ? "انتظار میں…" : "Waiting for response…"}
                  </span>
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
            <span className={lang === "ur" ? "font-urdu" : ""}>
              {lang === "ur" ? "تینوں مشیروں کی رائے یکجا کی جا رہی ہے…" : "Synthesizing all three advisor opinions…"}
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
