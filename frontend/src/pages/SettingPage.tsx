import { Link } from "@tanstack/react-router";
import { CalendarDays, BellRing, GraduationCap, ChevronRight } from "lucide-react";
import { BottomNav } from "@/component/BottomNav";
import { loadSession } from "@/lib/auth";

const ITEMS: {
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

function SettingPage() {
  const session = loadSession();

  return (
    <div className="flex flex-col h-full bg-white text-black">
      <header className="px-6 pt-6 pb-3 border-b border-black">
        <h1 className="text-lg font-medium">Settings</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {session && (
          <Link
            to="/mypage"
            className="mb-4 flex items-center gap-3 border border-black rounded-xl px-4 py-3 hover:bg-gray-50 transition-colors"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-black text-sm font-medium shrink-0">
              {session.user.name.slice(0, 1).toUpperCase()}
            </span>
            <span className="flex flex-1 flex-col min-w-0">
              <span className="text-sm font-medium truncate">{session.user.name}</span>
              <span className="text-xs text-gray-400 truncate">Voro Learner</span>
            </span>
            <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
          </Link>
        )}

        <ul className="flex flex-col gap-3">
          {ITEMS.map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                search={{ from: "setting" }}
                className="flex items-center gap-4 px-4 py-3 border border-black rounded-xl hover:bg-gray-50 transition-colors"
              >
                <span className="flex items-center justify-center w-10 h-10 rounded-full border border-black">
                  {item.icon}
                </span>
                <span className="flex-1 flex flex-col text-left">
                  <span className="text-sm font-medium">{item.title}</span>
                  <span className="text-xs text-gray-500">{item.description}</span>
                </span>
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <BottomNav active="setting" />
    </div>
  );
}

export default SettingPage;
