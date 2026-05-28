import { createFileRoute, redirect } from "@tanstack/react-router";
import SetupNotesPage from "@/pages/SetupNotesPage";
import { isAuthenticated } from "@/lib/auth";

export const Route = createFileRoute("/set-up/notes")({
  beforeLoad: () => {
    if (!isAuthenticated()) {
      throw redirect({ to: "/login" });
    }
  },
  component: SetupNotesPage,
});
