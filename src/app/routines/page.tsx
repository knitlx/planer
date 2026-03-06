import { Suspense } from "react";
import { RoutinesClient } from "./page.client";

export default function RoutinesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-text-secondary">Загрузка...</div></div>}>
      <RoutinesClient />
    </Suspense>
  );
}
