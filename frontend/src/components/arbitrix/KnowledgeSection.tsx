"use client";

import { useApp } from "@/contexts/AppContext";
import { BookOpen, Database, BrainCircuit, FileText } from "lucide-react";

export const KnowledgeSection = () => {
  const { lang } = useApp();

  const items = [
    {
      icon: Database,
      title: lang === "ur" ? "وسیع قانونی ڈیٹا" : "Vast Legal Database",
      desc: lang === "ur" ? "دس ہزار سے زیادہ مقامی معاہدوں پر تربیت یافتہ۔" : "Trained on over 10,000+ local contracts and legal precedents.",
      tint: "from-sky-400 to-indigo-600",
    },
    {
      icon: BrainCircuit,
      title: lang === "ur" ? "مصنوعی ذہانت" : "Advanced AI",
      desc: lang === "ur" ? "باریک بین شقوں کو تیزی سے سمجھتا ہے۔" : "Understands nuanced clauses and complex legalese instantly.",
      tint: "from-amber-400 to-orange-500",
    },
    {
      icon: FileText,
      title: lang === "ur" ? "جامع رپورٹنگ" : "Comprehensive Reports",
      desc: lang === "ur" ? "تفصیلی خطرات اور مشورے کے ساتھ رپورٹس۔" : "Actionable insights with pinpointed risk flags and advice.",
      tint: "from-emerald-400 to-teal-600",
    }
  ];

  return (
    <section className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-soft opacity-50" />
      <div className="container relative max-w-6xl">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm mb-4">
            <BookOpen className="h-4 w-4" />
            {lang === "ur" ? "آربیٹرکس کے بارے میں" : "Knowledge Base"}
          </div>
          <h2 className={`text-3xl md:text-4xl font-bold ${lang === "ur" ? "font-urdu" : ""}`}>
            {lang === "ur" ? "ہماری ذہانت کی بنیاد" : "The Intelligence Behind Arbitrix"}
          </h2>
          <p className={`mt-4 text-muted-foreground max-w-2xl mx-auto ${lang === "ur" ? "font-urdu" : ""}`}>
            {lang === "ur" ? "ہموار اور محفوظ طریقے سے آپ کی قانونی دستاویزات کی جانچ پڑتال کریں۔" : "We combine deep Pakistani legal context with cutting-edge artificial intelligence to deliver unparalleled contract analysis."}
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 stagger">
          {items.map((item, i) => (
            <div key={item.title} className="group relative card-tilt rounded-3xl p-[1.5px] shadow-card hover:shadow-elegant">
              <span aria-hidden className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${item.tint} opacity-20 group-hover:opacity-90 transition-opacity duration-500`} />
              <div className="relative h-full rounded-[calc(1.5rem-1px)] bg-card p-6 overflow-hidden shimmer-overlay">
                <div className="relative inline-grid place-items-center">
                  <span className={`absolute inset-0 -m-1 rounded-2xl bg-gradient-to-br ${item.tint} opacity-50 blur-md group-hover:opacity-80 transition-opacity`} />
                  <div className={`relative grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${item.tint} text-white shadow-elegant transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110`}>
                    <item.icon className="h-5 w-5" strokeWidth={2.25} />
                  </div>
                </div>
                <h3 className={`mt-5 text-base font-semibold ${lang === "ur" ? "font-urdu" : ""}`}>{item.title}</h3>
                <p className={`mt-1.5 text-sm text-muted-foreground leading-relaxed ${lang === "ur" ? "font-urdu" : ""}`}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
