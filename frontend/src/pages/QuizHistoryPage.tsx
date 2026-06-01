import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ChevronRight, X } from "lucide-react";
import { listAttempts, type QuizAttempt } from "@/lib/attempts";
import { loadClasses } from "@/lib/classes";

type Row = QuizAttempt & { className: string };

function formatDate(ms: number): string {
  const d = new Date(ms);
  return d.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

function QuizHistoryPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    Promise.all([listAttempts(), loadClasses()])
      .then(([attempts, classes]) => {
        const nameMap = new Map(classes.map((c) => [c.id, c.name]));
        const sorted = [...attempts].sort((a, b) => b.completedAt - a.completedAt);
        setRows(sorted.map((a) => ({ ...a, className: nameMap.get(a.classId) ?? a.classId })));
      })
      .catch(() => setRows([]));
  }, []);

  return (
    <div className="flex flex-col h-full bg-paper text-black">
      <div className="flex-1 overflow-y-auto px-6 pt-6 pb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-medium">History</h1>
            <p className="text-xs italic text-gray-600 mt-1">past attempts</p>
          </div>
          <button
            onClick={() => navigate({ to: "/quiz" })}
            aria-label="Close"
            className="p-1 -mr-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="border-b border-black mt-3" />

        {rows === null && (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {rows !== null && rows.length === 0 && (
          <div className="flex flex-col items-center gap-2 mt-12 text-center">
            <p className="text-sm text-gray-700">No attempts yet.</p>
            <p className="text-xs text-gray-500">Complete a quiz to see your history here.</p>
          </div>
        )}

        {rows !== null && rows.length > 0 && (
          <ul className="flex flex-col gap-3 mt-5">
            {rows.map((row) => (
              <li key={row.id}>
                <button
                  onClick={() =>
                    navigate({
                      to: "/quiz/$classId/result/$attemptId",
                      params: { classId: row.classId, attemptId: row.id },
                    })
                  }
                  className="group w-full flex items-center gap-3 p-3 border-2 border-black rounded-sm text-left shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:bg-paper-dark active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_0_rgba(0,0,0,1)] transition-transform sketch bg-paper"
                >
                  <div className="flex items-center justify-center w-10 h-10 border-2 border-black rounded-sm shrink-0 text-sm font-bold sketch">
                    {row.score}/{row.total}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{row.lectureTitle}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {row.className} · {formatDate(row.completedAt)}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default QuizHistoryPage;
