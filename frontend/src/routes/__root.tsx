import { createRootRoute, Outlet } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-200">
      <div className="relative w-[375px] h-[812px] border-[14px] border-gray-800 rounded-[36px] overflow-hidden bg-white shadow-2xl">
        <Outlet />
      </div>
    </div>
  );
}
