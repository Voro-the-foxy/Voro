import { createFileRoute, redirect } from "@tanstack/react-router";
import UploadNotePage from "@/pages/UploadNotePage";
import { isAuthenticated } from "@/lib/auth";

export const Route = createFileRoute("/notes/upload")({
  beforeLoad: () => {
    if (!isAuthenticated()) {
      throw redirect({ to: "/login" });
    }
  },
  component: UploadNotePage,
});
