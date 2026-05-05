import { useState } from "react";
import { Check, ChevronDown, ChevronRight, X } from "lucide-react";
import type { MultipleChoiceQuestion } from "@/types/quiz";

type Props = {
  questions: MultipleChoiceQuestion[];
  answers: number[];
};

export function AttemptReview({ questions, answers }: Props) {
  return (
    <ul className="flex flex-col gap-2">
      {questions.map((q, i) => (
        <ReviewRow
          key={q.id}
          index={i}
          question={q}
          chosen={answers[i] ?? -1}
        />
      ))}
    </ul>
  );
}

function ReviewRow({
  index,
  question,
  chosen,
}: {
  index: number;
  question: MultipleChoiceQuestion;
  chosen: number;
}) {
  const ok = chosen === question.correctIndex;
  const [open, setOpen] = useState(!ok);

  return (
    <li className="border border-black rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-3 py-2.5 text-left"
      >
        <span
          className={`flex items-center justify-center w-6 h-6 rounded-full text-white shrink-0 ${
            ok ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {ok ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
        </span>
        <span className="flex-1 text-sm truncate">
          <span className="font-medium mr-1.5">Q{index + 1}.</span>
          {question.prompt}
        </span>
        {open ? (
          <ChevronDown className="w-4 h-4 shrink-0 text-gray-500" />
        ) : (
          <ChevronRight className="w-4 h-4 shrink-0 text-gray-500" />
        )}
      </button>

      {open && (
        <div className="px-3 pb-3 pt-1 border-t border-gray-200 bg-gray-50 text-xs flex flex-col gap-2">
          <p className="text-sm text-gray-800 whitespace-pre-line">
            {question.prompt}
          </p>
          <div className="flex flex-col gap-1">
            <Line
              label="내 답"
              text={chosen >= 0 ? question.choices[chosen] : "(미응답)"}
              tone={ok ? "good" : "bad"}
            />
            {!ok && (
              <Line
                label="정답"
                text={question.choices[question.correctIndex]}
                tone="good"
              />
            )}
          </div>
          {question.explanation && (
            <p className="text-gray-600 leading-relaxed mt-1">
              {question.explanation}
            </p>
          )}
        </div>
      )}
    </li>
  );
}

function Line({
  label,
  text,
  tone,
}: {
  label: string;
  text: string;
  tone: "good" | "bad";
}) {
  const color = tone === "good" ? "text-green-700" : "text-red-700";
  return (
    <div className="flex gap-2">
      <span className="text-gray-500 shrink-0 w-9">{label}</span>
      <span className={`flex-1 ${color}`}>{text}</span>
    </div>
  );
}
