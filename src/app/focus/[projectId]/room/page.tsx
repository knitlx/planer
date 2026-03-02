"use client";

import { useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { TheFocusRoom } from "@/components/TheFocusRoom";
import { useFocusStore } from "@/store/useFocusStore";

export default function FocusRoomPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { startFocus, startTask } = useFocusStore();
  const projectId = params.projectId as string | undefined;
  const taskId = searchParams.get("taskId");

  useEffect(() => {
    if (!projectId) return;
    startFocus(projectId);
    if (taskId) startTask(taskId);
  }, [projectId, taskId, startFocus, startTask]);

  return <TheFocusRoom />;
}
