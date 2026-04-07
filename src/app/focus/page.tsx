import type { Metadata } from "next";
import FocusPageClient from "./page.client";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Фокус",
  description: "Выбор проекта для фокус-сессии и переход в Focus Room.",
  alternates: {
    canonical: "/focus",
  },
};

export default function FocusPage() {
  return <FocusPageClient />;
}
