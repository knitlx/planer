import type { Metadata } from "next";
import TasksPageClient from "./page.client";

export const metadata: Metadata = {
  title: "Задачи",
  description: "Список задач по проектам: фильтрация, статусы, редактирование и удаление.",
  alternates: {
    canonical: "/tasks",
  },
};

export default function TasksPage() {
  return <TasksPageClient />;
}
