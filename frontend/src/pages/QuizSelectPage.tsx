import { Link } from "@tanstack/react-router";
import { X } from "lucide-react";
import { BottomNav } from "@/component/BottomNav";
import { QUIZ_CLASSES } from "@/lib/quiz";

// MOCK: class list rendered from the in-memory mock catalog (lib/quiz.ts).
// TODO(backend): GET /api/quiz/classes
//                Replace QUIZ_CLASSES with fetched data; show loading state while
//                in flight and an empty-state CTA when the user has no quizzes yet.
function QuizSelectPage() {
  return (
    <div className="flex flex-col h-full bg-white text-black">
      <div className="flex-1 overflow-y-auto px-6 pt-6">
        <div className="flex items-start justify-between">
          <h1 className="text-lg font-medium">Select class..</h1>
          <Link to="/home" aria-label="Close" className="p-1 -mr-1">
            <X className="w-5 h-5" />
          </Link>
        </div>
        <div className="border-b border-black mt-3" />

        <ul className="flex flex-col items-center gap-3 mt-6">
          {QUIZ_CLASSES.map((c) => (
            <li key={c.id} className="w-full flex justify-center">
              <Link
                to="/quiz/$classId"
                params={{ classId: c.id }}
                className="px-6 py-2 border border-black rounded-md text-sm bg-white hover:bg-gray-50 transition-colors min-w-[180px] text-center"
              >
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <BottomNav active="quiz" />
    </div>
  );
}

export default QuizSelectPage;
