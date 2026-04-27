export type SetupStep = "schedule" | "alarm" | "exam";

export type SetupState = {
  schedule: boolean;
  alarm: boolean;
  exam: boolean;
};
