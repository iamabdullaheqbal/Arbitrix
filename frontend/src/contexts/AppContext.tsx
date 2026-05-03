"use client";

import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { Lang, t } from "@/lib/i18n";

export type ContractType =
  | "vendor" | "employment" | "partnership" | "property" | "freelance" | "other";
export type UserRole = "owner" | "freelancer";
export type AnalysisMode = "technical" | "plain";

export interface RedFlag {
  clause: string;
  risk: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  agent: "lawyer" | "businessman" | "regulator";
}

export interface Verdict {
  risk_score: number;
  active_language?: "en" | "ur";
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

export interface AnalysisCache {
  verdict: { english: Verdict; urdu: Verdict };
  agentOutputs: { english: AgentOutputs; urdu: AgentOutputs };
  timestamp: number;
}

const SESSION_KEY = "arbitrix_current_analysis";

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

  contractText: string;
  setContractText: (s: string) => void;
  mode: AnalysisMode;
  setMode: (m: AnalysisMode) => void;
  agentOutputs: AgentOutputs;
  setAgentOutputs: (fn: (prev: AgentOutputs) => AgentOutputs) => void;
  agentDone: AgentDone;
  setAgentDone: (fn: (prev: AgentDone) => AgentDone) => void;
  verdict: Verdict | null;
  setVerdict: (v: Verdict | null) => void;
  analysisError: string | null;
  setAnalysisError: (e: string | null) => void;

  // Bilingual cache — both languages stored after one analysis run
  analysisCache: AnalysisCache | null;
  setAnalysisCache: (c: AnalysisCache | null) => void;

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

  const [contractText, setContractText] = useState("");
  const [mode, setMode] = useState<AnalysisMode>("technical");
  const [agentOutputs, setAgentOutputs] = useState<AgentOutputs>(EMPTY_OUTPUTS);
  const [agentDone, setAgentDone] = useState<AgentDone>(EMPTY_DONE);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisCache, setAnalysisCacheState] = useState<AnalysisCache | null>(null);

  // Restore from sessionStorage on mount (handles browser back button)
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (raw) {
        const parsed: AnalysisCache = JSON.parse(raw);
        setAnalysisCacheState(parsed);
        setVerdict(parsed.verdict.english);
        setAgentOutputs(EMPTY_OUTPUTS); // streaming outputs not needed after restore
      }
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ur" ? "rtl" : "ltr";
  }, [lang]);

  const setAnalysisCache = (c: AnalysisCache | null) => {
    setAnalysisCacheState(c);
    if (c) {
      try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(c)); } catch { /* quota */ }
    } else {
      sessionStorage.removeItem(SESSION_KEY);
    }
  };

  const resetAnalysis = () => {
    setContractText("");
    setAgentOutputs(EMPTY_OUTPUTS);
    setAgentDone(EMPTY_DONE);
    setVerdict(null);
    setAnalysisError(null);
    setAnalysisCache(null);
  };

  const value = useMemo(
    () => ({
      lang, setLang, T: t[lang],
      contractType, setContractType,
      role, setRole,
      industry, setIndustry,
      contractText, setContractText,
      mode, setMode,
      agentOutputs, setAgentOutputs,
      agentDone, setAgentDone,
      verdict, setVerdict,
      analysisError, setAnalysisError,
      analysisCache, setAnalysisCache,
      resetAnalysis,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lang, contractType, role, industry, contractText, mode, agentOutputs, agentDone, verdict, analysisError, analysisCache]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useApp = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp outside provider");
  return v;
};
