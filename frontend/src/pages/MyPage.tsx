import { Link } from "@tanstack/react-router";
import {
  CalendarDays, BellRing, GraduationCap, ChevronRight,
} from "lucide-react";
import { BottomNav } from "@/component/BottomNav";
import { loadSession } from "@/lib/auth";

const SETTING_ITEMS: {
  to: "/set-up/schedule" | "/set-up/alarm" | "/set-up/exam-day";
  icon: React.ReactNode;
  title: string;
  description: string;
}[] = [
  {
    to: "/set-up/schedule",
    icon: <CalendarDays className="w-5 h-5" />,
    title: "Class schedule",
    description: "Edit your weekly timetable",
  },
  {
    to: "/set-up/alarm",
    icon: <BellRing className="w-5 h-5" />,
    title: "Alarm",
    description: "Manage wake-up alarms",
  },
  {
    to: "/set-up/exam-day",
    icon: <GraduationCap className="w-5 h-5" />,
    title: "Exam day",
    description: "Set exam schedules",
  },
];

function MyPage() {
  const session = loadSession();
  const initial = session?.user.name?.slice(0, 1).toUpperCase() ?? "?";

  return (
    <div className="flex flex-col h-full bg-white text-black">
      <header className="px-6 pt-6 pb-4 border-b border-black">
        <h1 className="text-lg font-medium">Profile</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-5">
        {/* User card → /account */}
        <Link
          to="/account"
          className="flex items-center gap-4 px-4 py-4 border border-black rounded-xl hover:bg-gray-50 transition-colors"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-black text-lg font-semibold shrink-0">
            {initial}
          </div>
          <div className="flex flex-col gap-1 min-w-0 flex-1">
            <span className="text-sm font-semibold truncate">{session?.user.name ?? "—"}</span>
            <span className="text-xs text-gray-500 truncate">{session?.user.email ?? "—"}</span>
            <span className="inline-flex items-center self-start rounded-full border border-black px-2 py-0.5 text-[10px] font-medium leading-none mt-0.5">
              Voro Learner
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
        </Link>

        {/* Settings */}
        <div>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2 px-1">Settings</p>
          <ul className="flex flex-col gap-2">
            {SETTING_ITEMS.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  search={{ from: "mypage" }}
                  className="flex items-center gap-4 px-4 py-3 border border-black rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <span className="flex items-center justify-center w-9 h-9 rounded-full border border-black shrink-0">
                    {item.icon}
                  </span>
                  <span className="flex-1 flex flex-col text-left min-w-0">
                    <span className="text-sm font-medium">{item.title}</span>
                    <span className="text-xs text-gray-500">{item.description}</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <BottomNav active="profile" />
    </div>
  );
}

export default MyPage;
