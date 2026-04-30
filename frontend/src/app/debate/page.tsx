import DebateClient from "./DebateClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Live Debate",
};

export default function DebatePage() {
  return <DebateClient />;
}
