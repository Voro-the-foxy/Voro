import { api } from "@/lib/api";
import type { Alarm } from "@/types/alarm";

export type { Alarm };

export const loadAlarms = (): Promise<Alarm[]> =>
  api.get<Alarm[]>("/api/alarms");

export const saveAlarms = (alarms: Alarm[]): Promise<Alarm[]> =>
  api.put<Alarm[]>("/api/alarms", alarms);

export const loadAlarmsMaster = (): Promise<boolean> =>
  api.get<{ enabled: boolean }>("/api/alarms/master").then((r) => r.enabled);

export const saveAlarmsMaster = (enabled: boolean): Promise<void> =>
  api.put<void>("/api/alarms/master", { enabled });

export const newAlarmId = (): string => crypto.randomUUID();
