import { createFileRoute, redirect } from "@tanstack/react-router";
import SchedulePage from "@/pages/SchedulePage";
import { isAuthenticated } from "@/lib/auth";

type SetupSearch = { from?: "setting" | "mypage" | "upload" };

export const Route = createFileRoute("/set-up/schedule")({
  beforeLoad: () => {
    if (!isAuthenticated()) {
      throw redirect({ to: "/login" });
    }
  },
  validateSearch: (s: Record<string, unknown>): SetupSearch => ({
    from:
      s.from === "setting" || s.from === "mypage"
        ? s.from
        : s.from === "upload"
          ? "upload"
          : undefined,
  }),
  component: SchedulePage,
});
