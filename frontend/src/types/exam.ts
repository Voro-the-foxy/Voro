import type { Period } from "@/types/alarm";

export type { Period };

export interface Exam {
  id: string;
  className: string;
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  period: Period;
  enabled: boolean;
}
