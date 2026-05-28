import { z } from "zod";

export const ScheduledClassSchema = z.object({
  id: z.string(),
  name: z.string(),
  slots: z.array(z.string()).min(1),
  noteCount: z.number().int().min(1),
});

export const SetupReadinessSchema = z.object({
  schedule: z.literal(true),
  alarm: z.literal(true),
  exam: z.literal(true),
  notes: z.literal(true),
  classes: z.array(ScheduledClassSchema).min(1),
});

export type SetupReadiness = z.infer<typeof SetupReadinessSchema>;
