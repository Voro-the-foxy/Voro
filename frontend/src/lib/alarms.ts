// MOCK IMPLEMENTATION — backed by localStorage.
// Alarms and the master toggle live in browser storage; nothing actually
// fires a notification. Swap to `api.*` calls per TODO(backend) markers.
import { STORAGE_KEYS, genId, readBool, readJSON, writeBool, writeJSON } from "@/lib/storage";
import type { Alarm } from "@/types/alarm";

export type { Alarm };

// TODO(backend): GET /api/alarms
//                Response: Alarm[] = [{ id, hour(1-12), minute(0-59),
//                period: 'AM'|'PM', days: ('Su'|'Mo'|'Tu'|'We'|'Th'|'Fr'|'Sa')[],
//                enabled: boolean }]
export const loadAlarms = (): Alarm[] =>
  readJSON<Alarm[]>(STORAGE_KEYS.alarms, []);

// TODO(backend): PUT /api/alarms (bulk replace)
//                Body: Alarm[]
//                Response: Alarm[] (server-canonical, may reassign ids).
//                Per-item endpoints alternative:
//                  POST /api/alarms / PUT /api/alarms/:id / DELETE /api/alarms/:id
export const saveAlarms = (alarms: Alarm[]) => {
  writeJSON(STORAGE_KEYS.alarms, alarms);
};

// TODO(backend): GET /api/alarms/master
//                Response: { enabled: boolean }
//                Master kill switch separate from per-alarm enabled flags.
export const loadAlarmsMaster = (): boolean =>
  readBool(STORAGE_KEYS.alarmsMaster, true);

// TODO(backend): PUT /api/alarms/master
//                Body: { enabled: boolean }
//                Response: { enabled: boolean }
export const saveAlarmsMaster = (enabled: boolean) => {
  writeBool(STORAGE_KEYS.alarmsMaster, enabled);
};

export const newAlarmId = () => genId("a");
