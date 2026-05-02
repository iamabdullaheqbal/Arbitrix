"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import {
  Briefcase, Gavel, Building2,
  ThumbsUp, AlertTriangle, Quote,
  Pause, Play, FastForward, CheckCircle2,
} from "lucide-react";

type AdvisorId = "businessman" | "lawyer" | "regulator";

interface Turn {
  speaker: AdvisorId;
  text: string;
  cite?: string;
  flag?: "risk" | "warn" | "ok";
  reactsTo?: AdvisorId;
}

interface Props {
  plain: boolean;
  contractType: string | null;
  industry: string;
  role: string;
  tier: "high" | "mod" | "low";
}

const ADVISORS: Record<AdvisorId, {
  name: string; nameUr: string;
  icon: typeof Briefcase;
  color: string; ring: string; chip: string;
}> = {
  lawyer: {
    name: "The Lawyer", nameUr: "وکیل",
    icon: Gavel,
    color: "from-primary to-primary-glow",
    ring: "ring-primary/40",
    chip: "bg-primary/10 text-primary border-primary/30",
  },
  businessman: {
    name: "The Businessman", nameUr: "کاروباری مشیر",
    icon: Briefcase,
    color: "from-amber-500 to-orange-600",
    ring: "ring-amber-400/40",
    chip: "bg-amber-500/10 text-amber-700 border-amber-500/30",
  },
  regulator: {
    name: "The Regulator", nameUr: "ریگولیٹر",
    icon: Building2,
    color: "from-emerald-600 to-teal-700",
    ring: "ring-emerald-400/40",
    chip: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
  },
};

const flagMeta = {
  risk: { icon: AlertTriangle, label: "Risk flagged",  labelUr: "خطرہ",      cls: "text-destructive bg-destructive/10 border-destructive/30" },
  warn: { icon: AlertTriangle, label: "Watch closely", labelUr: "توجہ دیں",  cls: "text-amber-700 bg-amber-500/10 border-amber-500/30" },
  ok:   { icon: ThumbsUp,      label: "Noted",         labelUr: "نوٹ کیا",   cls: "text-emerald-700 bg-emerald-500/10 border-emerald-500/30" },
} as const;

/** Detect if a string is predominantly Urdu/Arabic script */
function isUrduText(text: string): boolean {
  const urduChars = (text.match(/[\u0600-\u06FF]/g) || []).length;
  return urduChars / Math.max(text.length, 1) > 0.25;
}

/**
 * Build debate turns from real verdict red_flags.
 * Each finding becomes a turn by the agent who found it,
 * with cross-reactions between advisors.
 */
function buildTurnsFromVerdict(
  redFlags: Array<{ clause: string; risk: string; severity: string; agent: string }>,
  tier: "high" | "mod" | "low",
  lang: "en" | "ur",
): Turn[] {
  if (!redFlags || redFlags.length === 0) return [];

  const turns: Turn[] = [];
  const agentOrder: AdvisorId[] = ["lawyer", "businessman", "regulator"];

  // Group flags by agent, preserving order
  const byAgent: Record<AdvisorId, typeof redFlags> = {
    lawyer: [], businessman: [], regulator: [],
  };
  for (const f of redFlags) {
    const a = f.agent as AdvisorId;
    if (byAgent[a]) byAgent[a].push(f);
  }

  // Interleave: each agent presents their top finding, then reacts
  const maxFindings = Math.max(
    byAgent.lawyer.length,
    byAgent.businessman.length,
    byAgent.regulator.length,
  );

  for (let i = 0; i < Math.min(maxFindings, 2); i++) {
    for (const agentId of agentOrder) {
      const finding = byAgent[agentId][i];
      if (!finding) continue;

      const sev = (finding.severity || "").toUpperCase();
      const flag: Turn["flag"] = sev === "HIGH" ? "risk" : sev === "MEDIUM" ? "warn" : "ok";

      // Auto-detect language from the risk text itself
      const textIsUrdu = isUrduText(finding.risk);
      const displayLang = textIsUrdu ? "ur" : lang;

      // Build cite chip from clause (first 60 chars)
      const clauseSnippet = finding.clause.length > 60
        ? finding.clause.slice(0, 57) + "…"
        : finding.clause;

      turns.push({
        speaker: agentId,
        text: finding.risk,
        cite: clauseSnippet,
        flag,
        // Second round: react to the previous agent
        reactsTo: i > 0 ? agentOrder[(agentOrder.indexOf(agentId) + 2) % 3] : undefined,
      });

      void displayLang; // used for future i18n
    }
  }

  // Closing summary turn from the highest-risk agent
  const highestFlag = redFlags.find(f => f.severity === "HIGH") || redFlags[0];
  if (highestFlag) {
    const closingAgent = highestFlag.agent as AdvisorId;
    const isUrdu = isUrduText(highestFlag.risk);
    turns.push({
      speaker: closingAgent,
      cite: lang === "ur" || isUrdu ? "حتمی فیصلہ" : "Verdict",
      flag: tier === "high" ? "risk" : tier === "mod" ? "warn" : "ok",
      text: lang === "ur" || isUrdu
        ? `خلاصہ: اس معاہدے میں ${redFlags.length} اہم مسائل ہیں۔ دستخط سے پہلے ان شقوں کو ضرور درست کروائیں۔`
        : `Bottom line: ${redFlags.length} issue${redFlags.length !== 1 ? "s" : ""} identified across all three advisors. Address the flagged clauses before signing.`,
    });
  }

  return turns;
}

export const LiveDebate = ({ plain, contractType, industry, role, tier }: Props) => {
  const { lang, verdict, contractText } = useApp();

  // Auto-detect language from contract text (overrides UI lang if contract is Urdu)
  const detectedLang = useMemo((): "en" | "ur" => {
    if (lang === "ur") return "ur";
    if (contractText && isUrduText(contractText)) return "ur";
    return "en";
  }, [contractText, lang]);

  // Build turns from real verdict data
  const turns = useMemo(() => {
    if (verdict?.red_flags && verdict.red_flags.length > 0) {
      return buildTurnsFromVerdict(verdict.red_flags, tier, detectedLang);
    }
    // Fallback: generic turns when no verdict yet
    return buildFallbackTurns(contractType, industry, tier, detectedLang);
  }, [verdict, tier, detectedLang, contractType, industry]);

  const [turnIdx, setTurnIdx]     = useState(0);
  const [typed, setTyped]         = useState("");
  const [done, setDone]           = useState(false);
  const [paused, setPaused]       = useState(false);
  const [speed, setSpeed]         = useState(1);
  const [thinking, setThinking]   = useState<AdvisorId | null>(turns[0]?.speaker ?? null);

  const scrollerRef = useRef<HTMLDivElement>(null);

  // Reset animation when turns change (new verdict loaded)
  useEffect(() => {
    setTurnIdx(0);
    setTyped("");
    setDone(false);
    setThinking(turns[0]?.speaker ?? null);
  }, [turns]);

  // Auto-scroll
  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [typed, turnIdx]);

  // Typewriter engine
  useEffect(() => {
    if (paused || done) return;
    if (turnIdx >= turns.length) { setDone(true); setThinking(null); return; }

    const turn = turns[turnIdx];
    const text = turn.text;

    if (typed.length === 0) {
      setThinking(turn.speaker);
      const t = setTimeout(() => {
        setThinking(null);
        setTyped(text.slice(0, 1));
      }, 600 / speed);
      return () => clearTimeout(t);
    }

    if (typed.length < text.length) {
      const remain = text.length - typed.length;
      const step = Math.max(1, Math.min(5, Math.floor(remain / 35) + 1));
      const delay = (10 + Math.random() * 20) / speed;
      const t = setTimeout(() => setTyped(text.slice(0, typed.length + step)), delay);
      return () => clearTimeout(t);
    }

    const t = setTimeout(() => { setTurnIdx(i => i + 1); setTyped(""); }, 800 / speed);
    return () => clearTimeout(t);
  }, [typed, turnIdx, paused, done, turns, speed]);

  const visibleTurns = turns.slice(0, turnIdx);
  const activeTurn   = !done ? turns[turnIdx] : null;
  const isUrdu       = detectedLang === "ur";

  return (
    <div className="rounded-3xl border border-border bg-gradient-to-b from-card to-muted/30 shadow-elegant overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-border bg-card/80 backdrop-blur">
        <div className="flex items-center gap-2.5">
          {done ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          ) : (
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-70" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-destructive" />
            </span>
          )}
          <span className="text-xs font-semibold tracking-wider uppercase text-foreground/80">
            {done
              ? (isUrdu ? "بحث مکمل" : "Debate concluded")
              : (isUrdu ? "لائیو · تین مشیروں کی بحث" : "Live · Three-advisor debate")}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setPaused(p => !p)}
            disabled={done}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background hover:bg-muted px-3 py-1.5 text-xs font-medium transition-smooth disabled:opacity-40"
          >
            {paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
            {paused ? (isUrdu ? "جاری رکھیں" : "Resume") : (isUrdu ? "روکیں" : "Pause")}
          </button>
          <button
            onClick={() => setSpeed(s => s === 1 ? 2 : 1)}
            disabled={done}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-smooth disabled:opacity-40 ${
              speed === 2 ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-muted"
            }`}
          >
            <FastForward className="h-3.5 w-3.5" />
            {speed}x
          </button>
        </div>
      </div>

      {/* Advisor presence row */}
      <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 px-5 py-8 border-b border-border bg-muted/20">
        {(Object.keys(ADVISORS) as AdvisorId[]).map(id => {
          const a = ADVISORS[id];
          const isThinking = thinking === id;
          const isSpeaking = activeTurn?.speaker === id && !thinking;
          const hasSpoken  = visibleTurns.some(t => t.speaker === id) || done;

          return (
            <div key={id} className="flex items-center gap-4 min-w-[160px]">
              <div className={`relative grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br ${a.color} text-white shadow-soft flex-shrink-0 ${
                isSpeaking ? `ring-4 ${a.ring} animate-glow-pulse` : ""
              }`}>
                <a.icon className="h-7 w-7" />
                {isThinking && (
                  <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-accent border-2 border-card animate-pulse" />
                )}
                {hasSpoken && !isSpeaking && (
                  <div className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-white" />
                  </div>
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className={`text-sm font-bold text-foreground/90 truncate ${isUrdu ? "font-urdu leading-[1.8]" : ""}`}>
                  {isUrdu ? a.nameUr : a.name}
                </span>
                <span className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 ${
                  isSpeaking ? "text-primary animate-pulse"
                  : isThinking ? "text-amber-600 animate-pulse"
                  : hasSpoken ? "text-emerald-600"
                  : "text-muted-foreground/50"
                }`}>
                  {isThinking ? (isUrdu ? "سوچ رہا ہے…" : "thinking…")
                    : isSpeaking ? (isUrdu ? "بول رہا ہے" : "speaking")
                    : hasSpoken ? (isUrdu ? "مکمل" : "done")
                    : (isUrdu ? "سن رہا ہے" : "listening")}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Transcript */}
      <div
        ref={scrollerRef}
        className="max-h-[540px] overflow-y-auto px-4 md:px-6 py-5 space-y-4"
      >
        {visibleTurns.map((turn, i) => (
          <DebateBubble key={i} turn={turn} typing={false} isUrdu={isUrdu} />
        ))}

        {activeTurn && thinking && (
          <ThinkingBubble speaker={activeTurn.speaker} isUrdu={isUrdu} />
        )}

        {activeTurn && !thinking && (
          <DebateBubble
            turn={{ ...activeTurn, text: typed }}
            typing
            isUrdu={isUrdu}
          />
        )}

        {done && (
          <div className="flex items-center justify-center gap-2 pt-2 text-sm text-muted-foreground animate-fade-in-up">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span className={isUrdu ? "font-urdu" : ""}>
              {isUrdu ? "تینوں مشیروں نے اپنی رائے دے دی۔" : "All three advisors have weighed in."}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

/* ─── Fallback script when no verdict data ─────────────────────────────── */

function buildFallbackTurns(
  contractType: string | null,
  industry: string,
  tier: "high" | "mod" | "low",
  lang: "en" | "ur",
): Turn[] {
  const ind = industry?.trim() || (lang === "ur" ? "آپ کا کاروبار" : "your business");

  if (lang === "ur") {
    return [
      {
        speaker: "lawyer",
        cite: "ذمہ داری کی شق",
        flag: "risk",
        text: `اس معاہدے میں ذمہ داری کی شق غیر محدود ہے۔ بالواسطہ نقصانات کے لیے کوئی استثنا نہیں، اور تعویض یکطرفہ ہے۔`,
      },
      {
        speaker: "businessman",
        reactsTo: "lawyer",
        flag: "warn",
        text: `${ind} کے لیے یہ خطرناک ہے۔ ایک تنازعہ مہینوں کا منافع ختم کر سکتا ہے۔ ذمہ داری کو معاہدے کی قیمت تک محدود کریں۔`,
      },
      {
        speaker: "regulator",
        cite: contractType === "property" ? "Registration Act 1908" : "SBP FE Manual",
        flag: "risk",
        text: contractType === "property"
          ? `کرایہ کی مدت رجسٹریشن کے بغیر 11 ماہ سے زیادہ ہے — یہ قانونی طور پر ناقابلِ نفاذ ہو سکتا ہے۔`
          : `ادائیگی کی شرائط SBP کی منظوری کے بغیر غیر ملکی کرنسی کا حوالہ دیتی ہیں۔`,
      },
      {
        speaker: "lawyer",
        cite: "حتمی فیصلہ",
        flag: tier === "high" ? "risk" : tier === "mod" ? "warn" : "ok",
        text: `خلاصہ: دستخط سے پہلے نشان زدہ شقوں کو ضرور درست کروائیں۔`,
      },
    ];
  }

  const ctxLine =
    contractType === "property" ? "the lease term and registration status"
    : contractType === "employment" ? "termination, notice and non-compete clauses"
    : contractType === "freelance" ? "scope creep and payment milestones"
    : contractType === "partnership" ? "profit-sharing and exit clauses"
    : "liability caps and dispute resolution";

  return [
    {
      speaker: "lawyer",
      cite: "Liability Clause",
      flag: "risk",
      text: `The liability clause imposes uncapped consequential damages with no carve-out for indirect losses. Indemnity is one-sided in favor of the counter-party.`,
    },
    {
      speaker: "businessman",
      reactsTo: "lawyer",
      flag: "warn",
      text: `Agreed. For ${ind}, uncapped liability on a single dispute could wipe out a full quarter of earnings. We need a hard cap at contract value.`,
    },
    {
      speaker: "regulator",
      cite: contractType === "property" ? "Registration Act 1908 §17(d)" : "SBP FE Manual Ch. 13",
      flag: "risk",
      text: contractType === "property"
        ? `The lease term exceeds 11 months without registration — non-compliant with Registration Act 1908 §17(d) and unenforceable in court.`
        : `Payment terms reference foreign currency without SBP approval, triggering FE Manual exposure for ${ind}.`,
    },
    {
      speaker: "lawyer",
      cite: "Verdict",
      flag: tier === "high" ? "risk" : tier === "mod" ? "warn" : "ok",
      text: `Bottom line: focus negotiation on ${ctxLine}. Address those points and residual risk drops materially.`,
    },
  ];
}

/* ─── Sub-components ───────────────────────────────────────────────────── */

function DebateBubble({
  turn, typing, isUrdu,
}: {
  turn: Turn; typing: boolean; isUrdu: boolean;
}) {
  const a = ADVISORS[turn.speaker];
  const isRight = turn.speaker === "businessman";
  const flag = turn.flag ? flagMeta[turn.flag] : null;
  // Use the passed isUrdu flag as primary; fall back to text detection
  const textIsUrdu = isUrdu;

  return (
    <div className={`flex ${isRight ? "flex-row-reverse" : "flex-row"} gap-3 animate-fade-in-up`}>
      <div className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${a.color} text-white shadow-soft flex-shrink-0`}>
        <a.icon className="h-4 w-4" />
      </div>

      <div className={`max-w-[85%] md:max-w-[78%] ${isRight ? "text-right" : ""}`}>
        {/* Name + reply-to */}
        <div className={`flex items-center gap-2 mb-1 flex-wrap ${isRight ? "justify-end" : ""}`}>
          <span className={`text-xs font-semibold ${isUrdu ? "font-urdu" : ""}`}>
            {isUrdu ? a.nameUr : a.name}
          </span>
          {turn.reactsTo && (
            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground border border-border rounded-full px-1.5 py-0.5">
              <Quote className="h-2.5 w-2.5" />
              {isUrdu ? `جواب: ${ADVISORS[turn.reactsTo].nameUr}` : `replying to ${ADVISORS[turn.reactsTo].name.replace("The ", "")}`}
            </span>
          )}
        </div>

        {/* Bubble */}
        <div className={`rounded-2xl border px-4 py-3 shadow-card text-sm bg-card ${
          isRight
            ? "border-amber-500/30 rounded-tr-sm"
            : turn.speaker === "lawyer"
            ? "border-primary/25 rounded-tl-sm"
            : "border-emerald-500/30 rounded-tl-sm"
        }`}>
          {/* Cite chip */}
          {turn.cite && (
            <div className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider border rounded-full px-2 py-0.5 mb-2 ${a.chip}`}>
              {turn.cite}
            </div>
          )}

          {/* Text */}
          <p
            className={`text-foreground/90 whitespace-pre-wrap leading-relaxed ${textIsUrdu ? "font-urdu" : ""}`}
            dir={textIsUrdu ? "rtl" : undefined}
            style={textIsUrdu ? { fontFamily: "'Noto Nastaliq Urdu', serif", lineHeight: "2" } : undefined}
          >
            {turn.text}
            {typing && (
              <span className="inline-block w-1.5 h-4 align-middle bg-foreground/70 ml-0.5 animate-pulse" />
            )}
          </p>

          {/* Flag badge */}
          {flag && !typing && (
            <div className={`mt-3 inline-flex items-center gap-1.5 text-[11px] font-medium border rounded-full px-2 py-1 ${flag.cls}`}>
              <flag.icon className="h-3 w-3" />
              {isUrdu ? flag.labelUr : flag.label}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ThinkingBubble({ speaker, isUrdu }: { speaker: AdvisorId; isUrdu: boolean }) {
  const a = ADVISORS[speaker];
  const isRight = speaker === "businessman";
  return (
    <div className={`flex ${isRight ? "flex-row-reverse" : "flex-row"} gap-3 animate-fade-in-up`}>
      <div className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${a.color} text-white shadow-soft flex-shrink-0`}>
        <a.icon className="h-4 w-4" />
      </div>
      <div>
        <div className={`text-xs font-semibold mb-1 ${isUrdu ? "font-urdu" : ""}`}>
          {isUrdu ? a.nameUr : a.name}
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
      className="inline-block h-2 w-2 rounded-full bg-foreground/40 animate-bounce"
      style={{ animationDelay: delay, animationDuration: "1s" }}
    />
  );
}
