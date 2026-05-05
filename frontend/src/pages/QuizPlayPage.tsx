import { useNavigate, useParams } from "@tanstack/react-router";
import { Check, X } from "lucide-react";
import { loadClasses } from "@/lib/classes";
import { saveAttempt } from "@/lib/attempts";
import { useQuizSession } from "@/hooks/useQuizSession";
import { ChoiceList } from "@/component/quiz/ChoiceList";
import type { MultipleChoiceQuestion } from "@/types/quiz";

function QuizPlayPage() {
  const { classId } = useParams({ from: "/quiz/$classId" });
  const navigate = useNavigate();
  const klass = loadClasses().find((c) => c.id === classId);

  const session = useQuizSession(classId, klass?.name ?? "", klass !== undefined);

  const finishAndNavigateToResult = () => {
    if (session.state.kind !== "ready") return;
    const quiz = session.state.quiz;
    const mc = quiz.questions as MultipleChoiceQuestion[];
    const attempt = saveAttempt({
      classId,
      quizId: quiz.classId,
      lectureTitle: quiz.lectureTitle,
      questionIds: mc.map((q) => q.id),
      answers: session.answers,
      correctIndices: mc.map((q) => q.correctIndex),
    });
    navigate({
      to: "/quiz/$classId/result/$attemptId",
      params: { classId, attemptId: attempt.id },
      replace: true,
    });
  };

  if (!klass) {
    return (
      <ErrorScreen
        message="강의를 찾을 수 없습니다"
        onBack={() => navigate({ to: "/quiz" })}
      />
    );
  }
  if (session.state.kind === "loading") {
    return <LoadingScreen onClose={() => navigate({ to: "/quiz" })} />;
  }
  if (session.state.kind === "error") {
    return (
      <ErrorScreen
        message={session.state.message}
        onBack={() => navigate({ to: "/quiz" })}
      />
    );
  }

  const quiz = session.state.quiz;
  const total = quiz.questions.length;
  const question = quiz.questions[session.index] as MultipleChoiceQuestion;
  const progress = ((session.index + 1) / total) * 100;

  const onPrimary = () => {
    if (!session.checked) {
      session.check();
      return;
    }
    if (session.isLastQuestion) {
      finishAndNavigateToResult();
      return;
    }
    session.next();
  };

  const isCorrect =
    session.checked && session.selected === question.correctIndex;
  const buttonLabel = !session.checked
    ? "Check"
    : session.isLastQuestion
      ? "See result"
      : "Next";
  const buttonDisabled = !session.checked && session.selected === null;

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
            {session.index + 1}/{total}
          </span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-5 pb-5">
        <Prompt text={question.prompt} />
        <div className="mt-5">
          <ChoiceList
            choices={question.choices}
            selected={session.selected}
            correctIndex={question.correctIndex}
            checked={session.checked}
            onSelect={session.select}
          />
        </div>

        {session.checked && (
          <FeedbackBanner
            ok={isCorrect}
            correctText={question.choices[question.correctIndex]}
            explanation={question.explanation}
          />
        )}
      </div>

      <footer className="px-5 pb-5">
        <button
          disabled={buttonDisabled}
          onClick={onPrimary}
          className="w-full py-3 rounded-xl border border-black bg-black text-white text-sm font-medium disabled:bg-gray-200 disabled:text-gray-400 disabled:border-gray-200"
        >
          {buttonLabel}
        </button>
      </footer>
    </div>
  );
}

function FeedbackBanner({
  ok,
  correctText,
  explanation,
}: {
  ok: boolean;
  correctText: string;
  explanation?: string;
}) {
  return (
    <div
      className={`mt-4 px-4 py-3 border rounded-2xl text-sm ${
        ok ? "border-green-600 bg-green-50" : "border-red-600 bg-red-50"
      }`}
    >
      <div className="flex items-center gap-2 font-medium">
        {ok ? (
          <>
            <Check className="w-4 h-4 text-green-700" />
            <span className="text-green-800">정답!</span>
          </>
        ) : (
          <>
            <X className="w-4 h-4 text-red-700" />
            <span className="text-red-800">아쉬워요</span>
          </>
        )}
      </div>
      {!ok && (
        <p className="mt-1 text-gray-800">
          정답: <span className="font-medium">{correctText}</span>
        </p>
      )}
      {explanation && (
        <p className="mt-1.5 text-gray-700 text-xs leading-relaxed">
          {explanation}
        </p>
      )}
    </div>
  );
}

function LoadingScreen({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-col h-full bg-white text-black">
      <header className="flex items-center justify-end px-5 pt-5 pb-3">
        <button onClick={onClose} aria-label="Close" className="p-1 -mr-1">
          <X className="w-5 h-5" />
        </button>
      </header>
      <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6">
        <div className="w-10 h-10 border-2 border-black border-t-transparent rounded-full animate-spin" />
        <p className="text-base text-gray-700">문제 생성 중…</p>
        <p className="text-xs text-gray-500 text-center">
          최대 1분 정도 걸릴 수 있어요
        </p>
      </div>
    </div>
  );
}

function ErrorScreen({
  message,
  onBack,
}: {
  message: string;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-col h-full bg-white text-black">
      <header className="flex items-center justify-end px-5 pt-5 pb-3">
        <button onClick={onBack} aria-label="Close" className="p-1 -mr-1">
          <X className="w-5 h-5" />
        </button>
      </header>
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-sm text-red-700">{message}</p>
        <button
          onClick={onBack}
          className="px-4 py-2 border border-black rounded-md text-sm"
        >
          Back
        </button>
      </div>
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

export default QuizPlayPage;
