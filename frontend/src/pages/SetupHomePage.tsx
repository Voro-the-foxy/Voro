import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { loadSetup, checkSetupReadiness, type SetupStep } from "@/lib/setup";

const STEPS: { label: string; to: string; key: SetupStep }[] = [
  { label: "Step1 : set-up your class schedule", to: "/set-up/schedule", key: "schedule" },
  { label: "Step2 : set-up your alarm", to: "/set-up/alarm", key: "alarm" },
  { label: "Step3 : set-up your exam day", to: "/set-up/exam-day", key: "exam" },
  { label: "Step4 : upload your first note", to: "/set-up/notes", key: "notes" },
];

const DEFAULT_SETUP = { schedule: false, alarm: false, exam: false, notes: false };

function SetupHomePage() {
  const navigate = useNavigate();
  const [setup, setSetup] = useState(DEFAULT_SETUP);
  const [notesComplete, setNotesComplete] = useState(false);
  const [allDone, setAllDone] = useState(false);

  const reload = async () => {
    const { zodResult, notesComplete: nc, state } = await checkSetupReadiness().catch(() => ({
      zodResult: { success: false as const },
      notesComplete: false,
      state: DEFAULT_SETUP,
    }));
    setSetup(state);
    setNotesComplete(nc);
    setAllDone(zodResult.success);
  };

  useEffect(() => {
    void reload();
    window.addEventListener("focus", reload);
    return () => window.removeEventListener("focus", reload);
  }, []);

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
        <div className="mb-6 px-5 py-3 border border-black rounded-2xl">
          <span className="text-sm italic">Glad to meet you!</span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {STEPS.map((s) => {
          const done = s.key === "notes" ? notesComplete : setup[s.key];
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
