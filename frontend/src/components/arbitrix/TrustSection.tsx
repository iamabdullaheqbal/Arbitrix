"use client";

import { ShieldCheck, Lock, Globe2, Sparkles, Eye, Scale, Check } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { useEffect, useRef, useState } from "react";

export const TrustSection = () => {
  const { lang } = useApp();
  const [verifiedCount, setVerifiedCount] = useState(0);
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && verifiedCount === 0) {
          [1, 2, 3, 4].forEach((n) => setTimeout(() => setVerifiedCount(n), n * 350));
          io.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [verifiedCount]);
  const features = [
    {
      icon: Lock,
      title: lang === "ur" ? "مکمل رازداری" : "Fully private",
      desc: lang === "ur" ? "آپ کی فائل کبھی محفوظ نہیں کی جاتی۔" : "Your file is never stored on our servers.",
      tint: "from-emerald-400 to-teal-600",
    },
    {
      icon: Scale,
      title: lang === "ur" ? "پاکستانی قانون" : "Pakistan-aware",
      desc: lang === "ur" ? "مقامی قوانین اور ریگولیٹرز کے مطابق۔" : "Trained on local statutes, SBP, SECP & FBR rules.",
      tint: "from-sky-400 to-indigo-600",
    },
    {
      icon: Globe2,
      title: lang === "ur" ? "دو زبانوں میں" : "Bilingual",
      desc: lang === "ur" ? "انگریزی اور آسان اردو میں نتائج۔" : "Verdicts in clear English and natural Urdu.",
      tint: "from-amber-400 to-orange-500",
    },
    {
      icon: Eye,
      title: lang === "ur" ? "شفاف وجوہات" : "Transparent reasoning",
      desc: lang === "ur" ? "ہر فیصلے کی وضاحت اور حوالے۔" : "Every flag cites the clause and the law.",
      tint: "from-fuchsia-400 to-violet-600",
    },
  ];

  return (
    <section ref={sectionRef} id="trust" className="relative overflow-hidden py-20 md:py-24">
      <div className="absolute inset-0 bg-grid-soft opacity-50" />
      <div className="container relative max-w-6xl">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/5 border border-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
            <Sparkles className="h-3 w-3 text-accent" />
            {lang === "ur" ? "اعتماد" : "Why trust Arbitrix"}
          </span>
          <h2 className={`mt-4 text-3xl md:text-4xl font-bold tracking-tight ${lang === "ur" ? "font-urdu" : ""}`}>
            {lang === "ur" ? "بنایا گیا — قانونی ذہن، انجینئرڈ شفافیت" : "Built like a lawyer thinks. Engineered for clarity."}
          </h2>
          <p className={`mt-3 text-muted-foreground ${lang === "ur" ? "font-urdu" : ""}`}>
            {lang === "ur"
              ? "آربیٹرکس آپ کے کاروبار کو پاکستانی سیاق میں سمجھتا ہے۔"
              : "Designed around Pakistani business reality — not a US legal template."}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 stagger">
          {features.map((f, i) => {
            const verified = i < verifiedCount;
            return (
            <div key={f.title} className="group relative card-tilt rounded-3xl p-[1.5px] shadow-card hover:shadow-elegant">
              <span aria-hidden className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${f.tint} opacity-20 group-hover:opacity-90 transition-opacity duration-500`} />
              <div className="relative h-full rounded-[calc(1.5rem-1px)] bg-card p-6 overflow-hidden shimmer-overlay">
                {/* Verify badge */}
                <div className="absolute top-4 end-4">
                  <div
                    className={`relative flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-all duration-500 ${
                      verified
                        ? "border-success/30 bg-success/10 text-success opacity-100 scale-100"
                        : "border-muted-foreground/20 bg-muted text-muted-foreground opacity-70 scale-95"
                    }`}
                  >
                    {verified ? (
                      <>
                        <svg viewBox="0 0 24 24" className="verify-check h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 12.5l4.5 4.5L19 7.5" />
                        </svg>
                        {lang === "ur" ? "تصدیق شدہ" : "Verified"}
                      </>
                    ) : (
                      <>
                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-pulse" />
                        {lang === "ur" ? "جانچ" : "Checking"}
                      </>
                    )}
                  </div>
                </div>
                <div className="relative inline-grid place-items-center">
                  <span className={`absolute inset-0 -m-1 rounded-2xl bg-gradient-to-br ${f.tint} opacity-50 blur-md group-hover:opacity-80 transition-opacity`} />
                  {/* Sweeping verify ring once verified */}
                  {verified && (
                    <span aria-hidden className={`verify-ring absolute -inset-1.5 rounded-2xl bg-[conic-gradient(from_0deg,transparent_0deg,hsl(var(--success)/0.45)_60deg,transparent_120deg)] opacity-60`} />
                  )}
                  <div className={`relative grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${f.tint} text-white shadow-elegant transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110`}>
                    <f.icon className="h-5 w-5" strokeWidth={2.25} />
                  </div>
                </div>
                <h3 className={`mt-5 text-base font-semibold ${lang === "ur" ? "font-urdu" : ""}`}>{f.title}</h3>
                <p className={`mt-1.5 text-sm text-muted-foreground leading-relaxed ${lang === "ur" ? "font-urdu" : ""}`}>{f.desc}</p>
                {/* Progress bar */}
                <div className="mt-4 h-1 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${f.tint} transition-all duration-700 ease-out`}
                    style={{ width: verified ? "100%" : "12%" }}
                  />
                </div>
              </div>
            </div>
            );
          })}
        </div>

        {/* Big trust banner */}
        <div className="mt-12 relative overflow-hidden rounded-3xl gradient-hero text-primary-foreground p-8 md:p-10 shadow-elegant">
          <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-accent/30 blur-3xl animate-blob" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-primary-glow/40 blur-3xl animate-blob" style={{ animationDelay: "2s" }} />
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary-foreground/10 border border-primary-foreground/20 backdrop-blur">
                <ShieldCheck className="h-7 w-7 text-accent" />
              </div>
              <div>
                <div className={`text-lg md:text-xl font-semibold ${lang === "ur" ? "font-urdu" : ""}`}>
                  {lang === "ur" ? "نہ ڈیٹا فروخت، نہ تربیت پر استعمال" : "Your contracts are never sold or used to train models."}
                </div>
                <div className="text-sm text-primary-foreground/70 mt-0.5">
                  {lang === "ur" ? "اپ لوڈ کے فوراً بعد تجزیہ، پھر حذف۔" : "Analyzed in-memory, then immediately discarded."}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-2 text-xs font-semibold backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-success opacity-70 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-success animate-status-dot" />
              </span>
              <Lock className="h-3.5 w-3.5 text-accent" />
              {lang === "ur" ? "اینڈ ٹو اینڈ خفیہ" : "End-to-end encrypted"}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};