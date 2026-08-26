import { z } from 'zod';

export const ActivitySchema = z.object({
  id: z.string().uuid(),
  key: z.string(),
  name: z.string(),
  category: z.string(),
  configSchema: z.record(z.any()),
  version: z.string(),
});

export const OrgActivitySchema = z.object({
  organizationId: z.string().uuid(),
  activityId: z.string().uuid(),
  isEnabled: z.boolean(),
  activity: ActivitySchema,
});

export const ToggleActivitySchema = z.object({
  isEnabled: z.boolean(),
});

export type Activity = z.infer<typeof ActivitySchema>;
export type OrgActivity = z.infer<typeof OrgActivitySchema>;
export type ToggleActivityInput = z.infer<typeof ToggleActivitySchema>;
