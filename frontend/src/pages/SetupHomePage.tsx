import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { loadSetup, type SetupStep } from "@/lib/setup";

const STEPS: { label: string; to: string; key: SetupStep }[] = [
  { label: "Step1 : set-up your class schedule", to: "/set-up/schedule", key: "schedule" },
  { label: "Step2 : set-up your alarm", to: "/set-up/alarm", key: "alarm" },
  { label: "Step3 : set-up your exam day", to: "/set-up/exam-day", key: "exam" },
];

function SetupHomePage() {
  const navigate = useNavigate();
  const [setup, setSetup] = useState(loadSetup);

  useEffect(() => {
    const reload = () => setSetup(loadSetup());
    window.addEventListener("focus", reload);
    return () => window.removeEventListener("focus", reload);
  }, []);

  const allDone = setup.schedule && setup.alarm && setup.exam;

  return (
    <div className="flex flex-col w-full h-full p-4 gap-4">
      <div className="flex items-end justify-center gap-3 mt-2 h-[140px]">
        <div className="shrink-0">
          <DotLottieReact
            src="/voro_3.lottie"
            autoplay
            loop
            aria-label="voro"
            style={{ width: 110, height: 120 }}
          />
        </div>
        <div className="relative mb-6">
          <div className="px-5 py-3 border border-black rounded-2xl">
            <span className="text-sm italic">Glad to meet you!</span>
          </div>
          <div className="absolute left-[-8px] bottom-3 w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-r-[10px] border-r-black" />
          <div className="absolute left-[-6px] bottom-[13px] w-0 h-0 border-t-[7px] border-t-transparent border-b-[7px] border-b-transparent border-r-[9px] border-r-white" />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {STEPS.map((s) => {
          const done = setup[s.key];
          return (
            <button
              key={s.key}
              onClick={() => navigate({ to: s.to })}
              className="w-full border border-black rounded-xl p-3 text-left flex items-center gap-3 hover:bg-black hover:text-white transition-colors"
            >
              <span
                className={`w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px] ${
                  done ? "bg-black text-white" : ""
                }`}
              >
                {done ? "✓" : ""}
              </span>
              <span className="flex-1">{s.label}</span>
            </button>
          );
        })}
      </div>

      <button
        disabled={!allDone}
        onClick={() => navigate({ to: "/home" })}
        className="mt-auto w-full py-3 rounded-xl border border-black bg-black text-white text-sm disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Start
      </button>
    </div>
  );
}

export default SetupHomePage;
