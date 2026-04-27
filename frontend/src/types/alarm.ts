export type Period = "AM" | "PM";
export type DayKey = "Su" | "Mo" | "Tu" | "We" | "Th" | "Fr" | "Sa";

export interface Alarm {
  id: string;
  hour: number;
  minute: number;
  period: Period;
  days: DayKey[];
  enabled: boolean;
}
