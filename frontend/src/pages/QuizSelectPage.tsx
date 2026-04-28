import { Link } from "@tanstack/react-router";
import { X, ChevronRight } from "lucide-react";
import { BottomNav } from "@/component/BottomNav";
import { QUIZ_CLASSES, getQuiz } from "@/lib/quiz";
import { loadSolvedQuizzes } from "@/lib/solvedQuizzes";

// MOCK: class list rendered from the in-memory mock catalog (lib/quiz.ts).
// TODO(backend): GET /api/quiz/classes
//                Replace QUIZ_CLASSES with fetched data; show loading state while
//                in flight and an empty-state CTA when the user has no quizzes yet.
function QuizSelectPage() {
  const solvedByClass = loadSolvedQuizzes().reduce<Record<string, number>>(
    (acc, s) => {
      acc[s.classId] = (acc[s.classId] ?? 0) + 1;
      return acc;
    },
    {},
  );

  return (
    <div className="flex flex-col h-full bg-white text-black">
      <div className="flex-1 overflow-y-auto px-6 pt-6 pb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-medium">Select class..</h1>
            <p className="text-xs italic text-gray-600 mt-1">
              pick a deck to drill
            </p>
          </div>
          <Link to="/home" aria-label="Close" className="p-1 -mr-1">
            <X className="w-5 h-5" />
          </Link>
        </div>
        <div className="border-b border-black mt-3" />

        <ul className="flex flex-col gap-4 mt-6">
          {classesWithMeta(solvedByClass).map((c, i) => (
            <li key={c.id}>
              <ClassCard
                classId={c.id}
                title={c.lectureTitle}
                badge={c.lectureTitle.charAt(0).toUpperCase()}
                total={c.total}
                solved={c.solved}
                tilt={i % 2 === 0 ? "-rotate-[0.4deg]" : "rotate-[0.4deg]"}
              />
            </li>
          ))}
        </ul>
      </div>
      <BottomNav active="quiz" />
    </div>
  );
}

function classesWithMeta(solvedByClass: Record<string, number>) {
  return QUIZ_CLASSES.map((c) => ({
    ...c,
    total: getQuiz(c.id)?.questions.length ?? 0,
    solved: solvedByClass[c.id] ?? 0,
  }));
}

function ClassCard({
  classId,
  title,
  badge,
  total,
  solved,
  tilt,
}: {
  classId: string;
  title: string;
  badge: string;
  total: number;
  solved: number;
  tilt: string;
}) {
  const pct = total === 0 ? 0 : Math.min(100, Math.round((solved / total) * 100));
  return (
    <Link
      to="/quiz/$classId"
      params={{ classId }}
      aria-label={title}
      className={[
        "group block bg-white border border-black rounded-md",
        "shadow-[3px_3px_0_0_rgba(0,0,0,1)]",
        "transition-transform active:translate-x-[1px] active:translate-y-[1px]",
        "active:shadow-[2px_2px_0_0_rgba(0,0,0,1)]",
        "hover:bg-gray-50",
        tilt,
      ].join(" ")}
      title={`${title} · ${solved}/${total} solved`}
    >
      <div className="flex items-center gap-3 p-3">
        <div className="flex items-center justify-center w-12 h-12 border border-black rounded-md text-xl font-medium shrink-0">
          {badge}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{title}</div>
          <div className="text-[11px] italic text-gray-600 mt-0.5">
            {total} questions · {solved} solved
          </div>
          <ProgressBar pct={pct} />
        </div>
        <ChevronRight className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="mt-2 h-2 w-full border border-black rounded-full overflow-hidden bg-white">
      <div
        className="h-full bg-black transition-[width] duration-300"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default QuizSelectPage;
