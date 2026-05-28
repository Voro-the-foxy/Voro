import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import Matter from "matter-js";
import { Flame, NotebookPen, FileText } from "lucide-react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { BottomNav } from "@/component/BottomNav";
import { loadNotes } from "@/lib/notes";
import { loadSolvedQuizzes } from "@/lib/solvedQuizzes";

function HomePage() {
  const [devouredNotes, setDevouredNotes] = useState(0);
  const [solvedQuizzes, setSolvedQuizzes] = useState(0);

  useEffect(() => {
    void (async () => {
      try {
        const [notes, solved] = await Promise.all([
          loadNotes(),
          loadSolvedQuizzes(),
        ]);
        setDevouredNotes(notes.length);
        setSolvedQuizzes(solved.length);
      } catch {}
    })();
  }, []);

  return (
    <div className="flex flex-col h-full bg-white text-black">
      <StreakBadge days={solvedQuizzes} />
      <FoxIntro message="I`m voro!!" />
      <StatRow devouredNotes={devouredNotes} solvedQuizzes={solvedQuizzes} />
      <div className="flex-1 mt-6 border-t border-black overflow-hidden">
        <BookStack count={devouredNotes} />
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


export default HomePage;
