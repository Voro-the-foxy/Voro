import { Link } from "@tanstack/react-router";
import { Home, BookOpenCheck, Settings } from "lucide-react";

type Tab = "home" | "quiz" | "setting";

export function BottomNav({ active }: { active: Tab }) {
  return (
    <nav className="border-t border-black bg-white md:hidden">
      <div className="grid grid-cols-3 px-2 py-3">
        <NavItem to="/home" icon={<Home className="w-6 h-6" />} label="home" active={active === "home"} />
        <NavItem to="/quiz" icon={<BookOpenCheck className="w-6 h-6" />} label="Quiz" active={active === "quiz"} />
        <NavItem to="/setting" icon={<Settings className="w-6 h-6" />} label="Setting" active={active === "setting"} />
      </div>
    </nav>
  );
}

function NavItem({
  to,
  icon,
  label,
  active,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  const className = `flex flex-col items-center gap-1 ${active ? "text-black" : "text-gray-500"}`;
  return (
    <Link to={to} className={className}>
      {icon}
      <span className="text-xs">{label}</span>
    </Link>
  );
}
