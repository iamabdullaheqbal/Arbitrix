"use client";

import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { Lang, t } from "@/lib/i18n";

export type ContractType =
  | "vendor" | "employment" | "partnership" | "property" | "freelance" | "other";
export type UserRole = "owner" | "freelancer" | "lawyer";

export interface RedFlag {
  clause: string;
  risk: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  agent: "lawyer" | "businessman" | "regulator";
}

export interface Verdict {
  risk_score: number;
  red_flags: RedFlag[];
  recommendations: string[];
  summary_english: string;
  summary_urdu: string;
}

export interface AgentOutputs {
  lawyer: string;
  businessman: string;
  regulator: string;
}

export interface AgentDone {
  lawyer: boolean;
  businessman: boolean;
  regulator: boolean;
}

interface AppCtx {
  // UI / language
  lang: Lang;
  setLang: (l: Lang) => void;
  T: typeof t["en"];

  // Contract metadata
  contractType: ContractType | null;
  setContractType: (c: ContractType | null) => void;
  role: UserRole;
  setRole: (r: UserRole) => void;
  industry: string;
  setIndustry: (s: string) => void;

  // Analysis state
  contractText: string;
  setContractText: (s: string) => void;
  agentOutputs: AgentOutputs;
  setAgentOutputs: (fn: (prev: AgentOutputs) => AgentOutputs) => void;
  agentDone: AgentDone;
  setAgentDone: (fn: (prev: AgentDone) => AgentDone) => void;
  verdict: Verdict | null;
  setVerdict: (v: Verdict | null) => void;
  analysisError: string | null;
  setAnalysisError: (e: string | null) => void;

  // Reset all analysis state
  resetAnalysis: () => void;
}

const Ctx = createContext<AppCtx | null>(null);

const EMPTY_OUTPUTS: AgentOutputs = { lawyer: "", businessman: "", regulator: "" };
const EMPTY_DONE: AgentDone = { lawyer: false, businessman: false, regulator: false };

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLang] = useState<Lang>("en");
  const [contractType, setContractType] = useState<ContractType | null>(null);
  const [role, setRole] = useState<UserRole>("owner");
  const [industry, setIndustry] = useState("");

  // Analysis state
  const [contractText, setContractText] = useState("");
  const [agentOutputs, setAgentOutputs] = useState<AgentOutputs>(EMPTY_OUTPUTS);
  const [agentDone, setAgentDone] = useState<AgentDone>(EMPTY_DONE);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ur" ? "rtl" : "ltr";
  }, [lang]);

  const resetAnalysis = () => {
    setContractText("");
    setAgentOutputs(EMPTY_OUTPUTS);
    setAgentDone(EMPTY_DONE);
    setVerdict(null);
    setAnalysisError(null);
  };

  const value = useMemo(
    () => ({
      lang, setLang, T: t[lang],
      contractType, setContractType,
      role, setRole,
      industry, setIndustry,
      contractText, setContractText,
      agentOutputs, setAgentOutputs,
      agentDone, setAgentDone,
      verdict, setVerdict,
      analysisError, setAnalysisError,
      resetAnalysis,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lang, contractType, role, industry, contractText, agentOutputs, agentDone, verdict, analysisError]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useApp = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp outside provider");
  return v;
};
