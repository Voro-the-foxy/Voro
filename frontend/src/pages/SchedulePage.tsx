import { useNavigate, useSearch } from "@tanstack/react-router";
import { Fragment, useEffect, useRef, useState } from "react";
import { markStepDone } from "@/lib/setup";
import {
  deleteClassWithMaterialsDeep,
  loadClasses,
  saveClasses,
} from "@/lib/classes";
import type { ClassItem } from "@/types/schedule";
import type { ClassNotifSettings } from "@/types/notificationSettings";
import {
  scheduleClassNotifications,
  requestNotifPermission,
} from "@/lib/notifications";

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
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingSlotsForId, setEditingSlotsForId] = useState<string | null>(
    null,
  );
  const [confirmTarget, setConfirmTarget] = useState<ClassItem | null>(null);
  const [pendingDeletes, setPendingDeletes] = useState<string[]>([]);
  const notifSettings: ClassNotifSettings = {
    beforeEnabled: true,
    afterEnabled: true,
  };

  useEffect(() => {
    loadClasses()
      .then(setClasses)
      .catch(() => {});
  }, []);

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

  const startEditSlots = (c: ClassItem) => {
    setEditingSlotsForId(c.id);
    setSelection(new Set(c.slots));
    setEditingId(null);
  };

  const cancelEditSlots = () => {
    setEditingSlotsForId(null);
    setSelection(new Set());
  };

  const updateSlots = () => {
    if (!editingSlotsForId) return;
    setClasses((prev) =>
      prev.map((c) =>
        c.id === editingSlotsForId ? { ...c, slots: [...selection] } : c,
      ),
    );
    setEditingSlotsForId(null);
    setSelection(new Set());
  };

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

  const deleteClass = () => {
    if (!confirmTarget) return;
    const id = confirmTarget.id;
    setClasses((prev) => prev.filter((c) => c.id !== id));
    setPendingDeletes((prev) => [...prev, id]);
    if (editingId === id) setEditingId(null);
    setConfirmTarget(null);
  };

  const renameClass = (id: string, name: string) => {
    setClasses(classes.map((c) => (c.id === id ? { ...c, name } : c)));
  };

  const handleSave = async () => {
    try {
      await Promise.all(
        pendingDeletes.map((id) => deleteClassWithMaterialsDeep(id)),
      );
      await saveClasses(classes);
      await markStepDone("schedule");
      await requestNotifPermission();
      await scheduleClassNotifications(classes, notifSettings);
    } catch {
      // non-blocking: navigate regardless
    }
    navigate({
      to:
        from === "setting" || from === "mypage"
          ? "/mypage"
          : from === "upload"
            ? "/notes/upload"
            : "/welcome",
    });
  };

  return (
    <div className="flex flex-col h-full select-none">
      <div
        className={`flex-1 overflow-y-auto transition-opacity ${
          confirmTarget ? "opacity-40 pointer-events-none" : ""
        }`}
      >
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
                const isEditingTarget = cls?.id === editingSlotsForId;
                const bg = isSelected
                  ? "bg-sky-400"
                  : cls
                    ? isEditingTarget
                      ? "bg-sky-200"
                      : CLASS_COLORS[colorIdx]
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
          {editingSlotsForId && (
            <div className="flex items-center gap-2 px-2 py-2 mb-1 bg-sky-50 border border-sky-300 rounded text-xs text-sky-800">
              <span className="flex-1">
                Editing slots for{" "}
                <strong>
                  {classes.find((c) => c.id === editingSlotsForId)?.name}
                </strong>{" "}
                — drag on the grid
              </span>
              <button
                onClick={cancelEditSlots}
                className="px-2 py-1 border border-sky-400 rounded"
              >
                Cancel
              </button>
            </div>
          )}
          {classes.map((c, idx) => {
            const color = CLASS_COLORS[idx % CLASS_COLORS.length];
            const isEditingSlots = editingSlotsForId === c.id;
            return (
              <div
                key={c.id}
                className={`flex items-center gap-1 ${isEditingSlots ? "ring-1 ring-sky-400 rounded" : ""}`}
              >
                <button
                  className="px-2 py-1 border border-gray-300 rounded text-xs"
                  onClick={() => setEditingId(editingId === c.id ? null : c.id)}
                >
                  Rename
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
                      {isEditingSlots
                        ? `${selection.size * 30} min`
                        : `${c.slots.length * 30} min`}
                    </span>
                  </div>
                )}
                <button
                  className={`px-2 py-1 border rounded text-xs ${isEditingSlots ? "border-sky-500 bg-sky-500 text-white" : "border-gray-300 text-gray-600"}`}
                  onClick={() =>
                    isEditingSlots ? updateSlots() : startEditSlots(c)
                  }
                >
                  {isEditingSlots ? "Done" : "Edit"}
                </button>
                <button
                  className="px-2 py-1 border border-gray-300 rounded text-xs text-red-500"
                  onClick={() => setConfirmTarget(c)}
                >
                  Del
                </button>
              </div>
            );
          })}
          {!editingSlotsForId && (
            <button
              className="border border-dashed border-gray-400 rounded py-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={addClass}
              disabled={selection.size === 0}
            >
              + Add Class{selection.size > 0 && ` (${selection.size} slots)`}
            </button>
          )}
        </div>
      </div>

      {confirmTarget ? (
        <div className="shrink-0 border-t-2 border-black bg-white px-5 pt-4 pb-6 flex flex-col gap-3">
          <p className="text-sm font-medium">Delete this class?</p>
          <p className="text-xs leading-relaxed text-gray-600">
            All notes and quiz records linked to {confirmTarget.name} will also
            be deleted.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setConfirmTarget(null)}
              className="h-11 rounded-xl border border-gray-300 text-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={deleteClass}
              className="h-11 rounded-xl border border-red-600 bg-red-600 text-sm text-white"
            >
              Delete
            </button>
          </div>
        </div>
      ) : (
        <div className="p-3 border-t border-gray-300 shrink-0">
          <button
            onClick={handleSave}
            disabled={classes.length === 0}
            className="w-full py-2 rounded-lg border border-black bg-black text-white text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Save
          </button>
        </div>
      )}
    </div>
  );
}

export default SchedulePage;
