import { z } from 'zod';

export const SessionMetricSchema = z.object({
  key: z.string(),
  value: z.number(),
});

export const SessionSchema = z.object({
  id: z.string().uuid(),
  assignmentId: z.string().uuid(),
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime().nullable(),
  rawResult: z.record(z.any()),
  metrics: z.array(SessionMetricSchema).optional(),
});

export const CreateSessionSchema = z.object({
  assignmentId: z.string().uuid('Invalid assignment ID'),
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime().nullable().optional(),
  rawResult: z.record(z.any()),
});

export const SessionWithMetricsSchema = SessionSchema.extend({
  metrics: z.array(SessionMetricSchema),
});

export const PatientReportingSchema = z.object({
  patientId: z.string().uuid(),
  sessions: z.array(SessionWithMetricsSchema),
  summary: z.object({
    totalSessions: z.number(),
    averageScore: z.number().nullable(),
    lastSessionDate: z.string().datetime().nullable(),
  }),
});

export type Session = z.infer<typeof SessionSchema>;
export type CreateSessionInput = z.infer<typeof CreateSessionSchema>;
export type SessionWithMetrics = z.infer<typeof SessionWithMetricsSchema>;
export type PatientReporting = z.infer<typeof PatientReportingSchema>;
