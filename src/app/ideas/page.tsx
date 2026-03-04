import type { Metadata } from "next";
import IdeasPageClient from "./page.client";

export const metadata: Metadata = {
  title: "Идеи",
  description: "Входящие идеи: конвертация в задачи или проекты и архивирование.",
  alternates: {
    canonical: "/ideas",
  },
};

export default function IdeasPage() {
  return <IdeasPageClient />;
}
