import { Link, useRouterState } from "@tanstack/react-router";
import { Home, BookOpenCheck, UserRound } from "lucide-react";
import { isAuthenticated } from "@/lib/auth";

export function SideNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  if (!isAuthenticated() || path === "/login") return null;

  return (
    <nav className="hidden md:flex flex-col w-56 shrink-0 border-r border-black bg-white p-4 gap-1">
      <div className="text-xl font-medium px-3 pt-4 pb-6">Voro</div>
      <SideNavItem
        to="/home"
        icon={<Home className="w-5 h-5" />}
        label="Home"
        active={path === "/" || path.startsWith("/home")}
      />
      <SideNavItem
        to="/quiz"
        icon={<BookOpenCheck className="w-5 h-5" />}
        label="Quiz"
        active={path.startsWith("/quiz")}
      />
      <SideNavItem
        to="/mypage"
        icon={<UserRound className="w-5 h-5" />}
        label="Profile"
        active={path.startsWith("/mypage") || path.startsWith("/setting")}
      />
    </nav>
  );
}

function SideNavItem({
  to,
  icon,
  label,
  active,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      className={[
        "flex items-center gap-3 px-3 py-2 rounded-md border text-sm transition-colors",
        active
          ? "border-black bg-black text-white"
          : "border-transparent text-gray-700 hover:border-black hover:text-black",
      ].join(" ")}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}
