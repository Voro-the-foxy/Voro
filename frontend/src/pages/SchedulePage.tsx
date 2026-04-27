import { useNavigate, useSearch } from "@tanstack/react-router";
import { Fragment, useEffect, useRef, useState } from "react";
import { markStepDone } from "@/lib/setup";
import { loadClasses, saveClasses } from "@/lib/classes";
import type { ClassItem } from "@/types/schedule";

import { DAYS } from "@/lib/schedule";
const SLOTS_PER_DAY = 48;

const CLASS_COLORS = [
  "bg-red-300",
  "bg-blue-300",
  "bg-green-300",
  "bg-yellow-300",
  "bg-purple-300",
  "bg-pink-300",
  "bg-indigo-300",
  "bg-teal-300",
];

const slotLabel = (i: number) => {
  const h = Math.floor(i / 2);
  const m = i % 2 === 0 ? "00" : "30";
  return `${String(h).padStart(2, "0")}:${m}`;
};

const cellKey = (day: number, slot: number) => `${day}-${slot}`;

function SchedulePage() {
  const navigate = useNavigate();
  const { from } = useSearch({ from: "/set-up/schedule" });
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [classes, setClasses] = useState<ClassItem[]>(loadClasses);
  const [editingId, setEditingId] = useState<string | null>(null);

  const isDraggingRef = useRef(false);
  const dragModeRef = useRef<"add" | "remove">("add");

  useEffect(() => {
    const up = () => {
      isDraggingRef.current = false;
    };
    window.addEventListener("pointerup", up);
    return () => window.removeEventListener("pointerup", up);
  }, []);

  const applyMode = (key: string, mode: "add" | "remove") => {
    setSelection((prev) => {
      const next = new Set(prev);
      if (mode === "add") next.add(key);
      else next.delete(key);
      return next;
    });
  };

  const handlePointerDown = (e: React.PointerEvent, key: string) => {
    (e.target as Element).releasePointerCapture?.(e.pointerId);
    const mode = selection.has(key) ? "remove" : "add";
    dragModeRef.current = mode;
    isDraggingRef.current = true;
    applyMode(key, mode);
  };

  const handlePointerEnter = (key: string) => {
    if (isDraggingRef.current) applyMode(key, dragModeRef.current);
  };

  const classOfCell = (key: string) =>
    classes.find((c) => c.slots.includes(key));

  const addClass = () => {
    if (selection.size === 0) return;
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : String(Date.now());
    setClasses([
      ...classes,
      { id, name: `Class ${classes.length + 1}`, slots: [...selection] },
    ]);
    setSelection(new Set());
  };

  const deleteClass = (id: string) => {
    setClasses(classes.filter((c) => c.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const renameClass = (id: string, name: string) => {
    setClasses(classes.map((c) => (c.id === id ? { ...c, name } : c)));
  };

  const handleSave = () => {
    saveClasses(classes);
    markStepDone("schedule");
    navigate({ to: from === "setting" ? "/setting" : "/" });
  };

  return (
    <div className="flex flex-col h-full select-none">
      <div className="flex-1 overflow-y-auto">
        <div className="sticky top-0 z-10 bg-white grid grid-cols-[32px_repeat(7,minmax(0,1fr))] text-[10px] border-b border-gray-200">
          <div />
          {DAYS.map((d, i) => (
            <div key={i} className="text-center py-1 font-medium">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-[32px_repeat(7,minmax(0,1fr))] text-[9px]">
          {Array.from({ length: SLOTS_PER_DAY }).map((_, slot) => (
            <Fragment key={slot}>
              <div className="text-right pr-1 h-5 leading-5 text-gray-500">
                {slot % 2 === 0 ? slotLabel(slot) : ""}
              </div>
              {DAYS.map((_, day) => {
                const key = cellKey(day, slot);
                const isSelected = selection.has(key);
                const cls = classOfCell(key);
                const colorIdx = cls
                  ? classes.findIndex((c) => c.id === cls.id) %
                    CLASS_COLORS.length
                  : -1;
                const bg = isSelected
                  ? "bg-sky-400"
                  : cls
                    ? CLASS_COLORS[colorIdx]
                    : "bg-white";
                const borderT =
                  slot % 2 === 0
                    ? "border-t border-gray-300"
                    : "border-t border-gray-100";
                return (
                  <div
                    key={key}
                    className={`h-5 border-l border-gray-200 ${borderT} ${bg} cursor-pointer`}
                    onPointerDown={(e) => handlePointerDown(e, key)}
                    onPointerEnter={() => handlePointerEnter(key)}
                  />
                );
              })}
            </Fragment>
          ))}
        </div>

        <div className="flex flex-col gap-2 p-3 border-t border-gray-200">
          {classes.map((c, idx) => {
            const color = CLASS_COLORS[idx % CLASS_COLORS.length];
            return (
              <div key={c.id} className="flex items-center gap-1">
                <button
                  className="px-2 py-1 border border-gray-300 rounded text-xs"
                  onClick={() =>
                    setEditingId(editingId === c.id ? null : c.id)
                  }
                >
                  수정
                </button>
                {editingId === c.id ? (
                  <input
                    className="flex-1 border border-gray-400 rounded px-2 py-1 text-sm"
                    value={c.name}
                    onChange={(e) => renameClass(c.id, e.target.value)}
                    onBlur={() => setEditingId(null)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") setEditingId(null);
                    }}
                    autoFocus
                  />
                ) : (
                  <div className="flex-1 flex items-center gap-2 border border-gray-300 rounded px-2 py-1 text-sm">
                    <span className={`w-3 h-3 rounded-full ${color}`} />
                    <span className="truncate">{c.name}</span>
                    <span className="ml-auto text-[10px] text-gray-500">
                      {c.slots.length * 30}분
                    </span>
                  </div>
                )}
                <button
                  className="px-2 py-1 border border-gray-300 rounded text-xs text-red-500"
                  onClick={() => deleteClass(c.id)}
                >
                  삭제
                </button>
              </div>
            );
          })}
          <button
            className="border border-dashed border-gray-400 rounded py-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={addClass}
            disabled={selection.size === 0}
          >
            + Add Class{selection.size > 0 && ` (${selection.size}칸)`}
          </button>
        </div>
      </div>

      <div className="p-3 border-t border-gray-300">
        <button
          onClick={handleSave}
          className="w-full py-2 rounded-lg border border-black bg-black text-white text-sm"
        >
          Save
        </button>
      </div>
    </div>
  );
}

export default SchedulePage;
