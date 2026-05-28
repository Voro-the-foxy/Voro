import { createFileRoute, redirect } from "@tanstack/react-router";
import { isAuthenticated } from "@/lib/auth";
import { isSetupComplete } from "@/lib/setup";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    if (!isAuthenticated()) {
      throw redirect({ to: "/login" });
    }
    if (await isSetupComplete()) {
      throw redirect({ to: "/home" });
    }
    throw redirect({ to: "/welcome" });
  },
  component: () => null,
});
