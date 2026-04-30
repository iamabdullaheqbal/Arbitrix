"use client";

import { useRef, useState } from "react";
import { useApp, UserRole } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadCloud, FileText, ArrowRight, Briefcase, Laptop, Gavel } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Props {
  onAnalyze: (fileName: string) => void;
}

const roles: { id: UserRole; icon: typeof Briefcase }[] = [
  { id: "owner", icon: Briefcase },
  { id: "freelancer", icon: Laptop },
  { id: "lawyer", icon: Gavel },
];

export const UploadZone = ({ onAnalyze }: Props) => {
  const { T, role, setRole, industry, setIndustry, contractType, lang } = useApp();
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (f: FileList | null) => {
    if (!f || !f[0]) return;
    const picked = f[0];
    if (picked.size > 20 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum size is 20 MB.", variant: "destructive" });
      return;
    }
    setFile(picked);
  };

  const submit = () => {
    if (!contractType) {
      toast({ title: lang === "ur" ? "پہلے قسم منتخب کریں" : "Select a contract type first", variant: "destructive" });
      return;
    }
    if (!file) {
      toast({ title: lang === "ur" ? "براہ کرم فائل اپلوڈ کریں" : "Please upload a contract", variant: "destructive" });
      return;
    }
    if (industry.length > 200) {
      toast({ title: "Description too long", description: "Keep it under 200 characters.", variant: "destructive" });
      return;
    }
    onAnalyze(file.name);
  };

  return (
    <div className="rounded-3xl border border-border gradient-card p-6 md:p-10 shadow-card">
      <div className="text-center mb-6">
        <span className="inline-block rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent-foreground uppercase tracking-wider">
          {lang === "ur" ? "مرحلہ ۲" : "Step 2"}
        </span>
        <h2 className={`mt-3 text-2xl md:text-3xl font-bold tracking-tight ${lang === "ur" ? "font-urdu" : ""}`}>{T.upload.title}</h2>
        <p className={`mt-2 text-muted-foreground ${lang === "ur" ? "font-urdu" : ""}`}>{T.upload.subtitle}</p>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-smooth ${
          drag ? "border-accent bg-accent/5" : "border-border bg-background/50 hover:border-primary/40"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".pdf,.txt,.doc,.docx"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {file ? (
          <div className="flex items-center justify-center gap-3 text-foreground">
            <FileText className="h-6 w-6 text-accent" />
            <div className="text-left">
              <div className="font-semibold">{file.name}</div>
              <div className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB · {lang === "ur" ? "تبدیل کرنے کے لیے کلک کریں" : "Click to change"}</div>
            </div>
          </div>
        ) : (
          <>
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl gradient-hero text-primary-foreground shadow-soft mb-4">
              <UploadCloud className="h-6 w-6" />
            </div>
            <div className={`font-semibold ${lang === "ur" ? "font-urdu" : ""}`}>{T.upload.drop}</div>
            <div className="my-2 text-xs text-muted-foreground">{T.upload.or}</div>
            <Button type="button" variant="outline" className="font-medium" onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}>
              {T.upload.browse}
            </Button>
          </>
        )}
      </div>

      <div className="mt-8 grid md:grid-cols-2 gap-6">
        <div>
          <Label className={`text-sm font-semibold ${lang === "ur" ? "font-urdu" : ""}`}>{T.upload.role}</Label>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {roles.map((r) => {
              const active = role === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id)}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 text-xs font-medium transition-smooth ${
                    active ? "border-primary bg-primary/5 text-foreground" : "border-border bg-card text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  <r.icon className="h-4 w-4" />
                  <span className={`text-center leading-tight ${lang === "ur" ? "font-urdu" : ""}`}>{T.upload.roles[r.id]}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <Label htmlFor="industry" className={`text-sm font-semibold ${lang === "ur" ? "font-urdu" : ""}`}>{T.upload.industryLabel}</Label>
          <Input
            id="industry"
            value={industry}
            onChange={(e) => setIndustry(e.target.value.slice(0, 200))}
            placeholder={T.upload.industryPh}
            maxLength={200}
            className="mt-2"
            dir={lang === "ur" ? "rtl" : "ltr"}
          />
          <div className="mt-1 text-xs text-muted-foreground text-end">{industry.length}/200</div>
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <Button
          size="lg"
          onClick={submit}
          className="gradient-gold text-accent-foreground hover:opacity-95 shadow-gold h-12 px-7 font-semibold"
        >
          {T.upload.analyze}
          <ArrowRight className="ms-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
