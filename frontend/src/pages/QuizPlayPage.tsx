import { useState } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { X } from "lucide-react";
import { getQuiz } from "@/lib/quiz";
import { addSolvedQuiz } from "@/lib/solvedQuizzes";
import type { Question } from "@/types/quiz";

// MOCK: questions loaded from the in-memory mock catalog (lib/quiz.ts).
// Per-question answers aren't stored or scored — only completion is recorded.
function QuizPlayPage() {
  const { classId } = useParams({ from: "/quiz/$classId" });
  const navigate = useNavigate();
  // TODO(backend): GET /api/quiz/classes/:classId
  //                Returns Quiz (lectureTitle + questions). Currently loads from
  //                in-memory mock; replace with useEffect + setState (loading state).
  const quiz = getQuiz(classId);

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);

  if (!quiz) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-sm text-gray-500">
        <span>Quiz not found.</span>
        <button
          onClick={() => navigate({ to: "/quiz" })}
          className="px-3 py-1.5 border border-black rounded-md"
        >
          Back to classes
        </button>
      </div>
    );
  }

  const total = quiz.questions.length;
  const question = quiz.questions[index];
  const progress = ((index + 1) / total) * 100;

  const canAdvance =
    question.type === "multiple_choice" ? selected !== null : revealed;

  const onNext = () => {
    if (index + 1 >= total) {
      // TODO(backend): POST /api/quizzes/solved
      //                Body: { classId, answers: { questionId, choiceIndex? }[] }
      //                Response: SolvedQuiz + score breakdown.
      //                Need to accumulate per-question answers across the session;
      //                currently we only count completion.
      addSolvedQuiz(classId);
      navigate({ to: "/home" });
      return;
    }
    // TODO(backend): optional POST /api/quiz/classes/:classId/answer
    //                Body: { questionId, choiceIndex } (for MC) or { questionId } (open).
    //                Used if the server should grade per question and return correctness
    //                instead of inlining correctIndex/explanation in the GET.
    setIndex(index + 1);
    setSelected(null);
    setRevealed(false);
  };

  return (
    <div className="flex flex-col h-full bg-white text-black">
      <header className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-base font-medium">{quiz.lectureTitle}</h1>
          <button
            onClick={() => navigate({ to: "/quiz" })}
            aria-label="Close"
            className="p-1 -mr-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-black transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-gray-700 whitespace-nowrap">
            {index + 1}/{total}
          </span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-5 pb-5">
        <Prompt text={question.prompt} />
        <div className="mt-5">
          {question.type === "multiple_choice" ? (
            <ChoiceList
              question={question}
              selected={selected}
              onSelect={setSelected}
            />
          ) : (
            <ExplanationCard
              question={question}
              revealed={revealed}
              onReveal={() => setRevealed(true)}
            />
          )}
        </div>
      </div>

      <footer className="px-5 pb-5">
        <button
          disabled={!canAdvance}
          onClick={onNext}
          className="w-full py-3 rounded-xl border border-black bg-black text-white text-sm font-medium disabled:bg-gray-200 disabled:text-gray-400 disabled:border-gray-200"
        >
          {index + 1 >= total ? "Finish" : "Next"}
        </button>
      </footer>
    </div>
  );
}

function Prompt({ text }: { text: string }) {
  return (
    <div className="px-5 py-4 border border-black rounded-2xl">
      <p className="text-sm">{text}</p>
    </div>
  );
}

function ChoiceList({
  question,
  selected,
  onSelect,
}: {
  question: Extract<Question, { type: "multiple_choice" }>;
  selected: number | null;
  onSelect: (i: number) => void;
}) {
  return (
    <ul className="flex flex-col gap-3">
      {question.choices.map((choice, i) => {
        const isSelected = selected === i;
        return (
          <li key={i}>
            <button
              onClick={() => onSelect(i)}
              className={`w-full flex items-center gap-3 px-4 py-3 border rounded-xl text-left text-sm transition-colors ${
                isSelected ? "border-black bg-gray-50" : "border-gray-300 bg-white"
              }`}
            >
              <span
                className={`flex items-center justify-center w-5 h-5 rounded-full border ${
                  isSelected ? "border-black" : "border-gray-400"
                }`}
              >
                {isSelected && <span className="w-2.5 h-2.5 rounded-full bg-black" />}
              </span>
              <span className="flex-1">{choice}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function ExplanationCard({
  question,
  revealed,
  onReveal,
}: {
  question: Extract<Question, { type: "open_answer" }>;
  revealed: boolean;
  onReveal: () => void;
}) {
  if (!revealed) {
    return (
      <button
        onClick={onReveal}
        className="w-full px-5 py-6 border border-black rounded-2xl text-sm text-gray-500"
      >
        Tap to reveal answer
      </button>
    );
  }
  return (
    <div className="px-5 py-5 border border-black rounded-2xl">
      <p className="text-sm whitespace-pre-line">{question.explanation}</p>
    </div>
  );
}

export default QuizPlayPage;
