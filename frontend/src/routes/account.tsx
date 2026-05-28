import { createFileRoute, redirect } from "@tanstack/react-router";
import AccountPage from "@/pages/AccountPage";
import { isAuthenticated } from "@/lib/auth";

export const Route = createFileRoute("/account")({
  beforeLoad: () => {
    if (!isAuthenticated()) throw redirect({ to: "/login" });
  },
  component: AccountPage,
});
