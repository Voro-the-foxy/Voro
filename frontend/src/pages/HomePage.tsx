import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import Matter from "matter-js";
import { Flame, NotebookPen, FileText } from "lucide-react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { BottomNav } from "@/component/BottomNav";
import { loadNotes } from "@/lib/notes";
import { loadSolvedQuizzes } from "@/lib/solvedQuizzes";

// MOCK: Home dashboard mixes localStorage-derived counts (devouredNotes,
// solvedQuizzes) with hardcoded values (streak, fox message, quiz progress).
// All of these should come from a single backend call — see TODO(backend) below.
function HomePage() {
  // TODO(backend): GET /api/users/me/home
  //                Response: { streakDays, devouredNotes, solvedQuizzes,
  //                  quizProgress: { currentStep, totalSteps },
  //                  foxMessage: string }
  //                Single endpoint that aggregates the home dashboard so we can
  //                drop the per-domain calls below. devouredNotes/solvedQuizzes
  //                here are temporary client-side counts.
  const [devouredNotes] = useState(() => loadNotes().length);
  const [solvedQuizzes] = useState(() => loadSolvedQuizzes().length);
  // MOCK: hardcoded quiz path progress.
  // TODO(backend): currentStep/totalSteps come from the user's quiz path on the
  //                server (e.g. enrolled curriculum). Replace with API value.
  const totalSteps = 12;
  const currentStep = Math.min(solvedQuizzes + 1, totalSteps + 1);
  return (
    <div className="flex flex-col h-full bg-white text-black">
      <div className="flex-1 overflow-y-auto">
        {/* MOCK: streak driven by solved quiz count (starts at 0, +1 per solve).
            TODO(backend): streak days come from /api/users/me/home.streakDays */}
        <StreakBadge days={solvedQuizzes} />
        {/* MOCK: hardcoded fox message.
            TODO(backend): fox message comes from /api/users/me/home.foxMessage
            (motivational copy or contextual nudge generated server-side) */}
        <FoxIntro message="I`m voro!!" />
        <StatRow devouredNotes={devouredNotes} solvedQuizzes={solvedQuizzes} />
        <ProgressSplit
          bookCount={devouredNotes}
          currentStep={currentStep}
          totalSteps={totalSteps}
        />
      </div>
      <BottomNav active="home" />
    </div>
  );
}

function StreakBadge({ days }: { days: number }) {
  return (
    <div className="px-6 pt-6">
      <div className="flex items-center justify-center gap-3 px-6 py-3 border border-black rounded-full">
        <Flame className="w-5 h-5" />
        <span className="text-base font-medium">{days} day streak</span>
      </div>
    </div>
  );
}

function FoxIntro({ message }: { message: string }) {
  return (
    <div className="flex items-end justify-center gap-3 px-6 mt-4 h-[140px]">
      <DotLottieReact
        src="/voro_2.lottie"
        autoplay
        loop
        aria-label="voro"
        style={{ width: 110, height: 120 }}
      />
      <div className="relative mb-6">
        <div className="px-5 py-3 border border-black rounded-2xl">
          <span className="text-sm italic">{message}</span>
        </div>
        <div className="absolute left-[-8px] bottom-3 w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-r-[10px] border-r-black" />
        <div className="absolute left-[-6px] bottom-[13px] w-0 h-0 border-t-[7px] border-t-transparent border-b-[7px] border-b-transparent border-r-[9px] border-r-white" />
      </div>
    </div>
  );
}

function StatRow({
  devouredNotes,
  solvedQuizzes,
}: {
  devouredNotes: number;
  solvedQuizzes: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-4 px-8 mt-4">
      <StatTile
        label="Devoured notes"
        count={devouredNotes}
        icon={<NotebookPen className="w-7 h-7" />}
        to="/notes/upload"
      />
      <StatTile
        label="Solved Quiz"
        count={solvedQuizzes}
        icon={<FileText className="w-7 h-7" />}
      />
    </div>
  );
}

function StatTile({
  label,
  count,
  icon,
  to,
}: {
  label: string;
  count: number;
  icon: React.ReactNode;
  to?: string;
}) {
  const tile = (
    <div className="flex flex-col items-center justify-center w-24 h-24 border border-black rounded-2xl gap-1 transition-colors hover:bg-gray-50">
      {icon}
      <span className="text-sm">{count} notes</span>
    </div>
  );
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-xs text-gray-700">{label}</span>
      {to ? (
        <Link to={to} aria-label={label}>
          {tile}
        </Link>
      ) : (
        tile
      )}
    </div>
  );
}

function ProgressSplit({
  bookCount,
  currentStep,
  totalSteps,
}: {
  bookCount: number;
  currentStep: number;
  totalSteps: number;
}) {
  return (
    <div className="grid grid-cols-2 mt-6 border-t border-black h-[280px]">
      <div className="border-r border-black overflow-hidden">
        <BookStack count={bookCount} />
      </div>
      <div className="overflow-hidden">
        <QuizPath currentStep={currentStep} totalSteps={totalSteps} />
      </div>
    </div>
  );
}

function BookStack({ count }: { count: number }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const { width, height } = container.getBoundingClientRect();
    if (width === 0 || height === 0) return;

    const engine = Matter.Engine.create();
    engine.gravity.y = 1.1;

    const render = Matter.Render.create({
      element: container,
      engine,
      options: {
        width,
        height,
        wireframes: false,
        background: "transparent",
        pixelRatio: window.devicePixelRatio || 1,
      },
    });

    const wallThickness = 60;
    const floor = Matter.Bodies.rectangle(
      width / 2,
      height + wallThickness / 2,
      width * 2,
      wallThickness,
      { isStatic: true, render: { visible: false } },
    );
    const leftWall = Matter.Bodies.rectangle(
      -wallThickness / 2,
      height / 2,
      wallThickness,
      height * 4,
      { isStatic: true, render: { visible: false } },
    );
    const rightWall = Matter.Bodies.rectangle(
      width + wallThickness / 2,
      height / 2,
      wallThickness,
      height * 4,
      { isStatic: true, render: { visible: false } },
    );
    Matter.Composite.add(engine.world, [floor, leftWall, rightWall]);

    Matter.Render.run(render);
    const runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine);

    const timeouts: number[] = [];
    const dropBook = () => {
      const bookW = 50 + Math.random() * 18;
      const bookH = 9;
      const x = bookW / 2 + 4 + Math.random() * Math.max(1, width - bookW - 8);
      const book = Matter.Bodies.rectangle(x, -12, bookW, bookH, {
        restitution: 0.05,
        friction: 0.95,
        frictionStatic: 1.2,
        density: 0.004,
        angle: (Math.random() - 0.5) * 0.25,
        chamfer: { radius: 1 },
        render: {
          fillStyle: "#ffffff",
          strokeStyle: "#000000",
          lineWidth: 1.2,
        },
      });
      Matter.Composite.add(engine.world, book);
    };

    for (let i = 0; i < count; i++) {
      timeouts.push(window.setTimeout(dropBook, 250 + i * 280));
    }

    return () => {
      timeouts.forEach((t) => clearTimeout(t));
      Matter.Render.stop(render);
      Matter.Runner.stop(runner);
      Matter.World.clear(engine.world, false);
      Matter.Engine.clear(engine);
      render.canvas.remove();
      render.textures = {};
    };
  }, [count]);

  return <div ref={containerRef} className="relative w-full h-full" />;
}

function QuizPath({
  currentStep,
  totalSteps,
}: {
  currentStep: number;
  totalSteps: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const currentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const c = currentRef.current;
    if (!c) return;
    c.scrollIntoView({ block: "center", behavior: "auto" });
  }, [currentStep]);

  const nodeSpacing = 64;
  const verticalPadding = 16;
  const totalHeight = totalSteps * nodeSpacing + verticalPadding * 2;

  const positionFor = (i: number) => {
    const top = verticalPadding + i * nodeSpacing;
    const isRight = i % 2 === 0;
    const left = isRight ? 56 : 8;
    return { top, left, isRight };
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-y-auto px-2 py-2"
    >
      <div className="relative w-full" style={{ height: totalHeight }}>
        <svg
          className="absolute inset-0 w-full pointer-events-none"
          style={{ height: totalHeight }}
        >
          <defs>
            <marker
              id="arrow-done"
              markerWidth="6"
              markerHeight="6"
              refX="3"
              refY="3"
              orient="auto"
            >
              <path d="M0,0 L6,3 L0,6 z" fill="black" />
            </marker>
            <marker
              id="arrow-todo"
              markerWidth="6"
              markerHeight="6"
              refX="3"
              refY="3"
              orient="auto"
            >
              <path d="M0,0 L6,3 L0,6 z" fill="#9ca3af" />
            </marker>
          </defs>
          {Array.from({ length: totalSteps - 1 }).map((_, i) => {
            const a = positionFor(i);
            const b = positionFor(i + 1);
            const ax = a.isRight ? "82%" : "26%";
            const bx = b.isRight ? "82%" : "26%";
            const ay = a.top + 18;
            const by = b.top + 18;
            const cx = "50%";
            const cy = (ay + by) / 2;
            const done = i + 1 < currentStep;
            return (
              <path
                key={i}
                d={`M${ax},${ay} Q${cx},${cy} ${bx},${by}`}
                stroke={done ? "black" : "#9ca3af"}
                strokeWidth="1.2"
                fill="none"
                strokeDasharray="3,3"
                markerEnd={done ? "url(#arrow-done)" : "url(#arrow-todo)"}
              />
            );
          })}
        </svg>
        {Array.from({ length: totalSteps }).map((_, i) => {
          const { top, left } = positionFor(i);
          const done = i < currentStep - 1;
          const current = i === currentStep - 1;
          return (
            <div
              key={i}
              ref={current ? currentRef : undefined}
              className={[
                "absolute flex items-center justify-center rounded-full border text-xs font-medium transition-colors",
                done
                  ? "bg-black text-white border-black"
                  : current
                    ? "bg-white text-black border-black border-2 shadow-[0_2px_0_0_rgba(0,0,0,1)]"
                    : "bg-white text-gray-400 border-gray-400",
              ].join(" ")}
              style={{ top, left, width: 56, height: 36 }}
            >
              {current ? `${currentStep}/${totalSteps}` : i + 1}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default HomePage;
