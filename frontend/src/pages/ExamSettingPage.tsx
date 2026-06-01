import { useNavigate, useSearch } from '@tanstack/react-router';
import { useEffect, useState, type ButtonHTMLAttributes } from 'react';
import { markStepDone } from '@/lib/setup';
import {
  loadExams,
  loadExamsMaster,
  newExamId,
  saveExams,
  saveExamsMaster,
} from '@/lib/exams';
import type { Exam, Period } from '@/types/exam';
import { loadClasses } from '@/lib/classes';

const PERIODS: Period[] = ['AM', 'PM'];
const HOURS: number[] = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES: number[] = Array.from({ length: 60 }, (_, i) => i);
const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const pad = (n: number) => n.toString().padStart(2, '0');

const formatExamDate = (e: Exam) =>
  `${e.year}/${pad(e.month + 1)}/${pad(e.day)} ${e.period} ${pad(e.hour)}:${pad(e.minute)}`;

const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
const firstDayOffset = (y: number, m: number) => new Date(y, m, 1).getDay();

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: 'sm' | 'md';
};

function IconButton({ size = 'md', className = '', ...props }: IconButtonProps) {
  const sizeCls = size === 'sm' ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-lg';
  return (
    <button
      type="button"
      {...props}
      className={`${sizeCls} flex items-center justify-center rounded-full border border-black hover:bg-black hover:text-white transition-colors ${className}`}
    />
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
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
        checked ? 'bg-black justify-end' : 'bg-paper justify-start'
      }`}
    >
      <span className={`w-3.5 h-3.5 rounded-full ${checked ? 'bg-paper' : 'bg-black'}`} />
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

function Calendar({
  year,
  month,
  selectedDay,
  onSelectDay,
  onNavMonth,
}: {
  year: number;
  month: number;
  selectedDay: number;
  onSelectDay: (d: number) => void;
  onNavMonth: (delta: number) => void;
}) {
  const total = daysInMonth(year, month);
  const offset = firstDayOffset(year, month);
  const cells: (number | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= total; d++) cells.push(d);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between px-1">
        <span className="text-sm font-medium">{MONTH_NAMES[month]} {year}</span>
        <div className="flex gap-3 text-sm">
          <button type="button" onClick={() => onNavMonth(-1)} className="hover:text-gray-400">
            &lt;
          </button>
          <button type="button" onClick={() => onNavMonth(1)} className="hover:text-gray-400">
            &gt;
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-[10px] text-center">
        {WEEKDAYS.map((w) => (
          <div key={w} className="text-gray-500">{w}</div>
        ))}
        {cells.map((d, i) => (
          <button
            key={i}
            type="button"
            disabled={d === null}
            onClick={() => d !== null && onSelectDay(d)}
            className={`h-6 rounded-full text-xs transition-colors ${
              d === selectedDay
                ? 'bg-black text-white'
                : d
                ? 'hover:bg-gray-100'
                : ''
            }`}
          >
            {d ?? ''}
          </button>
        ))}
      </div>
    </div>
  );
}

function ExamRow({
  exam,
  onDelete,
  onToggle,
  onClick,
}: {
  exam: Exam;
  onDelete: () => void;
  onToggle: () => void;
  onClick: () => void;
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 border-2 border-black rounded-sm mx-3 mb-2 sketch shadow-[2px_2px_0_0_rgba(0,0,0,1)] bg-paper">
      <IconButton size="sm" onClick={onDelete} aria-label="Delete exam">
        ✕
      </IconButton>
      <button
        type="button"
        onClick={onClick}
        className="flex-1 flex flex-col items-start text-left min-w-0"
      >
        <span className="text-sm font-medium truncate w-full">{exam.className}</span>
        <span className="text-xs text-gray-600">{formatExamDate(exam)}</span>
      </button>
      <Toggle checked={exam.enabled} onChange={onToggle} />
    </div>
  );
}

export default function ExamSettingPage() {
  const navigate = useNavigate();
  const { from } = useSearch({ from: '/set-up/exam-day' });
  const [masterEnabled, setMasterEnabled] = useState<boolean>(true);
  const [exams, setExams] = useState<Exam[]>([]);
  const [classSelectOpen, setClassSelectOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editing, setEditing] = useState<Exam | null>(null);
  const [pendingClass, setPendingClass] = useState<string | null>(null);
  const [classNames, setClassNames] = useState<string[]>([]);

  const now = new Date();
  const [period, setPeriod] = useState<Period>('AM');
  const [hour, setHour] = useState<number>(6);
  const [minute, setMinute] = useState<number>(0);
  const [year, setYear] = useState<number>(now.getFullYear());
  const [month, setMonth] = useState<number>(now.getMonth());
  const [day, setDay] = useState<number>(now.getDate());

  useEffect(() => {
    loadExams().then(setExams).catch(() => {});
    loadExamsMaster().then(setMasterEnabled).catch(() => {});
    loadClasses().then((cs) => setClassNames(cs.map((c) => c.name))).catch(() => {});
  }, []);

  const handleSave = async () => {
    try {
      await Promise.all([saveExams(exams), saveExamsMaster(masterEnabled)]);
      await markStepDone('exam');
    } catch {
      // non-blocking: navigate regardless
    }
    navigate({ to: from === 'setting' || from === 'mypage' ? '/mypage' : '/welcome' });
  };

  const openNew = () => {
    setEditing(null);
    setPendingClass(null);
    setClassSelectOpen(true);
  };

  const selectClass = (name: string) => {
    setPendingClass(name);
    setClassSelectOpen(false);
    setPeriod('AM');
    setHour(6);
    setMinute(0);
    setYear(now.getFullYear());
    setMonth(now.getMonth());
    setDay(now.getDate());
    setPickerOpen(true);
  };

  const openEdit = (e: Exam) => {
    setEditing(e);
    setPendingClass(e.className);
    setPeriod(e.period);
    setHour(e.hour);
    setMinute(e.minute);
    setYear(e.year);
    setMonth(e.month);
    setDay(e.day);
    setPickerOpen(true);
  };

  const closePicker = () => {
    setPickerOpen(false);
    setEditing(null);
    setPendingClass(null);
  };

  const handleNavMonth = (delta: number) => {
    let m = month + delta;
    let y = year;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    const max = daysInMonth(y, m);
    if (day > max) setDay(max);
    setMonth(m);
    setYear(y);
  };

  const savePicker = () => {
    if (!pendingClass) return;
    const values = { period, hour, minute, year, month, day };
    setExams((prev) => {
      if (editing) {
        return prev.map((x) =>
          x.id === editing.id ? { ...x, ...values, className: pendingClass } : x
        );
      }
      return [...prev, { id: newExamId(), className: pendingClass, enabled: true, ...values }];
    });
    closePicker();
  };

  const remove = (id: string) =>
    setExams((prev) => prev.filter((e) => e.id !== id));

  const toggleExam = (id: string) =>
    setExams((prev) =>
      prev.map((e) => (e.id === id ? { ...e, enabled: !e.enabled } : e))
    );

  const isModal = classSelectOpen || pickerOpen;

  return (
    <div className="flex flex-col h-full bg-paper text-black">
      <div className="flex items-center justify-between px-4 py-3 border-b border-black shrink-0">
        <h1 className="text-lg font-bold">
          {classSelectOpen ? 'Select Class' : pickerOpen ? 'Set Date & Time' : 'Exam'}
        </h1>
        {!isModal && (
          <IconButton onClick={openNew} aria-label="Add exam">
            ＋
          </IconButton>
        )}
      </div>

      {classSelectOpen ? (
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto flex flex-col gap-2 p-4">
            {classNames.length === 0 ? (
              <p className="text-center text-sm text-gray-500 py-8">No classes registered.</p>
            ) : (
              classNames.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => selectClass(c)}
                  className="border-2 border-black rounded-sm py-3 text-sm hover:bg-paper-dark sketch shadow-[2px_2px_0_0_rgba(0,0,0,1)] bg-paper"
                >
                  {c}
                </button>
              ))
            )}
          </div>
          <div className="p-4 border-t border-black shrink-0">
            <button
              type="button"
              onClick={() => setClassSelectOpen(false)}
              className="w-full py-3 border-2 border-black rounded-sm text-sm bg-paper hover:bg-paper-dark sketch shadow-[3px_3px_0_0_rgba(0,0,0,1)]"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : pickerOpen ? (
        <div className="flex flex-col flex-1 overflow-y-auto px-4 py-4 gap-4">
          {pendingClass && (
            <p className="text-sm font-medium text-center text-gray-700">{pendingClass}</p>
          )}
          <div className="flex items-center justify-center gap-2">
            <Wheel items={PERIODS} value={period} onChange={setPeriod} />
            <Wheel items={HOURS} value={hour} onChange={setHour} format={pad} />
            <span className="text-xl font-bold self-center">:</span>
            <Wheel items={MINUTES} value={minute} onChange={setMinute} format={pad} />
          </div>

          <div className="border-2 border-black rounded-sm p-3 sketch shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
            <Calendar
              year={year}
              month={month}
              selectedDay={day}
              onSelectDay={setDay}
              onNavMonth={handleNavMonth}
            />
          </div>

          <div className="flex gap-2 mt-auto pt-2">
            <button
              type="button"
              onClick={closePicker}
              className="flex-1 py-3 border-2 border-black rounded-sm text-sm bg-paper text-black hover:bg-paper-dark sketch shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={savePicker}
              className="flex-1 py-3 border-2 border-black rounded-sm text-sm bg-black text-white sketch shadow-[2px_2px_0_0_rgba(0,0,0,0.3)]"
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 px-4 py-2 border-2 border-black rounded-sm mx-3 mt-3 mb-2 shrink-0 sketch shadow-[2px_2px_0_0_rgba(0,0,0,1)] bg-paper">
            <Toggle checked={masterEnabled} onChange={() => setMasterEnabled((v) => !v)} />
            <span className="text-sm">Enable exam notifications</span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {exams.length === 0 ? (
              <p className="p-6 text-center text-sm text-gray-500">No exams yet.</p>
            ) : (
              exams.map((e) => (
                <ExamRow
                  key={e.id}
                  exam={e}
                  onDelete={() => remove(e.id)}
                  onToggle={() => toggleExam(e.id)}
                  onClick={() => openEdit(e)}
                />
              ))
            )}
          </div>

          <div className="p-3 border-t border-black shrink-0">
            <button
              onClick={handleSave}
              className="w-full py-2 rounded-sm border-2 border-black bg-black text-white text-sm sketch shadow-[3px_3px_0_0_rgba(0,0,0,0.3)]"
            >
              Save
            </button>
          </div>
        </>
      )}
    </div>
  );
}
