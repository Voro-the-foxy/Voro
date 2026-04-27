export const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'] as const;
export type DayKey = typeof DAYS[number];
export const SLOTS_PER_DAY = 48;
export type SlotIdx = number;

export type ClassItem = {
  id: string;
  day: DayKey;
  slot: SlotIdx;
}
