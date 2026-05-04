import { createRootRoute, Outlet } from "@tanstack/react-router";
import { SideNav } from "@/component/SideNav";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    <div className="flex h-screen w-screen bg-white md:bg-gray-100 overflow-hidden">
      <SideNav />
      <main className="flex-1 h-full overflow-hidden md:flex md:items-center md:justify-center md:p-8">
        <div
          className={[
            "h-full w-full bg-white",
            "md:h-[812px] md:w-[420px] md:max-h-full",
            "md:border md:border-black md:rounded-md md:overflow-hidden",
            "md:shadow-[6px_6px_0_0_rgba(0,0,0,1)]",
          ].join(" ")}
        >
          <Outlet />
        </div>
      </main>
    </div>
  );
}
