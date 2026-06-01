import { Check, X } from "lucide-react";

type Props = {
  choices: string[];
  selected: number | null;
  correctIndex: number;
  checked: boolean;
  onSelect: (i: number) => void;
};

type Visual = "neutral" | "selected" | "correct" | "wrong";

const styleFor: Record<Visual, string> = {
  neutral: "border-2 border-black bg-paper shadow-[2px_2px_0_0_rgba(0,0,0,0.5)] hover:bg-paper-dark",
  selected: "border-2 border-black bg-paper-dark shadow-[2px_2px_0_0_rgba(0,0,0,1)]",
  correct: "border-2 border-green-600 bg-green-50 shadow-[2px_2px_0_0_rgba(22,163,74,0.5)]",
  wrong: "border-2 border-red-600 bg-red-50 shadow-[2px_2px_0_0_rgba(220,38,38,0.5)]",
};

const dotFor = (visual: Visual, isSelected: boolean) => {
  if (visual === "correct") {
    return (
      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-green-600 text-white">
        <Check className="w-3 h-3" />
      </span>
    );
  }
  if (visual === "wrong") {
    return (
      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-red-600 text-white">
        <X className="w-3 h-3" />
      </span>
    );
  }
  return (
    <span
      className={`flex items-center justify-center w-5 h-5 rounded-full border ${
        isSelected ? "border-black" : "border-gray-400"
      }`}
    >
      {isSelected && <span className="w-2.5 h-2.5 rounded-full bg-black" />}
    </span>
  );
};

export function ChoiceList({
  choices,
  selected,
  correctIndex,
  checked,
  onSelect,
}: Props) {
  return (
    <ul className="flex flex-col gap-3">
      {choices.map((choice, i) => {
        const isSelected = selected === i;
        const isCorrect = i === correctIndex;

        let visual: Visual = "neutral";
        if (checked) {
          if (isCorrect) visual = "correct";
          else if (isSelected) visual = "wrong";
        } else if (isSelected) {
          visual = "selected";
        }

        return (
          <li key={i}>
            <button
              onClick={() => onSelect(i)}
              disabled={checked}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-sm text-left text-sm sketch ${styleFor[visual]} disabled:cursor-default`}
            >
              {dotFor(visual, isSelected)}
              <span className="flex-1">{choice}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
