import type { Metadata } from "next";
import Dashboard from "./page.client";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Обзор дня",
  description: "Дашборд проектов и задач: быстрые действия, статистика и вход в фокус.",
  alternates: {
    canonical: "/",
  },
};

export default function DashboardPage() {
  return <Dashboard />;
}
