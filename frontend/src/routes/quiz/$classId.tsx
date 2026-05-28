import { createFileRoute, redirect } from "@tanstack/react-router";
import QuizPlayPage from "@/pages/QuizPlayPage";
import { isAuthenticated } from "@/lib/auth";

export const Route = createFileRoute("/quiz/$classId")({
  beforeLoad: () => {
    if (!isAuthenticated()) {
      throw redirect({ to: "/login" });
    }
  },
  component: QuizPlayPage,
});
