import type { Metadata } from "next";
import ProjectsPageClient from "./page.client";

export const metadata: Metadata = {
  title: "Проекты",
  description: "Управление проектами: список, навигация и действия.",
  alternates: {
    canonical: "/projects",
  },
};

export default function ProjectsPage() {
  return <ProjectsPageClient />;
}
