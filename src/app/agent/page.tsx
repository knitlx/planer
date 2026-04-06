import type { Metadata } from "next";
import AgentPageClient from "./page.client";

export const metadata: Metadata = {
  title: "AI Агент",
  description: "Чат с AI-агентом: управление проектами, задачами и идеями, включая голосовой ввод.",
  alternates: {
    canonical: "/agent",
  },
};

export default function AgentPage() {
  return <AgentPageClient />;
}
