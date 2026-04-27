import { createFileRoute, redirect } from "@tanstack/react-router";
import UploadNotePage from "@/pages/UploadNotePage";
import { isSetupComplete } from "@/lib/setup";

export const Route = createFileRoute("/notes/upload")({
  beforeLoad: () => {
    if (!isSetupComplete()) {
      throw redirect({ to: "/" });
    }
  },
  component: UploadNotePage,
});
