import { Link } from "@tanstack/react-router";
import { Home, BookOpenCheck, UserRound } from "lucide-react";

type Tab = "home" | "quiz" | "profile" | "setting";

export function BottomNav({ active }: { active: Tab }) {
  return (
    <nav className="border-t border-black bg-white md:hidden">
      <div className="grid grid-cols-3 px-2 py-3">
        <NavItem to="/home" icon={<Home className="w-6 h-6" />} label="Home" active={active === "home"} />
        <NavItem to="/quiz" icon={<BookOpenCheck className="w-6 h-6" />} label="Quiz" active={active === "quiz"} />
        <NavItem to="/mypage" icon={<UserRound className="w-6 h-6" />} label="Profile" active={active === "profile"} />
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
  return (
    <Link to={to} className={`flex flex-col items-center gap-1 ${active ? "text-black" : "text-gray-400"}`}>
      {icon}
      <span className="text-xs">{label}</span>
    </Link>
  );
}
