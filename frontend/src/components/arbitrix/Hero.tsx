"use client";

import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/AppContext";
import { ArrowRight, ShieldCheck, Sparkles, Briefcase, Scale, Landmark, FileSearch, CheckCircle2, Lock, Loader2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export const Hero = () => {
  const router = useRouter();
  const { T, lang } = useApp();
  const [ctaState, setCtaState] = useState<"idle" | "loading" | "done">("idle");
  const ctaSteps = lang === "ur"
    ? ["مشیر تیار کر رہا ہے", "قانونی ماڈیول لوڈ", "تیار!"]
    : ["Waking advisors", "Loading legal modules", "Ready!"];
  const [ctaStep, setCtaStep] = useState(0);

  const handleStart = () => {
    if (ctaState !== "idle") return;
    setCtaState("loading");
    setCtaStep(0);
    const t1 = setTimeout(() => setCtaStep(1), 600);
    const t2 = setTimeout(() => setCtaStep(2), 1200);
    const t3 = setTimeout(() => {
      setCtaState("done");
      router.push("/analyze");
    }, 1700);
    const t4 = setTimeout(() => {
      setCtaState("idle");
      setCtaStep(0);
    }, 3200);
    return () => { [t1,t2,t3,t4].forEach(clearTimeout); };
  };
  const advisors = [
    { icon: Briefcase, label: lang === "ur" ? "کاروباری" : "Businessman", tint: "from-amber-400 to-orange-500", delay: "0s" },
    { icon: Scale, label: lang === "ur" ? "وکیل" : "Lawyer", tint: "from-sky-400 to-indigo-600", delay: "1.2s" },
    { icon: Landmark, label: lang === "ur" ? "ریگولیٹر" : "Regulator", tint: "from-emerald-400 to-teal-600", delay: "2.4s" },
  ];
  const stats = [
    { v: "60s", k: lang === "ur" ? "اوسط جائزہ" : "Avg. review time" },
    { v: "3", k: lang === "ur" ? "اے آئی مشیر" : "AI advisors" },
    { v: "100%", k: lang === "ur" ? "نجی" : "Private" },
  ];
  const trust = [
    "SBP", "SECP", "FBR", "PEC", "Contract Act 1872", "Registration Act 1908",
    "Companies Act 2017", "Income Tax Ord. 2001",
  ];
  return (
    <section id="top" className="relative overflow-hidden gradient-hero text-primary-foreground">
      {/* Grid + dots */}
      <div className="absolute inset-0 opacity-[0.07] [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:24px_24px]" />
      <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(white_1px,transparent_1px),linear-gradient(90deg,white_1px,transparent_1px)] [background-size:80px_80px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)]" />

      {/* Animated blobs */}
      <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-accent/30 blur-3xl animate-blob" />
      <div className="absolute -bottom-40 -left-32 h-96 w-96 rounded-full bg-primary-glow/40 blur-3xl animate-blob" style={{ animationDelay: "3s" }} />
      <div className="absolute top-1/3 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-accent/10 blur-3xl animate-blob" style={{ animationDelay: "6s" }} />

      <div className="container relative py-20 md:py-28 grid lg:grid-cols-12 gap-10 items-center">
        {/* LEFT — copy */}
        <div className="lg:col-span-7 text-center lg:text-start">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-1.5 text-xs font-medium backdrop-blur animate-fade-in-up">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-accent animate-ping-slow" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            {T.hero.eyebrow}
          </div>

          <h1 className={`mt-6 text-4xl md:text-6xl font-bold tracking-tight leading-[1.05] animate-fade-in-up ${lang === "ur" ? "font-urdu" : ""}`}>
            {T.hero.title.split(" — ")[0]}
            {T.hero.title.includes(" — ") && (
              <>
                <br className="hidden md:block" />
                <span className="headline-underline">— {T.hero.title.split(" — ")[1]}</span>
              </>
            )}
          </h1>

          <p className={`mt-6 text-lg md:text-xl text-primary-foreground/80 max-w-2xl lg:mx-0 mx-auto animate-fade-in-up ${lang === "ur" ? "font-urdu" : ""}`}>
            {T.hero.subtitle}
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center lg:justify-start gap-4 animate-fade-in-up">
            <Button
              size="lg"
              disabled={ctaState === "loading"}
              className="gradient-gold text-accent-foreground hover:opacity-95 shadow-gold h-12 px-7 text-base font-semibold relative overflow-hidden group min-w-[220px] disabled:opacity-100"
              onClick={handleStart}
            >
              {/* Idle */}
              <span
                className={`relative z-10 inline-flex items-center gap-2 transition-all duration-300 ${
                  ctaState === "idle" ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 absolute inset-0 justify-center"
                }`}
              >
                {T.hero.cta}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
              {/* Loading */}
              <span
                className={`relative z-10 inline-flex items-center gap-2 transition-all duration-300 ${
                  ctaState === "loading" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 absolute inset-0 justify-center"
                }`}
              >
                <Loader2 className="h-4 w-4 animate-spin" />
                <span key={ctaStep} className={`animate-fade-in-up ${lang === "ur" ? "font-urdu" : ""}`}>
                  {ctaSteps[ctaStep]}
                </span>
              </span>
              {/* Done */}
              <span
                className={`relative z-10 inline-flex items-center gap-2 transition-all duration-300 ${
                  ctaState === "done" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 absolute inset-0 justify-center"
                }`}
              >
                <CheckCircle2 className="h-4 w-4 animate-pop-in" />
                {lang === "ur" ? "تیار!" : "Ready!"}
              </span>
              {/* Hover shimmer */}
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              {/* Loading fill */}
              {ctaState === "loading" && (
                <span className="absolute bottom-0 left-0 h-[3px] bg-primary/70 animate-[cta-fill_1.6s_linear_forwards]" />
              )}
            </Button>
            <div className="flex items-center gap-2 text-sm text-primary-foreground/70">
              <ShieldCheck className="h-4 w-4 text-accent" />
              {lang === "ur" ? "آپ کی فائلیں محفوظ رہتی ہیں" : "Your files stay private"}
            </div>
          </div>

          {/* Stats */}
          <div className="mt-10 grid grid-cols-3 gap-3 max-w-md lg:max-w-lg mx-auto lg:mx-0 stagger">
            {stats.map((s) => (
              <div key={s.k} className="rounded-2xl border border-primary-foreground/15 bg-primary-foreground/5 backdrop-blur px-3 py-3 text-center">
                <div className="text-2xl md:text-3xl font-bold text-accent">{s.v}</div>
                <div className={`text-[11px] md:text-xs text-primary-foreground/70 mt-0.5 ${lang === "ur" ? "font-urdu" : ""}`}>{s.k}</div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — floating advisor visual */}
        <div className="lg:col-span-5 relative h-[420px] hidden lg:block">
          {/* Mock contract card */}
          <div className="absolute left-0 top-6 w-72 rotate-[-6deg] rounded-2xl bg-card text-card-foreground p-5 shadow-elegant animate-tilt-float">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <FileSearch className="h-4 w-4 text-primary" />
              CONTRACT.PDF
            </div>
            <div className="mt-3 space-y-2">
              <div className="h-2 w-3/4 rounded bg-muted" />
              <div className="h-2 w-full rounded bg-muted" />
              <div className="h-2 w-5/6 rounded bg-muted" />
              <div className="h-2 w-2/3 rounded bg-muted" />
              <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-destructive/10 px-2 py-1.5 text-[11px] font-medium text-destructive">
                <span className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" />
                Clause 7.2 — Unilateral termination
              </div>
              <div className="flex items-center gap-1.5 rounded-lg bg-success/10 px-2 py-1.5 text-[11px] font-medium text-success">
                <CheckCircle2 className="h-3 w-3" />
                Payment terms — fair
              </div>
            </div>
          </div>

          {/* Floating advisor pills */}
          {advisors.map((a, i) => {
            const positions = [
              "right-2 top-0",
              "right-8 top-40",
              "right-0 bottom-4",
            ];
            return (
              <div
                key={a.label}
                className={`absolute ${positions[i]} animate-tilt-float`}
                style={{ animationDelay: a.delay, animationDuration: "7s" }}
              >
                <div className="flex items-center gap-3 rounded-2xl border border-primary-foreground/15 bg-primary-foreground/10 backdrop-blur-md px-4 py-3 shadow-elegant">
                  <div className={`relative grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${a.tint} text-white shadow-elegant`}>
                    <a.icon className="h-5 w-5" />
                    <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-success ring-2 ring-primary" />
                  </div>
                  <div>
                    <div className="text-xs text-primary-foreground/60">{lang === "ur" ? "تجزیہ کر رہا ہے" : "Analyzing"}</div>
                    <div className={`text-sm font-semibold text-primary-foreground ${lang === "ur" ? "font-urdu" : ""}`}>{a.label}</div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Connecting glow */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/20 blur-3xl animate-glow-pulse" />
          </div>
        </div>
      </div>

      {/* Trust marquee */}
      <div className="relative border-t border-primary-foreground/10 bg-primary/30 backdrop-blur-sm">
        <div className="container py-4 flex items-center gap-6 overflow-hidden">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-primary-foreground/60 shrink-0">
            <Lock className="h-3.5 w-3.5 text-accent" />
            {lang === "ur" ? "پاکستانی قانون پر مبنی" : "Grounded in Pakistani law"}
          </div>
          <div className="relative flex-1 overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_15%,black_85%,transparent)]">
            <div className="flex gap-10 animate-marquee whitespace-nowrap w-max">
              {[...trust, ...trust].map((label, i) => (
                <span key={i} className="text-sm font-semibold text-primary-foreground/70 tracking-wide">
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
