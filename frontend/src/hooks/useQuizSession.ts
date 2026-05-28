import { useEffect, useState } from "react";
import { loadQuizForClass } from "@/lib/quiz";
import type { Quiz } from "@/types/quiz";

export type LoadState =
  | { kind: "loading" }
  | { kind: "ready"; quiz: Quiz }
  | { kind: "error"; message: string };

export type Session = {
  state: LoadState;
  index: number;
  selected: number | null;
  checked: boolean;
  answers: number[];
  select: (i: number) => void;
  check: () => void;
  next: () => void;
  reset: () => void;
  isLastQuestion: boolean;
  canCheck: boolean;
  canAdvance: boolean;
  score: number;
};

const onlyMultipleChoice = (quiz: Quiz): Quiz => ({
  ...quiz,
  questions: quiz.questions.filter((q) => q.type === "multiple_choice"),
});

export function useQuizSession(
  classId: string,
  lectureTitle: string,
  enabled: boolean,
): Session {
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [answers, setAnswers] = useState<number[]>([]);

  const [prevClassId, setPrevClassId] = useState(classId);
  if (prevClassId !== classId) {
    setPrevClassId(classId);
    setState({ kind: "loading" });
    setIndex(0);
    setSelected(null);
    setChecked(false);
    setAnswers([]);
  }

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    loadQuizForClass(classId, lectureTitle)
      .then((quiz) => {
        if (cancelled) return;
        setState({ kind: "ready", quiz: onlyMultipleChoice(quiz) });
      })
      .catch((e) => {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "Failed to load quiz";
        setState({ kind: "error", message: msg });
      });
    return () => {
      cancelled = true;
    };
  }, [classId, lectureTitle, enabled]);

  const quiz = state.kind === "ready" ? state.quiz : undefined;
  const total = quiz?.questions.length ?? 0;
  const isLastQuestion = quiz !== undefined && index >= total - 1;

  const select = (i: number) => {
    if (checked) return;
    setSelected(i);
  };

  const check = () => {
    if (selected === null || checked) return;
    setChecked(true);
    setAnswers((prev) => [...prev, selected]);
  };

  const next = () => {
    if (!checked) return;
    if (isLastQuestion) return;
    setIndex((i) => i + 1);
    setSelected(null);
    setChecked(false);
  };

  const reset = () => {
    setIndex(0);
    setSelected(null);
    setChecked(false);
    setAnswers([]);
  };

  const score =
    quiz === undefined
      ? 0
      : answers.reduce((acc, ans, i) => {
          const q = quiz.questions[i];
          if (q.type !== "multiple_choice") return acc;
          return ans === q.correctIndex ? acc + 1 : acc;
        }, 0);

  return {
    state,
    index,
    selected,
    checked,
    answers,
    select,
    check,
    next,
    reset,
    isLastQuestion,
    canCheck: selected !== null && !checked,
    canAdvance: checked,
    score,
  };
}
