import { z } from 'zod';

export const AssignmentSchema = z.object({
  id: z.string().uuid(),
  patientId: z.string().uuid(),
  practitionerId: z.string().uuid(),
  activityId: z.string().uuid(),
  config: z.record(z.any()),
  createdAt: z.string().datetime(),
});

export const CreateAssignmentSchema = z.object({
  patientId: z.string().uuid('Invalid patient ID'),
  activityId: z.string().uuid('Invalid activity ID'),
  config: z.record(z.any()).default({}),
});

export const AssignmentWithDetailsSchema = AssignmentSchema.extend({
  patient: z.object({
    id: z.string().uuid(),
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().email(),
  }),
  activity: z.object({
    id: z.string().uuid(),
    key: z.string(),
    name: z.string(),
    category: z.string(),
  }),
});

export type Assignment = z.infer<typeof AssignmentSchema>;
export type CreateAssignmentInput = z.infer<typeof CreateAssignmentSchema>;
export type AssignmentWithDetails = z.infer<typeof AssignmentWithDetailsSchema>;
