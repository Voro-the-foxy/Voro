import { createFileRoute } from "@tanstack/react-router";
import SchedulePage from "@/pages/SchedulePage";

type SetupSearch = { from?: "setting" };

export const Route = createFileRoute("/set-up/schedule")({
  validateSearch: (s: Record<string, unknown>): SetupSearch => ({
    from: s.from === "setting" ? "setting" : undefined,
  }),
  component: SchedulePage,
});
