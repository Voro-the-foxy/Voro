import { createFileRoute, redirect } from "@tanstack/react-router";
import SignupPage from "@/pages/SignupPage";
import { isAuthenticated } from "@/lib/auth";

export const Route = createFileRoute("/signup")({
  beforeLoad: () => {
    if (isAuthenticated()) {
      throw redirect({ to: "/" });
    }
  },
  component: SignupPage,
});
