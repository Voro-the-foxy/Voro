import { createFileRoute, redirect } from "@tanstack/react-router";
import QuizResultPage from "@/pages/QuizResultPage";
import { isSetupComplete } from "@/lib/setup";

export const Route = createFileRoute("/quiz/$classId_/result/$attemptId")({
  beforeLoad: () => {
    if (!isSetupComplete()) {
      throw redirect({ to: "/" });
    }
  },
  component: QuizResultPage,
});
