import type { Metadata } from "next";
import ArchivePageClient from "./page.client";

export const metadata: Metadata = {
  title: "Архив проектов",
  description: "Завершенные проекты в статусе «Готово».",
  alternates: {
    canonical: "/archive",
  },
};

export default function ArchivePage() {
  return <ArchivePageClient />;
}
