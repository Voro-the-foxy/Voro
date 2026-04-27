import { createFileRoute, redirect } from "@tanstack/react-router";
import SettingPage from "@/pages/SettingPage";
import { isSetupComplete } from "@/lib/setup";

export const Route = createFileRoute("/setting")({
  beforeLoad: () => {
    if (!isSetupComplete()) {
      throw redirect({ to: "/" });
    }
  },
  component: SettingPage,
});
