import { createFileRoute, redirect } from "@tanstack/react-router";
import QuizPlayPage from "@/pages/QuizPlayPage";
import { isSetupComplete } from "@/lib/setup";

export const Route = createFileRoute("/quiz/$classId")({
  beforeLoad: () => {
    if (!isSetupComplete()) {
      throw redirect({ to: "/" });
    }
  },
  component: QuizPlayPage,
});
