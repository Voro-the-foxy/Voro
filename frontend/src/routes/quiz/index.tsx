import { createFileRoute, redirect } from "@tanstack/react-router";
import QuizSelectPage from "@/pages/QuizSelectPage";
import { isAuthenticated } from "@/lib/auth";

export const Route = createFileRoute("/quiz/")({
  beforeLoad: () => {
    if (!isAuthenticated()) {
      throw redirect({ to: "/login" });
    }
  },
  component: QuizSelectPage,
});
