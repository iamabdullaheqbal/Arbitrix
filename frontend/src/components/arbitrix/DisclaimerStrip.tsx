"use client";

import { Info } from "lucide-react";
import { useApp } from "@/contexts/AppContext";

export const DisclaimerStrip = () => {
  const { T, lang } = useApp();
  return (
    <footer id="trust" className="border-t border-border bg-muted/40 mt-16">
      <div className="container py-6 flex items-start gap-3 text-xs text-muted-foreground max-w-4xl">
        <Info className="h-4 w-4 mt-0.5 flex-shrink-0 text-accent" />
        <p className={`leading-relaxed ${lang === "ur" ? "font-urdu text-sm leading-[1.6]" : ""}`}>
          {T.disclaimer}
        </p>
      </div>
    </footer>
  );
};
