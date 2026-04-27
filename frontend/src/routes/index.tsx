import { createFileRoute } from "@tanstack/react-router";
import SetupHomePage from "@/pages/SetupHomePage";

export const Route = createFileRoute("/")({
  component: SetupHomePage,
});
