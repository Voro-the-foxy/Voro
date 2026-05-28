import { createRootRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { SideNav } from "@/component/SideNav";
import { ensureValidSession } from "@/lib/auth";

export const Route = createRootRoute({
  beforeLoad: () => ensureValidSession(),
  component: RootLayout,
});

function RootLayout() {
  const navigate = useNavigate();

  useEffect(() => {
    const handler = () => void navigate({ to: "/login" });
    window.addEventListener("voro-session-expired", handler);
    return () => window.removeEventListener("voro-session-expired", handler);
  }, [navigate]);

  return (
    <div className="flex h-screen w-screen bg-white md:bg-gray-100 overflow-hidden">
      <SideNav />
      <main className="flex-1 h-full overflow-hidden md:flex md:items-center md:justify-center md:p-8">
        <div
          className={[
            "relative h-full w-full bg-white overflow-hidden",
            "md:h-[812px] md:w-[420px] md:max-h-full",
            "md:border md:border-black md:rounded-md",
            "md:shadow-[6px_6px_0_0_rgba(0,0,0,1)]",
          ].join(" ")}
        >
          <Outlet />
        </div>
      </main>
    </div>
  );
}
