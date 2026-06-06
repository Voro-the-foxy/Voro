import { useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState, type ButtonHTMLAttributes } from "react";
import { markStepDone } from "@/lib/setup";
import {
  loadAlarms,
  loadAlarmsMaster,
  newAlarmId,
  saveAlarms,
  saveAlarmsMaster,
} from "@/lib/alarms";
import {
  requestNotifPermission,
  ensureExactAlarmPermission,
  scheduleAlarmNotifications,
} from "@/lib/notifications";
import type { Alarm, DayKey, Period } from "@/types/alarm";

const DAYS: DayKey[] = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const PERIODS: Period[] = ["AM", "PM"];
const HOURS: number[] = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES: number[] = Array.from({ length: 60 }, (_, i) => i);

const DEFAULT_ALARM: Omit<Alarm, "id"> = {
  hour: 6,
  minute: 0,
  period: "AM",
  days: [],
  enabled: true,
};

const pad = (n: number) => n.toString().padStart(2, "0");

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: "sm" | "md";
};

function IconButton({
  size = "md",
  className = "",
  ...props
}: IconButtonProps) {
  const sizeCls = size === "sm" ? "w-6 h-6 text-xs" : "w-8 h-8 text-lg";
  return (
    <button
      type="button"
      {...props}
      className={`${sizeCls} flex items-center justify-center rounded-full border border-black hover:bg-black hover:text-white transition-colors ${className}`}
    />
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      className={`flex items-center w-10 h-5 p-[2px] rounded-full border border-black transition-colors ${
        checked ? "bg-black justify-end" : "bg-paper justify-start"
      }`}
    >
      <span
        className={`w-3.5 h-3.5 rounded-full ${checked ? "bg-paper" : "bg-black"}`}
      />
    </button>
  );
}

function Wheel<T extends string | number>({
  items,
  value,
  onChange,
  format = (v) => String(v),
}: {
  items: T[];
  value: T;
  onChange: (v: T) => void;
  format?: (v: T) => string;
}) {
  const idx = items.indexOf(value);
  const len = items.length;
  const prev = items[(idx - 1 + len) % len];
  const next = items[(idx + 1) % len];

  return (
    <div className="flex flex-col items-center w-12 select-none">
      <button
        type="button"
        onClick={() => onChange(prev)}
        className="text-sm text-gray-400 hover:text-black h-6"
      >
        {format(prev)}
      </button>
      <div className="text-xl font-bold w-full text-center py-1 border-y border-black">
        {format(value)}
      </div>
      <button
        type="button"
        onClick={() => onChange(next)}
        className="text-sm text-gray-400 hover:text-black h-6"
      >
        {format(next)}
      </button>
    </div>
  );
}

function DayChip({
  day,
  active,
  onClick,
}: {
  day: DayKey;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`w-8 h-8 rounded-full border border-black text-xs font-medium transition-colors ${
        active ? "bg-black text-white" : "bg-paper text-black"
      }`}
    >
      {day[0]}
    </button>
  );
}

function AlarmRow({
  alarm,
  onDelete,
  onToggle,
  onClick,
}: {
  alarm: Alarm;
  onDelete: () => void;
  onToggle: () => void;
  onClick: () => void;
}) {
  return (
    <div className="mx-3 mt-3 flex items-center gap-2 px-3 py-3 border-2 border-black rounded-sm sketch shadow-[3px_3px_0_0_rgba(0,0,0,1)] bg-paper">
      <IconButton size="sm" onClick={onDelete} aria-label="Delete alarm">
        ✕
      </IconButton>
      <button
        type="button"
        onClick={onClick}
        className="flex-1 flex flex-col items-start text-left"
      >
        <div className="flex items-baseline gap-1">
          <span className="text-xs text-gray-600">{alarm.period}</span>
          <span className="text-2xl tracking-tight">
            {pad(alarm.hour)}:{pad(alarm.minute)}
          </span>
        </div>
        <div className="flex gap-1 text-[10px] tracking-wider mt-0.5">
          {DAYS.map((d) => (
            <span
              key={d}
              className={alarm.days.includes(d) ? "text-black" : "text-gray-400"}
            >
              {d[0]}
            </span>
          ))}
        </div>
      </button>
      <Toggle checked={alarm.enabled} onChange={onToggle} />
    </div>
  );
}

export default function AlarmPage() {
  const [masterEnabled, setMasterEnabled] = useState<boolean>(true);
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editing, setEditing] = useState<Alarm | null>(null);
  const navigate = useNavigate();
  const { from } = useSearch({ from: "/set-up/alarm" });

  const [period, setPeriod] = useState<Period>(DEFAULT_ALARM.period);
  const [hour, setHour] = useState<number>(DEFAULT_ALARM.hour);
  const [minute, setMinute] = useState<number>(DEFAULT_ALARM.minute);
  const [days, setDays] = useState<DayKey[]>(DEFAULT_ALARM.days);

  useEffect(() => {
    loadAlarms()
      .then(setAlarms)
      .catch(() => {});
    loadAlarmsMaster()
      .then(setMasterEnabled)
      .catch(() => {});
  }, []);

  const openNew = () => {
    setEditing(null);
    setPeriod(DEFAULT_ALARM.period);
    setHour(DEFAULT_ALARM.hour);
    setMinute(DEFAULT_ALARM.minute);
    setDays(DEFAULT_ALARM.days);
    setPickerOpen(true);
  };

  const openEdit = (a: Alarm) => {
    setEditing(a);
    setPeriod(a.period);
    setHour(a.hour);
    setMinute(a.minute);
    setDays(a.days);
    setPickerOpen(true);
  };

  const close = () => {
    setPickerOpen(false);
    setEditing(null);
  };

  const savePicker = () => {
    const a: Alarm = {
      ...DEFAULT_ALARM,
      ...editing,
      id: editing?.id ?? newAlarmId(),
      period,
      hour,
      minute,
      days,
    };
    setAlarms((prev) => {
      const i = prev.findIndex((x) => x.id === a.id);
      if (i >= 0) {
        const copy = [...prev];
        copy[i] = a;
        return copy;
      }
      return [...prev, a];
    });
    setPickerOpen(false);
    setEditing(null);
  };

  const toggleDay = (d: DayKey) =>
    setDays((p) => (p.includes(d) ? p.filter((x) => x !== d) : [...p, d]));

  const remove = (id: string) =>
    setAlarms((prev) => prev.filter((a) => a.id !== id));

  const toggleAlarm = (id: string) =>
    setAlarms((prev) =>
      prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a)),
    );

  const handleSave = async () => {
    try {
      await Promise.all([saveAlarms(alarms), saveAlarmsMaster(masterEnabled)]);
      await markStepDone("alarm");
      await requestNotifPermission();
      await ensureExactAlarmPermission();
      await scheduleAlarmNotifications(alarms, masterEnabled);
    } catch {
      // non-blocking: navigate regardless
    }
    navigate({ to: from === "setting" || from === "mypage" ? "/mypage" : "/welcome" });
  };

  return (
    <div className="relative flex flex-col h-full bg-paper text-black">
      <div className="flex items-center justify-between px-4 py-3 border-b border-black shrink-0">
        <h1 className="text-lg font-bold">Alarm Setting</h1>
        <IconButton onClick={openNew} aria-label="Add alarm">
          ＋
        </IconButton>
      </div>

      <div className="flex items-center gap-3 px-4 py-2 border-2 border-black rounded-sm mx-3 mt-3 mb-2 shrink-0 sketch shadow-[2px_2px_0_0_rgba(0,0,0,1)] bg-paper">
        <Toggle
          checked={masterEnabled}
          onChange={() => setMasterEnabled((v) => !v)}
        />
        <span className="text-sm">Enable alarm notifications</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {alarms.length === 0 ? (
          <p className="p-6 text-center text-sm text-gray-500">
            No alarms yet.
          </p>
        ) : (
          alarms.map((a) => (
            <AlarmRow
              key={a.id}
              alarm={a}
              onDelete={() => remove(a.id)}
              onToggle={() => toggleAlarm(a.id)}
              onClick={() => openEdit(a)}
            />
          ))
        )}
      </div>

      <div className="p-3 border-t-2 border-black shrink-0">
        <button
          onClick={handleSave}
          className="w-full py-2 rounded-sm border-2 border-black bg-black text-white text-sm sketch shadow-[3px_3px_0_0_rgba(0,0,0,0.3)]"
        >
          Save
        </button>
      </div>

      {pickerOpen && (
        <div
          className="absolute inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4"
          onClick={close}
        >
          <div
            className="w-full max-w-sm bg-paper border-2 border-black rounded-sm flex flex-col p-5 gap-6 sketch shadow-[4px_4px_0_0_rgba(0,0,0,1)] max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center font-bold text-base border-b-2 border-black pb-2">
              {editing ? "Edit Alarm" : "New Alarm"}
            </div>

            <div className="flex items-center justify-center gap-2 py-2">
              <Wheel items={PERIODS} value={period} onChange={setPeriod} />
              <Wheel
                items={HOURS}
                value={hour}
                onChange={setHour}
                format={pad}
              />
              <span className="text-xl font-bold self-center">:</span>
              <Wheel
                items={MINUTES}
                value={minute}
                onChange={setMinute}
                format={pad}
              />
            </div>

            <div className="flex justify-between px-1">
              {DAYS.map((d) => (
                <DayChip
                  key={d}
                  day={d}
                  active={days.includes(d)}
                  onClick={() => toggleDay(d)}
                />
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={close}
                className="flex-1 py-2.5 border-2 border-black rounded-sm text-sm bg-paper text-black hover:bg-paper-dark sketch shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={savePicker}
                className="flex-1 py-2.5 border-2 border-black rounded-sm text-sm bg-black text-white hover:bg-gray-900 sketch shadow-[2px_2px_0_0_rgba(0,0,0,0.3)]"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
