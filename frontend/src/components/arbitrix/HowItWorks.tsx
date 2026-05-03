"use client";

import { Upload, Users, FileCheck2, ArrowRight } from "lucide-react";
import { useApp } from "@/contexts/AppContext";

export const HowItWorks = () => {
  const { T, lang } = useApp();
  const steps = [
    { n: 1, icon: Upload, title: T.how.s1t, desc: T.how.s1d, tint: "from-sky-400 to-blue-600" },
    { n: 2, icon: Users, title: T.how.s2t, desc: T.how.s2d, tint: "from-violet-400 to-fuchsia-600" },
    { n: 3, icon: FileCheck2, title: T.how.s3t, desc: T.how.s3d, tint: "from-emerald-400 to-teal-600" },
  ];
  return (
    <section id="how" className="container py-20 md:py-24">
      <div className="text-center max-w-2xl mx-auto mb-14">
        <span className="inline-block rounded-full bg-primary/5 border border-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
          {lang === "ur" ? "طریقہ کار" : "Process"}
        </span>
        <h2 className={`mt-4 text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight break-words ${lang === "ur" ? "font-urdu leading-[1.5]" : ""}`}>{T.how.title}</h2>
        <p className={`mt-3 text-muted-foreground ${lang === "ur" ? "font-urdu leading-relaxed" : ""}`}>{T.how.subtitle}</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 md:gap-8 relative stagger">
        {steps.map((s, i) => (
          <div key={s.n} className="relative">
            {/* Connector arrow */}
            {i < steps.length - 1 && (
              <div className="hidden md:flex absolute top-1/2 -right-5 z-10 -translate-y-1/2 h-9 w-9 items-center justify-center rounded-full bg-card border border-border shadow-soft text-accent">
                <ArrowRight className="h-4 w-4" />
              </div>
            )}

            <div className="group card-tilt relative h-full rounded-3xl p-[1.5px] shadow-card hover:shadow-elegant">
              <span aria-hidden className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${s.tint} opacity-25 group-hover:opacity-90 transition-opacity duration-500`} />
              <div className="relative h-full rounded-[calc(1.5rem-1px)] bg-card p-7 overflow-hidden shimmer-overlay">
                {/* Big translucent step number */}
                <span className={`pointer-events-none absolute top-0 ${lang === 'ur' ? 'left-2' : 'right-2'} text-[5rem] leading-none font-extrabold bg-gradient-to-br ${s.tint} bg-clip-text text-transparent opacity-15 select-none transition-transform duration-700 group-hover:scale-105`}>
                  {s.n}
                </span>

                {/* Icon with rotating ring */}
                <div className="relative inline-grid place-items-center">
                  <span className={`absolute inset-0 -m-1 rounded-2xl bg-gradient-to-br ${s.tint} opacity-50 blur-md group-hover:opacity-80 transition-opacity`} />
                  <div className={`relative grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br ${s.tint} text-white shadow-elegant transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110`}>
                    <s.icon className="h-6 w-6" strokeWidth={2.25} />
                  </div>
                </div>

                <h3 className={`mt-6 text-lg font-semibold ${lang === "ur" ? "font-urdu leading-[1.4]" : ""}`}>{s.title}</h3>
                <p className={`mt-2 text-sm text-muted-foreground leading-relaxed ${lang === "ur" ? "font-urdu" : ""}`}>{s.desc}</p>

                <span className={`mt-5 block h-[3px] w-10 rounded-full bg-gradient-to-r ${s.tint} transition-all duration-500 group-hover:w-24`} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
