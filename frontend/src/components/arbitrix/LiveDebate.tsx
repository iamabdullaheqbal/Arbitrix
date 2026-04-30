"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { Briefcase, Gavel, Building2, ThumbsUp, AlertTriangle, Quote, Sparkles, Pause, Play, FastForward, CheckCircle2 } from "lucide-react";

type AdvisorId = "businessman" | "lawyer" | "regulator";

interface Turn {
  speaker: AdvisorId;
  tech: string;
  plain: string;
  cite?: string;          // clause citation chip
  flag?: "risk" | "ok" | "warn";
  reactsTo?: AdvisorId;   // shows "replying to" pill
}

interface Props {
  plain: boolean;
  contractType: string | null;
  industry: string;
  role: string;
  tier: "high" | "mod" | "low";
}

const ADVISORS: Record<AdvisorId, { name: string; nameUr: string; role: string; roleUr: string; icon: typeof Briefcase; color: string; ring: string; chip: string; }> = {
  businessman: {
    name: "The Businessman", nameUr: "کاروباری مشیر",
    role: "Profit & loss lens", roleUr: "نفع و نقصان",
    icon: Briefcase,
    color: "from-amber-500 to-orange-600",
    ring: "ring-amber-400/40",
    chip: "bg-amber-500/10 text-amber-700 border-amber-500/30",
  },
  lawyer: {
    name: "The Lawyer", nameUr: "وکیل",
    role: "Clause-by-clause review", roleUr: "قانونی شقیں",
    icon: Gavel,
    color: "from-primary to-primary-glow",
    ring: "ring-primary/40",
    chip: "bg-primary/10 text-primary border-primary/30",
  },
  regulator: {
    name: "The Regulator", nameUr: "ریگولیٹر",
    role: "Compliance & statutes", roleUr: "قوانین و ضوابط",
    icon: Building2,
    color: "from-emerald-600 to-teal-700",
    ring: "ring-emerald-400/40",
    chip: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
  },
};

function buildScript(contractType: string | null, industry: string, tier: "high" | "mod" | "low"): Turn[] {
  const ind = industry?.trim() || "your business";
  const ctxLine =
    contractType === "property"
      ? "the lease term and registration status"
      : contractType === "employment"
      ? "termination, notice and non-compete clauses"
      : contractType === "freelance"
      ? "scope creep and payment milestones"
      : contractType === "partnership"
      ? "profit-sharing and exit clauses"
      : "liability caps and dispute resolution";

  return [
    {
      speaker: "lawyer",
      cite: "Clause 4.2 — Liability",
      flag: "risk",
      tech: `Clause 4.2 imposes uncapped consequential liability. There is no carve-out for indirect damages, and indemnity is one-sided in favor of the counter-party.`,
      plain: `Clause 4.2 is dangerous. If something goes wrong, the other side can come after all your money — not just what this deal is worth.`,
    },
    {
      speaker: "businessman",
      reactsTo: "lawyer",
      flag: "warn",
      tech: `Agreed. From a P&L standpoint, an uncapped liability against ${ind} could wipe out a full quarter of retained earnings on a single dispute. We must cap at contract value, 1× max.`,
      plain: `Yes — for ${ind}, one bad dispute could eat months of profit. We need a hard ceiling: never more than the deal itself is worth.`,
    },
    {
      speaker: "regulator",
      cite: contractType === "property" ? "Registration Act 1908 §17(d)" : "SBP FE Manual Ch. 13",
      flag: "risk",
      tech:
        contractType === "property"
          ? `Separately — the lease term exceeds 11 months without registration. That is non-compliant with the Registration Act 1908 §17(d) and unenforceable in court.`
          : `Separately — payment terms reference foreign currency without SBP approval. That triggers FE Manual exposure for ${ind}, regardless of the counter-party's intent.`,
      plain:
        contractType === "property"
          ? `Also — this lease is too long to be unregistered. If it ever goes to court, the contract simply won't hold.`
          : `Also — paying in foreign currency without SBP clearance can get ${ind} fined, even if everyone else acts in good faith.`,
    },
    {
      speaker: "lawyer",
      reactsTo: "regulator",
      flag: "warn",
      tech: `Concur. We should add a compliance representation and a survival clause so the obligation outlives termination.`,
      plain: `Right. We add a line that makes the other side legally promise they're following the rules — and that promise stays alive even after the deal ends.`,
    },
    {
      speaker: "businessman",
      flag: "ok",
      tech: `Commercially, push for a 30-day cure period and a mutual termination right. That preserves the relationship while protecting downside.`,
      plain: `Business-wise — give both sides 30 days to fix mistakes before walking away. Keeps the deal alive but protects you.`,
    },
    {
      speaker: "regulator",
      reactsTo: "businessman",
      flag: "ok",
      tech: `Acceptable, provided the cure period does not extend statutory notice obligations under ${contractType === "employment" ? "the Industrial & Commercial Employment Ordinance 1968" : "applicable Pakistani law"}.`,
      plain: `Fine — as long as the fix-it window doesn't override the legal notice periods Pakistan already requires.`,
    },
    {
      speaker: "lawyer",
      flag: tier === "high" ? "risk" : tier === "mod" ? "warn" : "ok",
      cite: "Verdict",
      tech: `Net position: focus negotiation on ${ctxLine}. With those three changes, residual legal risk drops materially.`,
      plain: `Bottom line: fix ${ctxLine}. Do those three things and most of the danger goes away.`,
    },
  ];
}

const flagMeta = {
  risk: { icon: AlertTriangle, label: "Risk flagged", cls: "text-destructive bg-destructive/10 border-destructive/30" },
  warn: { icon: AlertTriangle, label: "Watch closely", cls: "text-amber-700 bg-amber-500/10 border-amber-500/30" },
  ok:   { icon: ThumbsUp,      label: "Concedes",      cls: "text-emerald-700 bg-emerald-500/10 border-emerald-500/30" },
} as const;

export const LiveDebate = ({ plain, contractType, industry, role, tier }: Props) => {
  const { lang } = useApp();
  const script = useMemo(() => buildScript(contractType, industry, tier), [contractType, industry, tier]);

  const [turnIdx, setTurnIdx] = useState(0);     // current turn being typed
  const [typed, setTyped] = useState("");        // streamed text of current turn
  const [done, setDone] = useState(false);
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState(1);         // 1x or 2x
  const [thinking, setThinking] = useState<AdvisorId | null>(script[0]?.speaker ?? null);

  const scrollerRef = useRef<HTMLDivElement>(null);

  // Scroll on update
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [typed, turnIdx]);

  // Streaming engine
  useEffect(() => {
    if (paused || done) return;
    if (turnIdx >= script.length) { setDone(true); setThinking(null); return; }

    const turn = script[turnIdx];
    const fullText = plain ? turn.plain : turn.tech;

    // Pre-turn "thinking" pause
    if (typed.length === 0) {
      setThinking(turn.speaker);
      const t = setTimeout(() => {
        setThinking(null);
        setTyped(fullText.slice(0, 1));
      }, 650 / speed);
      return () => clearTimeout(t);
    }

    if (typed.length < fullText.length) {
      const remain = fullText.length - typed.length;
      const step = Math.max(1, Math.min(4, Math.floor(remain / 40) + 1));
      const delay = (12 + Math.random() * 22) / speed;
      const t = setTimeout(() => setTyped(fullText.slice(0, typed.length + step)), delay);
      return () => clearTimeout(t);
    }

    // Finished this turn — pause then advance
    const t = setTimeout(() => {
      setTurnIdx((i) => i + 1);
      setTyped("");
    }, 700 / speed);
    return () => clearTimeout(t);
  }, [typed, turnIdx, paused, done, plain, script, speed]);

  // Reset stream when mode/script changes
  useEffect(() => {
    setTurnIdx(0); setTyped(""); setDone(false); setThinking(script[0]?.speaker ?? null);
  }, [plain, script]);

  const visibleTurns = script.slice(0, turnIdx);
  const activeTurn = !done ? script[turnIdx] : null;

  return (
    <div className="rounded-3xl border border-border bg-gradient-to-b from-card to-muted/30 shadow-elegant overflow-hidden">
      {/* Header bar — looks like a live courtroom feed */}
      <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-border bg-card/80 backdrop-blur">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-70" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-destructive" />
          </span>
          <span className="text-xs font-semibold tracking-wider uppercase text-foreground/80">
            {done ? "Debate concluded" : "Live · Three-advisor debate"}
          </span>
          {!done && <Sparkles className="h-3.5 w-3.5 text-accent animate-pulse" />}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setPaused((p) => !p)}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background hover:bg-muted px-3 py-1.5 text-xs font-medium transition-smooth"
            disabled={done}
          >
            {paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
            {paused ? "Resume" : "Pause"}
          </button>
          <button
            onClick={() => setSpeed((s) => (s === 1 ? 2 : 1))}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-smooth ${speed === 2 ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-muted"}`}
            disabled={done}
          >
            <FastForward className="h-3.5 w-3.5" />
            {speed}x
          </button>
        </div>
      </div>

      {/* Advisor presence row */}
      <div className="grid grid-cols-3 gap-2 px-5 py-3 border-b border-border bg-muted/30">
        {(Object.keys(ADVISORS) as AdvisorId[]).map((id) => {
          const a = ADVISORS[id];
          const isThinking = thinking === id;
          const isSpeaking = activeTurn?.speaker === id && !thinking;
          return (
            <div key={id} className="flex items-center gap-2.5 min-w-0">
              <div className={`relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br ${a.color} text-white shadow-soft flex-shrink-0 ${isSpeaking ? `ring-4 ${a.ring} animate-glow-pulse` : ""}`}>
                <a.icon className="h-4 w-4" />
                {isThinking && (
                  <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-accent border-2 border-card animate-pulse" />
                )}
              </div>
              <div className="min-w-0">
                <div className={`text-xs font-semibold truncate ${lang === "ur" ? "font-urdu" : ""}`}>
                  {lang === "ur" ? a.nameUr : a.name}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {isThinking ? "thinking…" : isSpeaking ? "speaking" : done ? "done" : "listening"}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Transcript scroller */}
      <div ref={scrollerRef} className="max-h-[520px] overflow-y-auto px-4 md:px-6 py-5 space-y-4 bg-[radial-gradient(ellipse_at_top,hsl(var(--muted)/0.4),transparent_60%)]">
        {visibleTurns.map((turn, i) => (
          <DebateBubble key={i} turn={turn} text={plain ? turn.plain : turn.tech} typing={false} lang={lang} />
        ))}

        {activeTurn && thinking && (
          <ThinkingBubble speaker={activeTurn.speaker} lang={lang} />
        )}

        {activeTurn && !thinking && (
          <DebateBubble turn={activeTurn} text={typed} typing lang={lang} />
        )}

        {done && (
          <div className="flex items-center justify-center gap-2 pt-2 text-sm text-muted-foreground animate-fade-in-up">
            <CheckCircle2 className="h-4 w-4 text-success" />
            All three advisors have weighed in.
          </div>
        )}
      </div>
    </div>
  );
};

/* ---------------- subcomponents ---------------- */

function DebateBubble({ turn, text, typing, lang }: { turn: Turn; text: string; typing: boolean; lang: "en" | "ur" }) {
  const a = ADVISORS[turn.speaker];
  const align = turn.speaker === "lawyer" ? "items-start" : turn.speaker === "businessman" ? "items-end md:items-end" : "items-start";
  const isRight = turn.speaker === "businessman";
  const flag = turn.flag ? flagMeta[turn.flag] : null;

  return (
    <div className={`flex ${isRight ? "flex-row-reverse" : "flex-row"} gap-3 animate-fade-in-up`}>
      <div className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${a.color} text-white shadow-soft flex-shrink-0`}>
        <a.icon className="h-4 w-4" />
      </div>
      <div className={`max-w-[85%] md:max-w-[78%] ${isRight ? "text-right" : ""}`}>
        <div className={`flex items-center gap-2 mb-1 ${isRight ? "justify-end" : ""}`}>
          <span className={`text-xs font-semibold ${lang === "ur" ? "font-urdu" : ""}`}>
            {lang === "ur" ? a.nameUr : a.name}
          </span>
          {turn.reactsTo && (
            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground border border-border rounded-full px-1.5 py-0.5">
              <Quote className="h-2.5 w-2.5" />
              replying to {ADVISORS[turn.reactsTo].name.replace("The ", "")}
            </span>
          )}
        </div>

        <div
          className={`relative rounded-2xl border px-4 py-3 shadow-card text-sm leading-relaxed bg-card ${
            isRight ? "border-amber-500/30 rounded-tr-sm" : turn.speaker === "lawyer" ? "border-primary/25 rounded-tl-sm" : "border-emerald-500/30 rounded-tl-sm"
          }`}
        >
          {turn.cite && (
            <div className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider border rounded-full px-2 py-0.5 mb-2 ${a.chip}`}>
              {turn.cite}
            </div>
          )}
          <p className="text-foreground/90 whitespace-pre-wrap">
            {text}
            {typing && <span className="inline-block w-1.5 h-4 align-middle bg-foreground/70 ml-0.5 animate-pulse" />}
          </p>

          {flag && !typing && (
            <div className={`mt-3 inline-flex items-center gap-1.5 text-[11px] font-medium border rounded-full px-2 py-1 ${flag.cls}`}>
              <flag.icon className="h-3 w-3" />
              {flag.label}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ThinkingBubble({ speaker, lang }: { speaker: AdvisorId; lang: "en" | "ur" }) {
  const a = ADVISORS[speaker];
  const isRight = speaker === "businessman";
  return (
    <div className={`flex ${isRight ? "flex-row-reverse" : "flex-row"} gap-3 animate-fade-in-up`}>
      <div className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${a.color} text-white shadow-soft flex-shrink-0`}>
        <a.icon className="h-4 w-4" />
      </div>
      <div>
        <div className={`text-xs font-semibold mb-1 ${lang === "ur" ? "font-urdu" : ""}`}>
          {lang === "ur" ? a.nameUr : a.name}
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-2xl border border-border bg-card px-4 py-3 shadow-card">
          <Dot delay="0ms" />
          <Dot delay="150ms" />
          <Dot delay="300ms" />
        </div>
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="inline-block h-2 w-2 rounded-full bg-foreground/50 animate-bounce"
      style={{ animationDelay: delay, animationDuration: "1s" }}
    />
  );
}