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

function buildScript(contractType: string | null, industry: string, tier: "high" | "mod" | "low", lang: "en" | "ur"): Turn[] {
  const ind = industry?.trim() || (lang === "ur" ? "آپ کا کاروبار" : "your business");
  
  if (lang === "ur") {
    return [
      {
        speaker: "lawyer",
        cite: "شق 4.2 — ذمہ داری (Liability)",
        flag: "risk",
        tech: `شق 4.2 غیر محدود ضمنی ذمہ داری (consequential liability) عائد کرتی ہے۔ بالواسطہ نقصانات کے لیے کوئی استثنا نہیں ہے، اور تعویض (indemnity) دوسری پارٹی کے حق میں یکطرفہ ہے۔`,
        plain: `شق 4.2 خطرناک ہے۔ اگر کچھ غلط ہو جاتا ہے تو، دوسری طرف آپ کے تمام پیسوں کے پیچھے آ سکتا ہے — نہ صرف اس معاہدے کی مالیت کے۔`,
      },
      {
        speaker: "businessman",
        reactsTo: "lawyer",
        flag: "warn",
        tech: `اتفاق کرتا ہوں۔ مالیاتی نقطہ نظر سے، ${ind} کے خلاف غیر محدود ذمہ داری (unlimited liability) منافع کا ایک پورا حصہ ختم کر سکتی ہے۔ ہمیں معاہدے کی قیمت تک محدود رکھنا چاہیے۔`,
        plain: `جی ہاں — ${ind} کے لیے، ایک برا تنازعہ مہینوں کا منافع کھا سکتا ہے۔ ہمیں ایک حد مقرر کرنے کی ضرورت ہے۔`,
      },
      {
        speaker: "regulator",
        cite: contractType === "property" ? "Registration Act 1908 §17(d)" : "SBP FE Manual Ch. 13",
        flag: "risk",
        tech: contractType === "property" 
          ? `کرایہ کی مدت رجسٹریشن (registration) کے بغیر 11 ماہ سے زیادہ ہے۔ یہ رجسٹریشن ایکٹ 1908 کی شق 17(d) کے مطابق نہیں ہے۔`
          : `${ind} کے لیے غیر ملکی کرنسی میں ادائیگی کے حوالہ جات SBP کی منظوری کے بغیر ہیں۔ یہ FE مینول کی خلاف ورزی ہو سکتی ہے۔`,
        plain: contractType === "property"
          ? `نیز — یہ لیز رجسٹریشن کے بغیر بہت لمبی ہے۔ اگر یہ کبھی عدالت میں جاتی ہے تو معاہدہ برقرار نہیں رہے گا۔`
          : `نیز — SBP کی اجازت کے بغیر غیر ملکی کرنسی میں ادائیگی کرنا آپ کو جرمانے کا شکار کر سکتا ہے۔`,
      },
      {
        speaker: "lawyer",
        cite: "حتمی فیصلہ (Verdict)",
        flag: tier === "high" ? "risk" : tier === "mod" ? "warn" : "ok",
        tech: `حتمی پوزیشن: مذاکرات (negotiation) کو اس شق پر مرکوز کریں۔ ان تبدیلیوں کے ساتھ، قانونی خطرہ نمایاں طور پر کم ہو جاتا ہے۔`,
        plain: `نیچے کی لکیر: ان چیزوں کو درست کریں اور زیادہ تر خطرہ ختم ہو جائے گا۔`,
      },
    ];
  }

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
  const { lang, agentOutputs } = useApp();

  // Detect whether we have real agent data
  const hasRealData = !!(agentOutputs.lawyer || agentOutputs.businessman || agentOutputs.regulator);

  // Parse real agent JSON into structured findings for direct rendering
  const realFindings = useMemo(() => {
    if (!hasRealData) return null;

    const parse = (raw: string): Array<{ clause: string; risk: string; severity: string }> => {
      try {
        const cleaned = raw.trim().replace(/^```[a-z]*\n?/i, "").replace(/```$/, "").trim();
        const obj = JSON.parse(cleaned);
        return Array.isArray(obj?.findings) ? obj.findings : [];
      } catch {
        return [];
      }
    };

    return {
      lawyer:      parse(agentOutputs.lawyer),
      businessman: parse(agentOutputs.businessman),
      regulator:   parse(agentOutputs.regulator),
    };
  }, [agentOutputs, hasRealData]);

  // Demo script for when there's no real data
  const script = useMemo(() => buildScript(contractType, industry, tier, lang),
    [contractType, industry, tier, lang]);

  const [turnIdx, setTurnIdx] = useState(0);
  const [typed, setTyped]     = useState("");
  const [done, setDone]       = useState(false);
  const [paused, setPaused]   = useState(false);
  const [speed, setSpeed]     = useState(1);
  const [thinking, setThinking] = useState<AdvisorId | null>(script[0]?.speaker ?? null);

  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [typed, turnIdx]);

  // Streaming engine — only runs for demo script, not real data
  useEffect(() => {
    if (hasRealData) return;
    if (paused || done) return;
    if (turnIdx >= script.length) { setDone(true); setThinking(null); return; }

    const turn = script[turnIdx];
    const techText  = turn.tech;
    const plainText = turn.plain;
    const canonical = techText.length >= plainText.length ? techText : plainText;

    if (typed.length === 0) {
      setThinking(turn.speaker);
      const t = setTimeout(() => {
        setThinking(null);
        setTyped(canonical.slice(0, 1));
      }, 650 / speed);
      return () => clearTimeout(t);
    }

    if (typed.length < canonical.length) {
      const remain = canonical.length - typed.length;
      const step = Math.max(1, Math.min(4, Math.floor(remain / 40) + 1));
      const delay = (12 + Math.random() * 22) / speed;
      const t = setTimeout(() => setTyped(canonical.slice(0, typed.length + step)), delay);
      return () => clearTimeout(t);
    }

    const t = setTimeout(() => { setTurnIdx((i) => i + 1); setTyped(""); }, 700 / speed);
    return () => clearTimeout(t);
  }, [typed, turnIdx, paused, done, script, speed, hasRealData]);

  useEffect(() => {
    setTurnIdx(0); setTyped(""); setDone(false); setThinking(script[0]?.speaker ?? null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [script]);

  // ── Real data path: render findings directly, no animation ──────────────
  if (hasRealData && realFindings) {
    const AGENT_ORDER: Array<{ id: AdvisorId; findings: typeof realFindings.lawyer }> = [
      { id: "lawyer",      findings: realFindings.lawyer },
      { id: "businessman", findings: realFindings.businessman },
      { id: "regulator",   findings: realFindings.regulator },
    ];

    return (
      <div className="rounded-3xl border border-border bg-gradient-to-b from-card to-muted/30 shadow-elegant overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 py-3 border-b border-border bg-card/80 backdrop-blur">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <span className="text-xs font-semibold tracking-wider uppercase text-foreground/80">
            {lang === "ur" ? "تینوں مشیروں کا تجزیہ" : "Three-advisor analysis complete"}
          </span>
        </div>

        <div className="px-4 md:px-6 py-5 space-y-6">
          {AGENT_ORDER.map(({ id, findings }) => {
            const a = ADVISORS[id];
            const Icon = a.icon;
            if (!findings || findings.length === 0) return null;
            return (
              <div key={id}>
                {/* Advisor header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className={`grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br ${a.color} text-white shadow-soft flex-shrink-0`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className={`font-semibold text-sm ${lang === "ur" ? "font-urdu" : ""}`}>
                    {lang === "ur" ? a.nameUr : a.name}
                  </span>
                </div>

                {/* Findings */}
                <div className="space-y-3 ml-12">
                  {findings.map((f, i) => {
                    const sev = (f.severity || "").toUpperCase();
                    const borderColor = sev === "HIGH" ? "#dc2626" : sev === "MEDIUM" ? "#d97706" : "#16a34a";
                    const badgeCls = sev === "HIGH"
                      ? "bg-red-100 text-red-700"
                      : sev === "MEDIUM"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-green-100 text-green-700";

                    return (
                      <div
                        key={i}
                        className="rounded-xl border border-border bg-card p-4"
                        style={{ borderLeft: `4px solid ${borderColor}` }}
                      >
                        <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-3 ${badgeCls}`}>
                          {sev === "HIGH" ? (lang === "ur" ? "زیادہ خطرہ" : "HIGH")
                            : sev === "MEDIUM" ? (lang === "ur" ? "درمیانہ خطرہ" : "MEDIUM")
                            : (lang === "ur" ? "کم خطرہ" : "LOW")}
                        </span>

                        <blockquote className="border-l-2 border-muted-foreground/30 pl-3 mb-3">
                          <p className="text-sm italic text-foreground/80 leading-relaxed">
                            "{f.clause}"
                          </p>
                        </blockquote>

                        <p
                          className={`text-sm text-muted-foreground leading-relaxed ${lang === "ur" ? "font-urdu" : ""}`}
                          dir={lang === "ur" ? "rtl" : undefined}
                          style={lang === "ur" ? { fontFamily: "'Noto Nastaliq Urdu', serif", lineHeight: "2" } : undefined}
                        >
                          {f.risk}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Demo script path: animated typewriter ───────────────────────────────
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
      <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-8 px-5 py-10 border-b border-border bg-muted/20">
        {(Object.keys(ADVISORS) as AdvisorId[]).map((id) => {
          const a = ADVISORS[id];
          const isThinking = thinking === id;
          const isSpeaking = activeTurn?.speaker === id && !thinking;
          const isDone = visibleTurns.some((t) => t.speaker === id) || done;

          return (
            <div key={id} className={`flex items-center min-w-[160px] ${lang === 'ur' ? 'gap-5' : 'gap-4'}`}>
              <div className={`relative grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br ${a.color} text-white shadow-soft flex-shrink-0 ${isSpeaking ? `ring-4 ${a.ring} animate-glow-pulse` : ""}`}>
                <a.icon className="h-7 w-7" />
                {isThinking && (
                  <span className={`absolute -bottom-1 ${lang === 'ur' ? '-left-1' : '-right-1'} h-4 w-4 rounded-full bg-accent border-2 border-card animate-pulse`} />
                )}
                {isDone && (
                  <div className="absolute -right-1 -top-1 h-6 w-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow-sm">
                    <div className="h-2.5 w-2.5 rounded-full bg-white" />
                  </div>
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <div className={`text-[16px] font-bold truncate text-foreground/90 ${lang === "ur" ? "font-urdu leading-[1.8] py-0.5" : ""}`}>
                  {lang === "ur" ? a.nameUr : a.name}
                </div>
                <div className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${isSpeaking ? "text-primary animate-pulse" : isThinking ? "text-amber-600 animate-pulse" : isDone ? "text-emerald-600" : "text-muted-foreground/60"}`}>
                  {isThinking ? (lang === 'ur' ? 'سوچ رہا ہے…' : 'thinking…') : isSpeaking ? (lang === 'ur' ? 'بول رہا ہے' : 'speaking') : isDone ? (lang === 'ur' ? 'مکمل' : 'done') : (lang === 'ur' ? 'سن رہا ہے' : 'listening')}
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
          <DebateBubble
            turn={activeTurn}
            text={(() => {
              // typed tracks the canonical (longer) text; slice the display text proportionally
              const canonical = activeTurn.tech.length >= activeTurn.plain.length ? activeTurn.tech : activeTurn.plain;
              const display   = plain ? activeTurn.plain : activeTurn.tech;
              const ratio     = canonical.length > 0 ? typed.length / canonical.length : 0;
              return display.slice(0, Math.round(display.length * ratio));
            })()}
            typing
            lang={lang}
          />
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
          className={`relative rounded-2xl border px-4 py-3 shadow-card text-sm bg-card ${
            isRight ? "border-amber-500/30 rounded-tr-sm" : turn.speaker === "lawyer" ? "border-primary/25 rounded-tl-sm" : "border-emerald-500/30 rounded-tl-sm"
          } ${lang === 'ur' ? 'leading-loose font-urdu' : 'leading-relaxed'}`}
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