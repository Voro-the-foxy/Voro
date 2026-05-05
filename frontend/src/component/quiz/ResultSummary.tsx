type Props = {
  score: number;
  total: number;
  marks: boolean[];
};

export function ResultSummary({ score, total, marks }: Props) {
  const percent = total === 0 ? 0 : Math.round((score / total) * 100);
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-7xl font-bold leading-none">
        {score}
        <span className="text-4xl text-gray-400">/{total}</span>
      </div>
      <div className="text-sm text-gray-600">{percent}% correct</div>
      <ol className="flex items-center gap-2 mt-2">
        {marks.map((ok, i) => (
          <li
            key={i}
            className="flex flex-col items-center gap-1"
            aria-label={`question ${i + 1} ${ok ? "correct" : "wrong"}`}
          >
            <span
              className={`w-4 h-4 rounded-full border ${
                ok ? "bg-green-600 border-green-600" : "bg-white border-red-600"
              }`}
            />
            <span className="text-[10px] text-gray-500">{i + 1}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
