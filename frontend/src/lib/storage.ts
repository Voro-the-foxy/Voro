export const STORAGE_KEYS = {
  setup: "voro.setup.done.v1",
  classes: "voro.classes.v1",
  notes: "voro.notes.v1",
  solvedQuizzes: "voro.solvedQuizzes.v1",
  attempts: "voro.attempts.v1",
  alarms: "voro.alarms.v1",
  alarmsMaster: "voro.alarms.master.v1",
  exams: "voro.exams.v1",
  examsMaster: "voro.exams.master.v1",
} as const;

export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJSON(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function readBool(key: string, fallback: boolean): boolean {
  const raw = localStorage.getItem(key);
  return raw === null ? fallback : raw === "true";
}

export function writeBool(key: string, value: boolean): void {
  localStorage.setItem(key, String(value));
}

export function genId(prefix = "id"): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1e4)}`;
}
