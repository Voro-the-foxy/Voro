import { useEffect, useState } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { X } from "lucide-react";
import { getAttempt } from "@/lib/attempts";
import { loadQuizForClass } from "@/lib/quiz";
import { loadClasses } from "@/lib/classes";
import { ResultSummary } from "@/component/quiz/ResultSummary";
import { AttemptReview } from "@/component/quiz/AttemptReview";
import type { QuizAttempt } from "@/types/attempt";
import type { MultipleChoiceQuestion } from "@/types/quiz";

type QuestionsState =
  | { kind: "loading" }
  | { kind: "ready"; questions: MultipleChoiceQuestion[] }
  | { kind: "error"; message: string };

function QuizResultPage() {
  const { classId, attemptId } = useParams({
    from: "/quiz/$classId_/result/$attemptId",
  });
  const navigate = useNavigate();

  const goHome = () => navigate({ to: "/home" });
  const retry = () => navigate({ to: "/quiz/$classId", params: { classId } });

  const [attempt, setAttempt] = useState<QuizAttempt | null | undefined>(undefined);
  const [lectureName, setLectureName] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getAttempt(attemptId), loadClasses()])
      .then(([a, classes]) => {
        setAttempt(a.classId === classId ? a : null);
        setLectureName(classes.find((c) => c.id === classId)?.name ?? null);
      })
      .catch(() => {
        setAttempt(null);
      });
  }, [attemptId, classId]);

  if (attempt === undefined) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!attempt || lectureName === null) {
    return <ErrorFrame message="Result not found" onClose={goHome} />;
  }

  return (
    <ResultBody
      classId={classId}
      lectureName={lectureName}
      attempt={attempt}
      onRetry={retry}
      onHome={goHome}
    />
  );
}

function ResultBody({
  classId,
  lectureName,
  attempt,
  onRetry,
  onHome,
}: {
  classId: string;
  lectureName: string;
  attempt: QuizAttempt;
  onRetry: () => void;
  onHome: () => void;
}) {
  const [questionsState, setQuestionsState] = useState<QuestionsState>({
    kind: "loading",
  });

  useEffect(() => {
    let cancelled = false;
    loadQuizForClass(classId, lectureName)
      .then((quiz) => {
        if (cancelled) return;
        const mc = quiz.questions.filter(
          (q): q is MultipleChoiceQuestion => q.type === "multiple_choice",
        );
        const byId = new Map(mc.map((q) => [q.id, q]));
        const ordered = attempt.questionIds
          .map((id) => byId.get(id))
          .filter((q): q is MultipleChoiceQuestion => q !== undefined);
        if (ordered.length === 0) {
          setQuestionsState({
            kind: "error",
            message: "Question data not found (quiz cache expired)",
          });
          return;
        }
        setQuestionsState({ kind: "ready", questions: ordered });
      })
      .catch((e) => {
        if (cancelled) return;
        const msg =
          e instanceof Error ? e.message : "Failed to load result";
        setQuestionsState({ kind: "error", message: msg });
      });
    return () => {
      cancelled = true;
    };
  }, [classId, lectureName, attempt.questionIds]);

  const marks = attempt.answers.map(
    (ans, i) => ans === attempt.correctIndices[i],
  );

  return (
    <div className="flex flex-col h-full bg-white text-black">
      <Header title={attempt.lectureTitle} onClose={onHome} />

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-5 py-6 flex flex-col md:flex-row gap-6">
          <section className="md:w-1/2 md:sticky md:top-6 md:self-start flex flex-col items-center pt-2">
            <ResultSummary
              score={attempt.score}
              total={attempt.total}
              marks={marks}
            />
          </section>

          <section className="md:w-1/2 flex flex-col gap-3">
            <h2 className="text-xs font-medium text-gray-700">Question review</h2>
            {questionsState.kind === "loading" && (
              <div className="flex items-center justify-center py-10">
                <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {questionsState.kind === "error" && (
              <p className="text-xs text-red-700">{questionsState.message}</p>
            )}
            {questionsState.kind === "ready" && (
              <AttemptReview
                questions={questionsState.questions}
                answers={attempt.answers}
              />
            )}
          </section>
        </div>
      </div>

      <footer className="px-5 pb-5 flex flex-col gap-2">
        <button
          onClick={onRetry}
          className="w-full py-3 rounded-xl border border-black bg-white text-black text-sm font-medium"
        >
          Retry
        </button>
        <button
          onClick={onHome}
          className="w-full py-3 rounded-xl border border-black bg-black text-white text-sm font-medium"
        >
          Done
        </button>
      </footer>
    </div>
  );
}

function Header({ title, onClose }: { title?: string; onClose: () => void }) {
  return (
    <header className="px-5 pt-5 pb-3 flex items-center justify-between border-b border-black">
      <h1 className="text-base font-medium truncate">{title ?? "Result"}</h1>
      <button onClick={onClose} aria-label="Close" className="p-1 -mr-1">
        <X className="w-5 h-5" />
      </button>
    </header>
  );
}

function ErrorFrame({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col h-full bg-white text-black">
      <Header onClose={onClose} />
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-sm text-red-700">{message}</p>
        <button
          onClick={onClose}
          className="px-4 py-2 border border-black rounded-md text-sm"
        >
          Home
        </button>
      </div>
    </div>
  );
}

export default QuizResultPage;
