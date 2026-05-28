import { createFileRoute, redirect } from "@tanstack/react-router";
import QuizResultPage from "@/pages/QuizResultPage";
import { isAuthenticated } from "@/lib/auth";

export const Route = createFileRoute("/quiz/$classId_/result/$attemptId")({
  beforeLoad: () => {
    if (!isAuthenticated()) {
      throw redirect({ to: "/login" });
    }
  },
  component: QuizResultPage,
});
