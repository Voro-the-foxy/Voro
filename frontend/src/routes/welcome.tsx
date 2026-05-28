import { createFileRoute, redirect } from "@tanstack/react-router";
import SetupHomePage from "@/pages/SetupHomePage";
import { isAuthenticated } from "@/lib/auth";

export const Route = createFileRoute("/welcome")({
  beforeLoad: () => {
    if (!isAuthenticated()) {
      throw redirect({ to: "/login" });
    }
  },
  component: SetupHomePage,
});
