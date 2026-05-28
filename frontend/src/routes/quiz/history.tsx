import { createFileRoute, redirect } from "@tanstack/react-router";
import QuizHistoryPage from "@/pages/QuizHistoryPage";
import { isAuthenticated } from "@/lib/auth";

export const Route = createFileRoute("/quiz/history")({
  beforeLoad: () => {
    if (!isAuthenticated()) {
      throw redirect({ to: "/login" });
    }
  },
  component: QuizHistoryPage,
});
