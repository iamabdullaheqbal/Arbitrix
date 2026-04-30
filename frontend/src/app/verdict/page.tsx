import VerdictClient from "./VerdictClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verdict",
};

export default function VerdictPage() {
  return <VerdictClient />;
}
