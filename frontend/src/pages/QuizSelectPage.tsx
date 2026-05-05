import { Link } from "@tanstack/react-router";
import { X, ChevronRight } from "lucide-react";
import { BottomNav } from "@/component/BottomNav";
import { loadClasses, type ClassItem } from "@/lib/classes";
import { latestDocumentIdForClass } from "@/lib/notes";
import { hasCachedQuiz } from "@/lib/quiz";
import { loadSolvedQuizzes } from "@/lib/solvedQuizzes";

type Row = {
  klass: ClassItem;
  hasDocument: boolean;
  hasQuiz: boolean;
  solved: number;
};

function buildRows(): Row[] {
  const solvedByClass = loadSolvedQuizzes().reduce<Record<string, number>>(
    (acc, s) => {
      acc[s.classId] = (acc[s.classId] ?? 0) + 1;
      return acc;
    },
    {},
  );
  return loadClasses().map((klass) => ({
    klass,
    hasDocument: latestDocumentIdForClass(klass.id) !== undefined,
    hasQuiz: hasCachedQuiz(klass.id),
    solved: solvedByClass[klass.id] ?? 0,
  }));
}

function QuizSelectPage() {
  const rows = buildRows();

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

        {rows.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="flex flex-col gap-4 mt-6">
            {rows.map((r, i) => (
              <li key={r.klass.id}>
                <ClassCard
                  classId={r.klass.id}
                  title={r.klass.name}
                  badge={r.klass.name.charAt(0).toUpperCase() || "?"}
                  hasDocument={r.hasDocument}
                  hasQuiz={r.hasQuiz}
                  solved={r.solved}
                  tilt={i % 2 === 0 ? "-rotate-[0.4deg]" : "rotate-[0.4deg]"}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
      <BottomNav active="quiz" />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 mt-12 text-center">
      <p className="text-sm text-gray-700">아직 등록된 강의가 없어요.</p>
      <p className="text-xs text-gray-500">
        먼저 자료(PDF)를 업로드해서 강의를 추가하세요.
      </p>
      <Link
        to="/notes/upload"
        className="mt-2 px-4 py-2 border border-black rounded-md text-sm"
      >
        Upload note
      </Link>
    </div>
  );
}

function ClassCard({
  classId,
  title,
  badge,
  hasDocument,
  hasQuiz,
  solved,
  tilt,
}: {
  classId: string;
  title: string;
  badge: string;
  hasDocument: boolean;
  hasQuiz: boolean;
  solved: number;
  tilt: string;
}) {
  const status = hasQuiz
    ? `quiz ready · ${solved} solved`
    : hasDocument
      ? "tap to generate"
      : "no document yet";
  const disabled = !hasDocument;
  const baseClass = [
    "group block bg-white border border-black rounded-md",
    "shadow-[3px_3px_0_0_rgba(0,0,0,1)]",
    "transition-transform active:translate-x-[1px] active:translate-y-[1px]",
    "active:shadow-[2px_2px_0_0_rgba(0,0,0,1)]",
    "hover:bg-gray-50",
    tilt,
    disabled ? "opacity-50 pointer-events-none" : "",
  ].join(" ");

  const inner = (
    <div className="flex items-center gap-3 p-3">
      <div className="flex items-center justify-center w-12 h-12 border border-black rounded-md text-xl font-medium shrink-0">
        {badge}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{title}</div>
        <div className="text-[11px] italic text-gray-600 mt-0.5">{status}</div>
      </div>
      <ChevronRight className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
    </div>
  );

  if (disabled) {
    return <div className={baseClass}>{inner}</div>;
  }

  return (
    <Link
      to="/quiz/$classId"
      params={{ classId }}
      aria-label={title}
      className={baseClass}
      title={title}
    >
      {inner}
    </Link>
  );
}

export default QuizSelectPage;
