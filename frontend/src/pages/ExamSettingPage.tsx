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

const PERIODS: Period[] = ['AM', 'PM'];
const HOURS: number[] = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES: number[] = Array.from({ length: 60 }, (_, i) => i);
const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const SAMPLE_CLASSES = [
  '인간-컴퓨터 상호작용',
  '자료구조',
  '운영체제',
  '알고리즘',
  '컴퓨터 네트워크',
];

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
        checked ? 'bg-black justify-end' : 'bg-white justify-start'
      }`}
    >
      <span className={`w-3.5 h-3.5 rounded-full ${checked ? 'bg-white' : 'bg-black'}`} />
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

function ClassSelectModal({
  classes,
  onCancel,
  onSelect,
}: {
  classes: string[];
  onCancel: () => void;
  onSelect: (name: string) => void;
}) {
  return (
    <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-20 p-4">
      <div className="w-full bg-white border-2 border-black rounded-2xl p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-black pb-2">
          <span className="font-medium">Select class..</span>
          <button type="button" onClick={onCancel} aria-label="Close" className="text-sm">
            ✕
          </button>
        </div>
        <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
          {classes.length === 0 ? (
            <p className="text-center text-sm text-gray-500 py-4">등록된 수업이 없어요.</p>
          ) : (
            classes.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => onSelect(c)}
                className="border border-black rounded-full py-2 text-sm hover:bg-black hover:text-white transition-colors"
              >
                {c}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function DateTimePickerModal({
  initial,
  onCancel,
  onSave,
}: {
  initial: Exam | null;
  onCancel: () => void;
  onSave: (e: Omit<Exam, 'id' | 'className' | 'enabled'>) => void;
}) {
  const now = new Date();
  const [period, setPeriod] = useState<Period>(initial?.period ?? 'AM');
  const [hour, setHour] = useState<number>(initial?.hour ?? 6);
  const [minute, setMinute] = useState<number>(initial?.minute ?? 0);
  const [year, setYear] = useState<number>(initial?.year ?? now.getFullYear());
  const [month, setMonth] = useState<number>(initial?.month ?? now.getMonth());
  const [day, setDay] = useState<number>(initial?.day ?? now.getDate());

  const handleNavMonth = (delta: number) => {
    let m = month + delta;
    let y = year;
    if (m < 0) {
      m = 11;
      y -= 1;
    }
    if (m > 11) {
      m = 0;
      y += 1;
    }
    const max = daysInMonth(y, m);
    if (day > max) setDay(max);
    setMonth(m);
    setYear(y);
  };

  const handleSave = () => onSave({ period, hour, minute, year, month, day });

  return (
    <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-20 p-4">
      <div className="w-full bg-white border-2 border-black rounded-2xl p-4 flex flex-col gap-3">
        <div className="flex items-center justify-center gap-2">
          <Wheel items={PERIODS} value={period} onChange={setPeriod} />
          <Wheel items={HOURS} value={hour} onChange={setHour} format={pad} />
          <span className="text-xl font-bold self-center">:</span>
          <Wheel items={MINUTES} value={minute} onChange={setMinute} format={pad} />
        </div>

        <div className="border border-black rounded-xl p-2">
          <Calendar
            year={year}
            month={month}
            selectedDay={day}
            onSelectDay={setDay}
            onNavMonth={handleNavMonth}
          />
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2 border border-black rounded-lg text-sm bg-white text-black"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-2 border border-black rounded-lg text-sm bg-black text-white"
          >
            Save
          </button>
        </div>
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
    <div className="flex items-center gap-2 px-3 py-2 border border-black rounded-xl mx-3 mb-2">
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
  const [masterEnabled, setMasterEnabled] = useState<boolean>(loadExamsMaster);
  const [exams, setExams] = useState<Exam[]>(loadExams);
  const [classSelectOpen, setClassSelectOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editing, setEditing] = useState<Exam | null>(null);
  const [pendingClass, setPendingClass] = useState<string | null>(null);

  const handleSave = () => {
    markStepDone('exam');
    navigate({ to: from === 'setting' ? '/setting' : '/' });
  };

  useEffect(() => {
    saveExams(exams);
  }, [exams]);

  useEffect(() => {
    saveExamsMaster(masterEnabled);
  }, [masterEnabled]);

  const openNew = () => {
    setEditing(null);
    setPendingClass(null);
    setClassSelectOpen(true);
  };

  const selectClass = (name: string) => {
    setPendingClass(name);
    setClassSelectOpen(false);
    setPickerOpen(true);
  };

  const openEdit = (e: Exam) => {
    setEditing(e);
    setPendingClass(e.className);
    setPickerOpen(true);
  };

  const closePicker = () => {
    setPickerOpen(false);
    setEditing(null);
    setPendingClass(null);
  };

  const savePicker = (values: Omit<Exam, 'id' | 'className' | 'enabled'>) => {
    if (!pendingClass) return;
    setExams((prev) => {
      if (editing) {
        return prev.map((x) =>
          x.id === editing.id ? { ...x, ...values, className: pendingClass } : x
        );
      }
      return [
        ...prev,
        { id: newExamId(), className: pendingClass, enabled: true, ...values },
      ];
    });
    closePicker();
  };

  const remove = (id: string) =>
    setExams((prev) => prev.filter((e) => e.id !== id));

  const toggleExam = (id: string) =>
    setExams((prev) =>
      prev.map((e) => (e.id === id ? { ...e, enabled: !e.enabled } : e))
    );

  return (
    <div className="flex flex-col h-full bg-white text-black">
      <div className="flex items-center justify-between px-4 py-3 border-b border-black">
        <h1 className="text-lg font-bold">Exam</h1>
        <IconButton onClick={openNew} aria-label="Add exam">
          ＋
        </IconButton>
      </div>

      <div className="flex items-center gap-3 px-4 py-2 border border-black rounded-xl mx-3 mt-3 mb-2">
        <Toggle checked={masterEnabled} onChange={() => setMasterEnabled((v) => !v)} />
        <span className="text-sm">Alarm setting</span>
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

      <div className="p-3 border-t border-gray-300">
        <button
          onClick={handleSave}
          className="w-full py-2 rounded-lg border border-black bg-black text-white text-sm"
        >
          Save
        </button>
      </div>

      {classSelectOpen && (
        <ClassSelectModal
          classes={SAMPLE_CLASSES}
          onCancel={() => setClassSelectOpen(false)}
          onSelect={selectClass}
        />
      )}
      {pickerOpen && (
        <DateTimePickerModal
          initial={editing}
          onCancel={closePicker}
          onSave={savePicker}
        />
      )}
    </div>
  );
}
