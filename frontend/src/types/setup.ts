export type SetupStep = "schedule" | "alarm" | "exam" | "notes";

export type SetupState = {
  schedule: boolean;
  alarm: boolean;
  exam: boolean;
  notes: boolean;
};
