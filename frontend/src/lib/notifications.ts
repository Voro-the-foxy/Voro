import { LocalNotifications } from "@capacitor/local-notifications";
import type { ClassItem } from "@/types/schedule";
import type { Exam } from "@/types/exam";
import type { Alarm } from "@/types/alarm";
import type { ClassNotifSettings, ExamNotifSettings } from "@/types/notificationSettings";
import { STORAGE_KEYS, readJSON, writeJSON } from "@/lib/storage";

// Capacitor weekday: 1=Sun, 2=Mon, 3=Tue, 4=Wed, 5=Thu, 6=Fri, 7=Sat
// App DAYS index:    0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun
const toWeekday = (appDay: number) => (appDay === 6 ? 1 : appDay + 2);

// DayKey → Capacitor weekday
const DAY_KEY_TO_WEEKDAY: Record<string, number> = {
  Su: 1, Mo: 2, Tu: 3, We: 4, Th: 5, Fr: 6, Sa: 7,
};

function fnv1a(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (Math.imul(h, 0x01000193)) >>> 0;
  }
  return (h & 0x7fffffff) || 1;
}

function addMinutes(hour: number, minute: number, delta: number) {
  const total = hour * 60 + minute + delta;
  return {
    hour: ((Math.floor(total / 60) % 24) + 24) % 24,
    minute: ((total % 60) + 60) % 60,
  };
}

export async function requestNotifPermission(): Promise<boolean> {
  try {
    const { display } = await LocalNotifications.requestPermissions();
    return display === "granted";
  } catch {
    return false;
  }
}

// Android 12+ requires the user to grant SCHEDULE_EXACT_ALARM in special app access.
// Without it, setExact() throws SecurityException and alarms never fire.
export async function ensureExactAlarmPermission(): Promise<void> {
  try {
    const result = await LocalNotifications.checkExactNotificationSetting();
    if ((result as { exact_alarm?: string }).exact_alarm !== "granted") {
      await LocalNotifications.changeExactNotificationSetting();
    }
  } catch {
    // iOS and older Android don't have this API — ignore
  }
}

// Class notification IDs are stored so we can cancel them precisely on reschedule.
const CLASS_NOTIF_IDS_KEY = "voro.classNotifIds.v1";

export async function scheduleClassNotifications(
  classes: ClassItem[],
  settings: ClassNotifSettings
): Promise<void> {
  try {
    // Cancel previously scheduled class notifications.
    const prevIds: number[] = readJSON<number[]>(CLASS_NOTIF_IDS_KEY, []);
    if (prevIds.length > 0) {
      await LocalNotifications.cancel({
        notifications: prevIds.map((id) => ({ id })),
      });
    }

    if (!settings.beforeEnabled && !settings.afterEnabled) {
      writeJSON(CLASS_NOTIF_IDS_KEY, []);
      return;
    }

    const notifications: Parameters<
      typeof LocalNotifications.schedule
    >[0]["notifications"] = [];

    for (const cls of classes) {
      // Find earliest slot per day (class start time on that day).
      const startByDay = new Map<number, number>();
      for (const key of cls.slots) {
        const [d, sl] = key.split("-").map(Number);
        const cur = startByDay.get(d);
        if (cur === undefined || sl < cur) startByDay.set(d, sl);
      }

      for (const [appDay, startSlot] of startByDay) {
        const startHour = Math.floor(startSlot / 2);
        const startMinute = (startSlot % 2) * 30;
        const weekday = toWeekday(appDay);

        if (settings.beforeEnabled) {
          const { hour, minute } = addMinutes(startHour, startMinute, -10);
          const id = fnv1a(`${cls.id}-${appDay}-before`);
          notifications.push({
            id,
            title: `${cls.name} starts in 10 minutes`,
            body: "Class is about to start. Get ready!",
            schedule: { on: { weekday, hour, minute }, repeats: true },
            extra: { classId: cls.id, kind: "class-before" },
          });
        }

        if (settings.afterEnabled) {
          const { hour, minute } = addMinutes(startHour, startMinute, 10);
          const id = fnv1a(`${cls.id}-${appDay}-after`);
          notifications.push({
            id,
            title: `${cls.name} — upload your notes`,
            body: "Class just started. Want to upload your notes?",
            schedule: { on: { weekday, hour, minute }, repeats: true },
            extra: { classId: cls.id, kind: "class-after" },
          });
        }
      }
    }

    if (notifications.length > 0) {
      await LocalNotifications.schedule({ notifications });
    }
    writeJSON(CLASS_NOTIF_IDS_KEY, notifications.map((n) => n.id));
  } catch (err) {
    console.warn("scheduleClassNotifications failed:", err);
  }
}

const EXAM_NOTIF_IDS_KEY = "voro.examNotifIds.v1";

export async function scheduleExamNotifications(
  exams: Exam[],
  settings: ExamNotifSettings
): Promise<void> {
  try {
    const prevIds: number[] = readJSON<number[]>(EXAM_NOTIF_IDS_KEY, []);
    if (prevIds.length > 0) {
      await LocalNotifications.cancel({
        notifications: prevIds.map((id) => ({ id })),
      });
    }

    const notifications: Parameters<
      typeof LocalNotifications.schedule
    >[0]["notifications"] = [];
    const now = new Date();

    for (const exam of exams) {
      if (!exam.enabled) continue;

      const hour24 =
        exam.period === "AM"
          ? exam.hour === 12
            ? 0
            : exam.hour
          : exam.hour === 12
            ? 12
            : exam.hour + 12;

      const examDate = new Date(exam.year, exam.month, exam.day, hour24, exam.minute);

      // Day-before reminders (at 9 AM).
      for (const daysBefore of settings.reminderDays) {
        const notifDate = new Date(examDate);
        notifDate.setDate(notifDate.getDate() - daysBefore);
        notifDate.setHours(9, 0, 0, 0);
        if (notifDate <= now) continue;

        const label =
          daysBefore === 1 ? "tomorrow" : daysBefore === 7 ? "in 1 week" : `in ${daysBefore} days`;
        const id = fnv1a(`${exam.id}-${daysBefore}`);
        notifications.push({
          id,
          title: `${exam.className} exam reminder`,
          body: `You have an exam ${label}. Are you ready?`,
          schedule: { at: notifDate },
          extra: { examId: exam.id, kind: "exam-remind" },
        });
      }

      // Morning-of reminder at 8 AM.
      const morningOf = new Date(exam.year, exam.month, exam.day, 8, 0, 0, 0);
      if (morningOf > now) {
        const id = fnv1a(`${exam.id}-0`);
        notifications.push({
          id,
          title: `${exam.className} exam is today!`,
          body: "Today's the day. You've got this! 🦊",
          schedule: { at: morningOf },
          extra: { examId: exam.id, kind: "exam-day" },
        });
      }
    }

    if (notifications.length > 0) {
      await LocalNotifications.schedule({ notifications });
    }
    writeJSON(EXAM_NOTIF_IDS_KEY, notifications.map((n) => n.id));
  } catch (err) {
    console.warn("scheduleExamNotifications failed:", err);
  }
}

export const DEFAULT_CLASS_NOTIF: ClassNotifSettings = {
  beforeEnabled: true,
  afterEnabled: true,
};

export const DEFAULT_EXAM_NOTIF: ExamNotifSettings = {
  reminderDays: [1, 3, 7],
};

export const loadClassNotifSettings = (): ClassNotifSettings =>
  readJSON<ClassNotifSettings>(STORAGE_KEYS.classNotif, DEFAULT_CLASS_NOTIF);

export const saveClassNotifSettings = (s: ClassNotifSettings) =>
  writeJSON(STORAGE_KEYS.classNotif, s);

export const loadExamNotifSettings = (): ExamNotifSettings =>
  readJSON<ExamNotifSettings>(STORAGE_KEYS.examNotif, DEFAULT_EXAM_NOTIF);

export const saveExamNotifSettings = (s: ExamNotifSettings) =>
  writeJSON(STORAGE_KEYS.examNotif, s);

const ALARM_NOTIF_IDS_KEY = "voro.alarmNotifIds.v1";

const ALARM_MESSAGES = [
  { title: "Time to study! 🦊", body: "How about a quick quiz right now?" },
  { title: "Quick review time! 🦊", body: "A short quiz keeps the knowledge fresh." },
  { title: "Voro is waiting 🦊", body: "Small reviews make a big difference!" },
  { title: "Perfect time to review! 🦊", body: "Recall it before you forget it." },
  { title: "Keep up the pace! 🦊", body: "Even one question gets you closer to your goal." },
];

export async function scheduleAlarmNotifications(
  alarms: Alarm[],
  masterEnabled: boolean
): Promise<void> {
  try {
    const prevIds: number[] = readJSON<number[]>(ALARM_NOTIF_IDS_KEY, []);
    if (prevIds.length > 0) {
      await LocalNotifications.cancel({
        notifications: prevIds.map((id) => ({ id })),
      });
    }

    if (!masterEnabled) {
      writeJSON(ALARM_NOTIF_IDS_KEY, []);
      return;
    }

    const notifications: Parameters<
      typeof LocalNotifications.schedule
    >[0]["notifications"] = [];

    for (const alarm of alarms) {
      if (!alarm.enabled) continue;

      const hour24 =
        alarm.period === "AM"
          ? alarm.hour === 12 ? 0 : alarm.hour
          : alarm.hour === 12 ? 12 : alarm.hour + 12;

      for (const day of alarm.days) {
        const weekday = DAY_KEY_TO_WEEKDAY[day];
        if (!weekday) continue;
        const id = fnv1a(`alarm-${alarm.id}-${day}`);
        const msg = ALARM_MESSAGES[Math.floor(Math.random() * ALARM_MESSAGES.length)];
        notifications.push({
          id,
          title: msg.title,
          body: msg.body,
          largeIcon: "voro_logo",
          schedule: { on: { weekday, hour: hour24, minute: alarm.minute }, repeats: true, allowWhileIdle: true },
          extra: { alarmId: alarm.id, kind: "alarm" },
        });
      }
    }

    if (notifications.length > 0) {
      await LocalNotifications.schedule({ notifications });
    }
    writeJSON(ALARM_NOTIF_IDS_KEY, notifications.map((n) => n.id));
  } catch (err) {
    console.warn("scheduleAlarmNotifications failed:", err);
  }
}
