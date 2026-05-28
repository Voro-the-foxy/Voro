import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/setting")({
  beforeLoad: () => {
    throw redirect({ to: "/mypage" });
  },
  component: () => null,
});
