import { createFileRoute, redirect } from "@tanstack/react-router";
import QuizSelectPage from "@/pages/QuizSelectPage";
import { isSetupComplete } from "@/lib/setup";

export const Route = createFileRoute("/quiz/")({
  beforeLoad: () => {
    if (!isSetupComplete()) {
      throw redirect({ to: "/" });
    }
  },
  component: QuizSelectPage,
});
