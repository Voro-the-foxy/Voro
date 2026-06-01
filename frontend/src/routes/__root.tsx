import { createRootRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { SideNav } from "@/component/SideNav";
import { ensureValidSession } from "@/lib/auth";

/* eslint-disable react-refresh/only-export-components */
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
    <div className="flex h-screen w-screen bg-paper md:bg-stone-200 overflow-hidden">
      {/* SVG filter definitions for sketch effect */}
      <svg className="absolute w-0 h-0 overflow-hidden" aria-hidden="true">
        <defs>
          <filter id="sketch" x="-4%" y="-4%" width="108%" height="108%">
            <feTurbulence type="fractalNoise" baseFrequency="0.04 0.04" numOctaves="5" seed="7" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.5" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <filter id="sketch-strong" x="-6%" y="-6%" width="112%" height="112%">
            <feTurbulence type="fractalNoise" baseFrequency="0.05 0.05" numOctaves="4" seed="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="4" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      <SideNav />
      <main className="flex-1 h-full overflow-hidden md:flex md:items-center md:justify-center md:p-8">
        <div
          className={[
            "relative h-full w-full bg-paper overflow-hidden sketch",
            "md:h-[812px] md:w-[420px] md:max-h-full",
            "md:border-2 md:border-black md:rounded-sm",
            "md:shadow-[6px_6px_0_0_rgba(0,0,0,1)]",
          ].join(" ")}
        >
          <Outlet />
        </div>
      </main>
    </div>
  );
}
