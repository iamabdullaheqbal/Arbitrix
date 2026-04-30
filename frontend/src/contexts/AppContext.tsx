"use client";

import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { Lang, t } from "@/lib/i18n";

export type ContractType =
  | "vendor" | "employment" | "partnership" | "property" | "freelance" | "other";
export type UserRole = "owner" | "freelancer" | "lawyer";

interface AppCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  T: typeof t["en"];
  contractType: ContractType | null;
  setContractType: (c: ContractType | null) => void;
  role: UserRole;
  setRole: (r: UserRole) => void;
  industry: string;
  setIndustry: (s: string) => void;
}

const Ctx = createContext<AppCtx | null>(null);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLang] = useState<Lang>("en");
  const [contractType, setContractType] = useState<ContractType | null>(null);
  const [role, setRole] = useState<UserRole>("owner");
  const [industry, setIndustry] = useState("");

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ur" ? "rtl" : "ltr";
  }, [lang]);

  const value = useMemo(
    () => ({ lang, setLang, T: t[lang], contractType, setContractType, role, setRole, industry, setIndustry }),
    [lang, contractType, role, industry]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useApp = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp outside provider");
  return v;
};
