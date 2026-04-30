"use client";

import { useApp, ContractType } from "@/contexts/AppContext";
import { Check, Package, UserRound, Handshake, Home, Laptop, FileText } from "lucide-react";

type Key = "vendor" | "employment" | "partnership" | "property" | "freelance" | "other";

const ITEMS: {
  id: ContractType;
  key: Key;
  Icon: typeof Package;
  tint: string; // tailwind gradient classes
  ring: string;
}[] = [
  { id: "vendor", key: "vendor", Icon: Package, tint: "from-amber-400/30 to-orange-500/10", ring: "from-amber-400 to-orange-500" },
  { id: "employment", key: "employment", Icon: UserRound, tint: "from-sky-400/30 to-blue-600/10", ring: "from-sky-400 to-blue-600" },
  { id: "partnership", key: "partnership", Icon: Handshake, tint: "from-emerald-400/30 to-teal-600/10", ring: "from-emerald-400 to-teal-600" },
  { id: "property", key: "property", Icon: Home, tint: "from-rose-400/30 to-pink-600/10", ring: "from-rose-400 to-pink-600" },
  { id: "freelance", key: "freelance", Icon: Laptop, tint: "from-violet-400/30 to-fuchsia-600/10", ring: "from-violet-400 to-fuchsia-600" },
  { id: "other", key: "other", Icon: FileText, tint: "from-slate-400/30 to-slate-600/10", ring: "from-slate-400 to-slate-600" },
];

export const ContractTypeSelector = () => {
  const { T, contractType, setContractType, lang } = useApp();
  return (
    <div className="relative rounded-[2rem] border border-border/60 gradient-card p-6 md:p-10 shadow-card overflow-hidden">
      {/* Decorative background blobs */}
      <div className="pointer-events-none absolute -top-24 -right-20 h-64 w-64 rounded-full bg-accent/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative text-center mb-10">
        <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[11px] font-bold text-accent-foreground uppercase tracking-[0.18em]">
          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-glow-pulse" />
          {lang === "ur" ? "مرحلہ ۱" : "Step 01"}
        </span>
        <h2 className={`mt-4 text-3xl md:text-4xl font-bold tracking-tight ${lang === "ur" ? "font-urdu" : ""}`}>{T.type.title}</h2>
        <p className={`mt-2 text-muted-foreground max-w-xl mx-auto ${lang === "ur" ? "font-urdu" : ""}`}>{T.type.subtitle}</p>
      </div>

      <div className="relative grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5 stagger">
        {ITEMS.map((it) => {
          const selected = contractType === it.id;
          const Icon = it.Icon;
          return (
            <button
              key={it.id}
              type="button"
              onClick={() => setContractType(it.id)}
              className={`group card-tilt relative text-left rounded-2xl p-[1.5px] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                selected ? "shadow-elegant" : "shadow-soft hover:shadow-card"
              }`}
            >
              {/* Animated gradient border */}
              <span
                aria-hidden
                className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${it.ring} ${
                  selected ? "opacity-100" : "opacity-0 group-hover:opacity-60"
                } transition-opacity duration-500`}
              />
              <div className="relative h-full rounded-[calc(1rem-1px)] bg-card p-5 overflow-hidden shimmer-overlay">
                {/* Soft tint blob */}
                <div className={`pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full bg-gradient-to-br ${it.tint} blur-2xl transition-transform duration-700 group-hover:scale-125`} />

                {/* Icon tile */}
                <div className={`relative grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${it.ring} text-white shadow-soft transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110`}>
                  <Icon className="h-5 w-5" strokeWidth={2.25} />
                </div>

                <div className={`relative mt-4 font-semibold leading-snug text-foreground ${lang === "ur" ? "font-urdu" : ""}`}>
                  {T.type[it.key]}
                </div>

                {/* Underline accent that grows on hover */}
                <span className={`relative mt-3 block h-[3px] rounded-full bg-gradient-to-r ${it.ring} origin-left transition-transform duration-500 ${selected ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`} />

                {/* Selected check */}
                {selected && (
                  <span className="absolute top-3 end-3 grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground animate-pop-in shadow-gold">
                    <Check className="h-4 w-4" strokeWidth={3} />
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
