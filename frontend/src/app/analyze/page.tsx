import AnalyzeClient from "./AnalyzeClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Analyze Contract",
};

export default function AnalyzePage() {
  return <AnalyzeClient />;
}
